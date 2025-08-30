// ---- Main Application Entry Point ----
import { DEFAULT_SETTINGS } from './modules/config.js';
import { loadLanguage, t } from './modules/i18n.js';
import { loadSettings, saveSettings, updateSettingsForm, getCurrentSettings } from './modules/settings.js';
import { initializeGroq, getGroqInstance, showError, validateApiKey } from './modules/groq.js';
import {
  createNewChat,
  switchToChat,
  deleteChat,
  updateChatsList,
  loadChats,
  saveChats,
  addMessage,
  updateMessage,
  showTyping,
  hideTyping,
  sendMessage,
  stopStreaming,
  regenerateResponse,
  getCurrentChatId,
  getChats,
  adjustTextareaHeight,
  scrollToBottom
} from './modules/chat.js';
import { updateUILanguage, toggleTheme, loadTheme, applyFontSize, setupEventListeners } from './modules/ui.js';
import { registerServiceWorker, setupInstallPrompt, setupInstallEventListeners } from './modules/pwa.js';

// Global reference for external access
window.chatModule = {
  createNewChat,
  switchToChat,
  deleteChat,
  sendMessage,
  stopStreaming,
  regenerateResponse
};

// ---- Main Initialization ----
async function initApp() {
  try {
    // Load settings first
    const settings = await loadSettings();

    // Initialize Groq if API key is available
    if (settings.apiKey) {
      await initializeGroq(settings.apiKey);
    }

    // Apply theme and font size
    loadTheme();
    applyFontSize(settings.fontSize);

    // Load chats if history is enabled
    if (settings.saveHistory) {
      loadChats();
    } else if (Object.keys(getChats()).length === 0) {
      createNewChat();
    }

    // Setup UI
    updateUILanguage();
    setupEventListeners();

    // Setup PWA
    registerServiceWorker();
    setupInstallPrompt();
    setupInstallEventListeners();

    // Setup settings modal
    setupSettingsModal();

    // Initial textarea adjustment
    adjustTextareaHeight();

  } catch (error) {
    console.error('Error initializing app:', error);
    showError('Chyba při inicializaci aplikace');
  }
}

// ---- Settings Modal Management ----
function setupSettingsModal() {
  const settingsBtn = document.getElementById('settingsBtn');
  const settingsModal = document.getElementById('settingsModal');
  const closeSettingsBtn = document.getElementById('closeSettingsBtn');
  const cancelSettingsBtn = document.getElementById('cancelSettingsBtn');
  const settingsForm = document.getElementById('settingsForm');

  function openSettings() {
    updateSettingsForm(settingsForm);
    settingsModal.setAttribute('aria-hidden', 'false');
    settingsModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeSettings() {
    settingsModal.setAttribute('aria-hidden', 'true');
    settingsModal.classList.remove('active');
    document.body.style.overflow = '';
  }

  if (settingsBtn) settingsBtn.addEventListener('click', openSettings);
  if (closeSettingsBtn) closeSettingsBtn.addEventListener('click', closeSettings);
  if (cancelSettingsBtn) cancelSettingsBtn.addEventListener('click', closeSettings);

  if (settingsModal) {
    settingsModal.addEventListener('click', function(e) {
      if (e.target === this) closeSettings();
    });
  }

  if (settingsForm) {
    settingsForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      const formData = new FormData(this);
      const settings = {
        apiKey: formData.get('apiKey'),
        model: formData.get('model'),
        temperature: parseFloat(formData.get('temperature')),
        maxTokens: parseInt(formData.get('maxTokens')),
        fontSize: formData.get('fontSize'),
        language: formData.get('language'),
        saveHistory: formData.get('history') === 'on'
      };
      await saveSettings(settings);
      closeSettings();
      showError(t('app.settingsSaved'));
    });
  }

  // Setup other UI elements
  const newChatBtn = document.getElementById('newChatBtn');
  if (newChatBtn) newChatBtn.addEventListener('click', createNewChat);

  const menuBtn = document.getElementById('menuBtn');
  if (menuBtn) menuBtn.addEventListener('click', () => {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.toggle('hidden');
  });

  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) themeToggle.addEventListener('click', toggleTheme);

  const sendButton = document.getElementById('sendButton');
  if (sendButton) sendButton.addEventListener('click', sendMessage);

  const stopButton = document.getElementById('stopButton');
  if (stopButton) stopButton.addEventListener('click', stopStreaming);

  const regenerateButton = document.getElementById('regenerateButton');
  if (regenerateButton) regenerateButton.addEventListener('click', regenerateResponse);
}

// ---- Initialize when DOM is ready ----
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}