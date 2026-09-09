import { currentUser } from './_auth.js'
import { ensureSchema } from './_db.js'
import { appOrigin, stripeClient } from './_stripe.js'

export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store')
  if (request.method !== 'POST') return response.status(405).json({ error: 'Método não permitido.' })
  try {
    await ensureSchema()
    const user = await currentUser(request)
    if (!user) return response.status(401).json({ error: 'Entre na sua conta para continuar.' })
    if (!user.stripe_customer_id) return response.status(400).json({ error: 'Nenhuma assinatura Stripe encontrada.' })
    const session = await stripeClient().billingPortal.sessions.create({ customer: user.stripe_customer_id, return_url: `${appOrigin(request)}/planos` })
    return response.status(200).json({ url: session.url })
  } catch (error) {
    console.error('[stripe-portal]', error)
    return response.status(500).json({ error: 'Não foi possível abrir o gerenciamento da assinatura.' })
  }
}
