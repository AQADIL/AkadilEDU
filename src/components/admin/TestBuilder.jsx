import i18n from '../../i18n';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Save, Plus, Edit, Trash2, Image as ImageIcon, Copy } from 'lucide-react';
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
  { id: 'profile2', nameKey: 'test.subjects.profile2' },
];

export default function TestBuilder({ test, onSave, onCancel }) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    title: '',
    subjects: [],
    variant: 1,
    timeLimit: 60,
    language: 'kk',
    creativeMode: false,
    sections: {},
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
    const guide = t('admin.externalGuide');

    try {
      if (
        typeof navigator !== 'undefined' &&
        navigator.clipboard &&
        navigator.clipboard.writeText
      ) {
        await navigator.clipboard.writeText(guide);
        window.alert(i18n.t('ui.aiInstructionsCopied'));
      } else {
        window.alert(i18n.t('ui.clipboardUnavailableUseASecureBrowserConnection'));
      }
    } catch {
      window.alert(i18n.t('ui.couldNotCopyAiInstructions'));
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
        sections: test.sections || {},
      });
    }
  }, [test]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubjectToggle = (subjectId) => {
    setFormData((prev) => ({
      ...prev,
      subjects: [subjectId],
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
      updatedAt: new Date().toISOString(),
    };

    onSave(testData);
  };

  const getTotalQuestions = () => {
    let total = 0;
    Object.values(formData.sections).forEach((section) => {
      if (section.questions) {
        total += Object.keys(section.questions).length;
      }
    });
    return total;
  };

  const initializeSection = (subjectId) => {
    if (!formData.sections[subjectId]) {
      const subjectMeta = SUBJECTS.find((s) => s.id === subjectId);
      const titleKey = subjectMeta?.nameKey || `test.subjects.${subjectId}`;
      setFormData((prev) => ({
        ...prev,
        sections: {
          ...prev.sections,
          [subjectId]: {
            title: t(titleKey),
            questions: {},
          },
        },
      }));
    }
    setCurrentSection(subjectId);
  };

  const handleAddQuestion = (sectionId) => {
    setCurrentSection(sectionId);

    const nextOrder = getNextQuestionOrder(sectionId);

    if (nextOrder > 40) {
      try {
        window.alert(i18n.t('ui.upTo_40QuestionsPerSubject'));
      } catch {}
      return;
    }

    if (nextOrder >= 26 && nextOrder <= 30) {
      setShowContextEditor(true);
      setShowQuestionEditor(false);
      return;
    }

    const isComplexBlock = nextOrder >= 36 && nextOrder <= 40;
    const baseOptions = isComplexBlock
      ? {
          A: { type: 'text', value: '' },
          B: { type: 'text', value: '' },
          C: { type: 'text', value: '' },
          D: { type: 'text', value: '' },
          E: { type: 'text', value: '' },
          F: { type: 'text', value: '' },
        }
      : {
          A: { type: 'text', value: '' },
          B: { type: 'text', value: '' },
          C: { type: 'text', value: '' },
          D: { type: 'text', value: '' },
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
      points: isComplexBlock ? 2 : 1,
    });
    setShowQuestionEditor(true);
  };

  const handleSaveContextBlock = (sectionId, payload) => {
    const { contextText, items, contextImages, contextInlineImageUrls, questionInlineImageUrls } =
      payload || {};
    if (!sectionId || !Array.isArray(items)) return;

    setFormData((prev) => {
      const next = { ...prev, sections: { ...prev.sections } };
      const section = next.sections[sectionId] || { title: '', questions: {} };
      if (!section.questions) section.questions = {};

      items.forEach((item, idx) => {
        const order = item.order;
        if (typeof order !== 'number' || order < 26 || order > 30) return;

        const qid =
          Object.keys(section.questions).find((id) => section.questions[id]?.order === order) ||
          `q_${Date.now()}_${order}_${Math.random().toString(36).slice(2, 6)}`;

        const options = {
          A: { type: 'text', value: item.options.A || '' },
          B: { type: 'text', value: item.options.B || '' },
          C: { type: 'text', value: item.options.C || '' },
          D: { type: 'text', value: item.options.D || '' },
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

          contentText: item.text || '',

          contentHtml: `${contextText}\n<hr />\n${item.text || ''}`,
          options,

          inlineImageUrls: inlineUrlsForQuestion,

          imageUrls: Array.isArray(contextImages)
            ? contextImages
            : section.questions[qid]?.imageUrls || [],
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
    const orders = Object.values(section.questions).map((q) => q.order || 0);
    return Math.max(0, ...orders) + 1;
  };

  const insertAIQuestions = (sectionId, questions) => {
    if (!sectionId || !Array.isArray(questions) || questions.length === 0) return;
    setFormData((prev) => {
      const next = { ...prev };
      if (!next.sections[sectionId]) {
        const subjectMeta = SUBJECTS.find((s) => s.id === sectionId);
        const titleKey = subjectMeta?.nameKey || `test.subjects.${sectionId}`;
        next.sections[sectionId] = { title: t(titleKey), questions: {} };
      }
      const buildSignature = (q) => {
        const type =
          q?.type || (Array.isArray(q?.correct) && q.correct.length > 1 ? 'multi' : 'single');
        const options = q?.options && typeof q.options === 'object' ? q.options : {};
        const optionsStr = Object.keys(options)
          .sort()
          .map((k) => `${k}:${(options[k]?.value ?? '').trim()}`)
          .join('|');
        const correctStr = Array.isArray(q?.correct) ? [...q.correct].sort().join(',') : '';
        const pairsStr = Array.isArray(q?.matchPairs)
          ? q.matchPairs.map((p) => `${p.left}=>${p.right}`).join('|')
          : '';
        const cm =
          q?.correctMatches && typeof q.correctMatches === 'object' ? q.correctMatches : {};
        const cmStr = Object.keys(cm)
          .sort()
          .map((k) => `${k}:${cm[k]}`)
          .join('|');
        return [type, (q?.contentText || '').trim(), optionsStr, correctStr, pairsStr, cmStr].join(
          '||',
        );
      };

      const target = next.sections[sectionId];
      const questionsMap = target.questions || (target.questions = {});
      const existingSignatures = new Set(
        Object.values(questionsMap).map((ex) => buildSignature(ex)),
      );

      let order = getNextQuestionOrder(sectionId);
      questions.forEach((q) => {
        const sig = buildSignature(q);
        if (existingSignatures.has(sig)) return;
        const id = `q_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
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
          correct: Array.isArray(q.correct) ? q.correct : q.correct ? [q.correct] : ['A'],
          points: Number.isFinite(q.points) && q.points > 0 ? q.points : aiDefaultPoints || 1,
          ...(Array.isArray(q.matchPairs) ? { matchPairs: q.matchPairs } : {}),
          ...(q.correctMatches && typeof q.correctMatches === 'object'
            ? { correctMatches: q.correctMatches }
            : {}),
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

      insertAIQuestions(aiTargetSection, res.questions || []);
      setShowAiModal(false);
      setAiInput('');
    } catch {
    } finally {
      setAiLoading(false);
    }
  };

  const buildExportBlockForQuestion = (q) => {
    if (!q) return '';

    const qNumber = q.order || 1;

    let baseText =
      (q.contentText && q.contentText.trim()) ||
      (q.contentHtml &&
        q.contentHtml
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()) ||
      '';

    const photoSources =
      Array.isArray(q.inlineImageUrls) && q.inlineImageUrls.length > 0
        ? q.inlineImageUrls
        : Array.isArray(q.imageUrls)
          ? q.imageUrls
          : [];
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

    const correct = Array.isArray(q.correct) ? q.correct : q.correct ? [q.correct] : [];
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
    const subjectOrder =
      formData.subjects && formData.subjects.length > 0 ? formData.subjects : Object.keys(sections);

    subjectOrder.forEach((subjectId) => {
      const section = sections[subjectId];
      if (!section || !section.questions) return;

      const entries = Object.entries(section.questions).sort(
        ([, a], [, b]) => (a.order || 0) - (b.order || 0),
      );

      entries.forEach(([, q], idx) => {
        const qNumber = q.order || idx + 1;
        let baseText =
          (q.contentText && q.contentText.trim()) ||
          (q.contentHtml &&
            q.contentHtml
              .replace(/<[^>]+>/g, ' ')
              .replace(/\s+/g, ' ')
              .trim()) ||
          '';

        const photoSources =
          Array.isArray(q.inlineImageUrls) && q.inlineImageUrls.length > 0
            ? q.inlineImageUrls
            : Array.isArray(q.imageUrls)
              ? q.imageUrls
              : [];
        let photoIdx = 0;
        if (baseText && baseText.includes('PHOTO') && photoSources.length > 0) {
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

        const correct = Array.isArray(q.correct) ? q.correct : q.correct ? [q.correct] : [];
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
        window.alert(i18n.t('ui.noQuestionsToExport'));
        return;
      }

      if (
        typeof navigator !== 'undefined' &&
        navigator.clipboard &&
        navigator.clipboard.writeText
      ) {
        await navigator.clipboard.writeText(text);
        window.alert(i18n.t('ui.questionsCopied'));
      } else {
        window.alert(i18n.t('ui.clipboardUnavailableUseASecureBrowserConnection'));
      }
    } catch {
      window.alert(i18n.t('ui.couldNotExportQuestions'));
    }
  };

  const handleCopySingleQuestionExport = async (question) => {
    const block = buildExportBlockForQuestion(question);
    if (!block.trim()) {
      try {
        window.alert(i18n.t('ui.thisQuestionHasNoContentToExport'));
      } catch {}
      return;
    }

    try {
      if (
        typeof navigator !== 'undefined' &&
        navigator.clipboard &&
        navigator.clipboard.writeText
      ) {
        await navigator.clipboard.writeText(block);
        try {
          window.alert(i18n.t('ui.questionCopied'));
        } catch {}
      } else {
        try {
          window.alert(i18n.t('ui.clipboardUnavailableUseASecureBrowserConnection'));
        } catch {}
      }
    } catch {
      try {
        window.alert(i18n.t('ui.couldNotCopyQuestion'));
      } catch {}
    }
  };

  const handleSaveQuestion = (questionData) => {
    const questionId = questionData.id || `q_${Date.now()}`;
    const sectionId = questionData.sectionId;

    setFormData((prev) => ({
      ...prev,
      sections: {
        ...prev.sections,
        [sectionId]: {
          ...prev.sections[sectionId],
          questions: {
            ...prev.sections[sectionId]?.questions,
            [questionId]: {
              ...questionData,
              id: questionId,
            },
          },
        },
      },
    }));

    setShowQuestionEditor(false);
    setEditingQuestion(null);
  };

  const handleEditQuestion = (sectionId, questionId, question) => {
    const order = question?.order;

    if (typeof order === 'number' && order >= 26 && order <= 30) {
      setCurrentSection(sectionId);
      setShowContextEditor(true);
      setShowQuestionEditor(false);
      setEditingQuestion(null);
      return;
    }

    setEditingQuestion({
      ...question,
      sectionId,
      id: questionId,
    });
    setShowQuestionEditor(true);
  };

  const handleDeleteQuestion = (sectionId, questionId) => {
    if (window.confirm(t('admin.confirmDeleteQuestion'))) {
      setFormData((prev) => {
        const newSections = { ...prev.sections };
        delete newSections[sectionId].questions[questionId];

        const section = newSections[sectionId];
        if (section?.questions) {
          const entries = Object.entries(section.questions).sort(
            ([, a], [, b]) => (a.order || 0) - (b.order || 0),
          );
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
          sections: newSections,
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
    setFormData((prev) => {
      const sections = { ...prev.sections };
      const section = sections[sectionId];
      if (!section?.questions) return prev;

      const entries = Object.entries(section.questions).sort(
        ([, a], [, b]) => (a.order || 0) - (b.order || 0),
      );
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
        sections,
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
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {i18n.t('ui.importWithAi')}
              </h3>
              <div className="grid gap-3 mb-4">
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                    {i18n.t('ui.targetSection')}
                  </label>
                  <select
                    value={aiTargetSection || ''}
                    onChange={(e) => setAiTargetSection(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  >
                    <option value="" disabled>
                      {i18n.t('ui.selectSection')}
                    </option>
                    {formData.subjects.map((s) => (
                      <option key={s} value={s}>
                        {t(`test.subjects.${s}`)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                    {i18n.t('ui.defaultPoints')}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={aiDefaultPoints}
                    onChange={(e) => setAiDefaultPoints(parseInt(e.target.value) || 1)}
                    className="w-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                    {i18n.t('ui.sourceText')}
                  </label>
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
                    <span>{i18n.t('ui.needInstructionsForAnotherAiTool')}</span>
                    <button
                      type="button"
                      onClick={copyExternalAiGuide}
                      className="px-2 py-1 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-[11px]"
                    >
                      {i18n.t('ui.copyAiInstructions')}
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowAiModal(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300"
                >
                  {i18n.t('course.cancel')}
                </button>
                <button
                  onClick={handleAiParse}
                  disabled={aiLoading || !aiTargetSection || !aiInput.trim()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg disabled:opacity-50"
                >
                  {i18n.t(aiLoading ? 'test.parsing' : 'test.parse')}
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
              placeholder={i18n.t('test.variantPlaceholder')}
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
              <option value="kk">{i18n.t('language.kazakh')}</option>
              <option value="ru">{i18n.t('language.russian')}</option>
              <option value="en">{i18n.t('ui.english')}</option>
            </select>
          </div>
        </div>
      </div>

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
                {i18n.t('ui.ai')}
              </button>
              <button
                onClick={handleExportQuestions}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-100 rounded-lg transition-colors text-sm"
              >
                {i18n.t('ui.export')}
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

                {section?.questions && Object.entries(section.questions).length > 0 && (
                  <div className="mt-4 space-y-2">
                    {Object.entries(section.questions)
                      .sort(([, a], [, b]) => (a.order || 0) - (b.order || 0))
                      .map(([questionId, question]) => {
                        const order = question.order || 1;
                        const previewText =
                          (question.contentText || '').trim() || i18n.t('ui.questionText');
                        const optionsCount = question.options
                          ? Object.keys(question.options).length
                          : 0;
                        const hasImages =
                          Array.isArray(question.imageUrls) && question.imageUrls.length > 0;
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
                                      {optionsCount}
                                      {i18n.t('ui.options')}
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
