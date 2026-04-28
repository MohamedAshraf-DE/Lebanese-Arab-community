const {
  validateEmail,
  validateName,
  validateSubject,
  validateMessage,
  validateContactForm,
  isWhitespaceOnly
} = require('../src/contactLogic.js');

describe('Contact Form Logic', () => {
  
  test('1. Empty name is rejected', () => {
    expect(validateName('')).toBe(false);
    expect(validateName(null)).toBe(false);
  });

  test('2. Whitespace-only name is rejected', () => {
    expect(isWhitespaceOnly('   ')).toBe(true);
    expect(validateName('   ')).toBe(false);
  });

  test('3. Short name is rejected', () => {
    expect(validateName('ab')).toBe(false);
    expect(validateName('abc')).toBe(true);
  });

  test('4. Empty email is rejected', () => {
    expect(validateEmail('')).toBe(false);
  });

  test('5. Invalid email is rejected', () => {
    expect(validateEmail('test.com')).toBe(false);
    expect(validateEmail('test@com')).toBe(false);
    expect(validateEmail('test@.com')).toBe(false);
  });

  test('6. Valid email is accepted', () => {
    expect(validateEmail('user@example.com')).toBe(true);
    expect(validateEmail('USER.NAME@DOMAIN.CO.UK')).toBe(true);
  });

  test('7. Empty subject is rejected', () => {
    expect(validateSubject('')).toBe(false);
  });

  test('8. Short subject is rejected', () => {
    expect(validateSubject('1234')).toBe(false);
    expect(validateSubject('12345')).toBe(true);
  });

  test('9. Empty message is rejected', () => {
    expect(validateMessage('')).toBe(false);
  });

  test('10. Short message is rejected', () => {
    expect(validateMessage('123456789')).toBe(false); // 9 chars
    expect(validateMessage('1234567890')).toBe(true); // 10 chars
  });

  test('11. Message over 500 characters is rejected', () => {
    const longMsg = 'a'.repeat(501);
    expect(validateMessage(longMsg)).toBe(false);
    
    const validLongMsg = 'a'.repeat(500);
    expect(validateMessage(validLongMsg)).toBe(true);
  });

  test('12. Valid form data passes successfully', () => {
    const validData = {
      name: 'وائل نبيل',
      email: 'wael@example.com',
      subject: 'استفسار مهم',
      message: 'هذه رسالة تجريبية لاختبار النموذج مكونة من أكثر من عشرة أحرف.'
    };
    
    const result = validateContactForm(validData);
    expect(result.isValid).toBe(true);
    expect(Object.keys(result.errors).length).toBe(0);
  });

  test('13. Error messages are returned per field', () => {
    const invalidData = {
      name: 'a',
      email: 'invalid',
      subject: 'hi',
      message: 'short'
    };
    
    const result = validateContactForm(invalidData);
    expect(result.isValid).toBe(false);
    expect(result.errors.name).toBeDefined();
    expect(result.errors.email).toBeDefined();
    expect(result.errors.subject).toBeDefined();
    expect(result.errors.message).toBeDefined();
  });
});
