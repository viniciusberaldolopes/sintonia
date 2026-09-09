export const TARGET_POSITIONS = Array.from({ length: 21 }, (_, index) => index * 5)

export function shuffledTargets(random = Math.random) {
  const positions = [...TARGET_POSITIONS]
  for (let index = positions.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(random() * (index + 1))
    ;[positions[index], positions[swapIndex]] = [positions[swapIndex], positions[index]]
  }
  return positions
}

export function scoreGuess(guess, target) {
  const distance = Math.abs(Number(guess) - Number(target))
  const points = distance <= 4 ? 4 : distance <= 9 ? 3 : distance <= 14 ? 2 : 0
  const feedback = distance <= 4 ? 'mesma pista!' : distance <= 9 ? 'quase lá' : distance <= 14 ? 'na borda' : 'fora do alvo'
  return { distance, points, feedback }
}
