// src/utils/aiParserStub.js
// Local fallback parser; no external calls.
export function parseQuestionsFromText(input, options = {}) {
  const defaultPoints = Number.isFinite(options.defaultPoints) ? options.defaultPoints : 1;
  if (!input || typeof input !== 'string') {
    return { questions: [], meta: { source: 'stub', count: 0 } };
  }

  const blocks = input
    .split(/\n\s*\n/)
    .map(s => s.trim())
    .filter(Boolean);

  // Merge blocks so that options (A–F), Images:, and Correct: lines
  // are not treated as separate questions when separated by blank lines.
  const mergedBlocks = [];
  for (const block of blocks) {
    if (mergedBlocks.length === 0) {
      mergedBlocks.push(block);
      continue;
    }

    const firstLine = block.split(/\n/).map(s => s.trim()).find(Boolean) || '';
    const isOptionsOrMeta =
      /^[A-F][)\.]/i.test(firstLine) ||
      /^correct\s*[:=]/i.test(firstLine) ||
      /^images?\s*:/i.test(firstLine);

    if (isOptionsOrMeta) {
      mergedBlocks[mergedBlocks.length - 1] += '\n\n' + block;
    } else {
      mergedBlocks.push(block);
    }
  }

  const questions = [];
  let order = 1;

  for (const block of mergedBlocks) {
    const lines = block.split(/\n/).map(s => s.trim()).filter(Boolean);
    if (lines.length === 0) continue;

 
    if (/^===\s+.+===\s*$/i.test(lines[0])) {
      continue;
    }

    let contentText = lines[0];
    const numMatch = contentText.match(/^(\d+)\)\s*(.*)$/);
    const qNumber = numMatch ? parseInt(numMatch[1], 10) : order;
    if (numMatch) {
      contentText = numMatch[2] || '';
    }
    let contentHtml = '';
    const optionsMap = {};
    let correct = [];
    const imageUrls = [];
    const inlineImageUrls = [];

    // Fix broken pattern like "C." + "orrect: D" which sometimes appears from bad formatting
    for (let i = 1; i < lines.length - 1; i++) {
      const cur = lines[i];
      const next = lines[i + 1];
      if (/^[cC][)\.]\s*$/.test(cur) && /^orrect\s*[:=]/i.test(next)) {
        lines[i] = 'Correct' + next.slice('orrect'.length);
        lines.splice(i + 1, 1);
        break;
      }
    }

    // Collect question-level images from blocks like:
    // Images:
    // - <any-url-or-data-uri>
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (/^images?\s*:/i.test(line)) {
        for (let j = i + 1; j < lines.length; j++) {
          const l2 = lines[j];
          // Stop if we reached options (A–F) or correct section
          if (/^[A-F][)\.]\s*/i.test(l2) || /^correct\s*[:=]/i.test(l2)) break;
          // Line format is usually "- <url>", capture the entire remainder so data:image... is preserved
          const m = l2.match(/^-\s*(.+)$/);
          if (m && m[1]) {
            imageUrls.push(m[1].trim());
          }
        }
      }
    }

    // Inline image markers inside main question text: [[img: URL]] -> PHOTO + inlineImageUrls
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

    // Also treat raw image URLs in the main question line as inline images -> PHOTO
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

    lines.slice(1).forEach(line => {
      const m = line.match(/^([A-F])[)\.]?\s*(.*)$/i);
      if (m) {
        const key = m[1].toUpperCase();
        const rest = m[2].trim();

        // Support patterns like: Image: URL (desc) where URL can be http(s) or data:image...
        const imgMatch = rest.match(/^Image:\s*(\S+)(?:\s*\((.+)\))?$/i);
        if (imgMatch) {
          const url = imgMatch[1];
          const desc = imgMatch[2] ? imgMatch[2].trim() : '';
          optionsMap[key] = { type: 'image', image: url, value: desc };
        } else {
          optionsMap[key] = { type: 'text', value: rest };
        }
      }
      const cm = line.match(/^correct\s*[:=]\s*(.+)$/i);
      if (cm) {
        const letters = cm[1].match(/[A-F]/gi);
        if (letters && letters.length > 0) {
          correct = letters.map((ch) => ch.toUpperCase());
        }
      }
    });

    if (Object.keys(optionsMap).length === 0) {
      optionsMap['A'] = { type: 'text', value: 'Yes' };
      optionsMap['B'] = { type: 'text', value: 'No' };
      correct = ['A'];
    }
    if (correct.length === 0) correct = ['A'];

    // Determine type and points based on position (question number)
    const isMatching = qNumber >= 31 && qNumber <= 35;
    const isComplexBlock = qNumber >= 36 && qNumber <= 40;
    let type = isMatching ? 'matching' : (correct.length > 1 ? 'multi' : 'single');

    let points = defaultPoints;
    if (isComplexBlock && points < 2) {
      points = 2;
    }

    questions.push({
      id: `stub_${Date.now()}_${order}`,
      order: qNumber,
      type,
      contentText,
      contentHtml,
      imageUrls,
      inlineImageUrls,
      options: optionsMap,
      correct,
      points,
    });
    order += 1;
  }

  return { questions, meta: { source: 'aiParserStub', count: questions.length, createdAt: new Date().toISOString() } };
}

export default { parseQuestionsFromText };
