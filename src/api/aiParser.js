import { GoogleGenerativeAI } from '@google/generative-ai';
import { parseQuestionsFromText as localStubParse } from '../utils/aiParserStub';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const GEMINI_MODEL = import.meta.env.VITE_GEMINI_MODEL || 'gemini-2.5-flash';

// Small diagnostic to verify whether Gemini is actually configured in the built client
if (typeof window !== 'undefined') {
  // Do NOT log the key itself, only whether it is present
  // This helps to understand why the client might still fall back to the local stub.
  // You can see this log in the browser DevTools console.
  // eslint-disable-next-line no-console
  console.log('[aiParser] GEMINI_API_KEY present:', Boolean(GEMINI_API_KEY), 'model:', GEMINI_MODEL);
}

function buildPrompt(input, options = {}) {
  return [
    'You are an assistant that converts plain text into a JSON schema of test questions for UBT.',
    'Return ONLY valid JSON. No commentary, no markdown fences.',
    'Schema: { "questions": [ {',
    '  "type": "single" | "multi" | "matching",',
    '  "contentText": string,',
    '  "contentHtml": string (optional),',
    '  "imageUrls": string[] (optional, additional images shown under the question),',
    '  "inlineImageUrls": string[] (optional, images for inline PHOTO placeholders in contentText/options, order matters),',
    '  "options": { "A": {"type":"text"|"image","value":string,"image"?:string}, "B": {...}, ... } (for single/multi),',
    '  "correct": ["A","B",...] (for single/multi),',
    '  "matchPairs": [{"left": string, "right": string}] (for matching),',
    '  "correctMatches": {"leftId": "rightId"} (for matching),',
    '  "points": number (default 1)',
    '} ] }',
    '',
    'Rules:',
    '- There are exactly 40 questions, numbered "1)", "2)" ... "40)".',
    '- Use the question NUMBER RANGE to decide the type and options:',
    '  * 1-25: standard single-choice questions with exactly 4 options (A-D) and type:"single".',
    '  * 26-30: context-based single-choice questions. If several questions share one context, copy the shared passage into contentHtml, then insert a <hr /> separator, then append the question-specific text. type:"single".',
    '  * 31-35: matching tasks; set type:"matching" and use matchPairs + correctMatches. Do NOT rely on options/correct for these.',
    '  * 36-40: single- or multi-answer questions with up to 6 options (A-F). Use type:"single" when there is exactly one correct option, or type:"multi" when there are several correct options (ideally no more than 3 correct letters).',
    '- The input may contain MANY questions in one text. Each question starts with a line like "1) ...", "2) ..." etc. Treat every such numbered block as a SEPARATE question object in the "questions" array. Never merge multiple numbered questions into a single JSON object.',
    '- A single numbered question continues until the NEXT line that starts with another "N)" question number or the end of the input. Ignore empty/blank lines inside the question; they do NOT end the question.',
    '- Do not create extra questions from option lines ("A) ..." etc.), from "Correct:" lines, or from lines that contain only the question number or only an image URL. All of these belong to the current numbered question.',
    '- Do not include the leading number token like "27)" / "1)" inside contentText or contentHtml; strip it from the beginning of the question text.',
    '- Prefer contentText. contentHtml may be empty.',
    '- For multi, correct is an array of option keys.',
    '- For matching, include matchPairs and correctMatches and set type:"matching".',
    '- Options should use keys from "A" up to "F" at most. Do not create more than 6 options per question.',
    '- If some questions do not explicitly specify "Correct:" answers, you must still set "correct" using your best judgment based on the question and options. Never leave "correct" empty for any question.',
    '- If the formatting or numbering is imperfect, still parse as many reasonable questions as possible instead of failing; be tolerant to minor mistakes.',
    '- Lines that start with "Correct:" or "Points:" are metadata for the current question and MUST NOT be treated as answer options or separate questions. Never create an option from the letter inside the word "Correct".',
    '- If the input contains a shared context text (for example a labelled block like "Контекст" / "Context" with a paragraph and maybe image links) followed by several numbered questions that rely on this context, then for EACH of those questions you must copy the shared context into contentHtml at the top, then insert a <hr /> separator, then append the question-specific text below it.',
    '- If the context text contains inline image markers like "[[img: URL]]", replace each such marker in contentHtml with an <img src="URL" alt="" /> tag placed at the same position. In contentText you must remove these markers and keep only readable text.',
    '- If the input contains a block like "Images:" followed by lines such as "- <url>", treat the first non-empty token after "-" as the image URL. This URL may be http, https, data:image, or any other scheme. Put ALL such URLs into imageUrls for that question (these are additional images, not inline).',
    '- Inline images inside the QUESTION TEXT may appear as markers like "[[img: URL]]" or as raw image URLs (http/https/data:image) in the middle of the sentence. For each such inline image: add the URL to inlineImageUrls (in order of appearance) and in contentText replace the whole marker/URL with the word "PHOTO". Do not create options from these URLs.',
    '- Answer options may also reference images. If an option line looks like "A) Image: <url> (description)", then create option A with {"type":"image","image":"<url>","value":"description"}. If there is no description, value can be an empty string. The <url> may be http, https, data:image, etc.',
    '- Do NOT lose any explicit image links from the input; always map them either to imageUrls or to options[*].image.',
    '- The input may contain math formulas written in TeX/LaTeX-style notation, for example: "$\\log_{3} 27$", "$\\frac{a^5 \\cdot a^3}{a^2}$", "$E_k = \\frac{mv^2}{2}$", powers like "x^2", subscripts like "a_1". You must copy these formulas EXACTLY as they appear into contentText/contentHtml without changing characters, removing backslashes, or converting them into words. Do not escape the backslashes again and do not remove the $ delimiters.',
    '- Before you output JSON, think through the 40-question structure carefully and double-check that each numbered question N) has the right type, options, correct answers, images, and math formulas preserved. Then output ONLY the final JSON (no commentary, no markdown).',
    '',
    'Input:',
    input
  ].join('\n');
}

