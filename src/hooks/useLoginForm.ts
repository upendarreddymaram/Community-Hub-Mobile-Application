import { useCallback, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { hasValidationErrors, validateLogin } from '../utils/validation';
import type { LoginFormErrors } from '../types/auth';

/** Primary demo account — one-tap for evaluators and local testing. */
export const DEMO_CREDENTIALS = {
  email: 'demo@communityhub.com',
  password: 'Password123!',
} as const;

export function useLoginForm() {
  const login = useAuthStore((state) => state.login);
  const isLoading = useAuthStore((state) => state.isLoading);
  const serverError = useAuthStore((state) => state.error);
  const clearError = useAuthStore((state) => state.clearError);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<LoginFormErrors>({});
  const [touched, setTouched] = useState<{ email: boolean; password: boolean }>({
    email: false,
    password: false,
  });

  const validateField = useCallback(
    (field: keyof LoginFormErrors) => {
      const validationErrors = validateLogin({ email, password });
      setErrors((current) => ({ ...current, [field]: validationErrors[field] }));
    },
    [email, password],
  );

  const handleEmailChange = useCallback(
    (value: string) => {
      setEmail(value);
      clearError();
      if (touched.email) {
        validateField('email');
      }
    },
    [clearError, touched.email, validateField],
  );

  const handlePasswordChange = useCallback(
    (value: string) => {
      setPassword(value);
      clearError();
      if (touched.password) {
        validateField('password');
      }
    },
    [clearError, touched.password, validateField],
  );

  const handleBlur = useCallback(
    (field: keyof LoginFormErrors) => {
      setTouched((current) => ({ ...current, [field]: true }));
      validateField(field);
    },
    [validateField],
  );

  const handleSubmit = useCallback(async () => {
    clearError();
    setTouched({ email: true, password: true });

    const trimmedEmail = email.trim();
    const validationErrors = validateLogin({ email: trimmedEmail, password });
    setErrors(validationErrors);
    if (hasValidationErrors(validationErrors)) {
      return;
    }

    await login({ email: trimmedEmail, password });
  }, [clearError, email, login, password]);

  const handleFillDemo = useCallback(() => {
    clearError();
    setEmail(DEMO_CREDENTIALS.email);
    setPassword(DEMO_CREDENTIALS.password);
    setErrors({});
    setTouched({ email: false, password: false });
  }, [clearError]);

  const isFormValid = !hasValidationErrors(validateLogin({ email, password }));

  return {
    email,
    password,
    errors,
    touched,
    isLoading,
    serverError,
    isFormValid,
    handleEmailChange,
    handlePasswordChange,
    handleBlur,
    handleSubmit,
    handleFillDemo,
  };
}
