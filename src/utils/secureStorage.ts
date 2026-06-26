import * as Keychain from 'react-native-keychain';
import { STORAGE_KEYS } from './constants';

const KEYCHAIN_SERVICE = 'community_hub_auth_token';

export async function saveAuthToken(token: string): Promise<void> {
  await Keychain.setGenericPassword(STORAGE_KEYS.AUTH_TOKEN, token, {
    service: KEYCHAIN_SERVICE,
    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED,
  });
}

export async function getAuthToken(): Promise<string | null> {
  try {
    const credentials = await Keychain.getGenericPassword({ service: KEYCHAIN_SERVICE });
    if (!credentials) {
      return null;
    }
    return credentials.password;
  } catch {
    return null;
  }
}

export async function clearAuthToken(): Promise<void> {
  try {
    await Keychain.resetGenericPassword({ service: KEYCHAIN_SERVICE });
  } catch {
    // Keychain may already be empty.
  }
}
