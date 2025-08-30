// Groq SDK
import { Groq } from 'https://cdn.skypack.dev/groq-sdk@0.30.0';

// ---- State ----
let groq = null;
let chats = {};
let currentChatId = null;
let attachments = [];
let isStreaming = false;
let streamController = null;
let enterToSend = false;
let retryCount = 0;
const MAX_RETRIES = 3;

// Language system
let translations = {};
let currentLanguage = 'czech';

let currentSettings = {
  apiKey: '',
  model: 'meta-llama/llama-4-scout-17b-16e-instruct',
  temperature: 1,
  maxTokens: 1024,
  fontSize: 'normal',
  language: 'czech',
  saveHistory: true
};

let lastSendTime = 0;
const SEND_COOLDOWN = 1000; // 1 second between sends

// ---- DOM Elements ----
const textarea = document.getElementById('composer-input');
const sendButton = document.getElementById('sendButton');
const charCounter = document.getElementById('charCounter');
const messagesContainer = document.getElementById('messagesContainer');
const typingMessage = document.getElementById('typingMessage');
const attachmentsContainer = document.getElementById('attachments');
const errorMessage = document.getElementById('errorMessage');
const actionButtons = document.getElementById('actionButtons');
const stopButton = document.getElementById('stopButton');
const regenerateButton = document.getElementById('regenerateButton');
const chatsList = document.getElementById('chatsList');
const newChatBtn = document.getElementById('newChatBtn');
const sidebar = document.getElementById('sidebar');
const menuBtn = document.getElementById('menuBtn');
const loadingOverlay = document.getElementById('loadingOverlay');
const themeToggle = document.getElementById('themeToggle');

// ---- Chat Management ----
function generateChatId() {
  return Date.now().toString() + Math.random().toString(36).substring(2);
}

function generateChatTitle(content, attachments = []) {
  if (attachments.some(att => att.type?.startsWith('image/'))) {
    return '🖼️ Analýza obrázku';
  }
  
  let text = '';
  if (typeof content === 'string') {
    text = content;
  } else if (Array.isArray(content)) {
    const textPart = content.find(p => p.type === 'text');
    text = textPart ? textPart.text : '';
  }
  
  if (text.trim()) {
    return text.trim().substring(0, 30) + (text.length > 30 ? '...' : '');
  }
  
  return 'Nový chat';
}

function createNewChat() {
  const chatId = generateChatId();
  const newChat = {
    id: chatId,
    title: 'Nový chat',
    messages: [],
    createdAt: Date.now()
  };
  
  chats[chatId] = newChat;
  currentChatId = chatId;
  
  clearMessages();
  attachments = [];
  updateAttachments();
  textarea.value = '';
  adjustTextareaHeight();
  sendButton.disabled = true;
  
  updateChatsList();
  saveChats();
  
  return chatId;
}

function switchToChat(chatId) {
  if (currentChatId === chatId) return;
  
  currentChatId = chatId;
  const chat = chats[chatId];
  
  if (chat) {
    clearMessages();
    displayChatHistory(chat.messages);
    updateChatsList();
  }
}

function deleteChat(chatId) {
  if (!confirm(t('app.deleteChatConfirm'))) return;
  
  delete chats[chatId];
  
  if (currentChatId === chatId) {
    const remainingChats = Object.keys(chats);
    if (remainingChats.length > 0) {
      switchToChat(remainingChats[0]);
    } else {
      createNewChat();
    }
  }
  
  updateChatsList();
  saveChats();
}

function updateChatsList() {
  chatsList.innerHTML = '';
  
  const sortedChats = Object.values(chats).sort((a, b) => b.createdAt - a.createdAt);
  
  sortedChats.forEach(chat => {
    const chatItem = document.createElement('div');
    chatItem.className = `chat-item ${chat.id === currentChatId ? 'active' : ''}`;
    chatItem.innerHTML = `
      <div class="chat-title">${chat.title}</div>
      <button class="chat-delete" onclick="event.stopPropagation(); deleteChat('${chat.id}')">
        <i class="fas fa-trash"></i>
      </button>
    `;
    
    chatItem.addEventListener('click', () => switchToChat(chat.id));
    chatsList.appendChild(chatItem);
  });
}

