# 📱 PWA Setup Guide - AkadilEDU

## ✅ Что Исправлено:

### 1. **index.html - Добавлены PWA мета-теги**
```html
<!-- PWA Configuration -->
<link rel="manifest" href="/manifest.json" />
<meta name="theme-color" content="#5b8cc9" />

<!-- iOS PWA Support -->
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="apple-mobile-web-app-title" content="AkadilEDU" />
<link rel="apple-touch-icon" href="/icons/icon-192.png" />
```

### 2. **main.jsx - Service Worker Включен**
```javascript
// ✅ PWA Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('✅ Service Worker registered');
        // Auto-update check every minute
        setInterval(() => registration.update(), 60000);
      });
  });
}
```

### 3. **manifest.json - Улучшен**
```json
{
  "name": "AkadilEDU - Educational Platform",
  "short_name": "AkadilEDU",
  "display": "standalone",
  "scope": "/",
  "categories": ["education", "learning"],
  "icons": [
    { "src": "/icons/icon-512.png", "sizes": "512x512" },
    { "src": "/icons/icon-192.png", "sizes": "192x192" },
    { "src": "/icons/icon-144.png", "sizes": "144x144" }
  ]
}
```

### 4. **sw.js - Обновлен Service Worker**
- Cache version: v2.1.0
- `skipWaiting()` - мгновенная активация
- `clients.claim()` - немедленный контроль
- Периодическая проверка обновлений

---

## 🔧 Что Нужно Сделать:

### 1. **Создать Иконку 512x512**

**Способ 1: Онлайн редактор**
1. Откройте существующую иконку: `public/icons/icon-192.png`
2. Зайдите на https://www.iloveimg.com/resize-image
3. Увеличьте до 512x512 пикселей
4. Сохраните как `icon-512.png` в папку `public/icons/`

**Способ 2: Через команду (если есть ImageMagick)**
```bash
magick public/icons/icon-192.png -resize 512x512 public/icons/icon-512.png
```

**Способ 3: Photoshop/Figma/Canva**
- Создайте квадратное изображение 512x512
- Добавьте логотип AkadilEDU
- Экспортируйте как PNG

---

### 2. **Проверить icon-144.png**

Файл `public/icons/icon-144.png` сейчас **пустой (0 bytes)**.

Создайте его:
```bash
# Если используете существующую 192px иконку
magick public/icons/icon-192.png -resize 144x144 public/icons/icon-144.png
```

Или через онлайн редактор, как описано выше.

---

## 📱 Как Протестировать PWA:

### На Desktop (Chrome/Edge):

1. Откройте сайт в браузере
2. Нажмите иконку установки в адресной строке: ⊕
3. Нажмите "Установить" / "Install"
4. Приложение откроется в отдельном окне как native app

**Проверка в DevTools:**
```
F12 → Application → Manifest
F12 → Application → Service Workers
```

Должно быть:
- ✅ Manifest detected
- ✅ Service Worker: Active and Running
- ✅ Icons: 144x144, 192x192, 512x512

---

### На Android:

1. Откройте сайт в Chrome
2. Нажмите меню (⋮) → "Добавить на главный экран"
3. Приложение появится на домашнем экране
4. Откройте его → работает как native app

**Признаки правильной работы:**
- ✅ Нет адресной строки браузера
- ✅ Полноэкранный режим
- ✅ Своя иконка в списке приложений
- ✅ Работает офлайн (частично)

---

### На iOS (iPhone/iPad):

1. Откройте сайт в Safari
2. Нажмите кнопку "Поделиться" (квадрат со стрелкой)
3. Прокрутите вниз → "Добавить на экран «Домой»"
4. Нажмите "Добавить"

**iOS особенности:**
- Нужны мета-теги `apple-mobile-web-app-*` ✅ (уже добавлены)
- Service Worker работает ограниченно
- PWA открывается как отдельное приложение

---

## 🔍 Troubleshooting:

### Проблема: "Add to Home Screen" не появляется

**Решение:**
1. Убедитесь что сайт работает на **HTTPS** (обязательно!)
2. Проверьте что `manifest.json` загружается (F12 → Network)
3. Очистите кеш: Ctrl+Shift+Delete

---

### Проблема: Иконка не появляется

**Решение:**
1. Проверьте что иконки существуют:
   ```
   public/icons/icon-144.png ✅
   public/icons/icon-192.png ✅
   public/icons/icon-512.png ❌ (нужно создать!)
   ```
2. Проверьте пути в `manifest.json`
3. Пересоберите проект: `npm run build`

---

### Проблема: Service Worker не регистрируется

**Решение:**
1. Проверьте что файл `public/sw.js` существует ✅
2. Откройте DevTools → Console → ищите ошибки
3. Проверьте что HTTPS включен (на localhost HTTP тоже работает)
4. Удалите старые Service Workers:
   ```javascript
   // В консоли браузера
   navigator.serviceWorker.getRegistrations().then(regs => 
     regs.forEach(reg => reg.unregister())
   );
   ```

---

## 🚀 Deploy на Production:

После создания всех иконок:

```bash
# 1. Build проекта
npm run build

# 2. Проверьте что все иконки в dist/
ls dist/icons/

# 3. Deploy
npm run deploy  # или ваш метод деплоя
```

---

## ✅ Контрольный Список:

- [x] `index.html` - добавлен `<link rel="manifest">`
- [x] `index.html` - добавлены iOS meta теги
- [x] `main.jsx` - Service Worker зарегистрирован
- [x] `manifest.json` - улучшена конфигурация
- [x] `sw.js` - обновлен с `skipWaiting()` и `clients.claim()`
- [ ] `icon-512.png` - **НУЖНО СОЗДАТЬ!**
- [ ] `icon-144.png` - **НУЖНО ПЕРЕСОЗДАТЬ! (сейчас пустой)**
- [ ] Протестировать на Desktop
- [ ] Протестировать на Android
- [ ] Протестировать на iOS

---

## 📖 Дополнительная Информация:

### PWA Критерии:
1. ✅ HTTPS
2. ✅ manifest.json с иконками
3. ✅ Service Worker зарегистрирован
4. ✅ `display: standalone`
5. ✅ `start_url` указан

### Рекомендации:
- Иконки должны быть **квадратными**
- Минимум 144x144, рекомендуется 512x512
- Формат PNG с прозрачным фоном
- `maskable` purpose для адаптивных иконок на Android

---

**После создания иконок сайт будет работать как полноценное нативное приложение!** 🎉
