export interface User {
  id: string;
  email: string;
  name: string;
}

export interface AuthSession {
  token: string;
  user: User;
}

/** User profile persisted in AsyncStorage (token stored separately in Keychain). */
export interface PersistedAuthProfile {
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginFormErrors {
  email?: string;
  password?: string;
}