function saveChats() {
  if (currentSettings.saveHistory) {
    localStorage.setItem('chats', JSON.stringify(chats));
    localStorage.setItem('currentChatId', currentChatId);
  }
}

function loadChats() {
  const storedChats = localStorage.getItem('chats');
  const storedCurrentChatId = localStorage.getItem('currentChatId');
  
  if (storedChats) {
    chats = JSON.parse(storedChats);
    currentChatId = storedCurrentChatId;
    
    if (currentChatId && chats[currentChatId]) {
      displayChatHistory(chats[currentChatId].messages);
    }
    
    updateChatsList();
  }
  
  if (Object.keys(chats).length === 0) {
    createNewChat();
  }
}

function clearMessages() {
  const messages = messagesContainer.querySelectorAll('.message:not(.typing-message)');
  messages.forEach((msg, index) => {
    if (index > 0) {
      msg.remove();
    }
  });
}

// ---- Helper Functions ----
function initializeGroq(apiKey) {
  try {
    groq = new Groq({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true
    });
    return true;
  } catch (err) {
    showError('Chyba při inicializaci Groq API: ' + err.message);
    return false;
  }
}

async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.readAsDataURL(file);
    r.onload = () => resolve(r.result);
    r.onerror = reject;
  });
}

function loadSettings() {
  const stored = localStorage.getItem('chatSettings');
  if (stored) {
    currentSettings = { ...currentSettings, ...JSON.parse(stored) };
    updateSettingsForm();
  }
  if (currentSettings.apiKey) initializeGroq(currentSettings.apiKey);
  applyFontSize(currentSettings.fontSize);

  // Load language file
  const langFile = currentSettings.language === 'english' ? 'en' : 'cs';
  loadLanguage(langFile);

  if (currentSettings.saveHistory) {
    loadChats();
  }
}

function saveSettings(settings) {
  const previousLanguage = currentSettings.language;
  currentSettings = { ...currentSettings, ...settings };
  localStorage.setItem('chatSettings', JSON.stringify(currentSettings));
  if (settings.apiKey) initializeGroq(settings.apiKey);
  if (settings.fontSize) applyFontSize(settings.fontSize);
  
  // Handle language change
  if (settings.language && settings.language !== previousLanguage) {
    const langFile = settings.language === 'english' ? 'en' : 'cs';
    loadLanguage(langFile);
  }
  
  if (settings.apiKey && !validateApiKey(settings.apiKey)) {
    showError(t('app.invalidApiKey'));
  }
  
  if (!currentSettings.saveHistory) {
    localStorage.removeItem('chats');
    localStorage.removeItem('currentChatId');
    chats = {};
    createNewChat();
  }
}

function updateSettingsForm() {
  const form = document.getElementById('settingsForm');
  form.apiKey.value = currentSettings.apiKey || '';
  form.model.value = currentSettings.model || 'meta-llama/llama-4-scout-17b-16e-instruct';
  form.temperature.value = currentSettings.temperature ?? 1;
  form.maxTokens.value = currentSettings.maxTokens ?? 1024;
  form.fontSize.value = currentSettings.fontSize || 'normal';
  form.language.value = currentSettings.language || 'czech';
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
  const fontSizeSelect = document.getElementById('fontSizeSelect');
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
  const languageSelect = document.getElementById('languageSelect');
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
  
  // Update modal close button
  const closeSettingsBtn = document.getElementById('closeSettingsBtn');
  if (closeSettingsBtn) closeSettingsBtn.title = t('app.closeSettings');
  
  // Update attachment button
  const attachmentBtn = document.getElementById('attachmentBtn');
  if (attachmentBtn) attachmentBtn.title = t('app.attachFile');
  
  // Update send button
  const sendButton = document.getElementById('sendButton');
  if (sendButton) sendButton.title = t('app.sendMessage');
  
  // Update buttons
  const cancelBtn = document.getElementById('cancelSettingsBtn');
  if (cancelBtn) cancelBtn.textContent = t('app.cancel');
  
  const saveBtn = document.querySelector('#settingsForm .btn-primary');
  if (saveBtn) saveBtn.textContent = t('app.save');
}

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.classList.add('active');
  setTimeout(() => errorMessage.classList.remove('active'), 5000);
}

