import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'
import { database, ensureSchema } from './_db.js'

const scrypt = promisify(scryptCallback)
const COOKIE_NAME = 'sintonia_session'
const DEVICE_COOKIE = 'mesma_pista_device'

export async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex')
  const derived = await scrypt(password, salt, 64)
  return `${salt}:${Buffer.from(derived).toString('hex')}`
}

export async function verifyPassword(password, stored) {
  const [salt, hash] = String(stored || '').split(':')
  if (!salt || !hash) return false
  const derived = Buffer.from(await scrypt(password, salt, 64))
  const expected = Buffer.from(hash, 'hex')
  return derived.length === expected.length && timingSafeEqual(derived, expected)
}

const tokenHash = (token) => createHash('sha256').update(token).digest('hex')

export function readCookie(request) {
  const cookies = String(request.headers.cookie || '').split(';').map((item) => item.trim().split('='))
  return cookies.find(([name]) => name === COOKIE_NAME)?.[1] || ''
}

function cookies(request) {
  return Object.fromEntries(String(request.headers.cookie || '').split(';').map((item) => item.trim().split('=')))
}

export function usageIdentity(request, response) {
  let device = cookies(request)[DEVICE_COOKIE]
  if (!/^[a-f0-9]{48}$/.test(device || '')) {
    device = randomBytes(24).toString('hex')
    response.appendHeader('Set-Cookie', `${DEVICE_COOKIE}=${device}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=31536000`)
  }
  const forwarded = String(request.headers['x-forwarded-for'] || '').split(',')[0].trim()
  const network = forwarded || request.socket?.remoteAddress || 'unknown'
  const pepper = process.env.USAGE_HASH_SECRET || process.env.DATABASE_URL
  if (!pepper) throw new Error('USAGE_HASH_SECRET não configurado')
  const digest = (value) => createHash('sha256').update(`${pepper}:${value}`).digest('hex')
  return { deviceHash: digest(device), networkHash: digest(network), identityHash: digest(`${device}:${network}`) }
}

export async function createSession(response, userId) {
  const sql = database()
  const token = randomBytes(32).toString('hex')
  await sql`INSERT INTO sintonia_sessions (token_hash, user_id, expires_at) VALUES (${tokenHash(token)}, ${userId}, NOW() + INTERVAL '30 days')`
  response.appendHeader('Set-Cookie', `${COOKIE_NAME}=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=2592000`)
}

export async function currentUser(request) {
  await ensureSchema()
  const token = readCookie(request)
  if (!token) return null
  const sql = database()
  const rows = await sql`SELECT u.id, u.username, u.email, u.role,
    CASE WHEN u.billing_product = 'party' AND u.paid_until <= NOW() THEN 'free' ELSE u.plan END AS plan,
    u.marketing_opt_in, u.created_at, u.stripe_customer_id, u.stripe_subscription_id, u.billing_product, u.paid_until
    FROM sintonia_sessions s JOIN sintonia_users u ON u.id = s.user_id
    WHERE s.token_hash = ${tokenHash(token)} AND s.expires_at > NOW() LIMIT 1`
  if (rows[0]?.billing_product === 'party' && rows[0]?.paid_until && new Date(rows[0].paid_until) <= new Date()) {
    await sql`UPDATE sintonia_users SET plan = 'free', billing_product = NULL, updated_at = NOW() WHERE id = ${rows[0].id} AND billing_product = 'party' AND paid_until <= NOW()`
  }
  return rows[0] || null
}

export async function destroySession(request, response) {
  const token = readCookie(request)
  if (token) await database()`DELETE FROM sintonia_sessions WHERE token_hash = ${tokenHash(token)}`
  response.appendHeader('Set-Cookie', `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`)
}

export function publicUser(user) {
  return user && { id: user.id, username: user.username, email: user.email, role: user.role, plan: user.plan, billingProduct: user.billing_product || null, paidUntil: user.paid_until || null, hasStripeCustomer: Boolean(user.stripe_customer_id), marketingOptIn: user.marketing_opt_in, createdAt: user.created_at }
}

export async function ensureAdmin() {
  const username = process.env.ADMIN_USERNAME
  const email = process.env.ADMIN_EMAIL
  const password = process.env.ADMIN_PASSWORD
  if (!username || !email || !password) return
  const sql = database()
  const existing = await sql`SELECT id FROM sintonia_users WHERE role = 'admin' LIMIT 1`
  if (existing[0]) return
  const passwordHash = await hashPassword(password)
  await sql`INSERT INTO sintonia_users (username, email, password_hash, role, plan, marketing_opt_in) VALUES (${username}, ${email.toLowerCase()}, ${passwordHash}, 'admin', 'paid', false) ON CONFLICT DO NOTHING`
}