function tryParseJson(text) {
  if (!text || typeof text !== 'string') return null;

  const candidates = [];

  // 1) Whole text as-is
  candidates.push(text);

  // 2) Markdown fenced blocks ```json ... ``` or ``` ... ```
  const fenceMatch = text.match(/```json\s*([\s\S]*?)```/i) || text.match(/```\s*([\s\S]*?)```/i);
  if (fenceMatch && fenceMatch[1]) {
    candidates.push(fenceMatch[1]);
  }

  // 3) Best-effort: take substring between first '{' and last '}'
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    candidates.push(text.slice(start, end + 1));
  }

  const tryParseCandidate = (raw) => {
    if (!raw || typeof raw !== 'string') return null;

    // First attempt: as-is
    try {
      return JSON.parse(raw);
    } catch (_) {}

    // Second attempt: strip trailing commas before } or ]
    const cleaned = raw.replace(/,\s*([}\]])/g, '$1');
    if (cleaned !== raw) {
      try {
        return JSON.parse(cleaned);
      } catch (_) {}
    }
    return null;
  };

  for (const candidate of candidates) {
    const parsed = tryParseCandidate(candidate);
    if (parsed) return parsed;
  }

  return null;
}

function normalizeQuestions(payload) {
  const out = Array.isArray(payload?.questions) ? payload.questions : [];
  let order = 1;
  return out.map((q) => {
    const qOrder = order;

    let contentText = q?.contentText || '';
    const contentHtml = q?.contentHtml || '';
    const imageUrls = Array.isArray(q?.imageUrls) ? q.imageUrls : [];
    let inlineImageUrls = Array.isArray(q?.inlineImageUrls) ? [...q.inlineImageUrls] : [];
    const options = q?.options && typeof q.options === 'object' ? q.options : {};

    // Normalize correct answers array first
    let correct = Array.isArray(q?.correct) ? [...q.correct] : (q?.correct ? [q.correct] : []);

    // If inlineImageUrls not explicitly provided, derive them from contentText ([[img: URL]] or raw URLs)
    if (inlineImageUrls.length === 0 && typeof contentText === 'string' && contentText) {
      // [[img: URL]] markers -> PHOTO + inlineImageUrls
      const inlineImgRegex = /\[\[img:\s*([^\]]+)\]\]/gi;
      if (inlineImgRegex.test(contentText)) {
        contentText = contentText.replace(inlineImgRegex, (_, url) => {
          const cleanUrl = (url || '').trim();
          if (cleanUrl) {
            inlineImageUrls.push(cleanUrl);
            return 'PHOTO';
          }
          return '';
        }).trim();
      }

      // Raw image URLs in text -> PHOTO + inlineImageUrls
      const rawImgRegex = /(https?:\/\/[^\s]+\.(?:jpg|jpeg|png|gif|webp|svg)|data:image\/[^\s]+)/gi;
      if (rawImgRegex.test(contentText)) {
        contentText = contentText.replace(rawImgRegex, (m) => {
          const cleanUrl = (m || '').trim();
          if (cleanUrl) {
            inlineImageUrls.push(cleanUrl);
            return 'PHOTO';
          }
          return '';
        }).trim();
      }
    }

    // Infer type based on Gemini output and question index range
    let type = q?.type || (Array.isArray(correct) && correct.length > 1 ? 'multi' : 'single');
    const isMatchingRange = qOrder >= 31 && qOrder <= 35;
    const isComplexBlock = qOrder >= 36 && qOrder <= 40;

    if (isMatchingRange) {
      type = 'matching';
    } else if (qOrder >= 1 && qOrder <= 30) {
      // 1-25 and 26-30 are always treated as single-choice
      type = 'single';
    } else if (isComplexBlock) {
      // 36-40: single or multi depending on correct answers count
      if (!q?.type && Array.isArray(correct)) {
        type = correct.length > 1 ? 'multi' : 'single';
      }
    }

    // Default correct answers: keep empty for matching, but not for single/multi
    if ((!Array.isArray(correct) || correct.length === 0) && type !== 'matching') {
      correct = ['A'];
    }

    // Points: ensure complex block 36-40 has at least 2 points
    const rawPoints = Number(q?.points);
    let points = Number.isFinite(rawPoints) && rawPoints > 0 ? rawPoints : 1;
    if (isComplexBlock && points < 2) {
      points = 2;
    }

    const normalized = {
      id: q?.id || `ai_${Date.now()}_${qOrder}`,
      order: qOrder,
      type,
      contentText,
      contentHtml,
      imageUrls,
      inlineImageUrls,
      options,
      correct,
      points,
    };
    if (type === 'matching') {
      normalized.matchPairs = Array.isArray(q?.matchPairs) ? q.matchPairs : [];
      normalized.correctMatches = q?.correctMatches && typeof q.correctMatches === 'object' ? q.correctMatches : {};
    }
    order += 1;
    return normalized;
  });
}