function validateApiKey(key) {
  // Basic validation for Groq API key format
  return key && key.startsWith('gsk_') && key.length > 20;
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ---- Language System ----
async function loadLanguage(lang) {
  try {
    const response = await fetch(`/${lang}.json`);
    if (!response.ok) {
      throw new Error(`Failed to load ${lang}.json`);
    }
    translations = await response.json();
    currentLanguage = lang;
    updateUILanguage();
  } catch (error) {
    console.error('Error loading language file:', error);
    // Fallback to default language
    if (lang !== 'cs') {
      loadLanguage('cs');
    }
  }
}

function t(key) {
  const keys = key.split('.');
  let value = translations;
  
  for (const k of keys) {
    value = value?.[k];
  }
  
  return value || key;
}

function updateUILanguage() {
  // Update document title
  document.title = t('app.title');
  
  // Update header elements
  const headerTitle = document.querySelector('h1');
  if (headerTitle) headerTitle.innerHTML = `<i class="fas fa-eye"></i> ${t('app.title')}`;
  
  // Update buttons
  const newChatBtn = document.getElementById('newChatBtn');
  if (newChatBtn) newChatBtn.innerHTML = `<i class="fas fa-plus"></i> ${t('app.newChat')}`;
  
  const settingsBtn = document.getElementById('settingsBtn');
  if (settingsBtn) settingsBtn.title = t('app.settings');
  
  const infoBtn = document.getElementById('infoBtn');
  if (infoBtn) infoBtn.title = t('app.info');
  
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) themeToggle.title = t('app.theme');
  
  const menuBtn = document.getElementById('menuBtn');
  if (menuBtn) menuBtn.title = t('app.menu');
  
  // Update send button
  const sendButton = document.getElementById('sendButton');
  if (sendButton) sendButton.title = t('app.send');
  
  // Update action buttons
  const stopButton = document.getElementById('stopButton');
  if (stopButton) stopButton.innerHTML = `<i class="fas fa-stop"></i> ${t('app.stop')}`;
  
  const regenerateButton = document.getElementById('regenerateButton');
  if (regenerateButton) regenerateButton.innerHTML = `<i class="fas fa-redo"></i> ${t('app.regenerate')}`;
  
  // Update composer placeholder
  const composerInput = document.getElementById('composer-input');
  if (composerInput) composerInput.placeholder = t('app.askMe');
  
  // Update suggestion chips
  const suggestionChips = document.querySelectorAll('.suggestion-chip');
  suggestionChips.forEach((chip, index) => {
    const suggestions = [
      'app.analyzeImage',
      'app.whatDoYouSee', 
      'app.describeDetails',
      'app.whatColors',
      'app.identifyObjects'
    ];
    if (suggestions[index]) {
      chip.textContent = t(suggestions[index]);
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
  const commandsHint = document.getElementById('commandsHint');
  if (commandsHint) commandsHint.textContent = t('app.useCommands');
  
  // Update welcome message
  const messages = document.querySelectorAll('.message.assistant .message-text');
  if (messages.length > 0 && messages[0].textContent.includes('Ahoj!')) {
    messages[0].textContent = t('app.welcomeMessage');
  }
  
  // Update typing indicator
  const typingMessage = document.getElementById('typingMessage');
  if (typingMessage) {
    const typingText = typingMessage.querySelector('.typing-indicator');
    if (typingText) typingText.innerHTML = `${t('app.modelWriting')}<div class="typing-dots"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div>`;
  }
  
  // Update install banner
  const installBanner = document.getElementById('installBanner');
  if (installBanner) {
    const bannerText = installBanner.querySelector('.install-banner-text span');
    if (bannerText) bannerText.textContent = t('app.installApp');
    
    const installBtn = document.getElementById('installBtn');
    if (installBtn) installBtn.textContent = t('app.install');
    
    const dismissBtn = document.getElementById('dismissInstallBtn');
    if (dismissBtn) dismissBtn.textContent = t('app.dismiss');
  }
  
  // Update desktop message
  const desktopMessage = document.getElementById('desktopMessage');
  if (desktopMessage) {
    const title = desktopMessage.querySelector('h1');
    if (title) title.textContent = t('app.mobileApp');
    
    const messages = desktopMessage.querySelectorAll('p');
    if (messages[0]) messages[0].textContent = t('app.mobileOnlyMessage');
    if (messages[1]) messages[1].textContent = t('app.openOnMobile');
  }
}

// ---- Theme Management ----
function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  
  // Update theme toggle icon
  const icon = themeToggle.querySelector('i');
  if (newTheme === 'dark') {
    icon.className = 'fas fa-sun';
  } else {
    icon.className = 'fas fa-moon';
  }
}

function loadTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  
  // Set initial icon
  const icon = themeToggle.querySelector('i');
  if (savedTheme === 'dark') {
    icon.className = 'fas fa-sun';
  } else {
    icon.className = 'fas fa-moon';
  }
}

function applyFontSize(size) {
  document.body.classList.remove('font-size-small', 'font-size-normal', 'font-size-big');
  document.body.classList.add(`font-size-${size}`);
}

function getBackoffDelay(retryCount) {
  return Math.min(1000 * Math.pow(2, retryCount), 10000);
}

function addMessage(role, content, atts = []) {
  const el = document.createElement('div');
  el.className = `message ${role}`;
  const avatar = document.createElement('div');
  avatar.className = 'message-avatar';
  avatar.innerHTML = role === 'user' ? '<i class="fas fa-user"></i>' : '<i class="fas fa-robot"></i>';

  const messageContent = document.createElement('div');
  messageContent.className = 'message-content';

  const messageText = document.createElement('div');
  messageText.className = 'message-text';
  messageText.textContent = content;

  messageContent.appendChild(messageText);

  if (atts && atts.length) {
    const attachmentsDiv = document.createElement('div');
    attachmentsDiv.className = 'message-attachments';
    atts.forEach(att => {
      const a = document.createElement('div');
      a.className = 'attachment-preview';
      if (att.type?.startsWith('image/')) {
        const img = document.createElement('img');
        img.src = att.url || att.base64 || '';
        img.alt = att.name || 'image';
        a.appendChild(img);
      } else {
        const icon = document.createElement('i');
        icon.className = 'fas fa-file';
        a.appendChild(icon);
      }
      const name = document.createElement('span');
      name.textContent = att.name || 'soubor';
      a.appendChild(name);
      attachmentsDiv.appendChild(a);
    });
    messageContent.appendChild(attachmentsDiv);
  }

  el.appendChild(avatar);
  el.appendChild(messageContent);
  messagesContainer.insertBefore(el, typingMessage);
  scrollToBottom();
  return el;
}

function updateMessage(el, content) {
  const t = el.querySelector('.message-text');
  t.textContent = content;
  scrollToBottom();
}

function scrollToBottom() { 
  messagesContainer.scrollTop = messagesContainer.scrollHeight; 
}

function showTyping() { 
  typingMessage.classList.add('active'); 
  actionButtons.classList.add('active'); 
  scrollToBottom(); 
}

function hideTyping() { 
  typingMessage.classList.remove('active'); 
  actionButtons.classList.remove('active'); 
}

// ---- Content Handling ----
function contentToDisplayText(content) {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    const text = content.filter(p => p?.type === 'text').map(p => p.text).join('\n').trim();
    return text || '(obrázek)';
  }
  return '';
}

