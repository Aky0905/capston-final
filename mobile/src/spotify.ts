import type { Track } from './domain';

const clientId = process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID || 'fa67f4c09bc24198b65c7d37a6d74464';
const tokenKey = 'feelody.spotify.session';
type Session = { token: string; expires: number; refresh: string };
const readSession = (): Session | null => JSON.parse(sessionStorage.getItem(tokenKey) || 'null');
export const connected = () => !!readSession();
const listeners = new Set<() => void>();
export function subscribeConnection(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
export function disconnect() {
  sessionStorage.removeItem(tokenKey);
  listeners.forEach(listener => listener());
}

async function exchange(params: URLSearchParams, oldRefresh = '') {
  params.set('client_id', clientId);
  const response = await fetch('https://accounts.spotify.com/api/token', { method: 'POST', body: params });
  if (!response.ok) {
    if (response.status === 400 && oldRefresh && readSession()?.refresh === oldRefresh) disconnect();
    throw new Error('Spotify 연결을 다시 시도해주세요.');
  }
  const data = await response.json();
  if (oldRefresh && readSession()?.refresh !== oldRefresh) throw new Error('스포티파이 연결이 변경됐어요.');
  const session: Session = { token: data.access_token, expires: Date.now() + data.expires_in * 1000, refresh: data.refresh_token || oldRefresh };
  sessionStorage.setItem(tokenKey, JSON.stringify(session));
  listeners.forEach(listener => listener());
  return session.token;
}
let refreshing: Promise<string> | undefined;
export async function token() {
  const session = readSession();
  if (!session) throw new Error('Spotify 연결이 필요해요.');
  if (session.expires > Date.now() + 60000) return session.token;
  return refreshing ??= exchange(new URLSearchParams({ grant_type: 'refresh_token', refresh_token: session.refresh }), session.refresh)
    .finally(() => { refreshing = undefined; });
}
function base64url(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
export async function authorize() {
  const popup = window.open('about:blank', 'feelody-spotify', 'width=520,height=720');
  if (!popup) throw new Error('팝업을 허용한 뒤 Spotify 연결을 눌러주세요.');
  const redirect = location.origin + '/';
  const verifier = base64url(crypto.getRandomValues(new Uint8Array(48)));
  const state = 'feelody-spotify-' + crypto.randomUUID();
  try {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
    const params = new URLSearchParams({ client_id: clientId, redirect_uri: redirect, response_type: 'code',
      scope: 'streaming user-read-email user-read-private user-modify-playback-state', state,
      code_challenge_method: 'S256', code_challenge: base64url(new Uint8Array(digest)) });
    const code = await new Promise<string>((resolve, reject) => {
      const finish = () => { clearInterval(timer); window.removeEventListener('message', receive); };
      const receive = (event: MessageEvent) => {
        if (event.origin !== location.origin || event.source !== popup || event.data?.state !== state) return;
        finish();
        if (event.data.code) resolve(event.data.code);
        else reject(new Error('Spotify 연결을 승인해주세요.'));
      };
      const timer = setInterval(() => { if (popup.closed) { finish(); reject(new Error('Spotify 연결 창을 닫았어요.')); } }, 500);
      window.addEventListener('message', receive);
      popup.location.href = 'https://accounts.spotify.com/authorize?' + params;
    });
    await exchange(new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: redirect, code_verifier: verifier }));
  } finally { popup.close(); }
}
export class SpotifyRequestError extends Error {
  constructor(readonly status: number, message: string) { super(message); }
}
export async function spotifyApi(path: string, options: RequestInit = {}) {
  const response = await fetch('https://api.spotify.com/v1/' + path, { ...options, headers: {
    Authorization: 'Bearer ' + await token(), 'Content-Type': 'application/json' } });
  if (!response.ok) throw new SpotifyRequestError(response.status, response.status === 403 ? 'Spotify Premium과 개발 앱의 허용 사용자 등록을 확인해주세요.' :
    response.status === 429 ? 'Spotify 요청이 많아요. 잠시 후 다시 시도해주세요.' : 'Spotify 요청에 실패했어요 (' + response.status + ').');
  return response;
}
export async function startPlayback(device: string, id: string) {
  const play = () => spotifyApi('me/player/play?device_id=' + encodeURIComponent(device), {
    method: 'PUT', body: JSON.stringify({ uris: ['spotify:track:' + id] })
  });
  try {
    await play();
  } catch (error) {
    if (!(error instanceof SpotifyRequestError) || error.status !== 404) throw error;
    await spotifyApi('me/player', { method: 'PUT', body: JSON.stringify({ device_ids: [device], play: false }) });
    await play();
  }
}
type Hit = { id: string; name: string; artists: { name: string }[]; album: { images: {url:string}[] } };
const norm = (s: string) => s.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
export async function resolveTrack(track: Track): Promise<Track | null> {
  if (track.spotifyId) {
    if (track.thumbnail) return track;
    const hit: Hit = await (await spotifyApi('tracks/' + encodeURIComponent(track.spotifyId))).json();
    return { ...track, thumbnail: hit.album.images[0]?.url };
  }
  const artist = track.artist.replace(/\s*- Topic$|VEVO$/i, '').trim();
  const title = track.title.replace(/\s*[([](?:official|공식|뮤직비디오|M\/V|MV)[^\])]*[\])]/gi, '').trim();
  const song = title.toLowerCase().startsWith(artist.toLowerCase() + ' - ') ? title.slice(artist.length + 3) : title;
  const query = new URLSearchParams({ q: 'track:' + song + ' artist:' + artist, type: 'track', limit: '5' });
  const data = await (await spotifyApi('search?' + query)).json();
  const hit = (data.tracks?.items as Hit[] || []).find(t => norm(t.name) === norm(song) && t.artists.some(a => norm(a.name) === norm(artist)));
  return hit ? { ...track, spotifyId: hit.id, title: hit.name, artist: hit.artists.map(a => a.name).join(', '), thumbnail: hit.album.images[0]?.url } : null;
}
