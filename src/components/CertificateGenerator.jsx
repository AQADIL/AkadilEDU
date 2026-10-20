import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Download } from 'lucide-react';

export default function CertificateGenerator({ result, user, onClose }) {
  const { t, i18n } = useTranslation();
  const canvasRef = useRef(null);

  const getCertificateTitle = () => {
    if (!result) return i18n.t('ui.untPracticeTest');

    if (result.mode === 'creative') {
      return i18n.t('ui.creativeTest');
    }
    if (result.mode === 'full') {
      return i18n.t('ui.untPracticeTest');
    }

    if (result.mode === 'single') {
      const subjects = Array.isArray(result.subjects) ? result.subjects : [];
      const baseSubjectId = subjects[0] || null;
      const subjectLabel = baseSubjectId
        ? t(`test.subjects.${baseSubjectId}`)
        : result.testTitle || t('test.singleSubjectTest');
      const n = typeof result.variant === 'number' && result.variant > 0 ? result.variant : 1;
      return i18n.t('test.variantTitle', { v0: subjectLabel, v1: n });
    }

    return result.testTitle || i18n.t('ui.untPracticeTest');
  };

  const generateCertificate = async () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    canvas.width = 1200;
    canvas.height = 800;

    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#667eea');
    gradient.addColorStop(1, '#764ba2');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.globalAlpha = 0.05;
    ctx.font = '60px Arial, sans-serif';
    ctx.fillStyle = '#ffffff';

    const symbols = [
      '∑',
      '∫',
      '√',
      'π',
      'α',
      'β',
      '∆',
      '∞',
      'θ',
      'λ',
      '≤',
      '≥',
      '≠',
      '±',
      '×',
      '÷',
    ];
    for (let i = 0; i < 25; i++) {
      const symbol = symbols[Math.floor(Math.random() * symbols.length)];
      ctx.fillText(symbol, Math.random() * canvas.width, Math.random() * canvas.height);
    }

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    for (let i = 0; i < 15; i++) {
      ctx.beginPath();
      ctx.arc(
        Math.random() * canvas.width,
        Math.random() * canvas.height,
        Math.random() * 30 + 10,
        0,
        2 * Math.PI,
      );
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    const certX = 80;
    const certY = 60;
    const certWidth = canvas.width - 160;
    const certHeight = canvas.height - 120;

    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 10;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(certX, certY, certWidth, certHeight);

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    ctx.strokeStyle = '#667eea';
    ctx.lineWidth = 8;
    ctx.strokeRect(certX + 20, certY + 20, certWidth - 40, certHeight - 40);

    ctx.strokeStyle = '#764ba2';
    ctx.lineWidth = 2;
    ctx.strokeRect(certX + 35, certY + 35, certWidth - 70, certHeight - 70);

    ctx.globalAlpha = 0.08;
    ctx.font = '24px Arial, sans-serif';
    ctx.fillStyle = '#667eea';

    const leftSymbols = ['∑', '∫', '√', 'π', 'α', '∆'];
    for (let i = 0; i < leftSymbols.length; i++) {
      ctx.fillText(
        leftSymbols[i],
        certX + 60 + Math.random() * 80,
        certY + 120 + i * 80 + Math.random() * 40,
      );
    }

    const rightSymbols = ['∞', 'θ', 'λ', '≤', '≥', '±'];
    for (let i = 0; i < rightSymbols.length; i++) {
      ctx.fillText(
        rightSymbols[i],
        certX + certWidth - 140 + Math.random() * 80,
        certY + 120 + i * 80 + Math.random() * 40,
      );
    }

    ctx.globalAlpha = 1;

    ctx.fillStyle = '#2d3748';
    ctx.font = 'bold 42px Arial, sans-serif';
    ctx.textAlign = 'center';

    const titleText = i18n.t('ui.completionRecord');
    ctx.fillText(titleText, canvas.width / 2, certY + 90);

    ctx.font = '18px Arial, sans-serif';
    ctx.fillStyle = '#4a5568';
    const subtitleText = i18n.t('ui.untPracticeTestCompleted');
    ctx.fillText(subtitleText, canvas.width / 2, certY + 125);

    ctx.font = 'bold 28px Arial, sans-serif';
    ctx.fillStyle = '#667eea';
    const userName = user.displayName || user.email.split('@')[0];
    ctx.fillText(userName, canvas.width / 2, certY + 180);

    ctx.font = 'bold 22px Arial, sans-serif';
    ctx.fillStyle = '#2d3748';
    ctx.fillText(getCertificateTitle(), canvas.width / 2, certY + 215);

    const scoreColor = result.score >= 70 ? '#38a169' : result.score >= 50 ? '#d69e2e' : '#e53e3e';

    const hasPoints =
      Number.isFinite(result?.earnedPoints) &&
      Number.isFinite(result?.totalPoints) &&
      result.totalPoints > 0;
    const mainScoreText = hasPoints
      ? `${result.earnedPoints}/${result.totalPoints}`
      : `${result.totalCorrect}/${result.totalQuestions}`;

    ctx.fillStyle = scoreColor;
    ctx.font = 'bold 72px Arial, sans-serif';
    ctx.fillText(mainScoreText, canvas.width / 2, certY + 290);

    ctx.font = 'bold 28px Arial, sans-serif';
    ctx.fillStyle = '#4a5568';
    ctx.fillText(`${result.score}%`, canvas.width / 2, certY + 330);

    ctx.font = 'italic 18px Arial, sans-serif';
    ctx.fillStyle = '#667eea';
    const quote = i18n.t('ui.reviewYourAnswersToPlanYourNext');

    const maxWidth = certWidth - 200;
    const words = quote.split(' ');
    let line = '';
    let y = certY + 470;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;

      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line, canvas.width / 2, y);
        line = words[n] + ' ';
        y += 25;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, canvas.width / 2, y);

    ctx.font = '16px Arial, sans-serif';
    ctx.fillStyle = '#4a5568';
    const date = new Date(result.finishedAt);
    const dateText = new Intl.DateTimeFormat(i18n.resolvedLanguage, { dateStyle: 'long' }).format(
      date,
    );
    ctx.fillText(dateText, canvas.width / 2, y + 40);

    try {
      const logo = new Image();
      logo.crossOrigin = 'anonymous';

      await new Promise((resolve, reject) => {
        logo.onload = resolve;
        logo.onerror = reject;
        logo.src = '/icons/logo-прозрачный.png';
      });

      ctx.globalAlpha = 0.26;
      const logoSize = 400;
      const logoX = (canvas.width - logoSize) / 2;
      const logoY = certY + 150;
      ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);
      ctx.globalAlpha = 1;
    } catch {
      ctx.globalAlpha = 0.08;
      ctx.font = 'bold 40px Arial, sans-serif';
      ctx.fillStyle = '#667eea';
      ctx.fillText(t('header.logo'), canvas.width / 2, certY + 370);
      ctx.globalAlpha = 1;
    }

    ctx.font = '11px Arial, sans-serif';
    ctx.fillStyle = '#667eea';
    ctx.textAlign = 'center';

    const contactY = certY + certHeight - 65;
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(certX + 50, contactY - 25, certWidth - 100, 45);

    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.strokeRect(certX + 50, contactY - 25, certWidth - 100, 45);

    ctx.fillStyle = '#4a5568';
    ctx.font = '14px Arial, sans-serif';
    ctx.fillText(t('header.logo'), canvas.width / 2, contactY - 5);

    ctx.font = '13px Arial, sans-serif';
    ctx.fillStyle = '#667eea';
    const footerText = t('ui.learningPlatform');
    ctx.fillText(footerText, canvas.width / 2, contactY + 15);

    let performanceText = '';
    let badgeColor = scoreColor;

    if (result.score >= 90) {
      performanceText = i18n.t('ui.excellent');
    } else if (result.score >= 70) {
      performanceText = i18n.t('ui.good');
    } else if (result.score >= 50) {
      performanceText = i18n.t('ui.keepPractising');
    }

    if (performanceText) {
      const badgeWidth = 120;
      const badgeHeight = 35;
      const badgeX = certX + certWidth - badgeWidth - 70;
      const badgeY = certY + 70;

      const innerBorderRight = certX + certWidth - 35;
      const innerBorderTop = certY + 35;

      if (badgeX + badgeWidth < innerBorderRight && badgeY > innerBorderTop) {
        ctx.fillStyle = badgeColor;
        ctx.globalAlpha = 0.12;
        ctx.fillRect(badgeX, badgeY, badgeWidth, badgeHeight);
        ctx.globalAlpha = 1;

        ctx.strokeStyle = badgeColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(badgeX, badgeY, badgeWidth, badgeHeight);

        ctx.fillStyle = badgeColor;
        ctx.font = 'bold 14px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(performanceText, badgeX + badgeWidth / 2, badgeY + 22);
      }
    }

    ctx.textAlign = 'left';
  };

  const downloadCertificate = async () => {
    await generateCertificate();

    const canvas = canvasRef.current;
    const link = document.createElement('a');
    const titleForFile = getCertificateTitle();
    const safeTitle = titleForFile.replace(/[^a-zA-Z0-9\u0400-\u04FF]/g, '-');
    link.download = `certificate-${safeTitle}-${result.score}%.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('test.generateCertificate')}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="text-center mb-6">
          <canvas
            ref={canvasRef}
            className="max-w-full h-auto border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg"
            style={{ maxHeight: '400px' }}
          />
        </div>

        <div className="flex justify-center space-x-4">
          <button
            onClick={generateCertificate}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl transition-colors"
          >
            {t('test.previewCertificate')}
          </button>
          <button
            onClick={downloadCertificate}
            className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            <Download className="h-5 w-5" />
            <span>{t('test.downloadCertificate')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
