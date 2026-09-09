import test from 'node:test'
import assert from 'node:assert/strict'
import { scoreGuess, shuffledTargets, TARGET_POSITIONS } from './engine.js'

test('pontuação respeita todas as faixas e extremos', () => {
  assert.equal(scoreGuess(0, 0).points, 4)
  assert.equal(scoreGuess(4, 0).points, 4)
  assert.equal(scoreGuess(9, 0).points, 3)
  assert.equal(scoreGuess(14, 0).points, 2)
  assert.equal(scoreGuess(15, 0).points, 0)
  assert.equal(scoreGuess(100, 100).points, 4)
})

test('sacola de alvos mantém todas as posições, incluindo 0 e 100', () => {
  const shuffled = shuffledTargets(() => 0.42)
  assert.equal(shuffled.length, TARGET_POSITIONS.length)
  assert.deepEqual([...shuffled].sort((a, b) => a - b), TARGET_POSITIONS)
})
