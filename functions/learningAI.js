const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');
const { buildPrompt, validateQuestions } = require('./ai');

exports.processLearningAI = functions
  .runWith({ secrets: ['GEMINI_API_KEY'], timeoutSeconds: 90, maxInstances: 3 })
  .https.onCall(async (data, context) => {
    if (!context.auth)
      throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    const user = await admin.auth().getUser(context.auth.uid);
    if (user.disabled || user.customClaims?.admin !== true) {
      throw new functions.https.HttpsError('permission-denied', 'Admin access required');
    }
    if (
      !['parseTest', 'parseQuiz'].includes(data?.operation) ||
      typeof data.input !== 'string' ||
      !data.input.trim() ||
      data.input.length > 60000
    ) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid import');
    }
    if (!process.env.GEMINI_API_KEY || !process.env.GEMINI_API_URL) {
      throw new functions.https.HttpsError('failed-precondition', 'AI service is not configured');
    }
    const endpoint = new URL(process.env.GEMINI_API_URL);
    if (
      endpoint.protocol !== 'https:' ||
      endpoint.hostname !== 'generativelanguage.googleapis.com'
    ) {
      throw new functions.https.HttpsError('failed-precondition', 'Invalid AI endpoint');
    }
    const now = Date.now();
    const limit = await admin
      .database()
      .ref(`privateRateLimits/ai/${context.auth.uid}`)
      .transaction((current) => {
        const count = current?.window > now - 60000 ? current.count : 0;
        if (count >= 5) return;
        return { window: count ? current.window : now, count: count + 1 };
      });
    if (!limit.committed)
      throw new functions.https.HttpsError('resource-exhausted', 'Import limit reached');
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': process.env.GEMINI_API_KEY,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: buildPrompt(data.input, data.operation) }] }],
          generationConfig: { responseMimeType: 'application/json' },
        }),
        signal: AbortSignal.timeout(75000),
      });
      if (!response.ok) throw new Error('provider-unavailable');
      const payload = await response.json();
      const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('');
      const parsed = JSON.parse(text);
      if (parsed.error === 'missing-answer-key') {
        throw new functions.https.HttpsError(
          'failed-precondition',
          'An explicit answer key is required',
        );
      }
      const questions = validateQuestions(parsed, data.operation);
      return { questions, meta: { source: 'gemini', count: questions.length } };
    } catch (error) {
      if (error instanceof functions.https.HttpsError) throw error;
      throw new functions.https.HttpsError(
        'unavailable',
        'Import failed. Check the source and retry.',
      );
    }
  });
