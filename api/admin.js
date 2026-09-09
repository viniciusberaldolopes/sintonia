import { currentUser, hashPassword, publicUser } from './_auth.js'
import { database, ensureSchema } from './_db.js'

export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store')
  try {
    await ensureSchema()
    const admin = await currentUser(request)
    if (!admin || admin.role !== 'admin') return response.status(403).json({ error: 'Acesso restrito ao administrador.' })
    const sql = database()

    if (request.method === 'GET') {
      const users = await sql`SELECT u.id, u.username, u.email, u.role, u.plan, u.marketing_opt_in, u.created_at,
        COALESCE(l.score, 0)::int AS lead_score,
        (SELECT COUNT(*)::int FROM mesma_pista_rooms r WHERE r.host_user_id = u.id) AS hosted_rooms
        FROM sintonia_users u LEFT JOIN mesma_pista_leads l ON l.user_id = u.id ORDER BY u.created_at DESC`
      const stats = await sql`SELECT
        (SELECT COUNT(*)::int FROM mesma_pista_guests) AS guests,
        (SELECT COUNT(*)::int FROM mesma_pista_rooms) AS rooms,
        (SELECT COUNT(*)::int FROM mesma_pista_results) AS results`
      return response.status(200).json({ users: users.map((user) => ({ ...publicUser(user), leadScore: user.lead_score, hostedRooms: user.hosted_rooms })), stats: stats[0] })
    }

    if (request.method === 'POST') {
      const { username, email, password, plan = 'free', marketingOptIn = true } = request.body || {}
      if (!username || !email || String(password || '').length < 8) return response.status(400).json({ error: 'Dados de cadastro incompletos.' })
      const passwordHash = await hashPassword(password)
      const rows = await sql`INSERT INTO sintonia_users (username, email, password_hash, plan, marketing_opt_in) VALUES (${String(username).trim().slice(0, 32)}, ${String(email).trim().toLowerCase().slice(0, 254)}, ${passwordHash}, ${plan === 'paid' ? 'paid' : 'free'}, ${Boolean(marketingOptIn)}) RETURNING *`
      return response.status(201).json({ user: publicUser(rows[0]) })
    }

    if (request.method === 'PATCH') {
      const { userId, plan } = request.body || {}
      const rows = await sql`UPDATE sintonia_users SET plan = ${plan === 'paid' ? 'paid' : 'free'}, updated_at = NOW() WHERE id = ${userId} RETURNING *`
      if (!rows[0]) return response.status(404).json({ error: 'Usuário não encontrado.' })
      return response.status(200).json({ user: publicUser(rows[0]) })
    }
    return response.status(405).json({ error: 'Método não permitido' })
  } catch (error) {
    if (error?.code === '23505') return response.status(409).json({ error: 'Nome ou e-mail já cadastrado.' })
    console.error('[admin]', error)
    return response.status(500).json({ error: 'Erro ao acessar usuários.' })
  }
}
