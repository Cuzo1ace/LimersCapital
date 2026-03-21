/**
 * Client-side API wrapper for /game/* endpoints on the API proxy.
 * Handles quiz submission, LP/XP reporting, leaderboard fetching,
 * and game state sync with Cloudflare Worker KV.
 */

const API_PROXY = import.meta.env.VITE_API_PROXY_URL || '';

/**
 * Submit quiz answers to the server for validation.
 * Answers are validated server-side — the client never sees correct answers.
 *
 * @param {string} quizId - e.g. 'quiz-1'
 * @param {Object} answers - map of questionIndex → selectedOptionIndex
 * @param {number} totalQuestions - total number of questions
 * @returns {Promise<{passed: boolean, perfect: boolean, score: number, total: number, correct: boolean[], explanations: string[]}>}
 */
export async function submitQuizToServer(quizId, answers, totalQuestions) {
  // Convert answers object to ordered array
  const answersArray = [];
  for (let i = 0; i < totalQuestions; i++) {
    answersArray.push(answers[i] ?? -1); // -1 = unanswered
  }

  const response = await fetch(`${API_PROXY}/game/quiz-submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quizId, answers: answersArray }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Quiz submission failed (${response.status})`);
  }

  return response.json();
}

/**
 * Fetch the public leaderboard (top 100).
 * @returns {Promise<Array<{rank: number, wallet: string, displayName: string, lp: number, tier: string}>>}
 */
export async function fetchLeaderboard() {
  const response = await fetch(`${API_PROXY}/game/leaderboard`);
  if (!response.ok) throw new Error('Failed to fetch leaderboard');
  return response.json();
}

/**
 * Report an LP award to the server (fire-and-forget).
 * Server validates and records the canonical value in KV.
 *
 * @param {string} action - e.g. 'trade', 'lesson', 'quiz'
 * @param {number} amount - LP amount awarded locally
 * @param {Object} metadata - action-specific data
 */
export async function reportLPAward(action, amount, metadata = {}) {
  try {
    await fetch(`${API_PROXY}/game/award-lp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, amount, metadata }),
    });
  } catch {
    // Silently fail — local state is the optimistic cache
  }
}

/**
 * Report an XP award to the server (fire-and-forget).
 */
export async function reportXPAward(action, amount, metadata = {}) {
  try {
    await fetch(`${API_PROXY}/game/award-xp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, amount, metadata }),
    });
  } catch {
    // Silently fail
  }
}
