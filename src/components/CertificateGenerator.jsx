import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Download } from 'lucide-react';

export default function CertificateGenerator({ result, user, onClose }) {
  const { t, i18n } = useTranslation();
  const canvasRef = useRef(null);

  const getCertificateTitle = () => {
    if (!result) return 'ҰБТ тесті';

    // Creative and full modes have fixed Kazakh titles as requested
    if (result.mode === 'creative') {
      return 'Шығармашылық тест';
    }
    if (result.mode === 'full') {
      return 'ҰБТ тесті';
    }

    // Single subject: Subject name | N - нұсқа
    if (result.mode === 'single') {
      const subjects = Array.isArray(result.subjects) ? result.subjects : [];
      const baseSubjectId = subjects[0] || null;
      const subjectLabel = baseSubjectId
        ? t(`test.subjects.${baseSubjectId}`)
        : (result.testTitle || t('test.singleSubjectTest'));
      const n = typeof result.variant === 'number' && result.variant > 0 ? result.variant : 1;
      return `${subjectLabel} | ${n} - нұсқа`;
    }

    return result.testTitle || 'ҰБТ тесті';
  };

  const generateCertificate = async () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    canvas.width = 1200;
    canvas.height = 800;
    
    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#667eea');
    gradient.addColorStop(1, '#764ba2');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add decorative mathematical symbols
    ctx.globalAlpha = 0.05;
    ctx.font = '60px Arial, sans-serif';
    ctx.fillStyle = '#ffffff';
    
    // Mathematical symbols as decorations
    const symbols = ['∑', '∫', '√', 'π', 'α', 'β', '∆', '∞', 'θ', 'λ', '≤', '≥', '≠', '±', '×', '÷'];
    for (let i = 0; i < 25; i++) {
      const symbol = symbols[Math.floor(Math.random() * symbols.length)];
      ctx.fillText(
        symbol,
        Math.random() * canvas.width,
        Math.random() * canvas.height
      );
    }
    
    // Add subtle geometric patterns
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    for (let i = 0; i < 15; i++) {
      ctx.beginPath();
      ctx.arc(
        Math.random() * canvas.width,
        Math.random() * canvas.height,
        Math.random() * 30 + 10,
        0,
        2 * Math.PI
      );
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    
    // White certificate area
    const certX = 80;
    const certY = 60;
    const certWidth = canvas.width - 160;
    const certHeight = canvas.height - 120;
    
    // Certificate background with shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 10;
    
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(certX, certY, certWidth, certHeight);
    
    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    // Decorative border
    ctx.strokeStyle = '#667eea';
    ctx.lineWidth = 8;
    ctx.strokeRect(certX + 20, certY + 20, certWidth - 40, certHeight - 40);
    
    // Inner border
    ctx.strokeStyle = '#764ba2';
    ctx.lineWidth = 2;
    ctx.strokeRect(certX + 35, certY + 35, certWidth - 70, certHeight - 70);
    
    // Add decorative math symbols inside certificate
    ctx.globalAlpha = 0.08;
    ctx.font = '24px Arial, sans-serif';
    ctx.fillStyle = '#667eea';
    
    // Left side symbols
    const leftSymbols = ['∑', '∫', '√', 'π', 'α', '∆'];
    for (let i = 0; i < leftSymbols.length; i++) {
      ctx.fillText(leftSymbols[i], certX + 60 + Math.random() * 80, certY + 120 + i * 80 + Math.random() * 40);
    }
    
    // Right side symbols  
    const rightSymbols = ['∞', 'θ', 'λ', '≤', '≥', '±'];
    for (let i = 0; i < rightSymbols.length; i++) {
      ctx.fillText(rightSymbols[i], certX + certWidth - 140 + Math.random() * 80, certY + 120 + i * 80 + Math.random() * 40);
    }
    
    ctx.globalAlpha = 1;
    
    // Certificate title
    ctx.fillStyle = '#2d3748';
    ctx.font = 'bold 42px Arial, sans-serif';
    ctx.textAlign = 'center';
    
    const titleText = i18n.language === 'kk' ? 'СЕРТИФИКАТ' : 
                     i18n.language === 'ru' ? 'СЕРТИФИКАТ' : 'CERTIFICATE';
    ctx.fillText(titleText, canvas.width / 2, certY + 90);
    
    // Subtitle (increased spacing)
    ctx.font = '18px Arial, sans-serif';
    ctx.fillStyle = '#4a5568';
    const subtitleText = i18n.language === 'kk' ? 'ҰБТ дайындық тесті аяқтағаны туралы' :
                        i18n.language === 'ru' ? 'о прохождении подготовительного теста к ЕНТ' :
                        'for completing UBT preparation test';
    ctx.fillText(subtitleText, canvas.width / 2, certY + 125);
    
    // User name (increased spacing)
    ctx.font = 'bold 28px Arial, sans-serif';
    ctx.fillStyle = '#667eea';
    const userName = user.displayName || user.email.split('@')[0];
    ctx.fillText(userName, canvas.width / 2, certY + 180);
    
    // Test title (increased spacing)
    ctx.font = 'bold 22px Arial, sans-serif';
    ctx.fillStyle = '#2d3748';
    ctx.fillText(getCertificateTitle(), canvas.width / 2, certY + 215);
    
    // MAIN SCORE (increased spacing)
    const scoreColor = result.score >= 70 ? '#38a169' : 
                      result.score >= 50 ? '#d69e2e' : '#e53e3e';
    
    // Prefer points (earnedPoints / totalPoints) when available, fallback to correct/total questions
    const hasPoints = Number.isFinite(result?.earnedPoints) && Number.isFinite(result?.totalPoints) && result.totalPoints > 0;
    const mainScoreText = hasPoints
      ? `${result.earnedPoints}/${result.totalPoints}`
      : `${result.totalCorrect}/${result.totalQuestions}`;

    ctx.fillStyle = scoreColor;
    ctx.font = 'bold 72px Arial, sans-serif';
    ctx.fillText(mainScoreText, canvas.width / 2, certY + 290);
    
    // Percentage (increased spacing)
    ctx.font = 'bold 28px Arial, sans-serif';
    ctx.fillStyle = '#4a5568';
    ctx.fillText(`${result.score}%`, canvas.width / 2, certY + 330);
    
    // Motivational quote
    ctx.font = 'italic 18px Arial, sans-serif';
    ctx.fillStyle = '#667eea';
    const quote = i18n.language === 'kk' ? 'Бұл тек бір қадам, алда бізбен бірге бұдан да жоғары деңгейге жетесің' :
                 i18n.language === 'ru' ? 'Это только один шаг, впереди вместе с нами достигнешь еще более высокого уровня' :
                 'This is just one step, ahead you will reach even higher levels with us';
    
    // Wrap quote text (adjusted position)
    const maxWidth = certWidth - 200; // Reduced to avoid symbols
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
    
    // Date (in Kazakh) - increased spacing
    ctx.font = '16px Arial, sans-serif';
    ctx.fillStyle = '#4a5568';
    const date = new Date(result.finishedAt);
    const kazakhMonths = [
      'қаңтар', 'ақпан', 'наурыз', 'сәуір', 'мамыр', 'маусым',
      'шілде', 'тамыз', 'қыркүйек', 'қазан', 'қараша', 'желтоқсан'
    ];
    const dateText = `${date.getDate()} ${kazakhMonths[date.getMonth()]} ${date.getFullYear()} ж.`;
    ctx.fillText(dateText, canvas.width / 2, y + 40);
    
    // Logo watermark (center background)
    try {
      const logo = new Image();
      logo.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        logo.onload = resolve;
        logo.onerror = reject;
        logo.src = '/icons/logo-прозрачный.png';
      });
      
      // Draw logo as center watermark
      ctx.globalAlpha = 0.26;
      const logoSize = 400;
      const logoX = (canvas.width - logoSize) / 2;
      const logoY = certY + 150;
      ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);
      ctx.globalAlpha = 1;
    } catch (error) {
      // Fallback text watermark
      ctx.globalAlpha = 0.08;
      ctx.font = 'bold 40px Arial, sans-serif';
      ctx.fillStyle = '#667eea';
      ctx.fillText('AkadilEDU', canvas.width / 2, certY + 370);
      ctx.globalAlpha = 1;
    }
    
    // Contact info (better positioned)
    ctx.font = '11px Arial, sans-serif';
    ctx.fillStyle = '#667eea';
    ctx.textAlign = 'center';
    
    // Create a beautiful contact box
    const contactY = certY + certHeight - 65;
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(certX + 50, contactY - 25, certWidth - 100, 45);
    
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.strokeRect(certX + 50, contactY - 25, certWidth - 100, 45);
    
    ctx.fillStyle = '#4a5568';
    ctx.font = '14px Arial, sans-serif';
    ctx.fillText('🌐 akadiledu.web.app   |   tg / inst: @akadiledu', canvas.width / 2, contactY - 5);
    
    // Footer (platform name)
    ctx.font = '13px Arial, sans-serif';
    ctx.fillStyle = '#667eea';
    const footerText = 'AkadilEDU - ' + (i18n.language === 'kk' ? 'Білім беру платформасы' :
                      i18n.language === 'ru' ? 'Образовательная платформа' : 'Educational Platform');
    ctx.fillText(footerText, canvas.width / 2, contactY + 15);
    
    // Performance badge (inside certificate area)
    let performanceText = '';
    let badgeColor = scoreColor;
    
    if (result.score >= 90) {
      performanceText = i18n.language === 'kk' ? 'КЕРЕМЕТ!' : i18n.language === 'ru' ? 'ОТЛИЧНО!' : 'EXCELLENT!';
    } else if (result.score >= 70) {
      performanceText = i18n.language === 'kk' ? 'ЖАҚСЫ' : i18n.language === 'ru' ? 'ХОРОШО' : 'GOOD';
    } else if (result.score >= 50) {
      performanceText = i18n.language === 'kk' ? 'ОРТАША' : i18n.language === 'ru' ? 'УДОВЛЕТВОРИТЕЛЬНО' : 'SATISFACTORY';
    }
    
    if (performanceText) {
      // Badge background (properly positioned inside certificate)
      const badgeWidth = 120;
      const badgeHeight = 35;
      const badgeX = certX + certWidth - badgeWidth - 70;
      const badgeY = certY + 70;
      
      // Make sure badge is within inner border
      const innerBorderRight = certX + certWidth - 35;
      const innerBorderTop = certY + 35;
      
      if (badgeX + badgeWidth < innerBorderRight && badgeY > innerBorderTop) {
        ctx.fillStyle = badgeColor;
        ctx.globalAlpha = 0.12;
        ctx.fillRect(badgeX, badgeY, badgeWidth, badgeHeight);
        ctx.globalAlpha = 1;
        
        // Badge border
        ctx.strokeStyle = badgeColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(badgeX, badgeY, badgeWidth, badgeHeight);
        
        // Badge text
        ctx.fillStyle = badgeColor;
        ctx.font = 'bold 14px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(performanceText, badgeX + badgeWidth/2, badgeY + 22);
      }
    }
    
    // Reset text align
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
