// ---- Configuration and Constants ----
export const MAX_RETRIES = 3;
export const SEND_COOLDOWN = 1000; // 1 second between sends

export const DEFAULT_SETTINGS = {
  apiKey: '',
  model: 'meta-llama/llama-4-scout-17b-16e-instruct',
  temperature: 1,
  maxTokens: 1024,
  fontSize: 'normal',
  language: 'czech',
  saveHistory: true
};

export const API_CONFIG = {
  groqSdkUrl: 'https://cdn.skypack.dev/groq-sdk@0.30.0'
};