import AsyncStorage from '@react-native-async-storage/async-storage';

const DEVICE_ID_KEY = '@curator_device_id';
const USER_ID_KEY = '@curator_user_id';
const PROFILE_KEY = '@curator_profile';
const ONBOARDING_COMPLETE_KEY = '@curator_onboarded';
const DIGEST_CACHE_KEY = '@curator_digest_cache';
const SETTINGS_KEY = '@curator_settings';

// Generate a simple UUID
export function generateDeviceId(): string {
  const chars = 'abcdef0123456789';
  let id = '';
  for (let i = 0; i < 32; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
    if (i === 8 || i === 12 || i === 16 || i === 20) id += '-';
  }
  return id;
}

// ---- Device ID ----
export async function getDeviceId(): Promise<string> {
  let id = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = generateDeviceId();
    await AsyncStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

// ---- User ID (from backend) ----
export async function getUserId(): Promise<number | null> {
  const val = await AsyncStorage.getItem(USER_ID_KEY);
  return val ? parseInt(val, 10) : null;
}

export async function setUserId(id: number) {
  await AsyncStorage.setItem(USER_ID_KEY, id.toString());
}

// ---- Offline-first onboarding status ----
export async function isOnboardedLocally(): Promise<boolean> {
  const val = await AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY);
  return val === 'true';
}

export async function setOnboardedLocally() {
  await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
}

// ---- Profile (saved locally as backup) ----
export async function saveProfileLocally(profile: any) {
  await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export async function getLocalProfile(): Promise<any | null> {
  const val = await AsyncStorage.getItem(PROFILE_KEY);
  return val ? JSON.parse(val) : null;
}

// ---- Digest cache (instant loading from background) ----
export async function saveDigestCache(digest: any) {
  const payload = JSON.stringify({ items: digest, cached_at: Date.now() });
  await AsyncStorage.setItem(DIGEST_CACHE_KEY, payload);

}

export async function getDigestCache(): Promise<any[] | null> {
  const val = await AsyncStorage.getItem(DIGEST_CACHE_KEY);
  if (!val) return null;
  try {
    const parsed = JSON.parse(val);
    if (parsed && Array.isArray(parsed.items)) {
      return parsed.items;
    }
    return null;
  } catch {
    return null;
  }
}

export async function getLastCachedTime(): Promise<number | null> {
  const val = await AsyncStorage.getItem(DIGEST_CACHE_KEY);
  if (!val) return null;
  try {
    const parsed = JSON.parse(val);
    return parsed.cached_at || null;
  } catch {
    return null;
  }
}

// ---- Settings ----
export interface AppSettings {
  topics: string[];
  notificationTimes: string[];
  contentVolume: string;
  sources: string[];
}

const DEFAULT_SETTINGS: AppSettings = {
  topics: [],
  notificationTimes: ['08:00', '18:00'],
  contentVolume: 'Moderate (6-10 articles)',
  sources: ['HackerNews', 'Reddit', 'RSS Feeds'],
};

export async function getSettings(): Promise<AppSettings> {
  const val = await AsyncStorage.getItem(SETTINGS_KEY);
  if (!val) return { ...DEFAULT_SETTINGS };
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(val) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export async function saveSettings(settings: Partial<AppSettings>) {
  const current = await getSettings();
  const merged = { ...current, ...settings };
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(merged));
}

// ---- Full reset ----
export async function clearAll() {
  await AsyncStorage.multiRemove([
    DEVICE_ID_KEY,
    USER_ID_KEY,
    PROFILE_KEY,
    ONBOARDING_COMPLETE_KEY,
    DIGEST_CACHE_KEY,
    SETTINGS_KEY,
  ]);
}

export async function clearCache() {
  await AsyncStorage.multiRemove([DIGEST_CACHE_KEY]);
}
