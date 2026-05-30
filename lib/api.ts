/**
 * Axios instance + JWT interceptor + 401'de /auth/refresh ile token yenileme.
 * Eşzamanlı 401'ler tek bir refresh isteğinde kuyruğa alınır.
 */
import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

if (!BASE_URL) {
  // Geliştirici uyarısı — .env içinde EXPO_PUBLIC_API_BASE_URL tanımlı olmalı.
  console.warn(
    '[api] EXPO_PUBLIC_API_BASE_URL tanımlı değil. .env dosyasını oluşturun (bkz. .env.example).',
  );
}

export const STORAGE_KEYS = {
  access: 'gamepm.accessToken',
  refresh: 'gamepm.refreshToken',
  player: 'gamepm.player',
} as const;

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
});

// --- İstek interceptor: access token ekle ---
api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await AsyncStorage.getItem(STORAGE_KEYS.access);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// --- Yanıt interceptor: 401'de refresh ---
type Pending = {
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
};

let isRefreshing = false;
let queue: Pending[] = [];

function flushQueue(error: unknown, token: string | null) {
  queue.forEach((p) => (token ? p.resolve(token) : p.reject(error)));
  queue = [];
}

/** Oturum geçersiz olduğunda store tarafından doldurulan geri çağrı (döngüsel importu önler). */
let onAuthFailure: (() => void) | null = null;
export function setAuthFailureHandler(fn: () => void) {
  onAuthFailure = fn;
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    const status = error.response?.status;
    const isRefreshCall = original?.url?.includes('/auth/refresh');

    if (status !== 401 || !original || original._retry || isRefreshCall) {
      return Promise.reject(error);
    }

    original._retry = true;

    if (isRefreshing) {
      // Refresh sürerken gelen istekleri kuyruğa al
      return new Promise((resolve, reject) => {
        queue.push({
          resolve: (token: string) => {
            original.headers.Authorization = `Bearer ${token}`;
            resolve(api(original));
          },
          reject,
        });
      });
    }

    isRefreshing = true;
    try {
      const refreshToken = await AsyncStorage.getItem(STORAGE_KEYS.refresh);
      if (!refreshToken) throw new Error('no refresh token');

      // Interceptor'sız ham istemci (sonsuz döngüyü önler)
      const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
      const newAccess: string = data.access_token;
      const newRefresh: string = data.refresh_token;

      await AsyncStorage.setItem(STORAGE_KEYS.access, newAccess);
      if (newRefresh) await AsyncStorage.setItem(STORAGE_KEYS.refresh, newRefresh);

      flushQueue(null, newAccess);
      original.headers.Authorization = `Bearer ${newAccess}`;
      return api(original);
    } catch (err) {
      flushQueue(err, null);
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.access,
        STORAGE_KEYS.refresh,
        STORAGE_KEYS.player,
      ]);
      onAuthFailure?.();
      return Promise.reject(err);
    } finally {
      isRefreshing = false;
    }
  },
);

/** Backend hata mesajını kullanıcı dostu metne çevirir. */
export function apiErrorMessage(err: unknown, fallback = 'Bir hata oluştu'): string {
  const ax = err as AxiosError<{ message?: string | string[] }>;
  if (ax?.response?.status === 429) {
    return 'Çok fazla istek gönderildi. Lütfen biraz bekleyip tekrar deneyin.';
  }
  const msg = ax?.response?.data?.message;
  if (Array.isArray(msg)) return msg[0] ?? fallback;
  if (typeof msg === 'string') return msg;
  if (ax?.message === 'Network Error') {
    return 'Sunucuya ulaşılamadı. Bağlantınızı ve API adresini kontrol edin.';
  }
  return fallback;
}
