import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, BackHandler, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Crypto from 'expo-crypto';
import type { Session } from '@supabase/supabase-js';
import { Notifications, MixDetail, type Mix, Analyzing, Graph, Home, InputScreen, LibraryScreen, PlaylistDetail, Profile, Records, Result } from './src/screens';
import { PlaylistPhotoPicker } from './src/PlaylistPhotoPicker';
import { Player } from './src/Player';
import { SettingsDialog } from './src/SettingsDialog';
import { NicknameSetup } from './src/NicknameSetup';
import { tracks, analyze, cloudMode, configReady, loadLibrary, persistLibrary, supabase, validateAnalysis } from './src/services';
import { emptyLibrary, localDate } from './src/domain';
import type { Entry, Library, Track } from './src/domain';
import { Button, C, Cloud, Icon, IconButton, IconName, s } from './src/ui';

type Screen = 'home' | 'input' | 'analyzing' | 'result' | 'records' | 'graph' | 'library' | 'playlist' | 'profile' | 'notifications';
type Dialog = { title: string; message?: string; confirm?: () => void; confirmLabel?: string; cancelLabel?: string } | null;
export default function App() { return <SafeAreaProvider><Main /></SafeAreaProvider>; }

function Main() {
  const [screen, setScreen] = useState<Screen>('home');
  const [library, setLibrary] = useState<Library>(emptyLibrary);
  const current = useRef(library);
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(!cloudMode || !configReady);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [retry, setRetry] = useState(0);
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [text, setText] = useState('');
  const [pending, setPending] = useState<Entry | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);
  const [mix,setMix] = useState<Mix | null>(null);
  const [song, setSong] = useState<Track | null>(null);
  const [playlistId, setPlaylistId] = useState<string | null>(null);
  const [playlistDialog, setPlaylistDialog] = useState<'create' | 'rename' | 'pick' | null>(null);
  const [playlistName, setPlaylistName] = useState('');
  const [photoLoading, setPhotoLoading] = useState(false);
  const [playlistPhoto, setPlaylistPhoto] = useState<string | undefined>();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [dialog, setDialog] = useState<Dialog>(null);
  const playlist = library.playlists.find(p => p.id === playlistId);
  const error = (e: unknown) => setDialog({ title: '잠깐만요', message: e instanceof Error ? e.message : '요청을 처리하지 못했어요.' });

  useEffect(() => {
    if (!cloudMode || !supabase) return;
    void supabase.auth.getSession().then(({ data, error: authError }) => {
      if (authError) error(new Error('로그인 정보를 불러오지 못했어요. 다시 로그인해주세요.'));
      setSession(data.session); setAuthReady(true);
    }).catch(e => { error(e); setAuthReady(true); });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => listener.subscription.unsubscribe();
  }, []);
  useEffect(() => {
    let alive = true;
    setSettingsOpen(false); setLoaded(false); setLoadError(''); setMix(null); setSong(null); setPending(null); setSelectedEntry(null); setScreen('home');
    const blank = emptyLibrary(); current.current = blank; setLibrary(blank);
    if (cloudMode && !session) return;
    void loadLibrary().then(next => { if (alive) { current.current = next; setLibrary(next); setLoaded(true); } }).catch(e => { if (alive) setLoadError(e instanceof Error ? e.message : '기록을 불러오지 못했어요.'); });
    return () => { alive = false; };
  }, [session?.user.id, retry]);
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (settingsOpen) { setSettingsOpen(false); return true; }
      if (dialog) { setDialog(null); return true; }
      if (playlistDialog) { setPlaylistDialog(null); return true; }
      if (song) { setSong(null); return true; }
      if (mix) { setMix(null); return true; }
      if (screen === 'input') { confirmLeaveInput(); return true; }
      if (screen === 'analyzing') return true;
      if (screen === 'home') return false;
      setScreen(screen === 'graph' ? 'records' : screen === 'playlist' ? 'library' : 'home'); return true;
    });
    return () => subscription.remove();
  }, [screen, song, mix, dialog, playlistDialog, settingsOpen, text]);

  async function mutate(update: (lib: Library) => Library, done?: () => void) {
    if (lock.current) return;
    lock.current = true; setBusy(true);
    try { const next = update(current.current); await persistLibrary(next); current.current = next; setLibrary(next); done?.(); }
    catch (e) { setPlaylistDialog(null); error(e); }
    finally { lock.current = false; setBusy(false); }
  }
  function confirmLeaveInput() {
    if (!text.trim()) { setScreen('home'); return; }
    setDialog({
      title: '감정글 작성을 중단 하시겠습니까?',
      message: '작성 중인 내용은 저장되지 않아요.',
      confirmLabel: '예', cancelLabel: '아니오',
      confirm: () => { setText(''); setPending(null); setScreen('home'); },
    });
  }
  async function runAnalysis() {
    if (!text.trim() || text.length > 500) return;
    setScreen('analyzing');
    try {
      const result = await analyze(text.trim());
      if (!validateAnalysis(result)) throw new Error('분석 결과를 읽지 못했어요. 다시 시도해주세요.');
      setPending({ ...result, id: Crypto.randomUUID(), text: text.trim(), createdAt: new Date().toISOString(), localDate: localDate() });
      setSelectedEntry(null); setScreen('result');
    } catch (e) { setScreen('input'); error(e); }
  }
  const favorite = (id: string) => void mutate(lib => ({ ...lib, favorites: lib.favorites.includes(id) ? lib.favorites.filter(x => x !== id) : [...lib.favorites, id] }));
  function play(track: Track) {
    setSong(track);
    void mutate(lib => ({ ...lib, recent: [track.id, ...lib.recent.filter(id => id !== track.id)].slice(0, 20) }));
  }
  function createPlaylist() {
    if (!playlistName.trim() || photoLoading) return;
    const id = Crypto.randomUUID();
    void mutate(lib => ({ ...lib, playlists: playlistDialog === 'rename' ? lib.playlists.map(p => p.id === playlistId ? { ...p, name: playlistName.trim(), coverUri: playlistPhoto } : p) : [{ id, name: playlistName.trim(), coverUri: playlistPhoto, trackIds: song ? [song.id] : [], createdAt: new Date().toISOString() }, ...lib.playlists] }), () => setPlaylistDialog(null));
  }
  async function logout() {
    if (!supabase) return;
    const { error: logoutError } = await supabase.auth.signOut();
    if (logoutError) error(logoutError);
  }
  function content() {
    if (cloudMode && !configReady) return <View style={[s.content, { flex: 1, justifyContent: 'center', gap: 18 }]}><Cloud /><Text style={s.title}>연결 설정이 필요해요</Text><Text style={s.body}>실제 연동 모드에는 API 서버 주소와 Supabase 설정이 필요합니다. 프로젝트의 실행 안내에 따라 환경변수를 설정해주세요.</Text></View>;
    if (!authReady) return <ActivityIndicator style={{ flex: 1 }} color={C.purple} />;
    if (cloudMode && !session) return <AuthScreen report={error} />;
    if (loadError) return <View style={[s.content, { flex: 1, justifyContent: 'center', gap: 20 }]}><Text style={s.heading}>기록을 불러오지 못했어요</Text><Text style={s.body}>{loadError}</Text><Button title="다시 시도" onPress={() => setRetry(n => n + 1)} />{cloudMode && <Button title="로그아웃" onPress={() => void logout()} subtle />}</View>;
    if (!loaded) return <ActivityIndicator style={{ flex: 1 }} color={C.purple} />;
    if (cloudMode && !library.name.trim()) return <NicknameSetup busy={busy} back={() => void logout()} save={name => void mutate(lib => ({ ...lib, name }), () => setScreen('home'))} />;
    if (song) return <Player track={song} close={() => setSong(null)} favorite={library.favorites.includes(song.id)} toggleFavorite={() => favorite(song.id)} addToPlaylist={() => setPlaylistDialog('pick')} play={play} />;
    if (mix) {
      const ids = mix.songs.map(t => t.id);
      const saved = library.playlists.some(p => p.name === mix.title && p.trackIds.join() === ids.join());
      return <MixDetail mix={mix} back={() => setMix(null)} play={play} liked={library.favorites} toggle={favorite} saved={saved} busy={busy}
        save={() => void mutate(lib => ({...lib,playlists:[{id:Crypto.randomUUID(),name:mix.title,trackIds:ids,createdAt:new Date().toISOString()},...lib.playlists]}))}/>;
    }
    switch (screen) {
      case 'home': return <Home library={library} input={() => { setText(''); setScreen('input'); }} play={play} openRecords={() => setScreen('records')} openEntry={entry => { setSelectedEntry(entry); setScreen('result'); }} settings={() => setSettingsOpen(true)} notifications={() => setScreen('notifications')} />;
      case 'notifications': return <Notifications back={() => setScreen('home')} />;
      case 'input': return <InputScreen text={text} setText={t => setText(t.slice(0, 500))} analyze={() => void runAnalysis()} back={confirmLeaveInput} />;
      case 'analyzing': return <Analyzing />;
      case 'result': {
        const entry = selectedEntry || pending;
        return entry && <Result result={entry} name={library.name} play={() => setMix({title:entry.musicMood,reason:entry.primaryEmotion+'의 마음에 어울리는 음악이에요.',songs:entry.tracks})} back={() => setScreen(selectedEntry ? 'records' : 'input')} saving={busy} stored={!!selectedEntry} save={() => void mutate(lib => ({ ...lib, entries: lib.entries.some(e => e.id === entry.id) ? lib.entries : [entry, ...lib.entries] }), () => { setPending(null); setText(''); setScreen('records'); })} remove={() => setDialog({ title: '이 기록을 삭제할까요?', message: '삭제한 기록은 되돌릴 수 없어요.', confirm: () => void mutate(lib => ({ ...lib, entries: lib.entries.filter(e => e.id !== entry.id) }), () => { setSelectedEntry(null); setScreen('records'); }) })} />;
      }
      case 'records': return <Records entries={library.entries} graph={() => setScreen('graph')} open={e => { setSelectedEntry(e); setScreen('result'); }} />;
      case 'graph': return <Graph entries={library.entries} back={() => setScreen('records')} />;
      case 'library': return <LibraryScreen library={library} play={play} toggleFavorite={favorite} create={() => { setPlaylistName(''); setPlaylistPhoto(undefined); setPlaylistDialog('create'); }} open={p => { setPlaylistId(p.id); setScreen('playlist'); }} />;
      case 'playlist': return playlist ? <PlaylistDetail playlist={playlist} back={() => setScreen('library')} play={play} removeTrack={id => void mutate(lib => ({ ...lib, playlists: lib.playlists.map(p => p.id === playlistId ? { ...p, trackIds: p.trackIds.filter(x => x !== id) } : p) }))} rename={() => { setPlaylistName(playlist.name); setPlaylistPhoto(playlist.coverUri); setPlaylistDialog('rename'); }} remove={() => setDialog({ title: '플레이리스트를 삭제할까요?', confirm: () => void mutate(lib => ({ ...lib, playlists: lib.playlists.filter(p => p.id !== playlistId) }), () => setScreen('library')) })} /> : null;
      case 'profile': return <Profile library={library} busy={busy} saveName={(name, done) => void mutate(lib => ({ ...lib, name }), done)} openRecords={() => setScreen('records')} logout={() => void logout()} clear={() => setDialog({ title: '체험 데이터를 모두 지울까요?', message: '이 기기에 저장한 감정 기록과 음악 목록이 삭제됩니다.', confirm: () => void mutate(() => emptyLibrary()) })} />;
    }
  }
  const onboarding = cloudMode && !!session && loaded && !library.name.trim();
  const showTabs = !onboarding && loaded && (!cloudMode || !!session) && !song && !mix && screen !== 'analyzing' && screen !== 'result' && screen !== 'notifications';
  const active = ['input', 'records', 'graph'].includes(screen) ? 'records' : screen === 'playlist' ? 'library' : screen;
  const tabs: { key: Screen; title: string; icon: IconName; selected: IconName }[] = [
    { key: 'home', title: '홈', icon: 'home-outline', selected: 'home' }, { key: 'records', title: '기록', icon: 'document-text-outline', selected: 'document-text' },
    { key: 'library', title: '플레이리스트', icon: 'musical-notes-outline', selected: 'musical-notes' }, { key: 'profile', title: '프로필', icon: 'person-outline', selected: 'person' }
  ];
  return <View style={{ flex: 1, backgroundColor: '#EBEDF8', alignItems: 'center' }}><SafeAreaView style={{ flex: 1, width: '100%', maxWidth: 480, backgroundColor: screen === 'home' && loaded && !song && !onboarding ? '#96B4EA' : C.bg }}><StatusBar style={screen === 'home' && loaded && !song && !onboarding ? 'light' : 'dark'} /><KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>{content()}</KeyboardAvoidingView>
    {showTabs && <View style={{ flexDirection: 'row', backgroundColor: '#FFFFFF', borderTopWidth: 1, borderColor: C.border, paddingTop: 9, paddingBottom: 8 }}>{tabs.map(tab => <Pressable key={tab.key} accessibilityRole="tab" accessibilityState={{ selected: active === tab.key }} accessibilityLabel={tab.title} onPress={() => setScreen(tab.key)} style={{ flex: 1, alignItems: 'center', gap: 5, paddingVertical: 6 }}><Icon name={active === tab.key ? tab.selected : tab.icon} color={active === tab.key ? C.purple : '#A0A5CD'} size={25} /><Text style={{ fontSize: 11, color: active === tab.key ? C.purple : C.muted }}>{tab.title}</Text></Pressable>)}</View>}
  </SafeAreaView>
  {settingsOpen && <SettingsDialog name={library.name} notificationsEnabled={library.notificationsEnabled ?? false} busy={busy} close={() => setSettingsOpen(false)} save={(name, notificationsEnabled) => void mutate(lib => ({ ...lib, name, notificationsEnabled }), () => setSettingsOpen(false))} />}
  <Modal visible={!!dialog} transparent animationType="fade" onRequestClose={() => setDialog(null)}><View style={s.sheetBackdrop}><View style={s.sheet}><Text style={s.heading}>{dialog?.title}</Text>{!!dialog?.message && <Text style={s.body}>{dialog.message}</Text>}<Button title={dialog?.confirmLabel || (dialog?.confirm ? '삭제하기' : '확인')} onPress={() => { const action = dialog?.confirm; setDialog(null); action?.(); }} />{dialog?.confirm && <Button title={dialog?.cancelLabel || "취소"} onPress={() => setDialog(null)} subtle />}</View></View></Modal>
  <Modal visible={!!playlistDialog} transparent animationType="slide" onRequestClose={() => setPlaylistDialog(null)}><KeyboardAvoidingView style={s.sheetBackdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><View style={s.sheet}><View style={s.sectionRow}><Text style={s.heading}>{playlistDialog === 'pick' ? '곡을 어디에 담을까요?' : playlistDialog === 'rename' ? '플레이리스트 수정' : '새 플레이리스트'}</Text><IconButton name="close" label="닫기" onPress={() => setPlaylistDialog(null)} /></View>{playlistDialog === 'pick' ? <><ScrollView style={{ maxHeight: 280 }}>{library.playlists.map(p => <Pressable key={p.id} disabled={busy} onPress={() => song && void mutate(lib => ({ ...lib, playlists: lib.playlists.map(x => x.id === p.id ? { ...x, trackIds: [...new Set([...x.trackIds, song.id])] } : x) }), () => { setPlaylistDialog(null); setDialog({ title: '플레이리스트에 담았어요' }); })} style={{ paddingVertical: 16, borderBottomWidth: 1, borderColor: C.border }}><Text style={s.trackTitle}>{p.name}</Text><Text style={s.small}>{p.trackIds.length}곡</Text></Pressable>)}{!library.playlists.length && <Text style={s.body}>아직 플레이리스트가 없어요. 새로 만들어볼까요?</Text>}</ScrollView><Button title="＋ 새로 만들기" onPress={() => { setPlaylistName(''); setPlaylistPhoto(undefined); setPlaylistDialog('create'); }} subtle /></> : <><PlaylistPhotoPicker key={playlistDialog} value={playlistPhoto} onChange={setPlaylistPhoto} disabled={busy} onBusyChange={setPhotoLoading} /><TextInput accessibilityLabel="플레이리스트 이름" autoFocus style={s.input} placeholder="예) 오늘도 괜찮아" placeholderTextColor="#9A9AA6" maxLength={40} value={playlistName} onChangeText={setPlaylistName} /><Button title="저장" onPress={createPlaylist} loading={busy} disabled={!playlistName.trim() || photoLoading} /></>}</View></KeyboardAvoidingView></Modal>
  </View>;
}

