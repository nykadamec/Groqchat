// ---- Chat Management ----
import { MAX_RETRIES, SEND_COOLDOWN } from './config.js';
import { t } from './i18n.js';
import { getGroqInstance, showError, validateApiKey } from './groq.js';
import { getCurrentSettings } from './settings.js';

let chats = {};
let currentChatId = null;
let attachments = [];
let isStreaming = false;
let streamController = null;
let lastSendTime = 0;

export function getCurrentChatId() {
  return currentChatId;
}

export function getChats() {
  return { ...chats };
}

export function getAttachments() {
  return [...attachments];
}

export function setAttachments(newAttachments) {
  attachments = [...newAttachments];
}

export function generateChatId() {
  return Date.now().toString() + Math.random().toString(36).substring(2);
}

export function generateChatTitle(content, attachments = []) {
  if (attachments.some(att => att.type?.startsWith('image/'))) {
    return t('app.analyzingImage');
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

  return t('app.newChatTitle');
}

export function createNewChat() {
  const chatId = generateChatId();
  const newChat = {
    id: chatId,
    title: t('app.newChatTitle'),
    messages: [],
    createdAt: Date.now()
  };

  chats[chatId] = newChat;
  currentChatId = chatId;

  clearMessages();
  attachments = [];
  updateAttachments();
  const textarea = document.getElementById('composer-input');
  if (textarea) {
    textarea.value = '';
    adjustTextareaHeight();
  }
  const sendButton = document.getElementById('sendButton');
  if (sendButton) sendButton.disabled = true;

  updateChatsList();
  saveChats();

  return chatId;
}

export function switchToChat(chatId) {
  if (currentChatId === chatId) return;

  currentChatId = chatId;
  const chat = chats[chatId];

  if (chat) {
    clearMessages();
    displayChatHistory(chat.messages);
    updateChatsList();
  }
}

export function deleteChat(chatId) {
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

export function updateChatsList() {
  const chatsList = document.getElementById('chatsList');
  if (!chatsList) return;

  chatsList.innerHTML = '';

  const sortedChats = Object.values(chats).sort((a, b) => b.createdAt - a.createdAt);

  sortedChats.forEach(chat => {
    const chatItem = document.createElement('div');
    chatItem.className = `chat-item ${chat.id === currentChatId ? 'active' : ''}`;
    chatItem.innerHTML = `
      <div class="chat-title">${chat.title}</div>
      <button class="chat-delete" onclick="event.stopPropagation(); window.chatModule.deleteChat('${chat.id}')">
        <i class="fas fa-trash"></i>
      </button>
    `;

    chatItem.addEventListener('click', () => switchToChat(chat.id));
    chatsList.appendChild(chatItem);
  });
}

export function saveChats() {
  const settings = getCurrentSettings();
  if (settings.saveHistory) {
    localStorage.setItem('chats', JSON.stringify(chats));
    localStorage.setItem('currentChatId', currentChatId);
  }
}

export function loadChats() {
  const settings = getCurrentSettings();
  if (!settings.saveHistory) return;

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

export function clearMessages() {
  const messagesContainer = document.getElementById('messagesContainer');
  if (!messagesContainer) return;

  const messages = messagesContainer.querySelectorAll('.message:not(.typing-message)');
  messages.forEach((msg, index) => {
    if (index > 0) {
      msg.remove();
    }
  });
}

export function addMessage(role, content, atts = []) {
  const messagesContainer = document.getElementById('messagesContainer');
  if (!messagesContainer) return null;

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
  const typingMessage = document.getElementById('typingMessage');
  if (typingMessage) {
    messagesContainer.insertBefore(el, typingMessage);
  }
  scrollToBottom();
  return el;
}

export function updateMessage(el, content) {
  if (!el) return;
  const t = el.querySelector('.message-text');
  if (t) {
    t.textContent = content;
    scrollToBottom();
  }
}

export function scrollToBottom() {
  const messagesContainer = document.getElementById('messagesContainer');
  if (messagesContainer) {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }
}

export function showTyping() {
  const typingMessage = document.getElementById('typingMessage');
  const actionButtons = document.getElementById('actionButtons');
  if (typingMessage) typingMessage.classList.add('active');
  if (actionButtons) actionButtons.classList.add('active');
  scrollToBottom();
}

export function hideTyping() {
  const typingMessage = document.getElementById('typingMessage');
  const actionButtons = document.getElementById('actionButtons');
  if (typingMessage) typingMessage.classList.remove('active');
  if (actionButtons) actionButtons.classList.remove('active');
}

export function adjustTextareaHeight() {
  const textarea = document.getElementById('composer-input');
  if (!textarea) return;

  textarea.style.height = 'auto';
  textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
}

export function handleFiles(files) {
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
  const sendButton = document.getElementById('sendButton');
  if (sendButton) {
    sendButton.disabled = document.getElementById('composer-input')?.value.trim() === '' && attachments.length === 0;
  }
}

export function updateAttachments() {
  const attachmentsContainer = document.getElementById('attachments');
  if (!attachmentsContainer) return;

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

export function removeAttachment(id) {
  const idx = attachments.findIndex(a => a.id == id);
  if (idx > -1) {
    const a = attachments[idx];
    if (a.url) URL.revokeObjectURL(a.url);
    attachments.splice(idx, 1);
    updateAttachments();
    const sendButton = document.getElementById('sendButton');
    const textarea = document.getElementById('composer-input');
    if (sendButton) {
      sendButton.disabled = textarea?.value.trim() === '' && attachments.length === 0;
    }
  }
}

export function displayChatHistory(messages = []) {
  const messagesContainer = document.getElementById('messagesContainer');
  if (!messagesContainer) return;

  const toRemove = Array.from(messagesContainer.querySelectorAll('.message:not(.typing-message)')).slice(1);
  toRemove.forEach(el => el.remove());

  messages.forEach(msg => {
    if (msg.role === 'system') return;
    const text = contentToDisplayText(msg.content);
    addMessage(msg.role === 'user' ? 'user' : 'assistant', text, msg.attachments);
  });
}

export function contentToDisplayText(content) {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    const text = content.filter(p => p?.type === 'text').map(p => p.text).join('\n').trim();
    return text || '(obrázek)';
  }
  return '';
}

export function stopStreaming() {
  isStreaming = false;
  if (streamController) {
    streamController.abort();
    streamController = null;
  }
  hideTyping();
}

export function getBackoffDelay(retryCount) {
  return Math.min(1000 * Math.pow(2, retryCount), 10000);
}

export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ---- Helper Functions ----
async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.readAsDataURL(file);
    r.onload = () => resolve(r.result);
    r.onerror = reject;
  });
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

function postProcessResponse(response, language) {
  if (!response || typeof response !== 'string') return response;

  // If response is already in the correct language, return as-is
  if (language === 'english' && /^[a-zA-Z\s\.,!?;:'"()-]+$/.test(response.trim())) {
    return response;
  }
  if (language === 'czech' && /[áéíóúýčďěňřšťžÁÉÍÓÚÝČĎĚŇŘŠŤŽ]/.test(response) || /^[a-zA-Z\s\.,!?;:'"()-čďěňřšťžČĎĚŇŘŠŤŽáéíóúýÁÉÍÓÚÝ]+$/.test(response.trim())) {
    return response;
  }

  // For now, return the response as-is since Groq should follow the system prompt
  // In the future, you could add translation logic here if needed
  return response;
}

// ---- Main Chat Functions ----
export async function sendMessage() {
  const textarea = document.getElementById('composer-input');
  const message = textarea ? textarea.value.trim() : '';
  if (!message && !attachments.length) return;

  // Rate limiting
  const now = Date.now();
  if (now - lastSendTime < SEND_COOLDOWN) {
    showError(t('app.waitBeforeSend'));
    return;
  }
  lastSendTime = now;

  const groq = getGroqInstance();
  const settings = getCurrentSettings();
  if (!groq || !settings.apiKey || !validateApiKey(settings.apiKey)) {
    showError(t('app.invalidApiKeyError'));
    return;
  }

  // Show loading overlay
  const loadingOverlay = document.getElementById('loadingOverlay');
  const sendButton = document.getElementById('sendButton');
  const regenerateButton = document.getElementById('regenerateButton');
  if (loadingOverlay) loadingOverlay.classList.add('active');
  if (sendButton) sendButton.disabled = true;
  if (regenerateButton) regenerateButton.disabled = true;

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
        if (loadingOverlay) loadingOverlay.classList.remove('active');
        if (sendButton) sendButton.disabled = false;
        if (regenerateButton) regenerateButton.disabled = false;
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

  if (textarea) textarea.value = '';
  attachments = [];
  updateAttachments();
  adjustTextareaHeight();

  const systemMessage = settings.language === 'english'
    ? 'You are a helpful AI assistant with vision support. You MUST respond ONLY in English, regardless of the user\'s input language. You can analyze images and answer questions in English.'
    : 'Jsi užitečný AI asistent s podporou vision. MUSÍŠ odpovídat VÝHRADNĚ v češtině, bez ohledu na jazyk vstupu uživatele. Můžeš analyzovat obrázky a odpovídat na otázky v češtině.';

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
    const streamingToggle = document.getElementById('streamingToggle');
    const streamingEnabled = streamingToggle ? streamingToggle.classList.contains('active') : false;

    if (streamingEnabled) {
      let stream;
      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
          stream = await groq.chat.completions.create({
            messages,
            model: settings.model,
            temperature: settings.temperature,
            max_completion_tokens: settings.maxTokens,
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
            model: settings.model,
            temperature: settings.temperature,
            max_completion_tokens: settings.maxTokens,
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
      // Post-process response based on language setting
      fullResponse = postProcessResponse(fullResponse, settings.language);
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
    if (loadingOverlay) loadingOverlay.classList.remove('active');
    if (sendButton) sendButton.disabled = false;
    if (regenerateButton) regenerateButton.disabled = false;
  }
}

export async function regenerateResponse() {
  if (!currentChatId || !chats[currentChatId]) return;

  const currentChat = chats[currentChatId];
  if (currentChat.messages.length < 2) return;

  currentChat.messages.pop();

  const lastUser = currentChat.messages[currentChat.messages.length - 1];

  const messagesContainer = document.getElementById('messagesContainer');
  if (messagesContainer) {
    const msgs = messagesContainer.querySelectorAll('.message:not(.typing-message)');
    if (msgs.length > 1) msgs[msgs.length - 1].remove();
  }

  attachments = lastUser.attachments ? lastUser.attachments.slice() : [];
  updateAttachments();

  let textContent = '';
  if (typeof lastUser.content === 'string') {
    textContent = lastUser.content;
  } else if (Array.isArray(lastUser.content)) {
    const t = lastUser.content.find(p => p.type === 'text');
    textContent = t ? t.text : '';
  }

  const textarea = document.getElementById('composer-input');
  if (textarea) {
    textarea.value = textContent;
    adjustTextareaHeight();
  }

  const sendButton = document.getElementById('sendButton');
  if (sendButton) {
    sendButton.disabled = !textContent.trim() && !attachments.length;
  }

  currentChat.messages.pop();
  await sendMessage();
}