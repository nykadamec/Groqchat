// ---- UI Management ----
import { t } from './i18n.js';
import { getCurrentSettings } from './settings.js';
import { handleFiles, removeAttachment, adjustTextareaHeight, updateAttachments, getAttachments } from './chat.js';

let enterToSend = false;

// DOM Elements cache
const elements = {};

function getElement(id) {
  if (!elements[id]) {
    elements[id] = document.getElementById(id);
  }
  return elements[id];
}

export function updateUILanguage() {
  // Update document title
  document.title = t('app.title');

  // Update header elements
  const headerTitle = document.querySelector('h1');
  if (headerTitle) headerTitle.innerHTML = `<i class="fas fa-eye"></i> ${t('app.title')}`;

  // Update buttons
  const newChatBtn = getElement('newChatBtn');
  if (newChatBtn) newChatBtn.innerHTML = `<i class="fas fa-plus"></i> ${t('app.newChat')}`;

  const settingsBtn = getElement('settingsBtn');
  if (settingsBtn) settingsBtn.title = t('app.settings');

  const infoBtn = getElement('infoBtn');
  if (infoBtn) infoBtn.title = t('app.info');

  const themeToggle = getElement('themeToggle');
  if (themeToggle) themeToggle.title = t('app.theme');

  const menuBtn = getElement('menuBtn');
  if (menuBtn) menuBtn.title = t('app.menu');

  // Update send button
  const sendButton = getElement('sendButton');
  if (sendButton) sendButton.title = t('app.sendMessage');

  // Update action buttons
  const stopButton = getElement('stopButton');
  if (stopButton) stopButton.innerHTML = `<i class="fas fa-stop"></i> ${t('app.stop')}`;

  const regenerateButton = getElement('regenerateButton');
  if (regenerateButton) regenerateButton.innerHTML = `<i class="fas fa-redo"></i> ${t('app.regenerate')}`;

  // Update composer placeholder
  const composerInput = getElement('composer-input');
  if (composerInput) composerInput.placeholder = t('app.askMe');

  // Update suggestion chips
  const suggestionChips = document.querySelectorAll('.suggestion-chip');
  suggestionChips.forEach((chip, index) => {
    const displaySuggestions = [
      'app.analyzeImage',
      'app.whatDoYouSee',
      'app.describeDetails',
      'app.whatColors',
      'app.identifyObjects'
    ];
    const dataSuggestions = [
      'app.analyzeImageFull',
      'app.whatDoYouSeeFull',
      'app.describeDetailsFull',
      'app.whatColorsFull',
      'app.identifyObjectsFull'
    ];
    if (displaySuggestions[index]) {
      chip.textContent = t(displaySuggestions[index]);
    }
    if (dataSuggestions[index]) {
      chip.setAttribute('data-text', t(dataSuggestions[index]));
    }
  });

  // Update controls
  const streamingToggleLabel = document.querySelector('.control-item:nth-child(1) span');
  if (streamingToggleLabel) streamingToggleLabel.textContent = t('app.streaming');

  const enterToggleLabel = document.querySelector('.control-item:nth-child(2) span');
  if (enterToggleLabel) enterToggleLabel.textContent = t('app.enterToSend');

  // Update attachment menu items
  const imageItem = document.querySelector('.attachment-menu-item[data-type="image"]');
  if (imageItem) imageItem.innerHTML = `<i class="fas fa-image"></i> ${t('app.image')}`;

  const fileItem = document.querySelector('.attachment-menu-item[data-type="file"]');
  if (fileItem) fileItem.innerHTML = `<i class="fas fa-file"></i> ${t('app.file')}`;

  const cameraItem = document.querySelector('.attachment-menu-item[data-type="camera"]');
  if (cameraItem) cameraItem.innerHTML = `<i class="fas fa-camera"></i> ${t('app.camera')}`;

  // Update commands hint
  const commandsHint = getElement('commandsHint');
  if (commandsHint) commandsHint.textContent = t('app.useCommands');

  // Update welcome message
  const messages = document.querySelectorAll('.message.assistant .message-text');
  if (messages.length > 0 && messages[0].textContent.includes('Ahoj!')) {
    messages[0].textContent = t('app.welcomeMessage');
  }

  // Update typing indicator
  const typingMessage = getElement('typingMessage');
  if (typingMessage) {
    const typingText = typingMessage.querySelector('.typing-indicator');
    if (typingText) typingText.innerHTML = `${t('app.modelWriting')}<div class="typing-dots"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div>`;
  }

  // Update install banner
  const installBanner = getElement('installBanner');
  if (installBanner) {
    const bannerText = installBanner.querySelector('.install-banner-text span');
    if (bannerText) bannerText.textContent = t('app.installApp');

    const installBtn = getElement('installBtn');
    if (installBtn) installBtn.textContent = t('app.install');

    const dismissBtn = getElement('dismissInstallBtn');
    if (dismissBtn) dismissBtn.textContent = t('app.dismiss');
  }

  // Update desktop message
  const desktopMessage = getElement('desktopMessage');
  if (desktopMessage) {
    const title = desktopMessage.querySelector('h1');
    if (title) title.textContent = t('app.mobileApp');

    const messages = desktopMessage.querySelectorAll('p');
    if (messages[0]) messages[0].textContent = t('app.mobileOnlyMessage');
    if (messages[1]) messages[1].textContent = t('app.openOnMobile');
  }

  // Update modal close button
  const closeSettingsBtn = getElement('closeSettingsBtn');
  if (closeSettingsBtn) closeSettingsBtn.title = t('app.closeSettings');

  // Update attachment button
  const attachmentBtn = getElement('attachmentBtn');
  if (attachmentBtn) attachmentBtn.title = t('app.attachFile');
}

