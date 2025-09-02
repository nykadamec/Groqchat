// ---- Application Loading System ----
import { t } from './i18n.js';

let loadingOverlay = null;
let loadingStatus = null;
let progressBar = null;
let currentProgress = 0;

// Loading steps with their descriptions
const LOADING_STEPS = {
  'init': { progress: 10, key: 'app.loadingInit' },
  'settings': { progress: 25, key: 'app.loadingSettings' },
  'language': { progress: 40, key: 'app.loadingLanguage' },
  'api': { progress: 55, key: 'app.loadingAPI' },
  'ui': { progress: 70, key: 'app.loadingUI' },
  'pwa': { progress: 85, key: 'app.loadingPWA' },
  'complete': { progress: 100, key: 'app.loadingComplete' }
};

// Initialize loading system
export function initLoading() {
  try {
    loadingOverlay = document.getElementById('appLoadingOverlay');
    loadingStatus = document.getElementById('loadingStatus');
    progressBar = document.getElementById('loadingProgressBar');
    
    if (!loadingOverlay || !loadingStatus || !progressBar) {
      console.warn('Loading elements not found in DOM');
      return false;
    }
    
    // Show loading overlay
    loadingOverlay.classList.remove('hidden');
    currentProgress = 0;
    updateProgress(0);
    
    return true;
  } catch (error) {
    console.error('Error initializing loading system:', error);
    return false;
  }
}

// Update loading progress
export function updateLoadingStep(stepKey) {
  try {
    if (!loadingOverlay || !loadingStatus || !progressBar) {
      return;
    }
    
    const step = LOADING_STEPS[stepKey];
    if (!step) {
      console.warn(`Unknown loading step: ${stepKey}`);
      return;
    }
    
    // Update progress bar
    currentProgress = step.progress;
    updateProgress(step.progress);
    
    // Update status text
    const statusText = t(step.key) || getDefaultStatusText(stepKey);
    loadingStatus.textContent = statusText;
    
    // Auto-hide when complete
    if (stepKey === 'complete') {
      setTimeout(() => {
        hideLoading();
      }, 800);
    }
  } catch (error) {
    console.error('Error updating loading step:', error);
  }
}

// Update progress bar
function updateProgress(percentage) {
  if (progressBar) {
    progressBar.style.width = `${percentage}%`;
  }
}

// Hide loading overlay
export function hideLoading() {
  try {
    if (loadingOverlay) {
      loadingOverlay.classList.add('hidden');
      
      // Remove from DOM after animation
      setTimeout(() => {
        if (loadingOverlay && loadingOverlay.parentNode) {
          loadingOverlay.style.display = 'none';
        }
      }, 500);
    }
  } catch (error) {
    console.error('Error hiding loading overlay:', error);
  }
}

// Show loading overlay (for manual control)
export function showLoading() {
  try {
    if (loadingOverlay) {
      loadingOverlay.style.display = 'flex';
      loadingOverlay.classList.remove('hidden');
    }
  } catch (error) {
    console.error('Error showing loading overlay:', error);
  }
}

// Get default status text if translation is not available
function getDefaultStatusText(stepKey) {
  const defaults = {
    'init': 'Inicializuji aplikaci...',
    'settings': 'Načítám nastavení...',
    'language': 'Načítám jazykové soubory...',
    'api': 'Připojuji k API...',
    'ui': 'Připravuji uživatelské rozhraní...',
    'pwa': 'Registruji Service Worker...',
    'complete': 'Aplikace je připravena!'
  };
  
  return defaults[stepKey] || 'Načítám...';
}

// Simulate loading step delay (for development/testing)
export function simulateLoadingDelay(ms = 500) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Error handling for loading system
export function handleLoadingError(error, stepKey = 'unknown') {
  console.error(`Loading error at step ${stepKey}:`, error);
  
  if (loadingStatus) {
    loadingStatus.textContent = `Chyba při načítání: ${error.message}`;
    loadingStatus.style.color = '#ff6b6b';
  }
  
  // Hide loading after error
  setTimeout(() => {
    hideLoading();
  }, 3000);
}

// Check if loading system is active
export function isLoading() {
  return loadingOverlay && !loadingOverlay.classList.contains('hidden');
}

// Get current progress
export function getCurrentProgress() {
  return currentProgress;
}