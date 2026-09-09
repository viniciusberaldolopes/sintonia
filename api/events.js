import { database, ensureSchema } from './_db.js'
import { allowRequest } from './_security.js'
import { currentUser, usageIdentity } from './_auth.js'
import { recordLeadEvent } from './_growth.js'

const ALLOWED_EVENTS = new Set(['lp_view', 'hero_cta_click', 'demo_started', 'demo_completed', 'host_lead_started', 'host_lead_created', 'room_created', 'invite_copied', 'invite_shared', 'guest_session_created', 'guest_joined_room', 'second_player_joined', 'game_started', 'round_completed', 'game_completed', 'results_viewed', 'results_shared', 'guest_lead_prompt_viewed', 'guest_lead_created', 'guest_converted_to_host', 'pricing_viewed', 'checkout_started', 'purchase'])

export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store')
  if (request.method !== 'POST') return response.status(405).json({ error: 'Método não permitido' })
  const { event, metadata = {} } = request.body || {}
  if (!ALLOWED_EVENTS.has(event)) return response.status(400).json({ error: 'Evento inválido' })
  try {
    await ensureSchema()
    const identity = usageIdentity(request, response)
    if (!await allowRequest(request, response, 'analytics', 120, 1, identity)) return response.status(202).json({ ok: true })
    const safeMetadata = JSON.stringify(metadata).slice(0, 4000)
    await database()`INSERT INTO sintonia_events (event_name, metadata) VALUES (${event}, ${safeMetadata})`
    if (['results_shared', 'pricing_viewed', 'checkout_started'].includes(event)) {
      const user = await currentUser(request)
      if (user) await recordLeadEvent({ userId: user.id, event, metadata })
      else {
        const guests = await database()`SELECT id FROM mesma_pista_guests WHERE identity_hash = ${identity.deviceHash} LIMIT 1`
        if (guests[0]) await recordLeadEvent({ guestId: guests[0].id, event, metadata })
      }
    }
    return response.status(202).json({ ok: true })
  } catch (error) {
    console.error('[events]', error)
    return response.status(500).json({ error: 'Evento não registrado' })
  }
}
