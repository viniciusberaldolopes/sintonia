import { getCache } from '@vercel/functions'
import { createHash, randomBytes, randomInt } from 'node:crypto'
import { currentUser, usageIdentity } from './_auth.js'
import { database, ensureSchema } from './_db.js'
import { recordLeadEvent } from './_growth.js'
import { allowRequest, cleanAttribution } from './_security.js'

const ROOM_TTL_SECONDS = 60 * 60 * 6
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const FREE_ROOM_LIMIT = 2
const FREE_ROUND_LIMIT = 8

function roomKey(code) {
  return `sintonia-room:${code}`
}

function createCode() {
  return Array.from({ length: 5 }, () => CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]).join('')
}

function validState(state) {
  return state && typeof state === 'object' && ['lobby', 'setup', 'target', 'hide', 'guess', 'result'].includes(state.phase)
}

function safeText(value, max) {
  return String(value || '').trim().slice(0, max)
}

function safeCard(card) {
  if (!card || !safeText(card.prompt, 180) || !safeText(card.low, 80) || !safeText(card.high, 80)) return null
  return {
    id: safeText(card.id, 80), theme: safeText(card.theme, 60), prompt: safeText(card.prompt, 180),
    low: safeText(card.low, 80), high: safeText(card.high, 80), target: randomInt(0, 21) * 5,
  }
}

function scoreGuess(guess, target) {
  const distance = Math.abs(guess - target)
  return distance <= 4 ? 4 : distance <= 9 ? 3 : distance <= 14 ? 2 : 0
}

async function guestForIdentity(sql, identityHash, origin = {}) {
  const rows = await sql`INSERT INTO mesma_pista_guests(identity_hash, origin)
    VALUES (${identityHash}, ${JSON.stringify(origin)})
    ON CONFLICT(identity_hash) DO UPDATE SET updated_at = NOW()
    RETURNING id`
  return rows[0]
}

const participantTokenHash = (token) => createHash('sha256').update(String(token || '')).digest('hex')

async function authorizedParticipant(request, room, participantKey, deviceHash, suppliedToken) {
  if (room.participantTokens?.[participantKey]) return participantTokenHash(suppliedToken) === room.participantTokens[participantKey]
  const sql = database()
  const rows = await sql`SELECT p.user_id, g.identity_hash FROM mesma_pista_participants p
    LEFT JOIN mesma_pista_guests g ON g.id = p.guest_id
    WHERE p.room_code = ${room.code} AND p.participant_key = ${participantKey} LIMIT 1`
  if (!rows[0]) return false
  if (rows[0].user_id) return (await currentUser(request))?.id === rows[0].user_id
  return rows[0].identity_hash === deviceHash
}

function clientRoom(room, participantId = '', participantToken = undefined) {
  const state = { ...room.state }
  const playerIndex = state.players?.findIndex((player) => player.id === participantId) ?? -1
  const maySeeTarget = state.phase === 'result' || (state.phase === 'target' && playerIndex === state.chooser)
  if (state.card && !maySeeTarget) state.card = { ...state.card, target: null }
  if (state.customTheme) {
    const questions = state.customTheme.questions || []
    state.customTheme = {
      name: state.customTheme.name,
      questions: questions.map(({ contributorId: _contributorId, ...question }) => question),
      canAdd: state.customTheme.unlimited || !questions.some((question) => question.contributorId === participantId),
      unlimited: state.customTheme.unlimited,
    }
  }
  return { code: room.code, state, revision: room.revision, updatedAt: room.updatedAt, role: playerIndex >= 0 ? playerIndex : undefined, participantToken }
}

function roomCustomTheme(theme, questions = [], unlimited = false) {
  if (!theme) return null
  return {
    name: theme.name,
    questions: questions.map((question) => ({ id: question.id, prompt: question.prompt, low: question.low_label, high: question.high_label, author: question.nickname, contributorId: question.participant_key })),
    unlimited,
  }
}

