const STORAGE_KEYS = {
  CONSENT: 'ak_consent',
  THEME: 'ak_theme',
  LANG: 'ak_lang',
  PROFILE: 'users.profile',
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

  revokeConsent() {
    this.clearAll();
    this.consentGiven = false;
  }

  getItem(key) {
    try {
      return localStorage.getItem(key);
    } catch (error) {
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
    } catch (error) {
      return false;
    }
  }

  removeItem(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      return false;
    }
  }

  clearAll() {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      return false;
    }
  }

  getTheme() {
    return this.getItem(STORAGE_KEYS.THEME) || 'light';
  }

  setTheme(theme) {
    return this.setItem(STORAGE_KEYS.THEME, theme);
  }

  getProfile() {
    const data = this.getItem(STORAGE_KEYS.PROFILE);
    return data ? JSON.parse(data) : null;
  }

  setProfile(profile) {
    return this.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  }
}

export const storage = new Storage();
export { STORAGE_KEYS };
