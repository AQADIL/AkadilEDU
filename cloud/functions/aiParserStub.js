// aiParserStub.js
// This is a local, offline stub. It DOES NOT call any external AI APIs.
// Use it in Admin builder to transform pasted text into a draft question set.

/**
 * parseQuestionsFromText
 * Very naive parser that splits by double newlines and tries to guess options/correct.
 * Returns an array of question objects compatible with our QuestionEditor/TestPlayer.
 *
 * @param {string} input - raw text pasted by admin
 * @param {object} options - optional config { defaultPoints?: number }
 * @returns {{ questions: Array<object>, meta: object }}
 */
function parseQuestionsFromText(input, options = {}) {
  const defaultPoints = Number.isFinite(options.defaultPoints) ? options.defaultPoints : 1;
  if (!input || typeof input !== 'string') {
    return { questions: [], meta: { source: 'stub', count: 0 } };
  }

  const blocks = input
    .split(/\n\s*\n/)
    .map(s => s.trim())
    .filter(Boolean);

  const questions = [];
  let qIndex = 1;

  for (const block of blocks) {
    // Try to split into lines and detect options starting with A), B), etc.
    const lines = block.split(/\n/).map(s => s.trim()).filter(Boolean);
    if (lines.length === 0) continue;

    const contentText = lines[0];
    const optionLines = lines.slice(1);

    const optionsMap = {};
    const optionKeyOrder = ['A', 'B', 'C', 'D'];
    let correct = [];

    optionLines.forEach((line) => {
      const m = line.match(/^([A-D])[\)\.]\s*(.*)$/i);
      if (m) {
        const key = m[1].toUpperCase();
        const text = m[2].trim();
        optionsMap[key] = { type: 'text', value: text };
      }
      const cm = line.match(/^correct\s*[:=]\s*([A-D](?:,\s*[A-D])*)$/i);
      if (cm) {
        correct = cm[1].split(/,\s*/).map(s => s.trim().toUpperCase());
      }
    });

    // Fallback single-choice if no options detected
    if (Object.keys(optionsMap).length === 0) {
      optionsMap['A'] = { type: 'text', value: 'Иә / Yes' };
      optionsMap['B'] = { type: 'text', value: 'Жоқ / No' };
      correct = ['A'];
    }

    if (correct.length === 0) correct = ['A'];

    const question = {
      id: `stub_${Date.now()}_${qIndex}`,
      order: qIndex,
      type: correct.length > 1 ? 'multi' : 'single',
      contentText,
      contentHtml: '',
      imageUrls: [],
      options: optionsMap,
      correct,
      points: defaultPoints,
    };

    questions.push(question);
    qIndex += 1;
  }

  return {
    questions,
    meta: {
      source: 'aiParserStub',
      count: questions.length,
      createdAt: new Date().toISOString(),
      warning: 'This is a simple local stub. No AI calls were made.'
    }
  };
}

module.exports = { parseQuestionsFromText };
