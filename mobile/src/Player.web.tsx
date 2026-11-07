import React, { useEffect, useRef, useState } from 'react';
import './player.css';
import { Image } from 'react-native';

import type { PlayerProps } from './Player';
import type { Track } from './domain';
import { Icon, type IconName } from './ui';
import { authorize, connected, resolveTrack, startPlayback, token } from './spotify';

let sdk: Promise<void> | undefined;
function loadSdk() {
  if (window.Spotify) return Promise.resolve();
  return sdk ??= new Promise<void>((resolve, reject) => {
    window.onSpotifyWebPlaybackSDKReady = resolve;
    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.onerror = () => { sdk = undefined; script.remove(); reject(new Error('Spotify 플레이어를 불러오지 못했어요.')); };
    document.head.appendChild(script);
  });
}
const time = (ms: number) => Math.floor(ms / 60000) + ':' + String(Math.floor(ms / 1000) % 60).padStart(2, '0');

export function Player({ track, queue, play, visible = true, close, favorite, toggleFavorite, addToPlaylist }: PlayerProps) {
  const [linked, setLinked] = useState(connected);
  const [song, setSong] = useState<Track | null>(null);
  const [device, setDevice] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [state, setState] = useState<Spotify.PlaybackState | null>(null);
  const ref = useRef<Spotify.Player | null>(null);
  useEffect(() => {
    let active = true;
    let player: Spotify.Player | undefined;
    let initializationFailed = false;
    setDevice(''); setState(null); setNotice('');
    if (!linked) return;
    const fail = (error: Error | Spotify.Error) => { if (active) setNotice(error.message); };
    async function setup() {
      await loadSdk();
      if (!active) return;
      player = new window.Spotify.Player({ name: 'Feelody', getOAuthToken: cb => { void token().then(cb).catch(fail); } });
      ref.current = player;
      player.addListener('ready', ({device_id}) => { if (active) setDevice(device_id); });
      player.addListener('not_ready', () => { if (active) setDevice(''); });
      player.addListener('player_state_changed', current => { if (active) setState(current); });
      player.addListener('initialization_error', () => {
        initializationFailed = true;
        if (active) {
          setDevice('');
          setNotice('이 브라우저에서 Spotify 플레이어를 시작할 수 없어요. Chrome에서 같은 Feelody 주소를 열어주세요.');
        }
      });
      for (const event of ['account_error','authentication_error','playback_error'] as const) player.addListener(event, fail);
      if (!await player.connect() && !initializationFailed) throw new Error('Spotify 재생 장치 연결에 실패했어요.');
    }
    void setup().catch(error => { if (!initializationFailed) fail(error); });
    return () => { active = false; player?.disconnect(); ref.current = null; };
  }, [linked]);
  useEffect(() => {
    let active = true;
    setSong(null);
    if (linked) {
      void resolveTrack(track).then(match => {
        if (!active) return;
        setSong(match);
        if (!match) setNotice('곡명과 아티스트가 일치하는 Spotify 원곡을 찾지 못했어요.');
      }).catch(error => { if (active) setNotice(error.message); });
    }
    return () => { active = false; };
  }, [track, linked]);
  useEffect(() => {
    const player = ref.current;
    if (!player || !device) return;
    if (!visible) {
      void player.pause().catch(() => {});
      return;
    }
    let active = true;
    const timer = setInterval(() => {
      void player.getCurrentState().then(value => { if (active) setState(value); }).catch(() => {});
    }, 1000);
    return () => { active = false; clearInterval(timer); };
  }, [visible, device]);
  const current = !!song?.spotifyId && state?.track_window.current_track.id === song.spotifyId;
  async function action() {
    setBusy(true); setNotice('');
    try {
      if (!linked) { await authorize(); setLinked(true); return; }
      if (!song?.spotifyId || !device || !ref.current) return;
      await ref.current.activateElement();
      if (current && state && (!state.paused || state.position > 0)) await ref.current.togglePlay();
      else await startPlayback(device, song.spotifyId);
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Spotify 연결을 확인해주세요.'); }
    finally { setBusy(false); }
  }
  const [drag, setDrag] = useState<number | null>(null);
  useEffect(() => { setDrag(null); }, [track.id, visible]);
  const displayed = song || track;
  const index = queue.findIndex(item => item.id === track.id);
  const previous = index > 0 ? queue[index - 1] : undefined;
  const next = index >= 0 ? queue[index + 1] : undefined;
  const duration = current && state ? state.duration : 0;
  const position = Math.min(duration, drag ?? (current && state ? state.position : 0));
  const playing = current && !state?.paused;
  async function control(command: () => Promise<void>) {
    setBusy(true); setNotice('');
    try { await command(); }
    catch (error) { setNotice(error instanceof Error ? error.message : '재생 상태를 확인해주세요.'); }
    finally { setBusy(false); setDrag(null); }
  }
  function skip(target?: Track) {
    if (!target || busy) return;
    void control(async () => {
      if (playing && device) {
        await ref.current?.activateElement();
        const match = await resolveTrack(target);
        if (!match?.spotifyId) throw new Error('다음 곡의 원곡을 찾지 못했어요.');
        await startPlayback(device, match.spotifyId);
        play(match);
      } else play(target);
    });
  }
  function seek(value: number) {
    if (!current || !ref.current || busy) return;
    void control(async () => {
      await ref.current!.seek(value);
      setState(await ref.current!.getCurrentState());
    });
  }

  return <main className="feel-player">
    <header><Control icon="chevron-down" label="음악 화면 닫기" disabled={busy} onClick={close} />
      <span>현재 재생 목록</span><span className="fp-counter">{index + 1} / {queue.length}</span></header>
    <section className="fp-body">
      <div className="fp-cover"><Image accessibilityLabel={displayed.title + ' 앨범 커버'} source={displayed.thumbnail ? {uri:displayed.thumbnail} : require('../assets/sky.png')} resizeMode="cover" style={{ width:'100%', height:'100%' }} /></div>
      <div className="fp-info"><div><h1>{displayed.title}</h1><p>{displayed.artist}</p></div>
        <Control icon={favorite ? 'heart' : 'heart-outline'} label={favorite ? '좋아요 취소' : '좋아요'} onClick={toggleFavorite} /></div>
      <input className="fp-range" type="range" aria-label="재생 위치" aria-valuetext={time(position)} min={0} max={duration || 1} step={1} disabled={!duration || busy}
        value={position} onChange={e => setDrag(Number(e.currentTarget.value))}
        onPointerUp={e => seek(Number(e.currentTarget.value))} onPointerCancel={() => setDrag(null)}
        onKeyUp={e => { if (drag !== null) seek(Number(e.currentTarget.value)); }} />
      <div className="fp-times"><span>{time(position)}</span><span>{duration ? time(duration) : '–:––'}</span></div>
      <div className="fp-controls">
        <Control icon="stop" label="정지" disabled={!current || busy} onClick={() => void control(async () => {
          await ref.current!.pause(); await ref.current!.seek(0); setState(await ref.current!.getCurrentState());
        })} />
        <Control icon="play-skip-back" label="이전 곡" disabled={!previous || busy} onClick={() => skip(previous)} />
        <Control main icon={playing ? 'pause' : 'play'} label={!linked ? 'Spotify 연결 후 재생' : playing ? '일시정지' : '재생'} disabled={busy || (linked && (!device || !song))} onClick={() => void action()} />
        <Control icon="play-skip-forward" label="다음 곡" disabled={!next || busy} onClick={() => skip(next)} />
        <Control icon="add-circle-outline" label="플레이리스트에 추가" onClick={addToPlaylist} />
      </div>
      {notice && <p role="status" className="fp-notice">{notice}</p>}
      {linked && !device && !notice && <p role="status" className="fp-notice">재생 장치 연결 중…</p>}
      {next && <button className="fp-next" disabled={busy} onClick={() => skip(next)}>
        <Icon name="list" size={22} color="#75688f" /><span><small>다음 곡</small><strong>{next.title}</strong><span>{next.artist}</span></span>
        <Icon name="chevron-forward" size={17} color="#75688f" />
      </button>}
    </section>
  </main>;
}

function Control({icon, label, main, disabled, onClick}: {icon: IconName; label: string; main?: boolean; disabled?: boolean; onClick: () => void}) {
  return <button className={main ? 'fp-button fp-primary' : 'fp-button'} aria-label={label} title={label} disabled={disabled} onClick={onClick}>
    <Icon name={icon} size={main ? 30 : 22} color={main ? '#ffffff' : 'currentColor'}/>
  </button>;
}
