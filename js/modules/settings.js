// ---- Settings Management ----
import { DEFAULT_SETTINGS } from './config.js';
import { loadLanguage, t } from './i18n.js';
import { updateUILanguage } from './ui.js';
import { validateApiKey, showError } from './groq.js';

let currentSettings = { ...DEFAULT_SETTINGS };

export function getCurrentSettings() {
  return { ...currentSettings };
}

export async function loadSettings() {
  const stored = localStorage.getItem('chatSettings');
  if (stored) {
    currentSettings = { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
  }

  // Load language file
  const langFile = currentSettings.language === 'english' ? 'en' : 'cs';
  await loadLanguage(langFile);

  return currentSettings;
}

export async function saveSettings(newSettings) {
  // Validate API key if provided
  if (newSettings.apiKey !== undefined && newSettings.apiKey !== '') {
    const validation = validateApiKey(newSettings.apiKey);
    if (!validation.isValid) {
      showError(validation.error);
      throw new Error(validation.error);
    }
  }
  
  const previousLanguage = currentSettings.language;
  currentSettings = { ...currentSettings, ...newSettings };
  localStorage.setItem('chatSettings', JSON.stringify(currentSettings));

  // Handle language change
  if (newSettings.language && newSettings.language !== previousLanguage) {
    const langFile = newSettings.language === 'english' ? 'en' : 'cs';
    await loadLanguage(langFile);
    // Update UI with new language
    updateUILanguage();
  }

  return currentSettings;
}

export function updateSettingsForm(form) {
  if (!form) return;

  form.apiKey.value = currentSettings.apiKey || '';
  form.model.value = currentSettings.model || DEFAULT_SETTINGS.model;
  form.temperature.value = currentSettings.temperature ?? DEFAULT_SETTINGS.temperature;
  form.maxTokens.value = currentSettings.maxTokens ?? DEFAULT_SETTINGS.maxTokens;
  form.fontSize.value = currentSettings.fontSize || DEFAULT_SETTINGS.fontSize;
  form.language.value = currentSettings.language || DEFAULT_SETTINGS.language;
  form.history.checked = currentSettings.saveHistory !== false;

  // Update form labels with translations
  const labels = form.querySelectorAll('label');
  labels.forEach(label => {
    const forAttr = label.getAttribute('for');
    switch(forAttr) {
      case 'apiKeyInput':
        label.textContent = t('app.groqApiKey');
        break;
      case 'modelSelect':
        label.textContent = t('app.visionModel');
        break;
      case 'temperatureInput':
        label.textContent = t('app.temperature');
        break;
      case 'maxTokensInput':
        label.textContent = t('app.maxTokens');
        break;
      case 'fontSizeSelect':
        label.textContent = t('app.fontSize');
        break;
      case 'languageSelect':
        label.textContent = t('app.appLanguage');
        break;
    }
  });

  // Update font size options
  const fontSizeSelect = form.querySelector('#fontSizeSelect');
  if (fontSizeSelect) {
    const options = fontSizeSelect.querySelectorAll('option');
    options.forEach(option => {
      switch(option.value) {
        case 'small':
          option.textContent = t('app.small');
          break;
        case 'normal':
          option.textContent = t('app.normal');
          break;
        case 'big':
          option.textContent = t('app.big');
          break;
      }
    });
  }

  // Update language options
  const languageSelect = form.querySelector('#languageSelect');
  if (languageSelect) {
    const options = languageSelect.querySelectorAll('option');
    options.forEach(option => {
      switch(option.value) {
        case 'czech':
          option.textContent = 'Čeština';
          break;
        case 'english':
          option.textContent = 'English';
          break;
      }
    });
  }

  // Update checkbox label
  const historyLabel = form.querySelector('label[for="historyToggle"]');
  if (historyLabel) historyLabel.textContent = t('app.saveHistory');

  // Update modal title
  const modalTitle = document.getElementById('settingsTitle');
  if (modalTitle) modalTitle.textContent = t('app.settingsTitle');

  // Update buttons
  const cancelBtn = document.getElementById('cancelSettingsBtn');
  if (cancelBtn) cancelBtn.textContent = t('app.cancel');

  const saveBtn = form.querySelector('.btn-primary');
  if (saveBtn) saveBtn.textContent = t('app.save');

  // Update API key buttons
  const toggleApiKeyBtn = form.querySelector('#toggleApiKeyBtn');
  if (toggleApiKeyBtn) {
    toggleApiKeyBtn.title = t('app.showApiKey');
  }

  const copyApiKeyBtn = form.querySelector('#copyApiKeyBtn');
  if (copyApiKeyBtn) {
    copyApiKeyBtn.title = t('app.copyApiKey');
  }
}