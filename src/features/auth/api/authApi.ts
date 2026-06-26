import type { AuthSession, LoginCredentials } from '../../../types/auth';
import { logApiInfo } from '../../../utils/apiLogger';
import { simulateNetwork } from '../../../api/client';

const MOCK_USERS = [
  { email: 'demo@communityhub.com', password: 'Password123!', name: 'Demo User' },
  { email: 'admin@communityhub.com', password: 'Admin123!', name: 'Admin User' },
];

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthSession> => {
    return simulateNetwork(() => {
      const user = MOCK_USERS.find(
        (item) =>
          item.email.toLowerCase() === credentials.email.trim().toLowerCase() &&
          item.password === credentials.password,
      );

      if (!user) {
        throw new Error('Invalid email or password');
      }

      const session: AuthSession = {
        token: `mock_token_${Date.now()}`,
        user: {
          id: `user_${user.email}`,
          email: user.email,
          name: user.name,
        },
      };

      logApiInfo('Mock auth login success', {
        email: user.email,
        name: user.name,
      });

      return session;
    });
  },
};