function normalizeContentForApi(msg) {
  const c = msg.content;
  if (typeof c === 'string') return c;

  if (Array.isArray(c)) {
    const parts = [];
    for (const p of c) {
      if (p?.type === 'text' && typeof p.text === 'string') {
        parts.push({ type: 'text', text: p.text });
      } else if (p?.type === 'image_url') {
        const url = p.image_url?.url || '';
        if (typeof url === 'string' && url.startsWith('')) {
          parts.push({ type: 'image_url', image_url: { url } });
        }
      }
    }
    return parts.length ? parts : '';
  }
  return '';
}

function sanitizeHistoryForApi(history) {
  const MAX = 16;
  const safe = history.slice(-MAX).map(m => ({
    role: m.role,
    content: normalizeContentForApi(m)
  }));
  return safe.filter(m => {
    if (typeof m.content === 'string') return m.content.trim().length;
    return Array.isArray(m.content) && m.content.length;
  });
}

async function prepareMessageContent(message, atts) {
  if (!atts.length) return message;
  const content = [];
  if (message.trim()) {
    content.push({ type: 'text', text: message });
  }
  for (const a of atts) {
    if (a.type?.startsWith('image/')) {
      try {
        const base64 = a.base64 || await fileToBase64(a.file);
        content.push({ type: 'image_url', image_url: { url: base64 } });
      } catch (err) {
        console.error('Image process error', err);
        showError(`${t('app.imageProcessingError')}: ${a.name || ''}`);
      }
    }
  }
  return content.length ? content : message;
}

