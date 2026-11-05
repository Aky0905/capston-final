export const MOODS = ['기쁨', '슬픔', '분노', '불안', '평온', '설렘', '기타'] as const;
export type Mood = typeof MOODS[number];
export type Track = { thumbnail?: string; id: string; title: string; artist: string; videoId: string; moods: Mood[]; tone: string; color: string };
export type Analysis = { primaryEmotion: Mood; secondaryEmotions: Mood[]; message: string; musicMood: string; tracks: Track[]; source: 'openai' | 'demo' };
export type Entry = Analysis & { id: string; text: string; createdAt: string; localDate: string };
export type Playlist = { id: string; name: string; trackIds: string[]; createdAt: string };
export type Library = { savedTracks?: Track[]; entries: Entry[]; favorites: string[]; playlists: Playlist[]; recent: string[]; name: string };
export const emptyLibrary = (): Library => ({ entries: [], favorites: [], playlists: [], recent: [], name: '지은' });
export const moodColors: Record<Mood, string> = { 기쁨: '#FFD574', 슬픔: '#96BCF8', 분노: '#FFA3AD', 불안: '#BEA5EE', 평온: '#9BD6CB', 설렘: '#E6ABDA', 기타: '#B5BDCE' };
export const moodFaces: Record<Mood, string> = { 기쁨: '☺', 슬픔: '☹', 분노: '≋', 불안: '∿', 평온: '◡', 설렘: '♡', 기타: '·' };
export function localDate(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function monthStats(entries: Entry[], month: string) {
  const current = entries.filter(e => e.localDate.startsWith(`${month}-`));
  return MOODS.map(mood => ({ mood, count: current.filter(e => e.primaryEmotion === mood).length, fraction: current.length ? current.filter(e => e.primaryEmotion === mood).length / current.length : 0 }));
}
export function streak(entries: Entry[], today = new Date()): number {
  const dates = new Set(entries.map(e => e.localDate));
  const cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (!dates.has(localDate(cursor))) cursor.setDate(cursor.getDate() - 1);
  let count = 0;
  while (dates.has(localDate(cursor))) { count++; cursor.setDate(cursor.getDate() - 1); }
  return count;
}
export function calendarCells(year: number, month: number): (number | null)[] {
  const start = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();
  const result: (number | null)[] = [...Array(start).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  while (result.length % 7) result.push(null);
  return result;
}
