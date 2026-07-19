/**
 * Elo rating utilities for multiplayer coding battles.
 *
 * Elo expectation and rating updates are based on the standard Elo system:
 *   expectedA = 1 / (1 + 10^((Rb - Ra) / 400))
 *   newRa = Ra + K * (scoreA - expectedA)
 */

/**
 * Expected score for a player given both ratings.
 * @param {number} playerRating
 * @param {number} opponentRating
 * @returns {number} expected score in [0,1]
 */
export function expectedScore(playerRating, opponentRating) {
  const ra = Number(playerRating) || 0;
  const rb = Number(opponentRating) || 0;
  return 1 / (1 + Math.pow(10, (rb - ra) / 400));
}

/**
 * Apply Elo update for one match.
 * @param {Object} params
 * @param {number} params.playerRating current player rating
 * @param {number} params.opponentRating opponent rating
 * @param {number} params.score actual score for player (1=win, 0=loss, 0.5=draw)
 * @param {number} [params.kFactor=32]
 * @returns {{ newRating: number, delta: number, expected: number }}
 */
export function applyElo({ playerRating, opponentRating, score, kFactor = 32 }) {
  const ra = Number(playerRating) || 0;
  const rb = Number(opponentRating) || 0;
  const s = Number(score);
  const actualScore = Number.isFinite(s) ? s : 0;

  const expected = expectedScore(ra, rb);
  const delta = kFactor * (actualScore - expected);
  const newRating = Math.round(ra + delta);

  return { newRating, delta, expected };
}

/**
 * Tier mapping by rating.
 * You can tune these thresholds later.
 * @param {number} rating
 * @returns {{ tier: string, nextTier?: string, progress?: number }}
 */
export function ratingToTier(rating) {
  const r = Number(rating) || 0;

  if (r < 1200) return { tier: 'Novice' };
  if (r < 1400) return { tier: 'Intermediate', nextTier: 'Advanced', progress: (r - 1200) / 200 };
  if (r < 1600) return { tier: 'Advanced', nextTier: 'Expert', progress: (r - 1400) / 200 };
  if (r < 1800) return { tier: 'Expert', nextTier: 'Master', progress: (r - 1600) / 200 };
  return { tier: 'Master' };
}
