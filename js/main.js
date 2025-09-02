// ---- Main Application Entry Point ----
import { DEFAULT_SETTINGS } from './modules/config.js';
import { loadLanguage, t } from './modules/i18n.js';
import { loadSettings, saveSettings, updateSettingsForm, getCurrentSettings } from './modules/settings.js';
import { initializeGroq, getGroqInstance, showError, validateApiKey } from './modules/groq.js';
import {
  createNewChat,
  switchToChat,
  deleteChat,
  renameChat,
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
import { initComposer } from './modules/composer.js';
import { initLoading, updateLoadingStep, hideLoading, handleLoadingError } from './modules/loading.js';
import { initLogger, loadStoredLogs, logger, exportLogs, clearLogs } from './modules/logger.js';

// Global reference for external access
window.chatModule = {
  createNewChat,
  switchToChat,
  deleteChat,
  renameChat,
  sendMessage,
  stopStreaming,
  regenerateResponse
};

// ---- Main Initialization ----
async function initApp() {
  try {
    // Initialize logging system first
    initLogger();
    loadStoredLogs();
    logger.info('App', 'Application initialization started');
    
    // Initialize loading system
    initLoading();
    updateLoadingStep('init');
    
    // Load settings first
    updateLoadingStep('settings');
    logger.info('App', 'Loading settings');
    const settings = await loadSettings();

    // Load language
    updateLoadingStep('language');
    logger.info('App', 'Loading language files');
    await new Promise(resolve => setTimeout(resolve, 300)); // Small delay for visual feedback

    // Initialize Groq if API key is available
    updateLoadingStep('api');
    if (settings.apiKey) {
      logger.info('App', 'Initializing Groq API');
      await initializeGroq(settings.apiKey);
    }
    await new Promise(resolve => setTimeout(resolve, 200));

    // Setup UI
    updateLoadingStep('ui');
    logger.info('App', 'Setting up UI');
    loadTheme();
    applyFontSize(settings.fontSize);

    // Load chats if history is enabled
    if (settings.saveHistory) {
      logger.info('App', 'Loading chat history');
      loadChats();
    } else if (Object.keys(getChats()).length === 0) {
      logger.info('App', 'Creating new chat');
      createNewChat();
    }

    updateUILanguage();
    setupEventListeners();
    await new Promise(resolve => setTimeout(resolve, 300));

    // Setup PWA
    updateLoadingStep('pwa');
    logger.info('App', 'Setting up PWA features');
    registerServiceWorker();
    setupInstallPrompt();
    setupInstallEventListeners();

    // Setup settings modal
    setupSettingsModal();
    
    // Initialize the new composer
    initComposer();

    // Initial textarea adjustment
    adjustTextareaHeight();

    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Complete loading
    updateLoadingStep('complete');
    logger.info('App', 'Application initialization completed successfully');

  } catch (error) {
    logger.error('App', 'Error initializing application', { error: error.message, stack: error.stack });
    handleLoadingError(error, 'init');
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
      try {
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
      } catch (error) {
        console.error('Error saving settings:', error);
        // Error is already shown by saveSettings via showError
      }
    });
  }

  // Setup API key visibility and copy buttons
  const toggleApiKeyBtn = document.getElementById('toggleApiKeyBtn');
  const copyApiKeyBtn = document.getElementById('copyApiKeyBtn');
  const apiKeyInput = document.getElementById('apiKeyInput');

  if (toggleApiKeyBtn && apiKeyInput) {
    toggleApiKeyBtn.addEventListener('click', function() {
      const isPassword = apiKeyInput.type === 'password';
      apiKeyInput.type = isPassword ? 'text' : 'password';
      this.querySelector('i').className = isPassword ? 'fas fa-eye-slash' : 'fas fa-eye';
      this.title = isPassword ? t('app.hideApiKey') : t('app.showApiKey');
    });
  }

  if (copyApiKeyBtn && apiKeyInput) {
    copyApiKeyBtn.addEventListener('click', async function() {
      const apiKey = apiKeyInput.value.trim();
      if (!apiKey) {
        showError(t('app.noApiKeyToCopy'));
        return;
      }

      try {
        await navigator.clipboard.writeText(apiKey);
        // Visual feedback
        this.classList.add('copied');
        this.querySelector('i').className = 'fas fa-check';
        this.title = t('app.apiKeyCopied');

        // Reset after 2 seconds
        setTimeout(() => {
          this.classList.remove('copied');
          this.querySelector('i').className = 'fas fa-copy';
          this.title = t('app.copyApiKey');
        }, 2000);
      } catch (error) {
        console.error('Failed to copy API key:', error);
        showError('Nepodařilo se zkopírovat API klíč');
      }
    });
  }

  // Setup log management buttons
  const exportLogsBtn = document.getElementById('exportLogsBtn');
  const clearLogsBtn = document.getElementById('clearLogsBtn');

  if (exportLogsBtn) {
    exportLogsBtn.addEventListener('click', function() {
      logger.info('Settings', 'User requested log export');
      if (exportLogs()) {
        showError('Logy byly úspěšně exportovány');
      } else {
        showError('Chyba při exportu logů');
      }
    });
  }

  if (clearLogsBtn) {
    clearLogsBtn.addEventListener('click', function() {
      if (confirm('Opravdu chcete smazat všechny logy? Tato akce nelze vrátit zpět.')) {
        logger.info('Settings', 'User requested log clearing');
        if (clearLogs()) {
          showError('Logy byly úspěšně smazány');
        } else {
          showError('Chyba při mazání logů');
        }
      }
    });
  }

  const menuBtn = document.getElementById('menuBtn');
  const sidebar = document.getElementById('sidebar');
  const sidebarOverlay = document.getElementById('sidebarOverlay');

  if (menuBtn && sidebar) {
    const toggleSidebar = () => {
      sidebar.classList.toggle('hidden');
    };

    menuBtn.addEventListener('click', toggleSidebar);

    // Close sidebar when clicking on overlay
    if (sidebarOverlay) {
      sidebarOverlay.addEventListener('click', () => {
        sidebar.classList.add('hidden');
      });
    }
  }

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