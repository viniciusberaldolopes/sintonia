import { createSession, currentUser, destroySession, ensureAdmin, hashPassword, publicUser, verifyPassword } from './_auth.js'
import { database, ensureSchema } from './_db.js'
import { recordLeadEvent } from './_growth.js'
import { allowRequest, cleanAttribution } from './_security.js'

const validEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store')
  try {
    await ensureSchema()
    await ensureAdmin()
    if (request.method === 'GET') return response.status(200).json({ user: publicUser(await currentUser(request)) })
    if (request.method !== 'POST') return response.status(405).json({ error: 'Método não permitido' })
    const { action, username, email, password, marketingOptIn = true, attribution = {} } = request.body || {}
    const sql = database()

    if (action === 'signup') {
      if (!await allowRequest(request, response, 'signup', 5, 60)) return response.status(429).json({ error: 'Muitas tentativas de cadastro. Aguarde antes de tentar novamente.' })
      const cleanUsername = String(username || '').trim().slice(0, 32)
      const cleanEmail = String(email || '').trim().toLowerCase().slice(0, 254)
      if (cleanUsername.length < 3 || !validEmail(cleanEmail) || String(password || '').length < 8) return response.status(400).json({ error: 'Preencha nome, e-mail válido e senha com pelo menos 8 caracteres.' })
      const passwordHash = await hashPassword(password)
      const rows = await sql`INSERT INTO sintonia_users (username, email, password_hash, marketing_opt_in) VALUES (${cleanUsername}, ${cleanEmail}, ${passwordHash}, ${Boolean(marketingOptIn)}) RETURNING *`
      const cleanSource = cleanAttribution(attribution)
      await sql`INSERT INTO mesma_pista_leads(user_id, name, email, attribution, score)
        VALUES (${rows[0].id}, ${cleanUsername}, ${cleanEmail}, ${JSON.stringify(cleanSource)}, 0)
        ON CONFLICT(user_id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, attribution = EXCLUDED.attribution, updated_at = NOW()`
      await recordLeadEvent({ userId: rows[0].id, event: 'host_lead_created', metadata: cleanSource })
      await createSession(response, rows[0].id)
      return response.status(201).json({ user: publicUser(rows[0]) })
    }

    if (action === 'login') {
      if (!await allowRequest(request, response, 'login', 15, 15)) return response.status(429).json({ error: 'Muitas tentativas de login. Aguarde alguns minutos.' })
      const identity = String(email || username || '').trim().toLowerCase()
      const rows = await sql`SELECT * FROM sintonia_users WHERE LOWER(email) = ${identity} OR LOWER(username) = ${identity} LIMIT 1`
      if (!rows[0] || !await verifyPassword(String(password || ''), rows[0].password_hash)) return response.status(401).json({ error: 'Usuário ou senha incorretos.' })
      await createSession(response, rows[0].id)
      return response.status(200).json({ user: publicUser(rows[0]) })
    }

    if (action === 'logout') {
      await destroySession(request, response)
      return response.status(200).json({ ok: true })
    }
    return response.status(400).json({ error: 'Ação inválida' })
  } catch (error) {
    if (error?.code === '23505') return response.status(409).json({ error: 'Este nome ou e-mail já está cadastrado.' })
    console.error('[auth]', error)
    return response.status(500).json({ error: 'Não foi possível concluir. Tente novamente.' })
  }
}
