import { database, ensureSchema } from './_db.js'

const escapeHtml = (value) => String(value || '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[character])

export default async function handler(request, response) {
  const id = String(request.query.id || '').slice(0, 24)
  if (!/^[A-Za-z0-9_-]{8,24}$/.test(id)) return response.status(404).send('Resultado não encontrado')
  await ensureSchema()
  const rows = await database()`SELECT summary FROM mesma_pista_results WHERE public_id = ${id} LIMIT 1`
  if (!rows[0]) return response.status(404).send('Resultado não encontrado')
  const summary = rows[0].summary
  const names = summary.players?.slice(0, 3).map((player) => player.name).join(' + ') || 'Uma galera'
  const title = `${names} — ${Number(summary.alignment || 0)}% na mesma pista`
  const url = `https://sintonia-seven.vercel.app/resultado/${encodeURIComponent(id)}`
  response.setHeader('Content-Type', 'text/html; charset=utf-8')
  response.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300')
  return response.status(200).send(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title><meta name="description" content="Veja este resultado de Mesma Pista."><link rel="canonical" href="${url}"><meta property="og:type" content="website"><meta property="og:title" content="${escapeHtml(title)}"><meta property="og:description" content="Vocês pensam perigosamente parecido."><meta property="og:image" content="https://sintonia-seven.vercel.app/brand/social/og-default.png"><meta property="og:url" content="${url}"><meta name="twitter:card" content="summary_large_image"><link rel="icon" href="/brand/favicon/favicon.ico"><style>body{margin:0;display:grid;place-items:center;min-height:100vh;padding:24px;box-sizing:border-box;background:#f8f7ff;color:#111229;font-family:Inter,system-ui,sans-serif}.card{max-width:720px;padding:56px;border-radius:24px;background:white;box-shadow:0 16px 50px rgba(17,18,41,.1);text-align:center}.logo{width:180px}.score{margin:36px 0 8px;color:#4c1dff;font-size:clamp(64px,14vw,120px);font-weight:900}.names{font-weight:900;text-transform:uppercase}.cta{display:inline-block;margin-top:28px;padding:15px 24px;border-radius:999px;color:white;background:#4c1dff;text-decoration:none;font-weight:800}@media(max-width:500px){.card{padding:36px 22px}}</style></head><body><main class="card"><img class="logo" src="/brand/logo/mesma-pista-logo-primary.svg" alt="Mesma Pista"><div class="score">${Number(summary.alignment || 0)}%</div><div class="names">${escapeHtml(names)}</div><h1>NA MESMA PISTA</h1><p>Vocês pensam perigosamente parecido.</p><a class="cta" href="/">CRIAR MINHA SALA GRÁTIS</a></main></body></html>`)
}