export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store')
  const cache = getCache({ namespace: 'sintonia' })
  await ensureSchema()
  const identity = usageIdentity(request, response)

  if (request.method === 'GET') {
    const code = String(request.query.code || '').trim().toUpperCase()
    if (!/^[A-Z0-9]{5}$/.test(code)) return response.status(400).json({ error: 'Código inválido' })
    const room = await cache.get(roomKey(code))
    if (!room) return response.status(404).json({ error: 'Sala não encontrada ou expirada' })
    const viewerId = String(request.query.participantId || '').slice(0, 80)
    const viewerToken = String(request.headers['x-participant-token'] || '').slice(0, 128)
    const knownViewer = room.state.players?.some((player) => player.id === viewerId)
    const authorizedViewer = knownViewer && await authorizedParticipant(request, room, viewerId, identity.deviceHash, viewerToken)
    if (!authorizedViewer && !await allowRequest(request, response, 'room_lookup', 20, 10, identity)) return response.status(429).json({ error: 'Muitas consultas de sala.' })
    return response.status(200).json(clientRoom(room, authorizedViewer ? viewerId : ''))
  }

  if (request.method === 'POST') {
    const { action, code: suppliedCode, state, name, participantId } = request.body || {}
    const participantToken = String(request.headers['x-participant-token'] || '').slice(0, 128)

    if (action === 'create_theme' || action === 'add_question') {
      if (!await allowRequest(request, response, 'custom_content', 30, 10, identity)) return response.status(429).json({ error: 'Muitas alterações seguidas. Aguarde um pouco.' })
      const code = String(suppliedCode || '').trim().toUpperCase()
      const actorId = String(participantId || '').slice(0, 80)
      if (!/^[A-Z0-9]{5}$/.test(code) || !actorId) return response.status(400).json({ error: 'Sala ou participante inválido.' })
      const current = await cache.get(roomKey(code))
      if (!current) return response.status(404).json({ error: 'Sala não encontrada ou expirada' })
      if (current.state.phase !== 'lobby') return response.status(409).json({ error: 'As perguntas só podem ser preparadas antes da partida.' })
      if (!await authorizedParticipant(request, current, actorId, identity.deviceHash, participantToken)) return response.status(403).json({ error: 'Identidade do participante inválida.' })
      const sql = database()
      const participants = await sql`SELECT id, participant_key, nickname FROM mesma_pista_participants WHERE room_code = ${code}`
      const participant = participants.find((item) => item.participant_key === actorId)
      if (!participant) return response.status(403).json({ error: 'Participante não registrado nesta sala.' })
      const unlimited = current.hostPlan === 'paid' || (await currentUser(request))?.role === 'admin'

      if (action === 'create_theme') {
        if (actorId !== current.hostParticipantId) return response.status(403).json({ error: 'Somente o anfitrião pode criar o tema.' })
        const themeName = safeText(request.body?.themeName, 48)
        if (themeName.length < 3) return response.status(400).json({ error: 'Dê um nome de pelo menos 3 caracteres ao tema.' })
        await sql`INSERT INTO mesma_pista_custom_themes(room_code, name, created_by) VALUES (${code}, ${themeName}, ${participant.id})
          ON CONFLICT(room_code) DO UPDATE SET name = EXCLUDED.name`
      } else {
        const themeRows = await sql`SELECT name FROM mesma_pista_custom_themes WHERE room_code = ${code}`
        if (!themeRows[0]) return response.status(409).json({ error: 'O anfitrião precisa criar o tema primeiro.' })
        const prompt = safeText(request.body?.prompt, 180)
        const low = safeText(request.body?.low, 60) || 'Ruim'
        const high = safeText(request.body?.high, 60) || 'Bom'
        if (prompt.length < 3) return response.status(400).json({ error: 'Escreva uma pergunta de pelo menos 3 caracteres.' })
        try {
          await sql`INSERT INTO mesma_pista_custom_questions(room_code, participant_id, prompt, low_label, high_label, free_slot)
            VALUES (${code}, ${participant.id}, ${prompt}, ${low}, ${high}, ${!unlimited})`
        } catch (error) {
          if (error?.code === '23505') return response.status(402).json({ error: 'No plano grátis, cada jogador pode adicionar uma pergunta por sala.', code: 'CUSTOM_LIMIT' })
          throw error
        }
      }

      const themes = await sql`SELECT name FROM mesma_pista_custom_themes WHERE room_code = ${code}`
      const questions = await sql`SELECT q.id, q.prompt, q.low_label, q.high_label, p.nickname, p.participant_key
        FROM mesma_pista_custom_questions q JOIN mesma_pista_participants p ON p.id = q.participant_id
        WHERE q.room_code = ${code} ORDER BY q.created_at`
      const customTheme = roomCustomTheme(themes[0], questions, unlimited)
      const room = { ...current, state: { ...current.state, customTheme }, revision: (current.revision || 0) + 1, updatedAt: Date.now() }
      await cache.set(roomKey(code), room, { ttl: ROOM_TTL_SECONDS, tags: [`room-${code}`], name: 'sintonia-room' })
      return response.status(200).json(clientRoom(room, actorId))
    }

    if (action === 'create') {
      if (!await allowRequest(request, response, 'room_create', 10, 60, identity)) return response.status(429).json({ error: 'Muitas salas criadas. Aguarde antes de tentar novamente.' })
      if (!validState(state)) return response.status(400).json({ error: 'Estado inválido' })
      const user = await currentUser(request)
      if (!user) return response.status(401).json({ error: 'Entre na sua conta para criar uma sala.', code: 'LOGIN_REQUIRED' })
      if (!String(participantId || '').trim()) return response.status(400).json({ error: 'Identificação do anfitrião ausente.' })
      const sql = database()
      if (user.plan !== 'paid' && user.role !== 'admin') {
        const totals = await sql`SELECT
          COUNT(DISTINCT room_code) FILTER (WHERE user_id = ${user.id} OR device_hash = ${identity.deviceHash})::int AS linked_rooms,
          COUNT(DISTINCT room_code) FILTER (WHERE network_hash = ${identity.networkHash})::int AS network_rooms
          FROM mesma_pista_usage
          WHERE event_name = 'room_created' AND created_at > NOW() - INTERVAL '30 days'
          AND (user_id = ${user.id} OR device_hash = ${identity.deviceHash} OR network_hash = ${identity.networkHash})`
        const linkedRooms = totals[0]?.linked_rooms || 0
        const networkRooms = totals[0]?.network_rooms || 0
        if (linkedRooms >= FREE_ROOM_LIMIT || networkRooms >= 8) return response.status(402).json({ error: 'Seu acesso gratuito já foi usado neste período. Escolha um passe para continuar criando salas.', code: 'PAYWALL', usage: { rooms: linkedRooms, roomLimit: FREE_ROOM_LIMIT, roundLimit: FREE_ROUND_LIMIT } })
      }
      let code = createCode()
      while (await cache.get(roomKey(code))) code = createCode()
      const initialState = { phase: 'lobby', cardIndex: 0, card: null, customTheme: null, guess: 50, guesses: {}, history: [], chooser: 0, responderCursor: 0, players: [{ id: String(participantId).slice(0, 80), name: safeText(user.username, 18), color: '#4C1DFF', score: 0 }] }
      const hostToken = randomBytes(32).toString('base64url')
      const room = { code, state: initialState, revision: 1, updatedAt: Date.now(), hostUserId: user.id, hostParticipantId: String(participantId).slice(0, 80), hostPlan: user.plan, completedRounds: 0, participantTokens: { [String(participantId).slice(0, 80)]: participantTokenHash(hostToken) } }
      await cache.set(roomKey(code), room, { ttl: ROOM_TTL_SECONDS, tags: [`room-${code}`], name: 'sintonia-room' })
      await sql`INSERT INTO mesma_pista_usage (user_id, device_hash, network_hash, room_code, event_name) VALUES (${user.id}, ${identity.deviceHash}, ${identity.networkHash}, ${code}, 'room_created')`
      await sql`INSERT INTO mesma_pista_rooms(code, host_user_id) VALUES (${code}, ${user.id})`
      await sql`INSERT INTO mesma_pista_participants(room_code, participant_key, user_id, nickname)
        VALUES (${code}, ${String(participantId).slice(0, 80)}, ${user.id}, ${safeText(state.players?.[0]?.name || user.username, 32)})`
      await recordLeadEvent({ userId: user.id, event: 'room_created', metadata: { roomCode: code } })
      return response.status(201).json(clientRoom(room, participantId, hostToken))
    }

    if (action === 'update') {
      if (!validState(state)) return response.status(400).json({ error: 'Estado inválido' })
      const code = String(suppliedCode || '').trim().toUpperCase()
      if (!/^[A-Z0-9]{5}$/.test(code)) return response.status(400).json({ error: 'Código inválido' })
      const current = await cache.get(roomKey(code))
      if (!current) return response.status(404).json({ error: 'Sala não encontrada ou expirada' })
      const actorId = String(request.body?.participantId || '')
      const actorIndex = current.state.players?.findIndex((player) => player.id === actorId) ?? -1
      if (!await authorizedParticipant(request, current, actorId, identity.deviceHash, participantToken)) return response.status(403).json({ error: 'Identidade do participante inválida.' })
      const hostAction = actorId === current.hostParticipantId
      if (!hostAction && actorIndex !== current.state.chooser) return response.status(403).json({ error: 'Não é a sua vez de controlar a sala.' })
      if (current.state.phase === 'lobby' && !hostAction) return response.status(403).json({ error: 'Somente o anfitrião pode iniciar a partida.' })
      const from = current.state.phase
      const to = state.phase
      let nextState
      let currentRoundId = current.currentRoundId || null
      if (from === 'lobby' && to === 'setup') {
        nextState = { ...current.state, phase: 'setup', chooser: 0, responderCursor: 0 }
        await database()`UPDATE mesma_pista_rooms SET status = 'playing' WHERE code = ${code}`
      } else if (from === 'setup' && to === 'target') {
        const card = safeCard(state.card)
        if (!card) return response.status(400).json({ error: 'Carta inválida.' })
        nextState = { ...current.state, phase: 'target', cardIndex: Math.max(0, Math.min(20, Number(state.cardIndex) || 0)), card }
        const rounds = await database()`INSERT INTO mesma_pista_rounds(room_code, round_number, chooser_index, prompt, low_label, high_label, target)
          VALUES (${code}, ${(current.completedRounds || 0) + 1}, ${current.state.chooser}, ${card.prompt}, ${card.low}, ${card.high}, ${card.target})
          ON CONFLICT(room_code, round_number) DO UPDATE SET chooser_index = EXCLUDED.chooser_index, prompt = EXCLUDED.prompt,
            low_label = EXCLUDED.low_label, high_label = EXCLUDED.high_label, target = EXCLUDED.target
          RETURNING id`
        currentRoundId = rounds[0].id
      } else if (from === 'target' && to === 'target') {
        const card = safeCard(state.card)
        if (!card) return response.status(400).json({ error: 'Carta inválida.' })
        nextState = { ...current.state, cardIndex: Math.max(0, Math.min(20, Number(state.cardIndex) || 0)), card }
        if (currentRoundId) await database()`UPDATE mesma_pista_rounds SET prompt = ${card.prompt}, low_label = ${card.low}, high_label = ${card.high}, target = ${card.target} WHERE id = ${currentRoundId}`
      } else if (from === 'target' && to === 'guess') {
        nextState = { ...current.state, phase: 'guess', guesses: {}, guess: 50 }
      } else if (from === 'result' && to === 'setup') {
        nextState = { ...current.state, phase: 'setup', chooser: (current.state.chooser + 1) % current.state.players.length, responderCursor: 0, guesses: {}, guess: 50, card: null }
      } else if (hostAction && to === 'setup') {
        nextState = { ...current.state, phase: 'setup', chooser: 0, responderCursor: 0, guesses: {}, guess: 50, card: null, history: [], players: current.state.players.map((player) => ({ ...player, score: 0 })) }
      } else {
        return response.status(409).json({ error: 'Transição de rodada inválida.' })
      }
      const room = { ...current, code, state: nextState, currentRoundId, revision: (current.revision || 0) + 1, updatedAt: Date.now() }
      await cache.set(roomKey(code), room, { ttl: ROOM_TTL_SECONDS, tags: [`room-${code}`], name: 'sintonia-room' })
      return response.status(200).json(clientRoom(room, actorId))
    }

    if (action === 'join') {
      if (!await allowRequest(request, response, 'room_join', 40, 10, identity)) return response.status(429).json({ error: 'Muitas tentativas de entrada. Aguarde um pouco.' })
      const code = String(suppliedCode || '').trim().toUpperCase()
      if (!/^[A-Z0-9]{5}$/.test(code)) return response.status(400).json({ error: 'Código inválido' })
      const id = String(participantId || '').slice(0, 80)
      if (!id) return response.status(400).json({ error: 'Identificação do jogador ausente' })

      for (let attempt = 0; attempt < 5; attempt++) {
        const current = await cache.get(roomKey(code))
        if (!current) return response.status(404).json({ error: 'Sala não encontrada ou expirada' })
        if (current.state.phase !== 'lobby') return response.status(409).json({ error: 'A partida já começou' })
        const players = current.state.players || []
        const existingRole = players.findIndex((player) => player.id === id)
        if (existingRole >= 0) {
          if (!await authorizedParticipant(request, current, id, identity.deviceHash, participantToken)) return response.status(409).json({ error: 'Este identificador já está em uso.' })
          return response.status(200).json(clientRoom(current, id, participantToken))
        }
        if (players.length >= 8) return response.status(409).json({ error: 'A sala já tem 8 jogadores' })
        const role = players.length
        const cleanName = String(name || '').trim().slice(0, 18) || `Jogador ${role + 1}`
        const nextState = { ...current.state, players: [...players, { id, name: cleanName, color: ['#2264d1', '#e7614f', '#23a886', '#a85bd4', '#e89b27', '#e34f86', '#397f91', '#7d9b35'][role], score: 0 }] }
        const guestToken = randomBytes(32).toString('base64url')
        const room = { ...current, code, state: nextState, participantTokens: { ...(current.participantTokens || {}), [id]: participantTokenHash(guestToken) }, revision: (current.revision || 0) + 1, updatedAt: Date.now() }
        await cache.set(roomKey(code), room, { ttl: ROOM_TTL_SECONDS, tags: [`room-${code}`], name: 'sintonia-room' })
        const sql = database()
        const guest = await guestForIdentity(sql, identity.deviceHash, { roomCode: code, ...cleanAttribution(request.body?.attribution) })
        await sql`INSERT INTO mesma_pista_participants(room_code, participant_key, guest_id, nickname)
          VALUES (${code}, ${id}, ${guest.id}, ${cleanName}) ON CONFLICT(room_code, participant_key) DO NOTHING`
        await sql`UPDATE mesma_pista_rooms SET player_count = GREATEST(player_count, ${role + 1}) WHERE code = ${code}`
        await recordLeadEvent({ userId: current.hostUserId, guestId: guest.id, event: role === 1 ? 'second_player_joined' : role === 4 ? 'five_players_joined' : 'guest_joined_room', metadata: { roomCode: code } })
        await new Promise((resolve) => setTimeout(resolve, 80))
        const verified = await cache.get(roomKey(code))
        const verifiedRole = verified?.state?.players?.findIndex((player) => player.id === id) ?? -1
        if (verifiedRole >= 0) return response.status(200).json(clientRoom(verified, id, guestToken))
      }
      return response.status(409).json({ error: 'Muitos jogadores entraram ao mesmo tempo. Tente novamente.' })
    }

    if (action === 'guess') {
      if (!await allowRequest(request, response, 'guess', 120, 10, identity)) return response.status(429).json({ error: 'Muitos palpites enviados.' })
      const code = String(suppliedCode || '').trim().toUpperCase()
      const id = String(participantId || '').slice(0, 80)
      const numericGuess = Math.max(0, Math.min(100, Math.round(Number(request.body?.guess))))
      if (!/^[A-Z0-9]{5}$/.test(code) || !id || !Number.isFinite(numericGuess)) return response.status(400).json({ error: 'Palpite inválido' })

      for (let attempt = 0; attempt < 6; attempt++) {
        const current = await cache.get(roomKey(code))
        if (!current) return response.status(404).json({ error: 'Sala não encontrada ou expirada' })
        const playerIndex = current.state.players?.findIndex((player) => player.id === id) ?? -1
        if (playerIndex < 0 || playerIndex === current.state.chooser) return response.status(403).json({ error: 'Jogador não pode responder' })
        if (!await authorizedParticipant(request, current, id, identity.deviceHash, participantToken)) return response.status(403).json({ error: 'Identidade do participante inválida.' })
        if (current.state.phase === 'result') return response.status(200).json(clientRoom(current, id))
        if (current.state.phase !== 'guess') return response.status(409).json({ error: 'A rodada não está recebendo palpites' })
        if (!current.currentRoundId) return response.status(409).json({ error: 'Rodada sem registro válido.' })

        const sql = database()
        const participants = await sql`SELECT id, participant_key FROM mesma_pista_participants WHERE room_code = ${code}`
        const participant = participants.find((item) => item.participant_key === id)
        if (!participant) return response.status(403).json({ error: 'Participante não registrado nesta sala.' })
        const playerPoints = scoreGuess(numericGuess, current.state.card.target)
        await sql`INSERT INTO mesma_pista_answers(round_id, participant_id, guess, points)
          VALUES (${current.currentRoundId}, ${participant.id}, ${numericGuess}, ${playerPoints})
          ON CONFLICT(round_id, participant_id) DO NOTHING`
        const storedAnswers = await sql`SELECT p.participant_key, a.guess, a.points
          FROM mesma_pista_answers a JOIN mesma_pista_participants p ON p.id = a.participant_id
          WHERE a.round_id = ${current.currentRoundId}`
        const nextGuesses = Object.fromEntries(storedAnswers.map((answer) => [answer.participant_key, Number(answer.guess)]))
        const responderPlayers = current.state.players.filter((_, index) => index !== current.state.chooser)
        const allAnswered = responderPlayers.every((player) => nextGuesses[player.id] !== undefined)
        let nextState = { ...current.state, guesses: nextGuesses }

        if (allAnswered) {
          const completedRounds = (current.completedRounds || 0) + 1
          if (current.hostPlan !== 'paid' && completedRounds > FREE_ROUND_LIMIT) return response.status(402).json({ error: 'A degustação desta sala terminou após 8 rodadas. O anfitrião precisa liberar um passe.', code: 'PAYWALL' })
          const roundEntries = responderPlayers.map((player) => {
            const playerGuess = nextGuesses[player.id]
            const points = scoreGuess(playerGuess, current.state.card.target)
            return { prompt: current.state.card.prompt, points, guess: playerGuess, target: current.state.card.target, chooser: current.state.chooser, responder: current.state.players.findIndex((item) => item.id === player.id) }
          })
          const pointsById = Object.fromEntries(responderPlayers.map((player, index) => [player.id, roundEntries[index].points]))
          const nextPlayers = current.state.players.map((player) => ({ ...player, score: player.score + (pointsById[player.id] || 0) }))
          const publicId = randomBytes(9).toString('base64url')
          const alignment = Math.round(roundEntries.reduce((sum, entry) => sum + entry.points, 0) / Math.max(1, roundEntries.length * 4) * 100)
          const summary = { roomCode: code, round: completedRounds, prompt: current.state.card.prompt, alignment, players: nextPlayers.map((player) => ({ name: player.name, color: player.color, score: player.score })), answers: roundEntries.map((entry) => ({ points: entry.points, guess: entry.guess, responder: entry.responder })), createdAt: new Date().toISOString() }
          await sql`INSERT INTO mesma_pista_results(public_id, room_code, summary) VALUES (${publicId}, ${code}, ${JSON.stringify(summary)})`
          nextState = { ...nextState, phase: 'result', resultId: publicId, players: nextPlayers, history: [...roundEntries, ...(current.state.history || [])] }
          await sql`INSERT INTO mesma_pista_usage (user_id, device_hash, network_hash, room_code, event_name) VALUES (${current.hostUserId}, ${identity.deviceHash}, ${identity.networkHash}, ${code}, 'round_completed')`
          await sql`UPDATE mesma_pista_rooms SET round_count = ${completedRounds} WHERE code = ${code}`
        }

        const room = { ...current, code, state: nextState, completedRounds: allAnswered ? (current.completedRounds || 0) + 1 : (current.completedRounds || 0), revision: (current.revision || 0) + 1, updatedAt: Date.now() }
        await cache.set(roomKey(code), room, { ttl: ROOM_TTL_SECONDS, tags: [`room-${code}`], name: 'sintonia-room' })
        await new Promise((resolve) => setTimeout(resolve, 80))
        const verified = await cache.get(roomKey(code))
        if (verified?.state?.guesses?.[id] !== undefined) return response.status(200).json(clientRoom(verified, id))
      }
      return response.status(409).json({ error: 'Os palpites chegaram juntos demais. Tente novamente.' })
    }

    return response.status(400).json({ error: 'Ação inválida' })
  }

  response.setHeader('Allow', 'GET, POST')
  return response.status(405).json({ error: 'Método não permitido' })
}
