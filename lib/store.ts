/**
 * Zustand auth store: player + access/refresh token (AsyncStorage'da kalıcı).
 */
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, STORAGE_KEYS, setAuthFailureHandler } from './api';
import type { AuthResponse, Player } from './types';

interface AuthState {
  player: Player | null;
  accessToken: string | null;
  hydrated: boolean;
  /** Uygulama açılışında AsyncStorage'tan oturumu yükler */
  hydrate: () => Promise<void>;
  setSession: (res: AuthResponse) => Promise<void>;
  setPlayer: (player: Player) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuth = create<AuthState>((set, get) => ({
  player: null,
  accessToken: null,
  hydrated: false,

  hydrate: async () => {
    const [access, playerRaw] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.access),
      AsyncStorage.getItem(STORAGE_KEYS.player),
    ]);
    set({
      accessToken: access,
      player: playerRaw ? (JSON.parse(playerRaw) as Player) : null,
      hydrated: true,
    });
  },

  setSession: async (res) => {
    await AsyncStorage.multiSet([
      [STORAGE_KEYS.access, res.access_token],
      [STORAGE_KEYS.refresh, res.refresh_token],
      [STORAGE_KEYS.player, JSON.stringify(res.player)],
    ]);
    set({ accessToken: res.access_token, player: res.player });
  },

  setPlayer: async (player) => {
    await AsyncStorage.setItem(STORAGE_KEYS.player, JSON.stringify(player));
    set({ player });
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // sunucu erişilemese bile yerel oturumu temizle
    }
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.access,
      STORAGE_KEYS.refresh,
      STORAGE_KEYS.player,
    ]);
    set({ accessToken: null, player: null });
  },
}));

// Refresh başarısız olduğunda (oturum süresi doldu) store'u temizle → auth gate login'e atar
setAuthFailureHandler(() => {
  void AsyncStorage.multiRemove([
    STORAGE_KEYS.access,
    STORAGE_KEYS.refresh,
    STORAGE_KEYS.player,
  ]);
  useAuth.setState({ accessToken: null, player: null });
});