// ---- API Functions ----

async function sendMessage() {
  const message = textarea.value.trim();
  if (!message && !attachments.length) return;

  // Rate limiting
  const now = Date.now();
  if (now - lastSendTime < SEND_COOLDOWN) {
    showError(t('app.waitBeforeSend'));
    return;
  }
  lastSendTime = now;

  if (!groq || !currentSettings.apiKey || !validateApiKey(currentSettings.apiKey)) {
    showError(t('app.invalidApiKeyError'));
    return;
  }

  // Show loading overlay
  loadingOverlay.classList.add('active');
  sendButton.disabled = true;
  regenerateButton.disabled = true;

  if (!currentChatId || !chats[currentChatId]) {
    createNewChat();
  }

  const currentChat = chats[currentChatId];

  const processed = [];
  for (const att of attachments) {
    const a = { ...att };
    if (a.type?.startsWith('image/')) {
      try { 
        a.base64 = a.base64 || await fileToBase64(a.file); 
      }
      catch { 
        showError(`${t('app.imageProcessingError')}: ${a.name}`); 
        loadingOverlay.classList.remove('active');
        sendButton.disabled = false;
        regenerateButton.disabled = false;
        return; 
      }
    }
    processed.push(a);
  }

  addMessage('user', message || '(bez textu)', processed);

  const userContent = await prepareMessageContent(message, processed);
  const userMsg = { role: 'user', content: userContent, attachments: processed.slice() };
  currentChat.messages.push(userMsg);

  if (currentChat.messages.length === 1) {
    currentChat.title = generateChatTitle(userContent, processed);
    updateChatsList();
  }

  textarea.value = '';
  attachments = [];
  updateAttachments();
  adjustTextareaHeight();

  const systemMessage = currentSettings.language === 'english' 
    ? 'You are a helpful AI assistant with vision support. You can analyze images and answer questions in English.'
    : 'Jsi užitečný AI asistent s podporou vision. Můžeš analyzovat obrázky a odpovídat na otázky v češtině.';

  const messages = [
    { role: 'system', content: systemMessage },
    ...sanitizeHistoryForApi(currentChat.messages)
  ];

  showTyping();
  isStreaming = true;
  streamController = new AbortController();
  let assistantMessage = null;
  let fullResponse = '';

  try {
    const streamingEnabled = document.getElementById('streamingToggle').classList.contains('active');

    if (streamingEnabled) {
      let stream;
      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
          stream = await groq.chat.completions.create({
            messages,
            model: currentSettings.model,
            temperature: currentSettings.temperature,
            max_completion_tokens: currentSettings.maxTokens,
            top_p: 1,
            stream: true,
            stop: null
          });
          break; // Success, exit retry loop
        } catch (error) {
          if (error.name === 'AbortError' || attempt === MAX_RETRIES) {
            throw error;
          }
          console.log(`Streaming attempt ${attempt + 1} failed:`, error.message);
          if (attempt < MAX_RETRIES) {
            const backoffDelay = getBackoffDelay(attempt);
            showError(`${t('app.connectionError')} ${Math.round(backoffDelay/1000)}${t('app.seconds')}...`);
            await delay(backoffDelay);
          }
        }
      }

      hideTyping();
      assistantMessage = addMessage('assistant', '');

      for await (const chunk of stream) {
        if (!isStreaming || streamController.signal.aborted) break;
        const delta = chunk.choices?.[0]?.delta?.content;
        if (delta) {
          fullResponse += delta;
          updateMessage(assistantMessage, fullResponse);
        }
      }
    } else {
      let response;
      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
          response = await groq.chat.completions.create({
            messages,
            model: currentSettings.model,
            temperature: currentSettings.temperature,
            max_completion_tokens: currentSettings.maxTokens,
            top_p: 1,
            stream: false,
            stop: null
          });
          break; // Success, exit retry loop
        } catch (error) {
          if (error.name === 'AbortError' || attempt === MAX_RETRIES) {
            throw error;
          }
          console.log(`Non-streaming attempt ${attempt + 1} failed:`, error.message);
          if (attempt < MAX_RETRIES) {
            const backoffDelay = getBackoffDelay(attempt);
            showError(`${t('app.connectionError')} ${Math.round(backoffDelay/1000)}${t('app.seconds')}...`);
            await delay(backoffDelay);
          }
        }
      }
      hideTyping();
      fullResponse = response.choices?.[0]?.message?.content || '';
      assistantMessage = addMessage('assistant', fullResponse);
    }

    if (!streamController.signal.aborted) {
      currentChat.messages.push({ role: 'assistant', content: fullResponse });
      saveChats();
    }
  } catch (err) {
    hideTyping();
    if (err.name === 'AbortError') {
      showError(t('app.requestCancelled'));
    } else {
      showError(t('app.apiCommunicationError') + ': ' + err.message);
    }
    console.error('API Error:', err);
  } finally {
    isStreaming = false;
    streamController = null;
    loadingOverlay.classList.remove('active');
    sendButton.disabled = false;
    regenerateButton.disabled = false;
  }
}