export function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);

  // Update theme toggle icon
  const themeToggle = getElement('themeToggle');
  if (themeToggle) {
    const icon = themeToggle.querySelector('i');
    if (newTheme === 'dark') {
      icon.className = 'fas fa-sun';
    } else {
      icon.className = 'fas fa-moon';
    }
  }
}

export function loadTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);

  // Set initial icon
  const themeToggle = getElement('themeToggle');
  if (themeToggle) {
    const icon = themeToggle.querySelector('i');
    if (savedTheme === 'dark') {
      icon.className = 'fas fa-sun';
    } else {
      icon.className = 'fas fa-moon';
    }
  }
}

export function applyFontSize(size) {
  document.body.classList.remove('font-size-small', 'font-size-normal', 'font-size-big');
  document.body.classList.add(`font-size-${size}`);
}

export function setupEventListeners() {
  // Composer input
  const textarea = getElement('composer-input');
  const sendButton = getElement('sendButton');
  const charCounter = getElement('charCounter');

  if (textarea) {
    textarea.addEventListener('input', function() {
      adjustTextareaHeight();
      if (sendButton) {
        sendButton.disabled = this.value.trim() === '' && getAttachments().length === 0;
      }
      if (charCounter) {
        charCounter.textContent = `${this.value.length} / 4000`;
      }
      const hint = getElement('commandsHint');
      if (hint) {
        if (this.value === '/') hint.classList.add('active');
        else hint.classList.remove('active');
      }
    });

    textarea.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        if (enterToSend && !e.shiftKey) {
          e.preventDefault();
          if (sendButton && !sendButton.disabled) {
            // Import and call sendMessage
            import('./chat.js').then(module => {
              // This will be handled by the main module
            });
          }
        }
      }
    });
  }

  // Toggle switches
  document.querySelectorAll('.toggle-switch').forEach(t => {
    t.addEventListener('click', function() {
      const active = this.classList.contains('active');
      this.classList.toggle('active');
      this.setAttribute('aria-checked', String(!active));
      if (this.id === 'enterToggle') enterToSend = !active;
    });
    t.addEventListener('keydown', function(e) {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        this.click();
      }
    });
  });

  // Attachment handling
  const attachmentBtn = getElement('attachmentBtn');
  const attachmentMenu = getElement('attachmentMenu');
  const fileInput = getElement('fileInput');
  const imageInput = getElement('imageInput');
  const cameraInput = getElement('cameraInput');

  if (attachmentBtn && attachmentMenu) {
    attachmentBtn.addEventListener('click', function() {
      const open = attachmentMenu.classList.contains('active');
      attachmentMenu.classList.toggle('active');
      this.setAttribute('aria-expanded', String(!open));
    });
  }

  document.addEventListener('click', function(e) {
    if (attachmentBtn && attachmentMenu && !attachmentBtn.contains(e.target) && !attachmentMenu.contains(e.target)) {
      attachmentMenu.classList.remove('active');
      attachmentBtn.setAttribute('aria-expanded', 'false');
    }
  });

  if (attachmentMenu) {
    attachmentMenu.addEventListener('click', function(e) {
      const item = e.target.closest('.attachment-menu-item');
      if (!item) return;
      const type = item.dataset.type;
      if (type === 'image' && imageInput) imageInput.click();
      if (type === 'file' && fileInput) fileInput.click();
      if (type === 'camera' && cameraInput) cameraInput.click();
      attachmentMenu.classList.remove('active');
      attachmentBtn.setAttribute('aria-expanded', 'false');
    });
  }

  if (fileInput) fileInput.addEventListener('change', e => {
    if (e.target.files.length) {
      handleFiles(e.target.files);
      e.target.value = '';
    }
  });
  if (imageInput) imageInput.addEventListener('change', e => {
    if (e.target.files.length) {
      handleFiles(e.target.files);
      e.target.value = '';
    }
  });
  if (cameraInput) cameraInput.addEventListener('change', e => {
    if (e.target.files.length) {
      handleFiles(e.target.files);
      e.target.value = '';
    }
  });

  // Attachment removal
  const attachmentsContainer = getElement('attachments');
  if (attachmentsContainer) {
    attachmentsContainer.addEventListener('click', e => {
      if (e.target.classList.contains('attachment-remove')) {
        removeAttachment(e.target.dataset.id);
      }
    });
  }

  // Suggestion chips
  document.querySelector('.suggestion-chips').addEventListener('click', e => {
    const chip = e.target.closest('.suggestion-chip');
    if (!chip) return;
    const text = chip.dataset.text || chip.textContent;
    if (textarea) {
      textarea.value = text;
      adjustTextareaHeight();
    }
    if (sendButton) {
      sendButton.disabled = getAttachments().length === 0 && !text.trim();
    }
    if (textarea) textarea.focus();
  });

  // Drag & Drop
  let dragCounter = 0;

  document.addEventListener('dragenter', function(e) {
    e.preventDefault();
    dragCounter++;
    const dragOverlay = getElement('dragOverlay');
    if (dragCounter === 1 && dragOverlay) {
      dragOverlay.classList.add('active');
    }
  });

  document.addEventListener('dragover', function(e) {
    e.preventDefault();
  });

  document.addEventListener('dragleave', function(e) {
    dragCounter--;
    const dragOverlay = getElement('dragOverlay');
    if (dragCounter === 0 && dragOverlay) {
      dragOverlay.classList.remove('active');
    }
  });

  document.addEventListener('drop', function(e) {
    e.preventDefault();
    dragCounter = 0;
    const dragOverlay = getElement('dragOverlay');
    if (dragOverlay) dragOverlay.classList.remove('active');

    if (e.dataTransfer.files.length) {
      handleFiles(e.dataTransfer.files);
    }
  });
}