const STORAGE_KEYS = {
  CONSENT: 'ak_consent',
  THEME: 'ak_theme',
  LANG: 'ak_lang',
};

class Storage {
  constructor() {
    this.consentGiven = this.getItem(STORAGE_KEYS.CONSENT) === 'true';
  }

  hasConsent() {
    return this.consentGiven;
  }

  giveConsent() {
    localStorage.setItem(STORAGE_KEYS.CONSENT, 'true');
    this.consentGiven = true;
  }

  getItem(key) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  setItem(key, value) {
    const essentialKeys = [STORAGE_KEYS.CONSENT, STORAGE_KEYS.THEME, STORAGE_KEYS.LANG];

    if (!this.consentGiven && !essentialKeys.includes(key)) {
      return false;
    }

    try {
      localStorage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  }

  clearAll() {
    try {
      localStorage.clear();
      return true;
    } catch {
      return false;
    }
  }

  getTheme() {
    return this.getItem(STORAGE_KEYS.THEME) || 'light';
  }

  setTheme(theme) {
    return this.setItem(STORAGE_KEYS.THEME, theme);
  }
}

export const storage = new Storage();
