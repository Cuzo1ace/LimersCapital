/**
 * Client-side API wrapper for /game/* endpoints on the API proxy.
 * Handles quiz submission, LP/XP reporting, leaderboard fetching,
 * and game state sync with Cloudflare Worker KV.
 */

const API_PROXY = import.meta.env.VITE_API_PROXY_URL || 'https://limer-api-proxy.solanacaribbean-team.workers.dev';

// Client-side answer keys for offline/fallback grading
const QUIZ_ANSWERS = {
  'quiz-1': [1, 1, 2, 1, 2],
  'quiz-2': [1, 1, 1, 1, 1],
  'quiz-3': [1, 1, 1, 1, 1],
  'quiz-4': [1, 2, 1, 1, 2],
  'quiz-5': [1, 1, 1, 1, 0],
  'quiz-6': [1, 1, 1, 1, 0],
  'quiz-7': [1, 1, 1, 1, 1],
  'quiz-8': [1, 1, 1, 1, 1],
};

/**
 * Grade quiz locally — used as fallback when the API is unreachable.
 */
function gradeLocally(quizId, answersArray) {
  const key = QUIZ_ANSWERS[quizId];
  if (!key) throw new Error(`Unknown quiz: ${quizId}`);
  const correct = answersArray.map((a, i) => a === key[i]);
  const score = correct.filter(Boolean).length;
  const total = key.length;
  return {
    passed: score / total >= 0.7,
    perfect: score === total,
    score,
    total,
    correct,
    explanations: correct.map((c) => c ? 'Correct!' : 'Incorrect — review the lesson for details.'),
    offline: true,
  };
}

/**
 * Submit quiz answers to the server for validation.
 * Falls back to client-side grading if the API is unreachable.
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

  try {
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
  } catch {
    // API unreachable — fall back to client-side grading
    return gradeLocally(quizId, answersArray);
  }
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