async function parseWithGemini(input, options) {
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    // Ask Gemini to respond as pure JSON to reduce parsing errors
    generationConfig: {
      responseMimeType: 'application/json',
    },
  });
  const prompt = buildPrompt(input, options);
  const result = await model.generateContent(prompt);
  const text = typeof result?.response?.text === 'function' ? result.response.text() : '';

  if (typeof window !== 'undefined') {
    // eslint-disable-next-line no-console
    console.log('[aiParser] Gemini raw response (first 400 chars):', String(text).slice(0, 400));
  }

  const parsed = tryParseJson(text);
  if (!parsed) {
    const stub = localStubParse(input, options);
    return { ...stub, meta: { ...stub.meta, source: 'gemini_parse_failed_stub' } };
  }
  const questions = normalizeQuestions(parsed);
  return { questions, meta: { source: 'gemini_client', model: GEMINI_MODEL, count: questions.length } };
}

export async function parseQuestionsWithAI(input, options = {}) {
  if (!input || typeof input !== 'string') {
    return { questions: [], meta: { source: 'client', reason: 'empty_input' } };
  }

  try {
    if (GEMINI_API_KEY) {
      return await parseWithGemini(input, options);
    }
  } catch (e) {
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line no-console
      console.error('[aiParser] Gemini error, falling back to local stub:', e);
    }
  }
  return localStubParse(input, options);
}

export default { parseQuestionsWithAI };
