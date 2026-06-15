document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('feedback-form');
  const statusContainer = document.getElementById('status-container');
  const statusMessage = document.getElementById('status-message');
  const fileInput = document.getElementById('attachment');
  const dropZone = document.getElementById('drop-zone');
  const filePrompt = document.getElementById('file-prompt');
  const fileNameDisplay = document.getElementById('file-name-display');
  const submitBtn = document.getElementById('submit-btn');
  const btnText = submitBtn.querySelector('.btn-text');
  const spinner = submitBtn.querySelector('.spinner');

  // Allowed file size (5MB)
  const MAX_FILE_SIZE = 5 * 1024 * 1024;
  const ALLOWED_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];

  // Handle Drag & Drop events
  ['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropZone.classList.add('dragover');
    }, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropZone.classList.remove('dragover');
    }, false);
  });

  dropZone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;

    if (files.length > 0) {
      fileInput.files = files;
      handleFileChange(files[0]);
    }
  });

  // Handle File Input selection
  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleFileChange(e.target.files[0]);
    } else {
      resetFileDisplay();
    }
  });

  function handleFileChange(file) {
    if (!file) return;

    // Client-side validation: size check
    if (file.size > MAX_FILE_SIZE) {
      showStatus('File size exceeds 5MB limit. Please upload a smaller file.', 'error');
      fileInput.value = '';
      resetFileDisplay();
      return;
    }

    // Client-side validation: type check
    if (!ALLOWED_TYPES.includes(file.type)) {
      showStatus('Only PDF, PNG, or JPG files are allowed.', 'error');
      fileInput.value = '';
      resetFileDisplay();
      return;
    }

    // Display selected file info
    filePrompt.textContent = file.name;
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
    fileNameDisplay.textContent = `Selected (${sizeInMB} MB)`;
    fileNameDisplay.style.color = 'var(--accent-cyan)';
    // Hide status container if a size error was shown previously
    if (statusContainer.classList.contains('error') && statusMessage.textContent.includes('File')) {
      hideStatus();
    }
  }

  function resetFileDisplay() {
    filePrompt.textContent = 'Choose a file or drag & drop';
    fileNameDisplay.textContent = 'Max size 5MB';
    fileNameDisplay.style.color = 'var(--text-muted)';
  }

  // Helper to show Success/Error alerts
  function showStatus(message, type) {
    statusContainer.className = 'status-box'; // reset
    statusContainer.classList.add(type);
    statusMessage.textContent = message;
    
    // Set icon based on status type
    const iconEl = statusContainer.querySelector('.status-icon ion-icon');
    if (type === 'success') {
      iconEl.setAttribute('name', 'checkmark-circle-outline');
    } else {
      iconEl.setAttribute('name', 'alert-circle-outline');
    }
  }

  function hideStatus() {
    statusContainer.classList.add('hidden');
  }

  // Intercept form submit event
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideStatus();

    // Fetch form input values
    const nameVal = document.getElementById('name').value.trim();
    const emailVal = document.getElementById('email').value.trim();
    const messageVal = document.getElementById('message').value.trim();

    // Client-side validation
    if (!nameVal || !emailVal || !messageVal) {
      showStatus('Please fill in all required fields.', 'error');
      return;
    }

    // Email format simple check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailVal)) {
      showStatus('Please enter a valid email address layout.', 'error');
      return;
    }

    // Set Loading state on button
    submitBtn.disabled = true;
    btnText.textContent = 'Submitting...';
    spinner.classList.remove('hidden');

    try {
      // Build FormData payload
      const formData = new FormData();
      formData.append('name', nameVal);
      formData.append('email', emailVal);
      formData.append('message', messageVal);
      
      if (fileInput.files.length > 0) {
        formData.append('attachment', fileInput.files[0]);
      }

      // Fetch POST API call
      const response = await fetch('/feedback', {
        method: 'POST',
        body: formData // Content-Type header is set automatically by the browser with correct boundary
      });

      const result = await response.json();

      if (response.status === 201) {
        // Success case
        showStatus(result.message || 'Feedback submitted successfully!', 'success');
        form.reset();
        resetFileDisplay();
      } else {
        // Validation/Rate-limit/Server error cases
        const errorMsg = result.error || 'Failed to submit feedback.';
        showStatus(errorMsg, 'error');
      }

    } catch (networkError) {
      console.error('Submission Network Error:', networkError);
      showStatus('Network error occurred. Please check your connection and try again.', 'error');
    } finally {
      // Reset loading state
      submitBtn.disabled = false;
      btnText.textContent = 'Submit Feedback';
      spinner.classList.add('hidden');
    }
  });
});
