import { database, ensureSchema } from './_db.js'

export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300')
  if (request.method !== 'GET') return response.status(405).json({ error: 'Método não permitido' })
  const id = String(request.query.id || '').slice(0, 24)
  if (!/^[A-Za-z0-9_-]{8,24}$/.test(id)) return response.status(400).json({ error: 'Resultado inválido' })
  await ensureSchema()
  const rows = await database()`SELECT public_id, summary, created_at FROM mesma_pista_results WHERE public_id = ${id} LIMIT 1`
  if (!rows[0]) return response.status(404).json({ error: 'Resultado não encontrado' })
  return response.status(200).json({ id: rows[0].public_id, ...rows[0].summary, createdAt: rows[0].created_at })
}
