import { currentUser } from './_auth.js'
import { database, ensureSchema } from './_db.js'
import { appOrigin, BILLING_PLANS, stripeClient } from './_stripe.js'
import { randomBytes } from 'node:crypto'

export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store')
  if (request.method !== 'POST') return response.status(405).json({ error: 'Método não permitido.' })

  try {
    await ensureSchema()
    const user = await currentUser(request)
    if (!user) return response.status(401).json({ error: 'Entre na sua conta para continuar.' })

    const planKey = String(request.body?.plan || '')
    const plan = BILLING_PLANS[planKey]
    if (!plan) return response.status(400).json({ error: 'Plano inválido.' })
    if (user.billing_product === 'pro' && user.plan === 'paid') return response.status(409).json({ error: 'Você já possui o plano Pro. Use “Gerenciar assinatura e pagamentos”.' })
    const priceId = process.env[plan.priceEnv]
    if (!priceId) return response.status(503).json({ error: 'Este plano ainda não foi configurado no Stripe.' })

    const stripe = stripeClient()
    const sql = database()
    let customerId = user.stripe_customer_id
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.username,
        metadata: { mesmaPistaUserId: user.id },
      })
      customerId = customer.id
      await sql`UPDATE sintonia_users SET stripe_customer_id = ${customerId}, updated_at = NOW() WHERE id = ${user.id}`
    }

    const origin = appOrigin(request)
    const session = await stripe.checkout.sessions.create({
      integration_identifier: `mesma_pista_${randomBytes(4).toString('hex')}`,
      mode: plan.mode,
      customer: customerId,
      client_reference_id: user.id,
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      success_url: `${origin}/planos?checkout=success`,
      cancel_url: `${origin}/planos?checkout=cancelled`,
      metadata: { mesmaPistaUserId: user.id, mesmaPistaPlan: planKey },
      ...(plan.mode === 'subscription' ? { subscription_data: { metadata: { mesmaPistaUserId: user.id, mesmaPistaPlan: planKey } } } : {}),
    })

    return response.status(200).json({ url: session.url })
  } catch (error) {
    console.error('[stripe-checkout]', error)
    return response.status(500).json({ error: 'Não foi possível abrir o pagamento. Tente novamente.' })
  }
}
