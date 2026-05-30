const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { parseQuestionsFromText: fallbackStub } = require('./aiParserStub');

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

function buildPrompt(input, options = {}) {
  return [
    'You are an assistant that converts plain text into a JSON schema of test questions for UBT.',
    'Extract questions and options and return ONLY valid JSON. No commentary, no markdown fences.',
    'Schema: { "questions": [ {',
    '  "type": "single" | "multi" | "matching",',
    '  "contentText": string,',
    '  "contentHtml": string (optional),',
    '  "imageUrls": string[] (optional),',
    '  "options": { "A": {"type":"text","value":string}, "B": {...}, "C": {...}, "D": {...} } (for single/multi),',
    '  "correct": ["A","B",...] (for single/multi),',
    '  "matchPairs": [{"left": string, "right": string}] (for matching),',
    '  "correctMatches": {"leftId": "rightId"} (for matching),',
    '  "points": number (default 1)',
    '} ] }',
    '',
    'Rules:',
    '- Prefer contentText. contentHtml may be empty.',
    '- For multi, correct is an array of option keys.',
    '- For matching, include matchPairs and correctMatches and set type:"matching".',
    '- Ensure valid JSON. Do not include markdown code fences.',
    '',
    'Input:',
    input
  ].join('\n');
}

function tryParseJson(text) {
  try {
    return JSON.parse(text);
  } catch (_) {
    const fence = text.match(/```json\s*([\s\S]*?)```/i) || text.match(/```\s*([\s\S]*?)```/i);
    if (fence && fence[1]) {
      try { return JSON.parse(fence[1]); } catch (_) { /* noop */ }
    }
    return null;
  }
}

function normalizeQuestions(payload) {
  const out = Array.isArray(payload?.questions) ? payload.questions : [];
  let order = 1;
  return out.map((q) => {
    const type = q?.type || (Array.isArray(q?.correct) && q.correct.length > 1 ? 'multi' : 'single');
    const options = q?.options && typeof q.options === 'object' ? q.options : {};
    const normalized = {
      id: q?.id || `ai_${Date.now()}_${order}`,
      order,
      type,
      contentText: q?.contentText || '',
      contentHtml: q?.contentHtml || '',
      imageUrls: Array.isArray(q?.imageUrls) ? q.imageUrls : [],
      options,
      correct: Array.isArray(q?.correct) ? q.correct : (q?.correct ? [q.correct] : ['A']),
      points: Number.isFinite(q?.points) && q.points > 0 ? q.points : 1,
    };
    if (type === 'matching') {
      normalized.matchPairs = Array.isArray(q?.matchPairs) ? q.matchPairs : [];
      normalized.correctMatches = q?.correctMatches && typeof q.correctMatches === 'object' ? q.correctMatches : {};
    }
    order += 1;
    return normalized;
  });
}

app.post('/aiParseQuestions', async (req, res) => {
  const { input, options } = req.body || {};
  if (!input || typeof input !== 'string') {
    return res.status(400).json({ questions: [], error: 'empty_input' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const stub = fallbackStub(input, options);
    return res.status(200).json(stub);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
    const model = genAI.getGenerativeModel({ model: modelName });
    const prompt = buildPrompt(input, options);

    const result = await model.generateContent(prompt);
    const text = result?.response?.text?.() || '';
    const parsed = tryParseJson(text);
    if (!parsed) {
      const stub = fallbackStub(input, options);
      return res.status(200).json(stub);
    }

    const questions = normalizeQuestions(parsed);
    return res.status(200).json({ questions, meta: { source: 'gemini', model: modelName, count: questions.length } });
  } catch (err) {
    const stub = fallbackStub(input, options);
    return res.status(200).json(stub);
  }
});

app.get('/healthz', (_, res) => res.json({ ok: true }));

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`AI server listening on :${port}`);
});
