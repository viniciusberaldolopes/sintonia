import { database } from './_db.js'

export async function recordLeadEvent({ userId = null, guestId = null, event, metadata = {} }) {
  const sql = database()
  const rules = await sql`SELECT points FROM mesma_pista_scoring_rules WHERE event_name = ${event} AND enabled = true LIMIT 1`
  const points = Number(rules[0]?.points || 0)
  const leads = userId
    ? await sql`SELECT id FROM mesma_pista_leads WHERE user_id = ${userId} LIMIT 1`
    : guestId ? await sql`SELECT id FROM mesma_pista_leads WHERE guest_id = ${guestId} LIMIT 1` : []
  const leadId = leads[0]?.id || null
  await sql`INSERT INTO mesma_pista_lead_events(lead_id, user_id, guest_id, event_name, points, metadata)
    VALUES (${leadId}, ${userId}, ${guestId}, ${event}, ${points}, ${JSON.stringify(metadata)})`
  if (leadId && points) await sql`UPDATE mesma_pista_leads SET score = score + ${points}, updated_at = NOW() WHERE id = ${leadId}`
  return points
}
