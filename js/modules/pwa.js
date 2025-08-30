// ---- PWA Functionality ----
import { t } from './i18n.js';

let deferredPrompt;

export function registerServiceWorker() {
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
}

export function setupInstallPrompt() {
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
}

export function showInstallBanner() {
  // Check if banner is already dismissed for this session
  if (localStorage.getItem('installBannerDismissed')) {
    return;
  }

  const installBanner = document.getElementById('installBanner');
  if (installBanner) {
    installBanner.style.display = 'block';
  }
}

export function hideInstallBanner() {
  const installBanner = document.getElementById('installBanner');
  if (installBanner) {
    installBanner.style.display = 'none';
  }
}

export function handleInstall() {
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

export function dismissInstallBanner() {
  hideInstallBanner();
  // Remember that user dismissed it for this session
  localStorage.setItem('installBannerDismissed', 'true');
}

export function setupInstallEventListeners() {
  const installBtn = document.getElementById('installBtn');
  const dismissInstallBtn = document.getElementById('dismissInstallBtn');

  if (installBtn) {
    installBtn.addEventListener('click', handleInstall);
  }
  if (dismissInstallBtn) {
    dismissInstallBtn.addEventListener('click', dismissInstallBanner);
  }
}