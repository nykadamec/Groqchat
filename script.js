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

let currentSettings = {
  apiKey: '',
  model: 'meta-llama/llama-4-scout-17b-16e-instruct',
  temperature: 0.7,
  maxTokens: 2048,
  saveHistory: true
};

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
const sidebarToggle = document.getElementById('sidebarToggle');

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
  if (!confirm('Opravdu chcete smazat tento chat?')) return;
  
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
    groq = new Groq({ apiKey, dangerouslyAllowBrowser: true });
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

  if (currentSettings.saveHistory) {
    loadChats();
  }
}

function saveSettings(settings) {
  currentSettings = { ...currentSettings, ...settings };
  localStorage.setItem('chatSettings', JSON.stringify(currentSettings));
  if (settings.apiKey) initializeGroq(settings.apiKey);
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
  form.temperature.value = currentSettings.temperature ?? 0.7;
  form.maxTokens.value = currentSettings.maxTokens ?? 2048;
  form.history.checked = currentSettings.saveHistory !== false;
}

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.classList.add('active');
  setTimeout(() => errorMessage.classList.remove('active'), 5000);
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
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
        showError(`Chyba při zpracování obrázku: ${a.name || ''}`);
      }
    }
  }
  return content.length ? content : message;
}

// ---- API Functions ----
async function sendMessageWithRetry(messages, isStreaming, signal) {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentSettings.apiKey}`
        },
        body: JSON.stringify({
          messages,
          model: currentSettings.model,
          temperature: currentSettings.temperature,
          max_completion_tokens: currentSettings.maxTokens,
          top_p: 1,
          stream: isStreaming,
          stop: null
        }),
        signal
      });

      if (response.ok) {
        retryCount = 0;
        return response;
      }

      if (response.status === 429 || response.status >= 500) {
        if (attempt < MAX_RETRIES) {
          const backoffDelay = getBackoffDelay(attempt);
          console.log(`Attempt ${attempt + 1} failed with status ${response.status}, retrying in ${backoffDelay}ms`);
          showError(`Příliš mnoho požadavků, zkouším znovu za ${Math.round(backoffDelay/1000)}s...`);
          await delay(backoffDelay);
          continue;
        }
      }

      let detail = '';
      try {
        const e = await response.json();
        detail = e?.error?.message || '';
      } catch {}
      throw new Error(detail || `HTTP ${response.status}: Request failed`);

    } catch (error) {
      if (error.name === 'AbortError') {
        throw error;
      }

      if (attempt === MAX_RETRIES) {
        throw error;
      }

      console.log(`Attempt ${attempt + 1} failed:`, error.message);
      if (attempt < MAX_RETRIES) {
        const backoffDelay = getBackoffDelay(attempt);
        await delay(backoffDelay);
      }
    }
  }
}

async function sendMessage() {
  const message = textarea.value.trim();
  if (!message && !attachments.length) return;

  if (!groq || !currentSettings.apiKey) {
    showError('Prosím nastavte API klíč v nastavení');
    return;
  }

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
        showError(`Chyba při zpracování obrázku: ${a.name}`); 
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
  sendButton.disabled = true;

  const messages = [
    { role: 'system', content: 'Jsi užitečný AI asistent s podporou vision. Můžeš analyzovat obrázky a odpovídat na otázky v češtině.' },
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
      const response = await sendMessageWithRetry(messages, true, streamController.signal);
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      hideTyping();
      assistantMessage = addMessage('assistant', '');

      while (isStreaming && !streamController.signal.aborted) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (!line.startsWith(' ')) continue;
          const data = line.slice(6).trim();
          if (!data) continue;
          if (data === '[DONE]') { isStreaming = false; break; }
          try {
            const json = JSON.parse(data);
            const delta = json.choices?.[0]?.delta?.content;
            if (delta) {
              fullResponse += delta;
              updateMessage(assistantMessage, fullResponse);
            }
          } catch { /* ignore */ }
        }
      }
    } else {
      const response = await groq.chat.completions.create({
        messages,
        model: currentSettings.model,
        temperature: currentSettings.temperature,
        max_completion_tokens: currentSettings.maxTokens,
        stream: false,
        signal: streamController.signal
      });
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
      showError('Požadavek byl zrušen');
    } else {
      showError('Chyba při komunikaci s API: ' + err.message);
    }
    console.error('API Error:', err);
  } finally {
    isStreaming = false;
    streamController = null;
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
    if (file.size > 10*1024*1024) { 
      showError(`Soubor ${file.name} je příliš velký (max 10MB)`); 
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
        <button class="attachment-remove" aria-label="Odebrat přílohu" data-id="${att.id}">×</button>
      `;
    } else {
      chip.className = 'attachment-chip';
      chip.innerHTML = `📄 ${att.name} <button class="attachment-remove" aria-label="Odebrat přílohu" data-id="${att.id}">×</button>`;
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
sidebarToggle.addEventListener('click', () => {
  sidebar.classList.toggle('hidden');
});

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
    saveHistory: formData.get('history') === 'on'
  };
  saveSettings(settings);
  closeSettings();
  showError('Nastavení uloženo');
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
adjustTextareaHeight();
