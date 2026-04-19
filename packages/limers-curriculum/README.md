# @limers/curriculum

> A ready-to-drop crypto/DeFi learning curriculum — 8 modules, 37+ lessons, 8 quizzes — extracted from the [Limer's Capital](https://limerscapital.com) flagship and published for any Solana retail app that needs a serious learn-to-earn content layer.

## What's in the box

| Level         | Modules | Focus                                                        |
| ------------- | ------- | ------------------------------------------------------------ |
| Basics        | 2       | Blockchain foundations · wallets · Caribbean markets         |
| Intermediate  | 3       | Solana ecosystem · security · ownership economics (UBO)      |
| Advanced      | 3       | LP provisioning · Meteora · impermanent loss · farming yield |

37+ lessons spanning wallets, DeFi, tokenization, on-chain analysis, regulatory landscape, and DLMM strategy. 8 quizzes, each gated with a 70%+ pass-to-complete threshold. All content is plain JS modules — tree-shakeable, localizable, replaceable per-lesson.

## Install

```bash
npm install @limers/curriculum
```

## Usage

```js
import { MODULES, LESSONS, QUIZZES, LEVELS } from '@limers/curriculum';

// Render a module list
MODULES.map((m) => (
  <Card key={m.id} icon={m.icon} title={m.title} description={m.description}>
    {m.lessons.length} lessons · quiz: {m.quizId}
  </Card>
));

// Deep-read a lesson
const lesson = LESSONS['1-1'];
lesson.content.forEach((para) => renderMarkdown(para));

// Render a quiz (answers are NOT in this package — see "Quiz answers" below)
const quiz = QUIZZES['quiz-1'];
quiz.questions.forEach((q) => <Question text={q.q} options={q.opts} />);
```

## Shape

See [`src/schema.js`](src/schema.js) for full JSDoc types: `Level`, `Module`, `Lesson`, `Quiz`, `QuizQuestion`.

## Quiz answers

**Answer keys are intentionally not shipped client-side.** The flagship validates quiz submissions via a Cloudflare Worker at `/game/quiz-submit` — that endpoint consults a server-side copy of the answers + explanations and returns per-question correctness.

For your own integration, pick one:
1. **Server-validated** (recommended for any reward-bearing quiz): deploy a matching endpoint with answer keys. See `workers/api-proxy.js` in the Limer's Capital repo for a reference implementation.
2. **Self-reported** (fine for non-gated educational reviews): trust the client; accept any completion as a pass.

## Pairs with

- [`@limers/gamification`](../limers-gamification) — XP, tiers, badges, LP multipliers. The reward layer that turns this curriculum into a learn-to-earn product.

## Versioning

Content is semantically versioned: breaking changes to any module/lesson `id` constitute a **major** bump (consumers may persist these ids). Content edits that preserve ids are **minor**/patch.

## License

Apache-2.0 · © Limer's Capital
