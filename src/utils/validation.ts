import type { LoginFormErrors, LoginCredentials } from '../types/auth';
import type { CreatePostFormErrors } from '../types/post';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateLogin(credentials: LoginCredentials): LoginFormErrors {
  const errors: LoginFormErrors = {};
  const email = credentials.email.trim();
  const password = credentials.password;

  if (!email) {
    errors.email = 'Email is required';
  } else if (!EMAIL_REGEX.test(email)) {
    errors.email = 'Enter a valid email address';
  }

  if (!password) {
    errors.password = 'Password is required';
  } else if (password.length < 6) {
    errors.password = 'Password must be at least 6 characters';
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
