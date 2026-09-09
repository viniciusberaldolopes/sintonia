import { database, ensureSchema } from './_db.js'
import { stripeClient } from './_stripe.js'

async function rawBody(request) {
  if (Buffer.isBuffer(request.body)) return request.body
  if (typeof request.body === 'string') return Buffer.from(request.body)
  // Algumas versões da runtime da Vercel entregam JSON já materializado mesmo
  // com o parser desativado. O Checkout envia JSON compacto, então preservar a
  // ordem das propriedades permite verificar a assinatura nesse fallback.
  if (request.body && typeof request.body === 'object') return Buffer.from(JSON.stringify(request.body))
  const chunks = []
  for await (const chunk of request) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  return Buffer.concat(chunks)
}

async function activateCheckout(sql, session) {
  if (session.mode === 'payment' && session.payment_status !== 'paid') return
  if (session.mode === 'subscription' && session.status !== 'complete') return
  const userId = session.metadata?.mesmaPistaUserId || session.client_reference_id
  const plan = session.metadata?.mesmaPistaPlan
  if (!userId || !['party', 'pro'].includes(plan)) return
  const subscriptionId = typeof session.subscription === 'string' ? session.subscription : null
  if (plan === 'party') {
    await sql`UPDATE sintonia_users SET plan = 'paid', billing_product = 'party', paid_until = NOW() + INTERVAL '24 hours', stripe_customer_id = COALESCE(${String(session.customer || '') || null}, stripe_customer_id), updated_at = NOW() WHERE id = ${userId}`
  } else {
    await sql`UPDATE sintonia_users SET plan = 'paid', billing_product = 'pro', paid_until = NULL, stripe_customer_id = COALESCE(${String(session.customer || '') || null}, stripe_customer_id), stripe_subscription_id = COALESCE(${subscriptionId}, stripe_subscription_id), updated_at = NOW() WHERE id = ${userId}`
  }
  await sql`INSERT INTO sintonia_events(event_name, metadata) VALUES ('purchase', ${JSON.stringify({ userId, plan, sessionId: session.id })})`
}

async function syncSubscription(sql, subscription) {
  const userId = subscription.metadata?.mesmaPistaUserId
  const active = ['active', 'trialing'].includes(subscription.status)
  if (userId) {
    await sql`UPDATE sintonia_users SET plan = ${active ? 'paid' : 'free'}, billing_product = ${active ? 'pro' : null}, paid_until = NULL, stripe_subscription_id = ${subscription.id}, updated_at = NOW() WHERE id = ${userId}`
  } else {
    await sql`UPDATE sintonia_users SET plan = ${active ? 'paid' : 'free'}, billing_product = ${active ? 'pro' : null}, paid_until = NULL, updated_at = NOW() WHERE stripe_subscription_id = ${subscription.id}`
  }
}

async function syncInvoiceSubscription(sql, stripe, invoice) {
  const subscriptionId = typeof invoice.subscription === 'string'
    ? invoice.subscription
    : invoice.subscription?.id
  if (!subscriptionId) return
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  await syncSubscription(sql, subscription)
}

export default async function handler(request, response) {
  if (request.method !== 'POST') return response.status(405).json({ error: 'Método não permitido.' })
  try {
    const signature = request.headers['stripe-signature']
    if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) return response.status(400).json({ error: 'Assinatura ausente.' })
    const stripe = stripeClient()
    const event = stripe.webhooks.constructEvent(await rawBody(request), signature, process.env.STRIPE_WEBHOOK_SECRET)
    await ensureSchema()
    const sql = database()
    const processed = await sql`SELECT event_id FROM mesma_pista_stripe_events WHERE event_id = ${event.id} LIMIT 1`
    if (processed[0]) return response.status(200).json({ received: true, duplicate: true })

    if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') await activateCheckout(sql, event.data.object)
    if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') await syncSubscription(sql, event.data.object)
    if (event.type === 'invoice.paid' || event.type === 'invoice.payment_failed') await syncInvoiceSubscription(sql, stripe, event.data.object)
    await sql`INSERT INTO mesma_pista_stripe_events(event_id, event_type) VALUES (${event.id}, ${event.type}) ON CONFLICT(event_id) DO NOTHING`
    return response.status(200).json({ received: true })
  } catch (error) {
    console.error('[stripe-webhook]', error)
    return response.status(400).json({ error: 'Webhook inválido.' })
  }
}

export const config = { api: { bodyParser: false } }
