import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Save, Plus, Eye, Edit, Trash2, Image as ImageIcon, Copy } from 'lucide-react';
import { parseQuestionsWithAI } from '../../api/aiParser';
import QuestionEditor from './QuestionEditor';
import ContextBlockEditor from './ContextBlockEditor';

const SUBJECTS = [
  { id: 'kazakh_history', nameKey: 'test.subjects.kazakhHistory' },
  { id: 'math_literacy', nameKey: 'test.subjects.mathLiteracy' },
  { id: 'reading_literacy', nameKey: 'test.subjects.readingLiteracy' },
  { id: 'math', nameKey: 'test.subjects.math' },
  { id: 'physics', nameKey: 'test.subjects.physics' },
  { id: 'geography', nameKey: 'test.subjects.geography' },
  { id: 'world_history', nameKey: 'test.subjects.world_history' },
  { id: 'biology', nameKey: 'test.subjects.biology' },
  { id: 'chemistry', nameKey: 'test.subjects.chemistry' },
  { id: 'foreign_language', nameKey: 'test.subjects.foreign_language' },
  { id: 'language_of_instruction', nameKey: 'test.subjects.language_of_instruction' },
  { id: 'literature', nameKey: 'test.subjects.literature' },
  { id: 'basics_of_law', nameKey: 'test.subjects.basics_of_law' },
  { id: 'informatics', nameKey: 'test.subjects.informatics' },
  { id: 'profile1', nameKey: 'test.subjects.profile1' },
  { id: 'profile2', nameKey: 'test.subjects.profile2' }
];

