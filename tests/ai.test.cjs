const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validateQuestions, buildPrompt } = require('../functions/ai');
const { courseSummary } = require('../functions/catalog');

test('quiz imports reject missing, negative and out-of-range answer keys', () => {
  for (const correct of [undefined, null, -1, 2, '0']) {
    assert.throws(() =>
      validateQuestions(
        { questions: [{ text: 'Question', options: ['A', 'B'], correct }] },
        'parseQuiz',
      ),
    );
  }
});

test('quiz imports preserve supplied answers and LaTeX', () => {
  const [question] = validateQuestions(
    {
      questions: [
        {
          text: 'Evaluate $x^2$',
          options: ['One', 'Two'],
          correct: 1,
        },
      ],
    },
    'parseQuiz',
  );
  assert.equal(question.correct, 1);
  assert.equal(question.text, 'Evaluate $x^2$');
});

test('test imports reject missing and nonexistent correct options', () => {
  for (const correct of [[], ['Z'], ['A', 'A'], ['A', 'B']]) {
    assert.throws(() =>
      validateQuestions(
        {
          questions: [
            {
              type: 'single',
              contentText: 'Question',
              options: { A: { type: 'text', value: 'One' }, B: { type: 'text', value: 'Two' } },
              correct,
            },
          ],
        },
        'parseTest',
      ),
    );
  }
});

test('AI imports reject executable image URLs', () => {
  assert.throws(() =>
    validateQuestions(
      {
        questions: [
          {
            type: 'single',
            contentText: 'Question',
            correct: ['A'],
            options: { A: { type: 'text', value: 'One' }, B: { type: 'text', value: 'Two' } },
            imageUrls: ['javascript:alert(1)'],
          },
        ],
      },
      'parseTest',
    ),
  );
});

test('matching imports use the ID and label structure consumed by the player', () => {
  const [question] = validateQuestions(
    {
      questions: [
        {
          type: 'matching',
          contentText: 'Match the terms',
          matchPairs: [
            { left: 'One', right: 'First' },
            { left: 'Two', right: 'Second' },
          ],
          correctMatches: { One: 'First', Two: 'Second' },
        },
      ],
    },
    'parseTest',
  );
  assert.deepEqual(question.matchPairs[0], {
    left: { id: 'L1', label: 'One' },
    right: { id: 'R1', label: 'First' },
  });
  assert.deepEqual(question.correctMatches, { L1: 'R1', L2: 'R2' });
});

test('AI instructions require supplied answers', () => {
  assert.match(buildPrompt('Untrusted document', 'parseQuiz'), /Never guess/);
});

test('course catalog omits lesson content, answers and private fields', () => {
  const summary = courseSummary({
    title: 'Course',
    privateNote: 'Private',
    modules: {
      one: { lessons: { first: { duration: 12, videoUrl: 'private', quiz: { answers: [1] } } } },
    },
  });
  assert.equal(summary.lessonCount, 1);
  assert.equal(summary.durationMinutes, 12);
  assert.equal(summary.modules, undefined);
  assert.equal(summary.privateNote, undefined);
  assert.equal(courseSummary({ published: false }), null);
});
