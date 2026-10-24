export const BOARD = { width: 320, height: 200, paddleY: 177, paddleWidth: 64, radius: 6 };
export const newRound = () => ({ x: 160, y: 90, vx: 95, vy: -115, paddle: 160, score: 0, over: false });
export type Round = ReturnType<typeof newRound>;
export function stepRound(round: Round, dt: number) {
  if (round.over) return;
  const previous = round.y;
  round.x += round.vx * dt; round.y += round.vy * dt;
  if (round.x < BOARD.radius) { round.x = BOARD.radius; round.vx = Math.abs(round.vx); }
  if (round.x > BOARD.width - BOARD.radius) { round.x = BOARD.width - BOARD.radius; round.vx = -Math.abs(round.vx); }
  if (round.y < BOARD.radius) { round.y = BOARD.radius; round.vy = Math.abs(round.vy); }
  if (round.vy > 0 && previous + BOARD.radius <= BOARD.paddleY && round.y + BOARD.radius >= BOARD.paddleY && Math.abs(round.x - round.paddle) <= BOARD.paddleWidth / 2 + BOARD.radius) {
    round.y = BOARD.paddleY - BOARD.radius;
    const speed = Math.min(270, Math.hypot(round.vx, round.vy) * 1.06);
    const angle = (round.x - round.paddle) / (BOARD.paddleWidth / 2 + BOARD.radius) * 1.05;
    round.vx = Math.sin(angle) * speed; round.vy = -Math.cos(angle) * speed; round.score++;
  }
  if (round.y > BOARD.height + BOARD.radius) round.over = true;
}
