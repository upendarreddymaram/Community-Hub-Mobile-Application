import type { LoginFormErrors, LoginCredentials } from '../types/auth';
import type { CreatePostFormErrors } from '../types/post';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const MAX_EMAIL_LENGTH = 254;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 64;
const SPECIAL_CHAR_REGEX = /[!@#$%^&*(),.?":{}|<>_\-+=[\]\\;/'`~]/;

export function validateLogin(credentials: LoginCredentials): LoginFormErrors {
  const errors: LoginFormErrors = {};
  const rawEmail = credentials.email;
  const email = rawEmail.trim();
  const password = credentials.password;

  if (!email) {
    errors.email = 'Email is required';
  } else {
    if (rawEmail !== email) {
      errors.email = 'Email cannot contain leading or trailing spaces';
    } else if (/\s/.test(rawEmail)) {
      errors.email = 'Email cannot contain spaces';
    } else if (email.length > MAX_EMAIL_LENGTH) {
      errors.email = `Email must be ${MAX_EMAIL_LENGTH} characters or fewer`;
    } else if (email.includes('..')) {
      errors.email = 'Email cannot contain consecutive dots';
    } else if (!EMAIL_REGEX.test(email)) {
      errors.email = 'Enter a valid email address (e.g. name@example.com)';
    }
  }

  if (!password) {
    errors.password = 'Password is required';
  } else {
    if (/\s/.test(password)) {
      errors.password = 'Password cannot contain spaces';
    } else if (password.length < MIN_PASSWORD_LENGTH) {
      errors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
    } else if (password.length > MAX_PASSWORD_LENGTH) {
      errors.password = `Password must be ${MAX_PASSWORD_LENGTH} characters or fewer`;
    } else if (!/[a-z]/.test(password)) {
      errors.password = 'Password must include at least one lowercase letter';
    } else if (!/[A-Z]/.test(password)) {
      errors.password = 'Password must include at least one uppercase letter';
    } else if (!/[0-9]/.test(password)) {
      errors.password = 'Password must include at least one number';
    } else if (!SPECIAL_CHAR_REGEX.test(password)) {
      errors.password = 'Password must include at least one special character (!@#$%^&* etc.)';
    }
  }

  return errors;
}

export function validateCreatePost(title: string, body: string): CreatePostFormErrors {
  const errors: CreatePostFormErrors = {};
  const trimmedTitle = title.trim();
  const trimmedBody = body.trim();

  if (!trimmedTitle) {
    errors.title = 'Title is required';
  } else if (trimmedTitle.length < 3) {
    errors.title = 'Title must be at least 3 characters';
  }

  if (!trimmedBody) {
    errors.body = 'Body is required';
  } else if (trimmedBody.length < 10) {
    errors.body = 'Body must be at least 10 characters';
  }

  return errors;
}

export function hasValidationErrors(errors: object): boolean {
  return Object.values(errors).some(Boolean);
}
