// Pure functions for contact form validation

function isEmpty(value) {
  return value === undefined || value === null || String(value) === '';
}

function isWhitespaceOnly(value) {
  if (isEmpty(value)) return false; // Empty is not whitespace only
  return String(value).trim() === '';
}

function validateEmail(email) {
  if (isEmpty(email) || isWhitespaceOnly(email)) return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
}

function validateName(name) {
  if (isEmpty(name) || isWhitespaceOnly(name)) return false;
  return String(name).trim().length >= 3;
}

function validateSubject(subject) {
  if (isEmpty(subject) || isWhitespaceOnly(subject)) return false;
  return String(subject).trim().length >= 5;
}

function validateMessage(message) {
  if (isEmpty(message) || isWhitespaceOnly(message)) return false;
  const len = String(message).trim().length;
  return len >= 10 && len <= 500;
}

function validateContactForm(formData) {
  const errors = {};
  
  if (!validateName(formData.name)) {
    errors.name = 'الاسم مطلوب ويجب أن يكون 3 أحرف على الأقل.';
  }
  
  if (!validateEmail(formData.email)) {
    errors.email = 'البريد الإلكتروني غير صالح.';
  }
  
  if (!validateSubject(formData.subject)) {
    errors.subject = 'الموضوع مطلوب ويجب أن يكون 5 أحرف على الأقل.';
  }
  
  if (!validateMessage(formData.message)) {
    errors.message = 'الرسالة مطلوبة ويجب أن تكون بين 10 و 500 حرف.';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

function createContactSubmission(formData) {
  return {
    id: Date.now(),
    name: formData.name.trim(),
    email: formData.email.trim().toLowerCase(),
    subject: formData.subject.trim(),
    message: formData.message.trim(),
    submittedAt: new Date().toISOString()
  };
}

// These functions use localStorage but are kept simple enough to test if mocked,
// or we can just mock localStorage in tests.
function saveContactSubmission(submission) {
  if (typeof window === 'undefined' || !window.localStorage) return false;
  
  const existing = getContactSubmissions();
  existing.push(submission);
  window.localStorage.setItem('contact_submissions', JSON.stringify(existing));
  return true;
}

function getContactSubmissions() {
  if (typeof window === 'undefined' || !window.localStorage) return [];
  
  const data = window.localStorage.getItem('contact_submissions');
  try {
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    isEmpty,
    isWhitespaceOnly,
    validateEmail,
    validateName,
    validateSubject,
    validateMessage,
    validateContactForm,
    createContactSubmission,
    saveContactSubmission,
    getContactSubmissions
  };
} else {
  window.contactLogic = {
    isEmpty,
    isWhitespaceOnly,
    validateEmail,
    validateName,
    validateSubject,
    validateMessage,
    validateContactForm,
    createContactSubmission,
    saveContactSubmission,
    getContactSubmissions
  };
}