function AuthScreen({ report }: { report: (error: unknown) => void }) {
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [busy, setBusy] = useState(false); const [signup, setSignup] = useState(false);
  const [duplicate, setDuplicate] = useState(false);
  async function submit() {
    setBusy(true);
    try {
      if (signup) {
        const { data, error } = await supabase!.auth.signUp({ email: email.trim(), password });
        const alreadyRegistered = error?.code === 'user_already_exists' ||
          error?.code === 'email_exists' || error?.message.toLowerCase() === 'user already registered';
        if (alreadyRegistered || (!error && !data.session && data.user?.identities?.length === 0)) {
          setDuplicate(true);
          return;
        }
        if (error) throw error;
        if (!data.session) report(new Error('인증 메일을 확인한 뒤 로그인해주세요.'));
      } else { const { error } = await supabase!.auth.signInWithPassword({ email: email.trim(), password }); if (error) throw new Error('로그인하지 못했어요. 이메일과 비밀번호를 확인해주세요.'); }
    } catch (e) { report(e); } finally { setBusy(false); }
  }
  return <><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[s.content, { flexGrow: 1, justifyContent: 'center', gap: 18 }]}><View style={{ alignItems: 'center' }}><Cloud size={170} /><Text style={[s.title, { marginTop: 22 }]}>Feelody</Text><Text style={[s.body, { textAlign: 'center', marginVertical: 14 }]}>오늘의 마음에,{ '\n' }음악 한 곡을 건네다.</Text></View><TextInput accessibilityLabel="이메일" style={s.input} placeholder="이메일" keyboardType="email-address" autoCapitalize="none" autoComplete="email" value={email} onChangeText={setEmail} /><TextInput accessibilityLabel="비밀번호" style={s.input} placeholder="비밀번호 · 8자 이상" secureTextEntry autoComplete={signup ? 'new-password' : 'current-password'} value={password} onChangeText={setPassword} /><Button title={signup ? '회원가입' : '로그인'} onPress={() => void submit()} loading={busy} disabled={!email.includes('@') || password.length < (signup ? 8 : 1)} /><Button title={signup ? '이미 계정이 있어요' : '처음이에요 · 회원가입'} onPress={() => setSignup(!signup)} subtle disabled={busy} /><Text style={[s.small, { textAlign: 'center', fontSize: 11 }]}>감정 분석 시 입력한 글과 음성은 OpenAI로 전송됩니다.{ '\n' }저장한 기록은 본인 계정에서만 확인할 수 있어요.</Text></ScrollView>
    <Modal visible={duplicate} transparent animationType="fade" onRequestClose={() => setDuplicate(false)}>
      <View style={s.sheetBackdrop}><View style={s.sheet}>
        <Text style={s.heading}>이미 가입된 이메일이에요</Text>
        <Text style={s.body}>이 이메일로 만든 계정이 있어요. 기존 비밀번호로 로그인해주세요.</Text>
        <Button title="로그인하기" onPress={() => {
          setSignup(false);
          setPassword('');
          setDuplicate(false);
        }} />
        <Button title="다른 이메일로 가입하기" subtle onPress={() => setDuplicate(false)} />
      </View></View>
    </Modal></>;
}
