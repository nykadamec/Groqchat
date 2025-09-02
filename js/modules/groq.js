// ---- Groq API Integration ----
import { API_CONFIG } from './config.js';
import { t } from './i18n.js';

let groq = null;

export async function initializeGroq(apiKey) {
  if (!apiKey) return false;

  try {
    // Dynamic import for Groq SDK
    const { Groq } = await import(API_CONFIG.groqSdkUrl);
    groq = new Groq({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true
    });
    return true;
  } catch (err) {
    console.error('Chyba při inicializaci Groq API:', err.message);
    return false;
  }
}

export function getGroqInstance() {
  return groq;
}

export function validateApiKey(key) {
  try {
    // Enhanced validation for Groq API key format
    if (!key || typeof key !== 'string') {
      return { isValid: false, error: 'API klíč musí být textový řetězec' };
    }
    
    const trimmedKey = key.trim();
    
    // Check basic format
    if (!trimmedKey.startsWith('gsk_')) {
      return { isValid: false, error: 'API klíč musí začínat "gsk_"' };
    }
    
    // Check length (Groq keys are typically 50+ characters)
    if (trimmedKey.length < 50) {
      return { isValid: false, error: 'API klíč je příliš krátký' };
    }
    
    // Check for valid characters (alphanumeric + underscore)
    const validChars = /^[a-zA-Z0-9_]+$/;
    if (!validChars.test(trimmedKey)) {
      return { isValid: false, error: 'API klíč obsahuje neplatné znaky' };
    }
    
    return { isValid: true, error: null };
  } catch (error) {
    console.error('Error validating API key:', error);
    return { isValid: false, error: 'Chyba při validaci API klíče' };
  }
}

// Simple legacy validation for backward compatibility
export function isValidApiKey(key) {
  const result = validateApiKey(key);
  return result.isValid;
}

export function showError(message) {
  const errorElement = document.getElementById('errorMessage');
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.classList.add('active');
    setTimeout(() => errorElement.classList.remove('active'), 5000);
  }
}