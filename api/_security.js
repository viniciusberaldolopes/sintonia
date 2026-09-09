import { database, ensureSchema } from './_db.js'
import { usageIdentity } from './_auth.js'

export async function allowRequest(request, response, action, limit, windowMinutes, knownIdentity = null) {
  await ensureSchema()
  const { identityHash } = knownIdentity || usageIdentity(request, response)
  const sql = database()
  const rows = await sql`INSERT INTO mesma_pista_rate_limits(identity_hash, action, window_start, attempts)
    VALUES (${identityHash}, ${action}, to_timestamp(floor(extract(epoch from NOW()) / (${windowMinutes} * 60)) * (${windowMinutes} * 60)), 1)
    ON CONFLICT(identity_hash, action, window_start) DO UPDATE SET attempts = mesma_pista_rate_limits.attempts + 1
    RETURNING attempts`
  return Number(rows[0]?.attempts || 0) <= limit
}

export function cleanAttribution(value = {}) {
  const text = (input, max = 180) => String(input || '').trim().slice(0, max) || undefined
  return {
    utmSource: text(value.utmSource, 80), utmMedium: text(value.utmMedium, 80),
    utmCampaign: text(value.utmCampaign, 120), utmContent: text(value.utmContent, 120),
    referrer: text(value.referrer, 300), landingPage: text(value.landingPage, 300),
  }
}