export default function TestBuilder({ test, onSave, onCancel }) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    title: '',
    subjects: [], // always max 1 subjectId
    variant: 1,
    timeLimit: 60,
    language: 'kk',
    creativeMode: false,
    sections: {}
  });
  const [currentSection, setCurrentSection] = useState(null);
  const [showQuestionEditor, setShowQuestionEditor] = useState(false);
  const [showContextEditor, setShowContextEditor] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiTargetSection, setAiTargetSection] = useState(null);
  const [aiDefaultPoints, setAiDefaultPoints] = useState(1);
  const [dragInfo, setDragInfo] = useState(null);

  const copyExternalAiGuide = async () => {
    const guide = [
      'You are a helper that prepares UBT test questions as PLAIN TEXT for a second AI parser.',
      'The second AI will read your text and convert it into structured JSON questions used in a web test system.',
      '',
      'GENERAL RULES (structure and types):',
      '- There must be exactly 40 questions, numbered "1)", "2)", ..., "40)" on separate lines.',
      '- Questions 1-25: standard single-choice questions with exactly 4 options (A-D) and ONE correct answer.',
      '- Questions 26-30: context-based questions. First write a shared reading passage (you may include inline images), then write questions that rely on this context. Each such question must still follow the numbered format below.',
      '- Questions 31-35: matching tasks. In plain text, clearly describe the LEFT items and the RIGHT items, but keep them inside one numbered block (31), 32), ... 35)). The parser will convert them into matching pairs.',
      '- Questions 36-40: single- or multi-answer questions with up to 6 options (A-F). Some of them may have several correct answers.',
      '',
      'QUESTION FORMAT (for each question N):',
      'N) Question text here',
      'A) option text',
      'B) option text',
      'C) option text',
      'D) option text',
      '[E) option text (only for questions 36-40 when needed)]',
      '[F) option text (only for questions 36-40 when needed)]',
      'Correct: A              # for single-answer',
      'Correct: A, C           # for multi-answer',
      'Points: 1               # optional, can be omitted (36-40 are usually 2 points)',
      '',
      'INLINE IMAGES INSIDE QUESTION TEXT:',
      '- If there is a small image that must appear INSIDE the text (for example a symbol, fragment of formula or map mark), insert a marker [[img: URL]] exactly in that place in the sentence.',
      '- Example: "Find the mark [[img: https://example.com/mark.png]] on the map."',
      '- You may also sometimes have plain image URLs in text (https://...png or data:image/...). The parser treats both [[img: URL]] and bare image URLs as inline images.',
      '',
      'MATH FORMULAS AND SYMBOLS:',
      '- You may use TeX/LaTeX-style math notation for formulas, for example: "$log_{3} 27 + log_{2} 8$", "$a^2 + b^2 = c^2$", "$E_k = \\frac{mv^2}{2}$", "$\\eta = 1 - \\frac{Q_2}{Q_1}$".',
      '- When you write formulas, keep the symbols, powers (x^2), indices (a_1), fractions (\\frac{a}{b}), roots (\\sqrt{...}) exactly as they should appear in the final text. The parser will store them as plain text and the client will display them as-is.',
      '- Do NOT replace math symbols with words (for example, keep "^2" instead of writing "squared"), and do not remove backslashes or dollar signs from inline formulas.',
      '',
      'ADDITIONAL (BLOCK) IMAGES FOR A QUESTION:',
      '- If a question has separate illustration images under the text (not inline), add a block:',
      '  Images:',
      '  - https://example.com/image1.png',
      '  - https://example.com/image2.png',
      '- These images belong to the whole question, not to a specific option.',
      '',
      'IMAGES IN ANSWER OPTIONS:',
      '- If an option shows an image, use the pattern:',
      '  A) Image: https://example.com/figure.png (short description)',
      '- The URL may be http, https or data:image. The description in brackets is optional.',
      '',
      'SHARED CONTEXT (26-30):',
      '- If several questions share the same reading passage, repeat the relevant part of the passage before each of these questions or make it very clear in the text which questions use the same context.',
      '',
      'MATCHING TASKS (31-35):',
      '- For matching tasks, clearly list the LEFT items and the RIGHT items inside the same numbered block so that another AI can infer pairs. For example:',
      '  31) Match the terms and definitions.',
      '  LEFT: 1) Term A; 2) Term B',
      '  RIGHT: A) Definition 1; B) Definition 2',
      '',
      'IMPORTANT:',
      '- Always keep clean numbering 1) .. 40).',
      '- Always provide a Correct: line for every question that has options (1-25 and 36-40). This line must start with the word "Correct:" and stay on a SINGLE line (do not break it across lines).',
      '- Never treat lines starting with "Correct:" or "Points:" as answer options. They are metadata for the current question only.',
      '- Use A-D options for questions 1-25, and A-F options only for questions 36-40.',
    ].join('\n');

    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(guide);
        window.alert('External AI guide copied to clipboard');
      } else {
        console.log(guide);
        window.alert('Clipboard API not available. Guide printed to console.');
      }
    } catch (e) {
      console.error('Error copying AI guide:', e);
      window.alert('Failed to copy AI guide');
    }
  };

  useEffect(() => {
    if (test) {
      setFormData({
        title: test.title || '',
        subjects: test.subjects || [],
        variant: test.variant || 1,
        timeLimit: test.timeLimit || 60,
        language: test.language || 'kk',
        creativeMode: Boolean(test.creativeMode),
        sections: test.sections || {}
      });
    }
  }, [test]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubjectToggle = (subjectId) => {
    // Each test now belongs to exactly one subject
    setFormData(prev => ({
      ...prev,
      subjects: [subjectId]
    }));
  };

  const handleSave = () => {
    if (!formData.title.trim()) {
      alert(t('admin.testTitleRequired'));
      return;
    }
    if (formData.subjects.length === 0) {
      alert(t('admin.selectSubjectsRequired'));
      return;
    }
    
    // Sanitize sections/questions to remove undefined (RTDB disallows undefined)
    const sanitizedSections = {};
    Object.entries(formData.sections || {}).forEach(([sectionId, section]) => {
      const newQs = {};
      Object.entries(section?.questions || {}).forEach(([qid, q]) => {
        const cleaned = { ...q };
        if (cleaned.matchPairs === undefined) delete cleaned.matchPairs;
        if (cleaned.correctMatches === undefined) delete cleaned.correctMatches;
        if (!Array.isArray(cleaned.imageUrls)) delete cleaned.imageUrls;
        if (!Array.isArray(cleaned.inlineImageUrls)) delete cleaned.inlineImageUrls;
        if (typeof cleaned.order === 'number' && cleaned.order >= 36 && cleaned.order <= 40) {
          const p = Number(cleaned.points);
          if (!Number.isFinite(p) || p < 2) {
            cleaned.points = 2;
          }
        }
        newQs[qid] = cleaned;
      });
      sanitizedSections[sectionId] = { ...section, questions: newQs };
    });

    const testData = {
      ...formData,
      sections: sanitizedSections,
      totalQuestions: getTotalQuestions(),
      updatedAt: new Date().toISOString()
    };
    
    onSave(testData);
  };

  const getTotalQuestions = () => {
    let total = 0;
    Object.values(formData.sections).forEach(section => {
      if (section.questions) {
        total += Object.keys(section.questions).length;
      }
    });
    return total;
  };

  const initializeSection = (subjectId) => {
    if (!formData.sections[subjectId]) {
      const subjectMeta = SUBJECTS.find(s => s.id === subjectId);
      const titleKey = subjectMeta?.nameKey || `test.subjects.${subjectId}`;
      setFormData(prev => ({
        ...prev,
        sections: {
          ...prev.sections,
          [subjectId]: {
            title: t(titleKey),
            questions: {}
          }
        }
      }));
    }
    setCurrentSection(subjectId);
  };

  const handleAddQuestion = (sectionId) => {
    setCurrentSection(sectionId);

    const nextOrder = getNextQuestionOrder(sectionId);

    // Enforce max 40 questions per subject (1-40)
    if (nextOrder > 40) {
      try {
        window.alert('Максимум 40 вопросов (1–40) на один предмет.');
      } catch (_) {}
      return;
    }

    // If we are at 26-30, open context block editor instead of single question
    if (nextOrder >= 26 && nextOrder <= 30) {
      setShowContextEditor(true);
      setShowQuestionEditor(false);
      return;
    }

    // Prepare base question skeleton; specific blocks (1-25, 31-35, 36-40)
    // are distinguished по номеру order. UI в редакторе покажет метки.

    // For complex block 36-40 we want up to 6 options (A-F) by default.
    // For earlier blocks (1-25 and 31-35) we start with 4 options (A-D).
    const isComplexBlock = nextOrder >= 36 && nextOrder <= 40;
    const baseOptions = isComplexBlock
      ? {
          'A': { type: 'text', value: '' },
          'B': { type: 'text', value: '' },
          'C': { type: 'text', value: '' },
          'D': { type: 'text', value: '' },
          'E': { type: 'text', value: '' },
          'F': { type: 'text', value: '' }
        }
      : {
          'A': { type: 'text', value: '' },
          'B': { type: 'text', value: '' },
          'C': { type: 'text', value: '' },
          'D': { type: 'text', value: '' }
        };
    setEditingQuestion({
      sectionId,
      order: nextOrder,
      contentHtml: '',
      contentText: '',
      imageUrls: [],
      inlineImageUrls: [],
      options: baseOptions,
      correct: ['A'],
      points: isComplexBlock ? 2 : 1
    });
    setShowQuestionEditor(true);
  };

  const handleSaveContextBlock = (sectionId, payload) => {
    const {
      contextText,
      items,
      contextImages,
      contextInlineImageUrls,
      questionInlineImageUrls
    } = payload || {};
    if (!sectionId || !Array.isArray(items)) return;

    setFormData(prev => {
      const next = { ...prev, sections: { ...prev.sections } };
      const section = next.sections[sectionId] || { title: '', questions: {} };
      if (!section.questions) section.questions = {};

      items.forEach((item, idx) => {
        const order = item.order;
        if (typeof order !== 'number' || order < 26 || order > 30) return;

        const qid = Object.keys(section.questions).find((id) => section.questions[id]?.order === order)
          || `q_${Date.now()}_${order}_${Math.random().toString(36).slice(2, 6)}`;

        const options = {
          A: { type: 'text', value: item.options.A || '' },
          B: { type: 'text', value: item.options.B || '' },
          C: { type: 'text', value: item.options.C || '' },
          D: { type: 'text', value: item.options.D || '' }
        };

        const correctKey = item.correct || 'A';

        const contextInline = Array.isArray(contextInlineImageUrls) ? contextInlineImageUrls : [];
        const questionInline =
          Array.isArray(questionInlineImageUrls) && Array.isArray(questionInlineImageUrls[idx])
            ? questionInlineImageUrls[idx]
            : [];
        const inlineUrlsForQuestion = [...contextInline, ...questionInline];

        section.questions[qid] = {
          ...(section.questions[qid] || {}),
          id: qid,
          sectionId,
          order,
          type: 'single',
          // contentText хранит только текст вопроса без контекста
          contentText: item.text || '',
          // contentHtml = контекст + <hr /> + текст вопроса (для клиента)
          contentHtml: `${contextText}\n<hr />\n${item.text || ''}`,
          options,
          // inlineImageUrls: сначала PHOTOS из контекста, потом из конкретного вопроса
          inlineImageUrls: inlineUrlsForQuestion,
          // imageUrls: дополнительные изображения общего контекста (одни и те же для 26–30)
          imageUrls: Array.isArray(contextImages) ? contextImages : (section.questions[qid]?.imageUrls || []),
          correct: [correctKey],
          points: Number.isFinite(section.questions[qid]?.points)
            ? section.questions[qid].points
            : 1,
        };
      });

      next.sections[sectionId] = section;
      return next;
    });

    setShowContextEditor(false);
    setShowQuestionEditor(false);
  };

  const getNextQuestionOrder = (sectionId) => {
    const section = formData.sections[sectionId];
    if (!section || !section.questions) return 1;
    const orders = Object.values(section.questions).map(q => q.order || 0);
    return Math.max(0, ...orders) + 1;
  };

  const insertAIQuestions = (sectionId, questions) => {
    if (!sectionId || !Array.isArray(questions) || questions.length === 0) return;
    setFormData(prev => {
      const next = { ...prev };
      if (!next.sections[sectionId]) {
        const subjectMeta = SUBJECTS.find(s => s.id === sectionId);
        const titleKey = subjectMeta?.nameKey || `test.subjects.${sectionId}`;
        next.sections[sectionId] = { title: t(titleKey), questions: {} };
      }
      const buildSignature = (q) => {
        const type = q?.type || (Array.isArray(q?.correct) && q.correct.length > 1 ? 'multi' : 'single');
        const options = q?.options && typeof q.options === 'object' ? q.options : {};
        const optionsStr = Object.keys(options)
          .sort()
          .map((k) => `${k}:${(options[k]?.value ?? '').trim()}`)
          .join('|');
        const correctStr = Array.isArray(q?.correct) ? [...q.correct].sort().join(',') : '';
        const pairsStr = Array.isArray(q?.matchPairs) ? q.matchPairs.map((p) => `${p.left}=>${p.right}`).join('|') : '';
        const cm = q?.correctMatches && typeof q.correctMatches === 'object' ? q.correctMatches : {};
        const cmStr = Object.keys(cm).sort().map((k) => `${k}:${cm[k]}`).join('|');
        return [type, (q?.contentText || '').trim(), optionsStr, correctStr, pairsStr, cmStr].join('||');
      };

      const target = next.sections[sectionId];
      const questionsMap = target.questions || (target.questions = {});
      const existingSignatures = new Set(Object.values(questionsMap).map((ex) => buildSignature(ex)));

      let order = getNextQuestionOrder(sectionId);
      questions.forEach((q) => {
        const sig = buildSignature(q);
        if (existingSignatures.has(sig)) return; // skip duplicates
        const id = `q_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
        questionsMap[id] = {
          id,
          sectionId,
          order,
          type: q.type || (Array.isArray(q.correct) && q.correct.length > 1 ? 'multi' : 'single'),
          contentText: q.contentText || '',
          contentHtml: q.contentHtml || '',
          imageUrls: Array.isArray(q.imageUrls) ? q.imageUrls : [],
          inlineImageUrls: Array.isArray(q.inlineImageUrls) ? q.inlineImageUrls : [],
          options: q.options || {},
          correct: Array.isArray(q.correct) ? q.correct : (q.correct ? [q.correct] : ['A']),
          points: Number.isFinite(q.points) && q.points > 0 ? q.points : (aiDefaultPoints || 1),
          ...(Array.isArray(q.matchPairs) ? { matchPairs: q.matchPairs } : {}),
          ...(q.correctMatches && typeof q.correctMatches === 'object' ? { correctMatches: q.correctMatches } : {})
        };
        existingSignatures.add(sig);
        order += 1;
      });
      return next;
    });
  };

  const openAiModal = (prefSectionId = null) => {
    const firstSel = formData.subjects[0] || null;
    setAiTargetSection(prefSectionId || currentSection || firstSel);
    setAiInput('');
    setAiDefaultPoints(1);
    setShowAiModal(true);
  };

  const handleAiParse = async () => {
    if (aiLoading) return;
    if (!aiTargetSection) return;
    if (!aiInput.trim()) return;
    setAiLoading(true);
    try {
      const res = await parseQuestionsWithAI(aiInput, { defaultPoints: aiDefaultPoints });
      if (res && res.meta) {
        console.log('AI parser meta:', res.meta);
      }
      insertAIQuestions(aiTargetSection, res.questions || []);
      setShowAiModal(false);
      setAiInput('');
    } catch (e) {
      // no-op
    } finally {
      setAiLoading(false);
    }
  };

  const dedupeAllSections = () => {
    setFormData(prev => {
      const next = { ...prev, sections: { ...prev.sections } };
      let removed = 0;
      const buildSignature = (q) => {
        const type = q?.type || (Array.isArray(q?.correct) && q.correct.length > 1 ? 'multi' : 'single');
        const options = q?.options && typeof q.options === 'object' ? q.options : {};
        const optionsStr = Object.keys(options)
          .sort()
          .map((k) => `${k}:${(options[k]?.value ?? '').trim()}`)
          .join('|');
        const correctStr = Array.isArray(q?.correct) ? [...q.correct].sort().join(',') : '';
        const pairsStr = Array.isArray(q?.matchPairs) ? q.matchPairs.map((p) => `${p.left}=>${p.right}`).join('|') : '';
        const cm = q?.correctMatches && typeof q.correctMatches === 'object' ? q.correctMatches : {};
        const cmStr = Object.keys(cm).sort().map((k) => `${k}:${cm[k]}`).join('|');
        return [type, (q?.contentText || '').trim(), optionsStr, correctStr, pairsStr, cmStr].join('||');
      };
      Object.keys(next.sections || {}).forEach((sectionId) => {
        const section = next.sections[sectionId];
        if (!section?.questions) return;
        const entries = Object.entries(section.questions)
          .sort(([,a],[,b]) => (a.order || 0) - (b.order || 0));
        const seen = new Set();
        const newQuestions = {};
        let order = 1;
        for (const [qid, q] of entries) {
          const sig = buildSignature(q);
          if (seen.has(sig)) { removed += 1; continue; }
          seen.add(sig);
          newQuestions[qid] = { ...q, order };
          order += 1;
        }
        section.questions = newQuestions;
      });
      if (removed > 0) {
        try { window.alert(`Removed duplicates: ${removed}`); } catch (_) {}
      }
      return next;
    });
  };

  const buildExportBlockForQuestion = (q) => {
    if (!q) return '';

    const qNumber = q.order || 1;

    let baseText = (q.contentText && q.contentText.trim())
      || (q.contentHtml && q.contentHtml
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim())
      || '';

    // Replace PHOTO placeholders with explicit inline markers for external AI
    const photoSources = (Array.isArray(q.inlineImageUrls) && q.inlineImageUrls.length > 0)
      ? q.inlineImageUrls
      : (Array.isArray(q.imageUrls) ? q.imageUrls : []);
    let photoIdx = 0;
    if (baseText && baseText.includes('PHOTO') && photoSources.length > 0) {
      baseText = baseText.replace(/\bPHOTO\b/g, () => {
        const url = photoIdx < photoSources.length ? photoSources[photoIdx] : 'PHOTO';
        photoIdx += 1;
        return url && url !== 'PHOTO' ? `[[img: ${url}]]` : 'PHOTO';
      });
    }

    const lines = [];
    lines.push(`${qNumber}) ${baseText || '...'}`);

    if (Array.isArray(q.imageUrls) && q.imageUrls.length > 0) {
      lines.push('Images:');
      q.imageUrls.forEach((url) => {
        if (url && typeof url === 'string') {
          lines.push(`- ${url}`);
        }
      });
    }

    const options = q.options && typeof q.options === 'object' ? q.options : {};
    const optionKeys = Object.keys(options).sort();
    if (optionKeys.length > 0) {
      optionKeys.forEach((key) => {
        const opt = options[key] || {};
        let text = '';
        if (opt.type === 'image' && opt.image) {
          text = `Image: ${opt.image}${opt.value ? ` (${opt.value})` : ''}`;
        } else {
          text = opt.value || '';
        }

        if (text && text.includes('PHOTO') && photoSources.length > 0) {
          text = text.replace(/\bPHOTO\b/g, () => {
            const url = photoIdx < photoSources.length ? photoSources[photoIdx] : 'PHOTO';
            photoIdx += 1;
            return url && url !== 'PHOTO' ? `[[img: ${url}]]` : 'PHOTO';
          });
        }

        lines.push(`${key}) ${text}`.trim());
      });
    }

    const correct = Array.isArray(q.correct) ? q.correct : (q.correct ? [q.correct] : []);
    if (correct.length > 0) {
      lines.push(`Correct: ${correct.join(', ')}`);
    }

    if (Number.isFinite(q.points)) {
      lines.push(`Points: ${q.points}`);
    }

    return lines.join('\n');
  };

  const buildExportText = () => {
    const lines = [];
    const sections = formData.sections || {};
    const subjectOrder = (formData.subjects && formData.subjects.length > 0)
      ? formData.subjects
      : Object.keys(sections);

    subjectOrder.forEach((subjectId) => {
      const section = sections[subjectId];
      if (!section || !section.questions) return;

      const entries = Object.entries(section.questions)
        .sort(([, a], [, b]) => (a.order || 0) - (b.order || 0));

      entries.forEach(([, q], idx) => {
        const qNumber = q.order || (idx + 1);
        let baseText = (q.contentText && q.contentText.trim())
          || (q.contentHtml && q.contentHtml
                .replace(/<[^>]+>/g, ' ')
                .replace(/\s+/g, ' ')
                .trim())
          || '';

        // Replace PHOTO placeholders in export with explicit inline markers for external AI
        const photoSources = (Array.isArray(q.inlineImageUrls) && q.inlineImageUrls.length > 0)
          ? q.inlineImageUrls
          : (Array.isArray(q.imageUrls) ? q.imageUrls : []);
        if (baseText && baseText.includes('PHOTO') && photoSources.length > 0) {
          let photoIdx = 0;
          baseText = baseText.replace(/\bPHOTO\b/g, () => {
            const url = photoSources[photoIdx] || 'PHOTO';
            photoIdx += 1;
            return url && url !== 'PHOTO' ? `[[img: ${url}]]` : 'PHOTO';
          });
        }

        lines.push('');
        lines.push(`${qNumber}) ${baseText || '...'}`);

        if (Array.isArray(q.imageUrls) && q.imageUrls.length > 0) {
          lines.push('Images:');
          q.imageUrls.forEach((url) => {
            if (url && typeof url === 'string') {
              lines.push(`- ${url}`);
            }
          });
        }

        const options = q.options && typeof q.options === 'object' ? q.options : {};
        const optionKeys = Object.keys(options).sort();
        if (optionKeys.length > 0) {
          optionKeys.forEach((key) => {
            const opt = options[key] || {};
            let text = '';
            if (opt.type === 'image' && opt.image) {
              text = `Image: ${opt.image}${opt.value ? ` (${opt.value})` : ''}`;
            } else {
              text = opt.value || '';
            }

            // Also convert PHOTO markers inside option texts back to [[img: URL]]
            if (text && text.includes('PHOTO') && photoSources.length > 0) {
              text = text.replace(/\bPHOTO\b/g, () => {
                const url = photoIdx < photoSources.length ? photoSources[photoIdx] : 'PHOTO';
                photoIdx += 1;
                return url && url !== 'PHOTO' ? `[[img: ${url}]]` : 'PHOTO';
              });
            }

            lines.push(`${key}) ${text}`.trim());
          });
        }

        const correct = Array.isArray(q.correct) ? q.correct : (q.correct ? [q.correct] : []);
        if (correct.length > 0) {
          lines.push(`Correct: ${correct.join(', ')}`);
        }

        if (Number.isFinite(q.points)) {
          lines.push(`Points: ${q.points}`);
        }
      });

      lines.push('');
    });

    return lines.join('\n');
  };

  const handleExportQuestions = async () => {
    try {
      const text = buildExportText();
      if (!text.trim()) {
        window.alert('No questions to export');
        return;
      }

      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        window.alert('Questions copied to clipboard');
      } else {
        console.log(text);
        window.alert('Clipboard API not available. Text printed to console.');
      }
    } catch (e) {
      console.error('Error exporting questions:', e);
      window.alert('Failed to export questions');
    }
  };

  const handleCopySingleQuestionExport = async (question) => {
    const block = buildExportBlockForQuestion(question);
    if (!block.trim()) {
      try {
        window.alert('Nothing to export for this question');
      } catch (_) {}
      return;
    }

    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(block);
        try {
          window.alert('Question export copied to clipboard');
        } catch (_) {}
      } else {
        // Fallback: log to console so it can be copied manually
        console.log(block);
        try {
          window.alert('Clipboard API not available. Question text printed to console.');
        } catch (_) {}
      }
    } catch (e) {
      console.error('Error copying question export:', e);
      try {
        window.alert('Failed to copy question export');
      } catch (_) {}
    }
  };

  const handleSaveQuestion = (questionData) => {
    const questionId = questionData.id || `q_${Date.now()}`;
    const sectionId = questionData.sectionId;
    
    setFormData(prev => ({
      ...prev,
      sections: {
        ...prev.sections,
        [sectionId]: {
          ...prev.sections[sectionId],
          questions: {
            ...prev.sections[sectionId]?.questions,
            [questionId]: {
              ...questionData,
              id: questionId
            }
          }
        }
      }
    }));
    
    setShowQuestionEditor(false);
    setEditingQuestion(null);
  };

  const handleEditQuestion = (sectionId, questionId, question) => {
    const order = question?.order;

    // For context questions (26–30) open the shared ContextBlockEditor
    if (typeof order === 'number' && order >= 26 && order <= 30) {
      setCurrentSection(sectionId);
      setShowContextEditor(true);
      setShowQuestionEditor(false);
      setEditingQuestion(null);
      return;
    }

    // For all other questions use the regular QuestionEditor
    setEditingQuestion({
      ...question,
      sectionId,
      id: questionId
    });
    setShowQuestionEditor(true);
  };

  const handleDeleteQuestion = (sectionId, questionId) => {
    if (window.confirm(t('admin.confirmDeleteQuestion'))) {
      setFormData(prev => {
        const newSections = { ...prev.sections };
        delete newSections[sectionId].questions[questionId];
        // Renumber remaining questions in this section: 1..N without gaps
        const section = newSections[sectionId];
        if (section?.questions) {
          const entries = Object.entries(section.questions)
            .sort(([,a],[,b]) => (a.order || 0) - (b.order || 0));
          const newQuestions = {};
          let order = 1;
          for (const [qid, q] of entries) {
            newQuestions[qid] = { ...q, order };
            order += 1;
          }
          section.questions = newQuestions;
        }
        return {
          ...prev,
          sections: newSections
        };
      });
    }
  };

  const handleQuestionDragStart = (sectionId, questionId) => {
    setDragInfo({ sectionId, questionId });
  };

  const handleQuestionDragOver = (e) => {
    e.preventDefault();
  };

  const handleQuestionDrop = (sectionId, targetQuestionId) => {
    if (!dragInfo || dragInfo.sectionId !== sectionId || dragInfo.questionId === targetQuestionId) {
      setDragInfo(null);
      return;
    }
    setFormData(prev => {
      const sections = { ...prev.sections };
      const section = sections[sectionId];
      if (!section?.questions) return prev;

      const entries = Object.entries(section.questions)
        .sort(([,a],[,b]) => (a.order || 0) - (b.order || 0));
      const fromIndex = entries.findIndex(([qid]) => qid === dragInfo.questionId);
      const toIndex = entries.findIndex(([qid]) => qid === targetQuestionId);
      if (fromIndex === -1 || toIndex === -1) return prev;

      const [moved] = entries.splice(fromIndex, 1);
      entries.splice(toIndex, 0, moved);

      const newQuestions = {};
      let order = 1;
      for (const [qid, q] of entries) {
        newQuestions[qid] = { ...q, order };
        order += 1;
      }
      section.questions = newQuestions;

      return {
        ...prev,
        sections
      };
    });
    setDragInfo(null);
  };

  if (showContextEditor && currentSection) {
    const section = formData.sections[currentSection] || { title: '', questions: {} };
    return (
      <ContextBlockEditor
        sectionId={currentSection}
        section={section}
        onSaveBlock={handleSaveContextBlock}
        onCancel={() => setShowContextEditor(false)}
      />
    );
  }

  if (showQuestionEditor) {
    return (
      <QuestionEditor
        question={editingQuestion}
        onSave={handleSaveQuestion}
        onCancel={() => {
          setShowQuestionEditor(false);
          setEditingQuestion(null);
        }}
      />
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-3 sm:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {test?.id ? t('admin.editTest') : t('admin.createTest')}
          </h2>
        </div>

    {showAiModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-2xl w-full border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">AI Parser (Gemini)</h3>
          <div className="grid gap-3 mb-4">
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Target section</label>
              <select
                value={aiTargetSection || ''}
                onChange={(e) => setAiTargetSection(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              >
                <option value="" disabled>Select section</option>
                {formData.subjects.map((s) => (
                  <option key={s} value={s}>{t(`test.subjects.${s}`)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Default points</label>
              <input
                type="number"
                min="1"
                value={aiDefaultPoints}
                onChange={(e) => setAiDefaultPoints(parseInt(e.target.value) || 1)}
                className="w-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Input</label>
              <textarea
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                placeholder={
                  'Paste text with questions and options\n1) Question text\nA) ...\nB) ...\nCorrect: A\n\nUse [[img: URL]] inside text for inline images and simple context + questions blocks.'
                }
              />
              <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                <span>Need instructions for another AI?</span>
                <button
                  type="button"
                  onClick={copyExternalAiGuide}
                  className="px-2 py-1 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-[11px]"
                >
                  Copy external AI guide
                </button>
              </div>
            </div>
          </div>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowAiModal(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={handleAiParse}
              disabled={aiLoading || !aiTargetSection || !aiInput.trim()}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg disabled:opacity-50"
            >
              {aiLoading ? 'Parsing…' : 'Parse'}
            </button>
          </div>
        </div>
      </div>
    )}
        
        <button
          onClick={handleSave}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <Save className="h-4 w-4" />
          <span>{t('admin.saveTest')}</span>
        </button>
      </div>

      {/* Test Configuration */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t('admin.testConfiguration')}
        </h3>
        
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('admin.testTitle')}
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder={t('admin.enterTestTitle')}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('admin.testVariant')}
            </label>
            <input
              type="number"
              min="1"
              max="99"
              value={formData.variant}
              onChange={(e) => handleInputChange('variant', parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder="1"
            />
          </div>
          
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('admin.timeLimit')} ({t('test.minutes')})
            </label>
            <input
              type="number"
              value={Number.isFinite(formData.timeLimit) ? formData.timeLimit : 60}
              onChange={(e) => {
                const v = e.target.value;
                const n = parseInt(v, 10);
                handleInputChange('timeLimit', Number.isFinite(n) && n >= 1 ? n : 1);
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              min="1"
              max="300"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('admin.language')}
            </label>
            <select
              value={formData.language}
              onChange={(e) => handleInputChange('language', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="kk">Қазақша</option>
              <option value="ru">Русский</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>
      </div>

      {/* Subject Selection */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t('admin.selectSubjects')}
        </h3>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {SUBJECTS.map((subject) => {
            const isSelected = formData.subjects.includes(subject.id);
            const isDisabled = false;
            
            return (
              <button
                key={subject.id}
                onClick={() => !isDisabled && handleSubjectToggle(subject.id)}
                disabled={isDisabled}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : isDisabled
                    ? 'border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 opacity-50 cursor-not-allowed'
                    : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                }`}
              >
                <div className="font-medium text-gray-900 dark:text-white">
                  {t(subject.nameKey)}
                </div>
                {isSelected && (
                  <div className="mt-2">
                    <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                      {t('admin.selected')}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Questions Management */}
      {formData.subjects.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('admin.questionsManagement')}
            </h3>
            <div className="flex items-center space-x-3">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {t('admin.totalQuestions')}: {getTotalQuestions()}
              </div>
              <button
                onClick={() => openAiModal()}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors text-sm"
              >
                AI
              </button>
              <button
                onClick={handleExportQuestions}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-100 rounded-lg transition-colors text-sm"
              >
                Export
              </button>
            </div>
          </div>
          
          {formData.subjects.map((subjectId) => {
            const section = formData.sections[subjectId];
            const questionCount = section?.questions ? Object.keys(section.questions).length : 0;
            
            return (
              <div key={subjectId} className="mb-6 last:mb-0">
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {t(`test.subjects.${subjectId}`)}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {questionCount} {t('admin.questions')}
                    </p>
                  </div>
                  
                  <button
                    onClick={() => {
                      initializeSection(subjectId);
                      handleAddQuestion(subjectId);
                    }}
                    className="flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    <span>{t('admin.addQuestion')}</span>
                  </button>
                </div>
                
                {/* Questions List */}
                {section?.questions && Object.entries(section.questions).length > 0 && (
                  <div className="mt-4 space-y-2">
                    {Object.entries(section.questions)
                      .sort(([,a], [,b]) => (a.order || 0) - (b.order || 0))
                      .map(([questionId, question]) => {
                        const order = question.order || 1;
                        const previewText = (question.contentText || '').trim() || 'Сұрақ мәтіні...';
                        const optionsCount = question.options ? Object.keys(question.options).length : 0;
                        const hasImages = Array.isArray(question.imageUrls) && question.imageUrls.length > 0;
                        const points = Number.isFinite(question.points) ? question.points : null;
                        return (
                          <div
                            key={questionId}
                            className="group flex items-center justify-between p-3 sm:p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/60 hover:border-blue-400 dark:hover:border-blue-400 hover:shadow-md transition-all cursor-pointer"
                            onClick={() => handleEditQuestion(subjectId, questionId, question)}
                            draggable
                            onDragStart={() => handleQuestionDragStart(subjectId, questionId)}
                            onDragOver={handleQuestionDragOver}
                            onDrop={() => handleQuestionDrop(subjectId, questionId)}
                          >
                            <div className="flex items-start space-x-3 sm:space-x-4">
                              <div className="flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-blue-50 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-700 flex items-center justify-center text-xs sm:text-sm font-semibold text-blue-700 dark:text-blue-200">
                                {order}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-0.5">
                                  {t('admin.questionOrder', { order })}
                                </p>
                                <p className="text-sm sm:text-base text-gray-900 dark:text-white line-clamp-2">
                                  {previewText}
                                </p>
                                <div className="mt-1 flex flex-wrap gap-2 text-[11px] sm:text-xs text-gray-500 dark:text-gray-400">
                                  {points !== null && (
                                    <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                                      {points} {t('test.points')}
                                    </span>
                                  )}
                                  {optionsCount > 0 && (
                                    <span className="px-2 py-0.5 rounded-full bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                                      {optionsCount} options
                                    </span>
                                  )}
                                  {hasImages && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                                      <ImageIcon className="h-3 w-3 mr-1" />
                                      {question.imageUrls.length}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-1 sm:space-x-2 ml-3">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopySingleQuestionExport(question);
                                }}
                                className="p-1.5 sm:p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                              >
                                <Copy className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditQuestion(subjectId, questionId, question);
                                }}
                                className="p-1.5 sm:p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/40 rounded-lg transition-colors"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteQuestion(subjectId, questionId);
                                }}
                                className="p-1.5 sm:p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
