import Stripe from 'stripe'

let client

export function stripeClient() {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY não configurada')
  if (!client) client = new Stripe(process.env.STRIPE_SECRET_KEY)
  return client
}

export function appOrigin(request) {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, '')
  const host = String(request.headers['x-forwarded-host'] || request.headers.host || '')
  if (!host) throw new Error('APP_URL não configurada')
  return `${host.includes('localhost') ? 'http' : 'https'}://${host}`
}

export const BILLING_PLANS = {
  party: { priceEnv: 'STRIPE_PARTY_PRICE_ID', mode: 'payment' },
  pro: { priceEnv: 'STRIPE_PRO_PRICE_ID', mode: 'subscription' },
}
