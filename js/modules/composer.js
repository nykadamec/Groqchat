// ---- Composer UI Management ----
import { handleFiles, removeAttachment, adjustTextareaHeight, updateAttachments, getAttachments } from './chat.js';
import { t } from './i18n.js';
import { logger } from './logger.js';

// Progress tracking for image uploads
let uploadProgress = 0;
let isUploading = false;

// Update image preview display
export function updateImagePreview() {
  try {
    const attachments = getAttachments();
    const previewArea = document.getElementById('attachments');

    if (!previewArea) return;

    // Clear existing previews
    previewArea.innerHTML = '';

    // Check if we have any attachments
    if (attachments.length === 0) {
      previewArea.classList.remove('active');
      return;
    }

    // Show the preview area
    previewArea.classList.add('active');

  // Create preview elements for each attachment
  attachments.forEach(async (attachment) => {
    if (attachment.type?.startsWith('image/')) {
      const previewItem = document.createElement('div');
      previewItem.className = 'image-preview-item';

      const img = document.createElement('img');

      // For mobile devices, prefer base64 over blob URL for better compatibility
      if (attachment.base64) {
        img.src = attachment.base64;
      } else if (attachment.url) {
        img.src = attachment.url;
      } else if (attachment.file) {
        // Convert to base64 for mobile compatibility
        try {
          const base64 = await fileToBase64(attachment.file);
          attachment.base64 = base64; // Store for future use
          img.src = base64;
        } catch (error) {
          console.error('Error converting file to base64:', error);
          img.src = attachment.url || '';
        }
      }

      img.alt = attachment.name || 'Image Preview';
      img.style.maxWidth = '100%';
      img.style.maxHeight = '100%';
      img.style.objectFit = 'cover';

      const removeBtn = document.createElement('button');
      removeBtn.className = 'image-preview-remove';
      removeBtn.innerHTML = '<i class="fas fa-times"></i>';
      removeBtn.dataset.id = attachment.id;
      removeBtn.setAttribute('aria-label', t('app.removeAttachment') || 'Remove attachment');

      previewItem.appendChild(img);
      previewItem.appendChild(removeBtn);
      previewArea.appendChild(previewItem);
    } else {
      // For non-image files, create a file chip
      const fileChip = document.createElement('div');
      fileChip.className = 'image-preview-item file-preview-item';

      const icon = document.createElement('i');
      icon.className = 'fas fa-file fa-2x';

      const name = document.createElement('span');
      name.textContent = attachment.name || 'File';
      name.className = 'file-name';

      const removeBtn = document.createElement('button');
      removeBtn.className = 'image-preview-remove';
      removeBtn.innerHTML = '<i class="fas fa-times"></i>';
      removeBtn.dataset.id = attachment.id;
      removeBtn.setAttribute('aria-label', t('app.removeAttachment') || 'Remove attachment');

      fileChip.appendChild(icon);
      fileChip.appendChild(name);
      fileChip.appendChild(removeBtn);
      previewArea.appendChild(fileChip);
    }
  });
  } catch (error) {
    console.error('Error updating image preview:', error);
    logger.error('Composer', 'Image preview update error', { error: error.message, attachmentCount: attachments.length });
    // Fallback: hide preview area on error
    const previewArea = document.getElementById('attachments');
    if (previewArea) previewArea.classList.remove('active');
  }
}

// Show upload progress
export function showUploadProgress() {
  const progressContainer = document.getElementById('uploadProgress');
  const progressBar = document.getElementById('uploadProgressBar');

  if (!progressContainer || !progressBar) return;

  // Reset progress
  uploadProgress = 0;
  isUploading = true;
  progressBar.style.width = '0%';
  progressContainer.classList.add('active');

  // Simulate progress (in a real app, this would be tied to actual upload progress)
  const simulateProgress = () => {
    if (!isUploading) return;

    if (uploadProgress < 90) {
      uploadProgress += Math.random() * 10;
      progressBar.style.width = `${uploadProgress}%`;
      setTimeout(simulateProgress, 200);
    }
  };

  simulateProgress();
}

// Complete upload progress
export function completeUploadProgress() {
  const progressContainer = document.getElementById('uploadProgress');
  const progressBar = document.getElementById('uploadProgressBar');

  if (!progressContainer || !progressBar) return;

  // Complete the progress bar
  uploadProgress = 100;
  progressBar.style.width = '100%';

  // Hide after a delay
  setTimeout(() => {
    isUploading = false;
    progressContainer.classList.remove('active');
  }, 500);
}

// Setup event listeners for the new composer
export function setupComposerEventListeners() {
  try {
    // Image upload button handling
    const imageInput = document.getElementById('imageInput');
    const uploadBtn = document.querySelector('.upload-btn');

  if (imageInput && uploadBtn) {
    console.log('Setting up upload button handlers');

    // Handle file selection change - this should work with the CSS overlay
    imageInput.addEventListener('change', (e) => {
      console.log('File input change event fired, files:', e.target.files.length);
      if (e.target.files.length) {
        console.log('Files selected:', e.target.files.length);
        showUploadProgress();

        // Process the files (simulate some delay for progress)
        setTimeout(() => {
          handleFiles(e.target.files);
          completeUploadProgress();
          e.target.value = '';
        }, 1000);
      }
    });

    // Improved mobile handling - prevent double triggers
    let isHandlingTouch = false;
    
    // Handle click for desktop
    uploadBtn.addEventListener('click', (e) => {
      if (isHandlingTouch) {
        e.preventDefault();
        return;
      }
      console.log('Upload button clicked (desktop)');
      imageInput.click();
    });

    // Handle touch for mobile devices
    uploadBtn.addEventListener('touchstart', (e) => {
      console.log('Upload button touchstart');
      isHandlingTouch = true;
      // Reset flag after a delay to allow for future interactions
      setTimeout(() => { isHandlingTouch = false; }, 300);
    });

    uploadBtn.addEventListener('touchend', (e) => {
      console.log('Upload button touchend');
      e.preventDefault();
      e.stopPropagation();
      
      // Only trigger if we haven't already triggered
      if (imageInput && isHandlingTouch) {
        console.log('Triggering file input click from touchend');
        imageInput.click();
      }
    });
  } else {
    console.error('Upload elements not found:', { imageInput, uploadBtn });
  }

  // Handle attachment removal from preview
  const attachmentsContainer = document.getElementById('attachments');
  if (attachmentsContainer) {
    attachmentsContainer.addEventListener('click', (e) => {
      const removeBtn = e.target.closest('.image-preview-remove');
      if (removeBtn) {
        const id = removeBtn.dataset.id;
        if (id) removeAttachment(id);
      }
    });
  }
  } catch (error) {
    console.error('Error setting up composer event listeners:', error);
    logger.error('Composer', 'Event listener setup error', { error: error.message });
  }
}

// Initialize the composer
export function initComposer() {
  setupComposerEventListeners();

  // Expose the updateImagePreview function globally so chat.js can call it
  window.composerModule = {
    updateImagePreview: updateImagePreview
  };
}