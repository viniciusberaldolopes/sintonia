const EVENT_NAMES = new Set([
  'lp_view', 'hero_cta_click', 'demo_started', 'demo_completed',
  'host_lead_started', 'host_lead_created', 'room_created',
  'invite_copied', 'invite_shared', 'guest_session_created',
  'guest_joined_room', 'second_player_joined', 'game_started',
  'round_completed', 'game_completed', 'results_viewed', 'results_shared',
  'guest_lead_prompt_viewed', 'guest_lead_created', 'guest_converted_to_host',
  'pricing_viewed', 'checkout_started', 'purchase',
])

export function attribution() {
  const query = new URLSearchParams(window.location.search)
  return {
    utmSource: query.get('utm_source') || undefined,
    utmMedium: query.get('utm_medium') || undefined,
    utmCampaign: query.get('utm_campaign') || undefined,
    utmContent: query.get('utm_content') || undefined,
    referrer: document.referrer || undefined,
    landingPage: `${window.location.pathname}${window.location.search}`,
  }
}

export function track(event, metadata = {}) {
  if (!EVENT_NAMES.has(event)) return
  fetch('/api/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event, metadata }),
    keepalive: true,
  }).catch(() => {})
}