function stopStreaming() {
  isStreaming = false;
  if (streamController) {
    streamController.abort();
    streamController = null;
  }
  hideTyping();
}

async function regenerateResponse() {
  if (!currentChatId || !chats[currentChatId]) return;
  
  const currentChat = chats[currentChatId];
  if (currentChat.messages.length < 2) return;
  
  currentChat.messages.pop();

  const lastUser = currentChat.messages[currentChat.messages.length - 1];

  const msgs = messagesContainer.querySelectorAll('.message:not(.typing-message)');
  if (msgs.length > 1) msgs[msgs.length - 1].remove();

  attachments = lastUser.attachments ? lastUser.attachments.slice() : [];
  updateAttachments();

  let textContent = '';
  if (typeof lastUser.content === 'string') {
    textContent = lastUser.content;
  } else if (Array.isArray(lastUser.content)) {
    const t = lastUser.content.find(p => p.type === 'text');
    textContent = t ? t.text : '';
  }
  textarea.value = textContent;
  adjustTextareaHeight();
  sendButton.disabled = !textContent.trim() && !attachments.length;

  currentChat.messages.pop();
  await sendMessage();
}

function adjustTextareaHeight() {
  textarea.style.height = 'auto';
  textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
}

function handleFiles(files) {
  Array.from(files).forEach(file => {
    if (file.size > 5*1024*1024) { 
      showError(`${t('app.fileTooLarge')} (${file.name})`); 
      return; 
    }
    const att = {
      id: Date.now() + Math.random(),
      name: file.name,
      size: file.size,
      type: file.type,
      file
    };
    if (file.type.startsWith('image/')) att.url = URL.createObjectURL(file);
    attachments.push(att);
  });
  updateAttachments();
  sendButton.disabled = textarea.value.trim() === '' && attachments.length === 0;
}

