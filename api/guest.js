import { createSession, hashPassword, publicUser, usageIdentity, verifyPassword } from './_auth.js'
import { database, ensureSchema } from './_db.js'
import { recordLeadEvent } from './_growth.js'
import { allowRequest, cleanAttribution } from './_security.js'

const validEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store')
  if (request.method !== 'POST') return response.status(405).json({ error: 'Método não permitido' })
  try {
    await ensureSchema()
    const identity = usageIdentity(request, response)
    if (!await allowRequest(request, response, 'guest_convert', 8, 60, identity)) return response.status(429).json({ error: 'Muitas tentativas. Aguarde antes de tentar novamente.' })
    const name = String(request.body?.name || '').trim().slice(0, 32)
    const email = String(request.body?.email || '').trim().toLowerCase().slice(0, 254)
    const password = String(request.body?.password || '')
    const marketingOptIn = Boolean(request.body?.marketingOptIn)
    if (name.length < 2 || !validEmail(email) || password.length < 8) return response.status(400).json({ error: 'Informe nome, e-mail válido e uma senha com pelo menos 8 caracteres.' })
    const sql = database()
    const guests = await sql`INSERT INTO mesma_pista_guests(identity_hash, origin)
      VALUES (${identity.deviceHash}, ${JSON.stringify(cleanAttribution(request.body?.attribution))})
      ON CONFLICT(identity_hash) DO UPDATE SET updated_at = NOW() RETURNING id`
    const guestId = guests[0].id
    let users = await sql`SELECT * FROM sintonia_users WHERE LOWER(email) = ${email} LIMIT 1`
    if (users[0]) {
      if (!await verifyPassword(password, users[0].password_hash)) return response.status(409).json({ error: 'Este e-mail já possui conta. Use a senha correta para associar seu histórico.' })
    } else {
      const passwordHash = await hashPassword(password)
      users = await sql`INSERT INTO sintonia_users(username, email, password_hash, marketing_opt_in) VALUES (${name}, ${email}, ${passwordHash}, ${marketingOptIn}) RETURNING *`
    }
    const user = users[0]
    await sql`UPDATE mesma_pista_guests SET converted_user_id = ${user.id}, updated_at = NOW() WHERE id = ${guestId}`
    await sql`UPDATE mesma_pista_participants SET user_id = ${user.id} WHERE guest_id = ${guestId}`
    await sql`INSERT INTO mesma_pista_leads(user_id, guest_id, name, email, attribution, score)
      VALUES (${user.id}, ${guestId}, ${name}, ${email}, ${JSON.stringify(cleanAttribution(request.body?.attribution))}, 0)
      ON CONFLICT(user_id) DO UPDATE SET guest_id = EXCLUDED.guest_id, name = EXCLUDED.name, email = EXCLUDED.email,
        attribution = EXCLUDED.attribution, updated_at = NOW()`
    await recordLeadEvent({ userId: user.id, guestId, event: 'guest_lead_created' })
    await recordLeadEvent({ userId: user.id, guestId, event: 'guest_converted_to_host' })
    await createSession(response, user.id)
    return response.status(200).json({ user: publicUser(user), preserved: true })
  } catch (error) {
    if (error?.code === '23505') return response.status(409).json({ error: 'Nome ou e-mail já cadastrado.' })
    console.error('[guest]', error)
    return response.status(500).json({ error: 'Não foi possível salvar seu histórico.' })
  }
}
