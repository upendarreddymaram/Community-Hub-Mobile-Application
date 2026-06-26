import {
  hasValidationErrors,
  validateCreatePost,
  validateLogin,
} from '../../src/utils/validation';

describe('validateLogin', () => {
  it('returns no errors for valid credentials', () => {
    const errors = validateLogin({
      email: 'demo@communityhub.com',
      password: 'Password123!',
    });

    expect(errors).toEqual({});
    expect(hasValidationErrors(errors)).toBe(false);
  });

  it('requires email and password', () => {
    const errors = validateLogin({ email: '', password: '' });

    expect(errors.email).toBe('Email is required');
    expect(errors.password).toBe('Password is required');
  });

  it('rejects invalid email formats', () => {
    expect(
      validateLogin({ email: 'not-an-email', password: 'Password123!' }).email,
    ).toBeTruthy();
    expect(
      validateLogin({ email: 'user@domain..com', password: 'Password123!' }).email,
    ).toMatch(/consecutive dots/i);
  });

  it('enforces password complexity rules', () => {
    expect(validateLogin({ email: 'a@b.co', password: 'short1!' }).password).toMatch(
      /8 characters/,
    );
    expect(validateLogin({ email: 'a@b.co', password: 'password1!' }).password).toMatch(
      /uppercase/,
    );
    expect(validateLogin({ email: 'a@b.co', password: 'Password!!' }).password).toMatch(
      /number/,
    );
    expect(validateLogin({ email: 'a@b.co', password: 'Password1' }).password).toMatch(
      /special/,
    );
  });
});

describe('validateCreatePost', () => {
  it('returns no errors for valid post input', () => {
    const errors = validateCreatePost('Hello world', 'This is a valid post body.');

    expect(errors).toEqual({});
  });

  it('requires title and body with minimum lengths', () => {
    const errors = validateCreatePost('ab', 'short');

    expect(errors.title).toMatch(/3 characters/);
    expect(errors.body).toMatch(/10 characters/);
  });
});

describe('hasValidationErrors', () => {
  it('returns true when any field has an error', () => {
    expect(hasValidationErrors({ email: 'Required' })).toBe(true);
    expect(hasValidationErrors({})).toBe(false);
  });
});