function updateAttachments() {
  attachmentsContainer.innerHTML = '';
  if (!attachments.length) { 
    attachmentsContainer.classList.remove('has-files'); 
    return; 
  }
  attachmentsContainer.classList.add('has-files');
  attachments.forEach(att => {
    const chip = document.createElement('div');
    
    if (att.type?.startsWith('image/')) {
      chip.className = 'attachment-chip image-chip';
      chip.innerHTML = `
        <img src="${att.url || ''}" alt="${att.name}" class="attachment-thumbnail">
        <button class="attachment-remove" aria-label="${t('app.removeAttachment') || 'Odebrat přílohu'}" data-id="${att.id}">×</button>
      `;
    } else {
      chip.className = 'attachment-chip';
      chip.innerHTML = `📄 ${att.name} <button class="attachment-remove" aria-label="${t('app.removeAttachment') || 'Odebrat přílohu'}" data-id="${att.id}">×</button>`;
    }
    
    attachmentsContainer.appendChild(chip);
  });
}

function removeAttachment(id) {
  const idx = attachments.findIndex(a => a.id == id);
  if (idx > -1) {
    const a = attachments[idx];
    if (a.url) URL.revokeObjectURL(a.url);
    attachments.splice(idx, 1);
    updateAttachments();
    sendButton.disabled = textarea.value.trim() === '' && attachments.length === 0;
  }
}

function displayChatHistory(messages = []) {
  const toRemove = Array.from(messagesContainer.querySelectorAll('.message:not(.typing-message)')).slice(1);
  toRemove.forEach(el => el.remove());

  messages.forEach(msg => {
    if (msg.role === 'system') return;
    const text = contentToDisplayText(msg.content);
    addMessage(msg.role === 'user' ? 'user' : 'assistant', text, msg.attachments);
  });
}

// Make functions globally available
window.deleteChat = deleteChat;

// ---- Event Listeners ----
textarea.addEventListener('input', function() {
  adjustTextareaHeight();
  sendButton.disabled = this.value.trim() === '' && attachments.length === 0;
  charCounter.textContent = `${this.value.length} / 4000`;
  const hint = document.getElementById('commandsHint');
  if (this.value === '/') hint.classList.add('active'); 
  else hint.classList.remove('active');
});

textarea.addEventListener('keydown', function(e) {
  if (e.key === 'Enter') {
    if (enterToSend && !e.shiftKey) {
      e.preventDefault();
      if (!sendButton.disabled) sendMessage();
    }
  }
});

sendButton.addEventListener('click', sendMessage);
stopButton.addEventListener('click', stopStreaming);
regenerateButton.addEventListener('click', regenerateResponse);
newChatBtn.addEventListener('click', createNewChat);
menuBtn.addEventListener('click', () => {
  sidebar.classList.toggle('hidden');
});
themeToggle.addEventListener('click', toggleTheme);

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

// Attachment menu handling
const attachmentBtn = document.getElementById('attachmentBtn');
const attachmentMenu = document.getElementById('attachmentMenu');
const fileInput = document.getElementById('fileInput');
const imageInput = document.getElementById('imageInput');
const cameraInput = document.getElementById('cameraInput');

attachmentBtn.addEventListener('click', function() {
  const open = attachmentMenu.classList.contains('active');
  attachmentMenu.classList.toggle('active');
  this.setAttribute('aria-expanded', String(!open));
});

document.addEventListener('click', function(e) {
  if (!attachmentBtn.contains(e.target) && !attachmentMenu.contains(e.target)) {
    attachmentMenu.classList.remove('active');
    attachmentBtn.setAttribute('aria-expanded', 'false');
  }
});

attachmentMenu.addEventListener('click', function(e) {
  const item = e.target.closest('.attachment-menu-item');
  if (!item) return;
  const type = item.dataset.type;
  if (type === 'image') imageInput.click();
  if (type === 'file') fileInput.click();
  if (type === 'camera') cameraInput.click();
  attachmentMenu.classList.remove('active');
  attachmentBtn.setAttribute('aria-expanded', 'false');
});

fileInput.addEventListener('change', e => {
  if (e.target.files.length) { 
    handleFiles(e.target.files); 
    e.target.value = ''; 
  }
});
imageInput.addEventListener('change', e => {
  if (e.target.files.length) { 
    handleFiles(e.target.files); 
    e.target.value = ''; 
  }
});
cameraInput.addEventListener('change', e => {
  if (e.target.files.length) { 
    handleFiles(e.target.files); 
    e.target.value = ''; 
  }
});

attachmentsContainer.addEventListener('click', e => {
  if (e.target.classList.contains('attachment-remove')) {
    removeAttachment(e.target.dataset.id);
  }
});

