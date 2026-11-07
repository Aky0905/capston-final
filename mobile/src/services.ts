import 'react-native-url-polyfill/auto';
import { AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { createClient } from '@supabase/supabase-js';
import type { Analysis, Library, Track } from './domain';
import { emptyLibrary, MOODS } from './domain';
import catalog from './catalog.json';
import { connected, resolveTrack } from './spotify';

export let savedTracks: Track[] = [];
export function remember(items: Track[]) { savedTracks = [...new Map([...savedTracks,...items.filter(t => !tracks.some(c => c.id === t.id))].map(t=>[t.id,t])).values()]; }
export const tracks = catalog as Track[];
export const cloudMode = process.env.EXPO_PUBLIC_MODE === 'cloud';
const url = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const anon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
export const apiUrl = (process.env.EXPO_PUBLIC_API_URL || '').replace(/\/$/, '');
export const configReady = /^https:\/\/.+\.supabase\.co$/.test(url) && !!anon && !!apiUrl;
// Supabase sessions can exceed SecureStore's per-value size limit. Store in small chunks.
const secureStorage = {
  async getItem(key: string) {
    if (Platform.OS === 'web') return AsyncStorage.getItem(key);
    const count = Number(await SecureStore.getItemAsync(`${key}.count`) || 0);
    if (!count) return null;
    const chunks = await Promise.all(Array.from({ length: count }, (_, i) => SecureStore.getItemAsync(`${key}.${i}`)));
    return chunks.some(x => x === null) ? null : chunks.join('');
  },
  async setItem(key: string, value: string) {
    if (Platform.OS === 'web') return AsyncStorage.setItem(key, value);
    await this.removeItem(key);
    const chunks = value.match(/[\s\S]{1,900}/g) || [];
    for (let i = 0; i < chunks.length; i++) await SecureStore.setItemAsync(`${key}.${i}`, chunks[i]!);
    await SecureStore.setItemAsync(`${key}.count`, String(chunks.length));
  },
  async removeItem(key: string) {
    if (Platform.OS === 'web') return AsyncStorage.removeItem(key);
    const count = Number(await SecureStore.getItemAsync(`${key}.count`) || 0);
    await SecureStore.deleteItemAsync(`${key}.count`);
    await Promise.all(Array.from({ length: count }, (_, i) => SecureStore.deleteItemAsync(`${key}.${i}`)));
  }
};
export const supabase = cloudMode && configReady ? createClient(url, anon, { auth: { storage: secureStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false } }) : null;
if (supabase && Platform.OS !== 'web') AppState.addEventListener('change', state => {
  if (state === 'active') supabase.auth.startAutoRefresh(); else supabase.auth.stopAutoRefresh();
});
const LOCAL_KEY = 'feelody.demo.library.v1';
export async function loadLibrary(): Promise<Library> {
  savedTracks = [];
  if (!cloudMode) {
    const saved = await AsyncStorage.getItem(LOCAL_KEY);
    return saved ? { ...emptyLibrary(), ...JSON.parse(saved) } : emptyLibrary();
  }
  if (!supabase) throw new Error('Supabase 설정을 확인해주세요.');
  const { data, error } = await supabase.from('libraries').select('data').maybeSingle();
  if (error) throw new Error('기록을 불러오지 못했어요. 잠시 후 다시 시도해주세요.');
  remember(data?.data?.savedTracks || []);
  return data ? { ...emptyLibrary(), name: '', ...data.data } : { ...emptyLibrary(), name: '' };
}
export async function persistLibrary(library: Library): Promise<void> {
  library = { ...library, savedTracks: savedTracks.filter(t => library.favorites.includes(t.id) || library.recent.includes(t.id) || library.playlists.some(p => p.trackIds.includes(t.id)) || library.entries.some(e => e.tracks.some(x => x.id === t.id))) };
  if (!cloudMode) { await AsyncStorage.setItem(LOCAL_KEY, JSON.stringify(library)); return; }
  if (!supabase) throw new Error('Supabase 설정이 필요해요.');
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('다시 로그인해주세요.');
  const { error } = await supabase.from('libraries').upsert({ user_id: user.id, data: library, updated_at: new Date().toISOString() });
  if (error) throw new Error('저장하지 못했어요. 네트워크 연결을 확인해주세요.');
}
async function headers(): Promise<Record<string, string>> {
  const { data } = await supabase!.auth.getSession();
  if (!data.session) throw new Error('로그인이 필요해요.');
  return { Authorization: `Bearer ${data.session.access_token}` };
}
async function request(path: string, body: string | FormData): Promise<any> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 65000);
  try {
    const auth = await headers();
    const res = await fetch(`${apiUrl}/api/${path}`, { method: 'POST', body, signal: controller.signal, headers: typeof body === 'string' ? { ...auth, 'Content-Type': 'application/json' } : auth });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || '요청을 처리하지 못했어요.');
    return json;
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') throw new Error('응답이 늦어지고 있어요. 다시 시도해주세요.');
    throw e;
  } finally { clearTimeout(timeout); }
}
export async function analyze(text: string): Promise<Analysis> {
  if (cloudMode) {
    const result: Analysis = await request('analyze', JSON.stringify({ text }));
    if (Platform.OS === 'web' && connected()) {
      const matches = await Promise.allSettled(result.tracks.map(resolveTrack));
      const verified = matches.flatMap(match => match.status === 'fulfilled' && match.value ? [match.value] : []);
      if (verified.length) result.tracks = verified;
    }
    remember(result.tracks);
    return result;
  }
  const mood = /불안|걱정|무서/.test(text) ? '불안' : /화나|짜증|분노/.test(text) ? '분노' : /우울|슬프|힘들|지쳐|지친/.test(text) ? '슬픔' : /설레|설렘|기대/.test(text) ? '설렘' : /기쁘|행복|신나|좋아/.test(text) ? '기쁨' : '평온';
  return { primaryEmotion: mood, secondaryEmotions: [], message: '오늘의 마음을 들려줘서 고마워요. 잠깐 숨을 고르고, 당신을 위한 음악과 함께 쉬어가도 괜찮아요.', musicMood: '포근한 위로', tracks: tracks.filter(t => t.moods.includes(mood)), source: 'demo' };
}
export async function transcribe(uri: string): Promise<string> {
  if (!cloudMode) throw new Error('음성 인식은 실제 연동 모드에서 사용할 수 있어요. 지금은 글로 마음을 적어주세요.');
  const form = new FormData();
  if (Platform.OS === 'web') {
    const blob = await (await fetch(uri)).blob();
    form.append('file', blob, blob.type.includes('webm') ? 'recording.webm' : 'recording.m4a');
  } else {
    form.append('file', { uri, name: 'recording.m4a', type: 'audio/mp4' } as any);
  }
  const data = await request('transcribe', form);
  if (typeof data.text !== 'string' || !data.text.trim()) throw new Error('목소리를 인식하지 못했어요. 다시 녹음해주세요.');
  return data.text;
}
export function validateAnalysis(value: Analysis): boolean {
  return MOODS.includes(value.primaryEmotion) && typeof value.message === 'string' && Array.isArray(value.tracks);
}