document.querySelector('.suggestion-chips').addEventListener('click', e => {
  const chip = e.target.closest('.suggestion-chip');
  if (!chip) return;
  const text = chip.dataset.text || chip.textContent;
  textarea.value = text;
  adjustTextareaHeight();
  sendButton.disabled = attachments.length === 0 && !text.trim();
  textarea.focus();
});

// Settings modal
const settingsBtn = document.getElementById('settingsBtn');
const settingsModal = document.getElementById('settingsModal');
const closeSettingsBtn = document.getElementById('closeSettingsBtn');
const cancelSettingsBtn = document.getElementById('cancelSettingsBtn');
const settingsForm = document.getElementById('settingsForm');

function openSettings() { 
  updateSettingsForm(); 
  settingsModal.setAttribute('aria-hidden', 'false'); 
  settingsModal.classList.add('active'); 
  document.body.style.overflow = 'hidden'; 
}

function closeSettings() { 
  settingsModal.setAttribute('aria-hidden', 'true'); 
  settingsModal.classList.remove('active'); 
  document.body.style.overflow = ''; 
}

settingsBtn.addEventListener('click', openSettings);
closeSettingsBtn.addEventListener('click', closeSettings);
cancelSettingsBtn.addEventListener('click', closeSettings);

settingsModal.addEventListener('click', function(e) {
  if (e.target === this) closeSettings();
});

settingsForm.addEventListener('submit', function(e) {
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
  saveSettings(settings);
  closeSettings();
  showError(t('app.settingsSaved'));
});

// Drag & Drop
let dragCounter = 0;

document.addEventListener('dragenter', function(e) {
  e.preventDefault();
  dragCounter++;
  if (dragCounter === 1) {
    document.getElementById('dragOverlay').classList.add('active');
  }
});

document.addEventListener('dragover', function(e) {
  e.preventDefault();
});

document.addEventListener('dragleave', function(e) {
  dragCounter--;
  if (dragCounter === 0) {
    document.getElementById('dragOverlay').classList.remove('active');
  }
});

document.addEventListener('drop', function(e) {
  e.preventDefault();
  dragCounter = 0;
  document.getElementById('dragOverlay').classList.remove('active');
  
  if (e.dataTransfer.files.length) {
    handleFiles(e.dataTransfer.files);
  }
});

// ---- Initialize ----
loadSettings();
loadTheme();
adjustTextareaHeight();

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('Service Worker registered successfully:', registration);
      })
      .catch(error => {
        console.log('Service Worker registration failed:', error);
      });
  });
}

// ---- PWA Install Prompt ----
let deferredPrompt;
let installBanner = document.getElementById('installBanner');
let installBtn = document.getElementById('installBtn');
let dismissInstallBtn = document.getElementById('dismissInstallBtn');

// Listen for the beforeinstallprompt event
window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent the mini-infobar from appearing on mobile
  e.preventDefault();
  // Stash the event so it can be triggered later
  deferredPrompt = e;
  // Show the install banner
  showInstallBanner();
});

// Listen for the appinstalled event
window.addEventListener('appinstalled', (e) => {
  console.log('PWA was installed');
  // Hide the install banner
  hideInstallBanner();
  // Clear the deferred prompt
  deferredPrompt = null;
});

function showInstallBanner() {
  // Check if banner is already dismissed for this session
  if (localStorage.getItem('installBannerDismissed')) {
    return;
  }
  
  installBanner.style.display = 'block';
}

function hideInstallBanner() {
  installBanner.style.display = 'none';
}

function handleInstall() {
  // Hide the banner
  hideInstallBanner();
  
  // Show the install prompt
  if (deferredPrompt) {
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      // Clear the deferred prompt
      deferredPrompt = null;
    });
  }
}

function dismissInstallBanner() {
  hideInstallBanner();
  // Remember that user dismissed it for this session
  localStorage.setItem('installBannerDismissed', 'true');
}

// Event listeners for install banner buttons
installBtn.addEventListener('click', handleInstall);
dismissInstallBtn.addEventListener('click', dismissInstallBanner);
