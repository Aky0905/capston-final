import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Image, ImageBackground, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AudioModule, RecordingPresets, setAudioModeAsync, useAudioRecorder, useAudioRecorderState } from 'expo-audio';
import Svg, { Circle } from 'react-native-svg';
import type { Analysis, Entry, Library, Playlist, Track } from './domain';
import { calendarCells, localDate, moodColors, moodFaces, monthStats, streak, weeklyRecordDays } from './domain';
import { cloudMode, tracks, savedTracks, transcribe } from './services';
import { PasswordSettings } from './PasswordSettings';
import { DailyEntriesPager } from './DailyEntriesPager';
import { EmotionHistoryPreview } from './EmotionHistoryPreview';
import { Button, C, Card, Cloud, Cover, Empty, Icon, IconButton, MoodChip, s, TrackRow } from './ui';

export function Home({ library, input, play, openRecords, openEntry, settings, notifications }: { library: Library; input: () => void; openEntry: (entry: Entry) => void; play: (t: Track) => void; openRecords: () => void; settings: () => void; notifications: () => void }) {
  const last = [...tracks,...savedTracks].find(t => t.id === library.recent[0]);
  const days = streak(library.entries);
  const [headerWidth, setHeaderWidth] = useState(480);
  return <ScrollView style={s.page} contentContainerStyle={{ paddingBottom: 26 }}>
    <View onLayout={event => setHeaderWidth(event.nativeEvent.layout.width)} style={{ height: 345, overflow: 'hidden' }}>
      <Image source={require('../assets/home-sky-lavender.png')} resizeMode="cover" style={{ position: 'absolute', bottom: 0, width: '100%', height: Math.max(345, headerWidth * 1086 / 1448) }} />
      <View style={{ padding: 25, paddingTop: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}><View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}><Image source={require('../assets/logo.png')} style={{ width: 40, height: 34 }} resizeMode="contain" /><Text style={{ color: 'white', fontSize: 23, fontFamily: Platform.select({ ios: 'ArialRoundedMTBold', android: 'sans-serif-rounded', web: '"Arial Rounded MT Bold", "Trebuchet MS", sans-serif' }), fontWeight: Platform.OS === 'ios' ? 'normal' : '700', letterSpacing: 0.4 }}>Feelody</Text></View><View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'flex-end', marginLeft: 8 }}><Text style={{ color: 'white', fontSize: 13, flexShrink: 1 }}>{days ? `🔥 ${days}일 연속 기록 중` : '오늘도 반가워요'}</Text><IconButton name="notifications-outline" label="알림 보기" onPress={notifications} color="white" /><IconButton name="settings-outline" label="설정 열기" onPress={settings} color="white" /></View></View>
        <Text style={[s.title, { fontSize: 27, lineHeight: 38, marginTop: 25 }]}>{library.name}님,{ '\n' }지금 마음은 어떤가요?</Text>
        <Text style={[s.small, { color: '#455C89', marginTop: 10, fontSize: 14 }]}>어떤 감정이든 괜찮아요.{ '\n' }오늘의 마음에 어울리는 음악을 찾아볼까요?</Text>
        <View style={{ alignSelf: 'flex-end', marginTop: -9, marginRight: 4 }}><Cloud size={135} /></View>
      </View>
    </View>
    <View style={{ paddingHorizontal: 22, marginTop: -36 }}>
      <Pressable accessibilityRole="button" onPress={input}><Card style={{ flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 95, shadowColor: '#A9A1DB', shadowOpacity: 0.12, shadowRadius: 12, elevation: 2 }}><View style={{ backgroundColor: '#E9E3FF', width: 57, height: 57, borderRadius: 30, alignItems: 'center', justifyContent: 'center' }}><Icon name="happy-outline" size={35} color={C.purple} /></View><View style={{ flex: 1 }}><Text style={s.trackTitle}>지금, 내 감정 기록하기</Text><Text style={s.small}>오늘의 감정을 들려주세요.</Text></View><Icon name="arrow-forward" color={C.purple} size={21} /></Card></Pressable>
      {!cloudMode && <Text style={[s.small, { marginTop: 13, fontSize: 11 }]}>체험 모드 · 분석 예시이며 실제 AI 분석이 아닙니다.</Text>}
      <EmotionHistoryPreview entries={library.entries} openRecords={openRecords} openEntry={openEntry} input={input} />
      <Card style={{ marginTop: 26, paddingVertical: 10 }}><Text style={[s.heading, { fontSize: 17, marginTop: 3 }]}>최근 확인한 음악</Text>{last ? <TrackRow track={last} onPress={() => play(last)} /> : <Text style={[s.small, { paddingVertical: 16 }]}>마음에 드는 음악을 골라보세요.</Text>}</Card>
    </View>
  </ScrollView>;
}

export function InputScreen({ text, setText, analyze, back }: { text: string; setText: (t: string) => void; analyze: () => void; back: () => void }) {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const state = useAudioRecorderState(recorder, 250);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const operation = useRef(false);
  const mounted = useRef(true);
  useEffect(() => () => { mounted.current = false; void setAudioModeAsync({ allowsRecording: false }); }, []);
  async function stop() {
    if (operation.current) return;
    operation.current = true; setBusy(true);
    try {
      await recorder.stop();
      await setAudioModeAsync({ allowsRecording: false });
      if (!recorder.uri) throw new Error('녹음 파일이 없어요. 다시 시도해주세요.');
      const result = await transcribe(recorder.uri);
      if (!mounted.current) return;
      if (result.length > 500) { setNotice('인식 결과가 500자를 넘었어요. 조금 짧게 다시 녹음해주세요.'); return; }
      setText(result); setNotice('인식한 내용을 확인하고 자유롭게 수정해주세요.');
    } catch (e) { if (mounted.current) setNotice(e instanceof Error ? e.message : '음성 인식에 실패했어요.'); }
    finally { operation.current = false; if (mounted.current) setBusy(false); }
  }
  useEffect(() => { if (state.isRecording && state.durationMillis >= 60000) void stop(); }, [state.durationMillis, state.isRecording]);
  async function record() {
    if (state.isRecording) { await stop(); return; }
    if (!cloudMode) { setNotice('음성 인식은 실제 연동 모드에서 사용할 수 있어요. 지금은 글로 입력해주세요.'); return; }
    if (operation.current) return;
    operation.current = true; setBusy(true); setNotice('');
    try {
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      if (!permission.granted) throw new Error('마이크 권한을 허용하면 음성으로 입력할 수 있어요.');
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync(); recorder.record({ forDuration: 61 });
    } catch (e) { setNotice(e instanceof Error ? e.message : '녹음을 시작하지 못했어요.'); }
    finally { operation.current = false; setBusy(false); }
  }
  return <ScrollView style={s.page} keyboardShouldPersistTaps="handled" contentContainerStyle={[s.content, { flexGrow: 1 }]}>
    <View style={[s.sectionRow, { marginHorizontal: -12 }]}><IconButton name="chevron-back" label="뒤로" onPress={back} /><Text style={s.small}>마음을 기록하는 시간</Text><View style={{ width: 44 }} /></View>
    <Text style={s.title}>지금 마음을 들려주세요.</Text><Text style={[s.body, { marginTop: 14 }]}>기쁜 마음도, 복잡한 마음도 괜찮아요.{ '\n' }편하게 적어주세요.</Text>
    <View style={{ marginTop: 35 }}><TextInput accessibilityLabel="감정 또는 고민 입력" style={[s.input, { minHeight: 240, textAlignVertical: 'top', paddingBottom: 35 }]} multiline maxLength={500} value={text} onChangeText={setText} placeholder={'지금 느끼는 감정을 자유롭게 입력해주세요.\n예) 요즘 해야 할 일은 많은데 어디서부터 시작해야 할지 모르겠어요. 미래에 대한 걱정도 많고, 내가 잘하고 있는 건지 불안해요. 누군가에게 위로 받고 싶은 하루예요.'} placeholderTextColor="#A2A4CF" editable={!busy && !state.isRecording} /><Text style={{ color: C.muted, position: 'absolute', right: 16, bottom: 12, fontSize: 12 }}>{text.length}/500</Text></View>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 13 }}>{['기쁨', '슬픔', '분노', '우울', '평온', '잘 모르겠어요'].map(t => {
      const tag = `#${t}`;
      const pattern = new RegExp(`(^|\\s)${tag}(?=\\s|$)`, 'g');
      const selected = pattern.test(text);
      return <Pressable key={t} accessibilityRole="button" accessibilityLabel={tag} accessibilityState={{ selected, disabled: busy || state.isRecording }} disabled={busy || state.isRecording}
        onPress={() => setText(selected ? text.replace(pattern, '$1').trimEnd() : (text.trimEnd() ? text.trimEnd() + ' ' : '') + tag)}
        style={{ paddingHorizontal: 16, paddingVertical: 9, borderRadius: 24, borderWidth: 1.5, borderColor: selected ? C.purple : '#E3DEFF', backgroundColor: selected ? '#EDE7FF' : '#FDFBFF' }}>
        <Text style={{ color: selected ? C.purple : C.muted, fontSize: 13, fontWeight: selected ? '600' : '400' }}>{tag}</Text>
      </Pressable>;
    })}</View>
    <View style={{ alignItems: 'center', marginVertical: 26 }}><View style={{ padding: 12, borderRadius: 90, borderWidth: 1, borderColor: '#EFEBFF', backgroundColor: '#F8F6FF' }}><Pressable accessibilityRole="button" accessibilityLabel={state.isRecording ? '녹음 종료 및 음성 인식' : '음성 입력 시작'} disabled={busy} onPress={() => void record()}><LinearGradient colors={state.isRecording ? ['#EE9BAF', '#B397F3'] : ['#9480FF', '#76B4FF']} style={{ width: 90, height: 90, borderRadius: 50, alignItems: 'center', justifyContent: 'center' }}>{busy ? <ActivityIndicator color="white" /> : <Icon name={state.isRecording ? 'stop' : 'mic'} size={42} color="white" />}</LinearGradient></Pressable></View><Text style={[s.small, { color: C.purple, marginTop: 14 }]}>{state.isRecording ? `남은 시간 ${Math.max(0, 60 - Math.floor(state.durationMillis / 1000))}초 · 누르면 종료` : busy ? '목소리를 글로 옮기고 있어요…' : '음성으로도 입력할 수 있어요. · 최대 60초'}</Text></View>
    {!!notice && <Text accessibilityLiveRegion="polite" style={[s.small, { color: '#8B6092', marginBottom: 15 }]}>{notice}</Text>}
    <View style={{ flex: 1 }} /><Button title="내 마음 분석하기  ›" disabled={!text.trim() || busy || state.isRecording} onPress={analyze} />
    {cloudMode && <Text style={[s.small, { textAlign: 'center', fontSize: 11, marginTop: 14 }]}>분석을 위해 입력 내용이 OpenAI로 전송됩니다.{ '\n' }결과는 저장 버튼을 누른 경우에만 기록에 남아요.</Text>}
  </ScrollView>;
}

export function Analyzing() {
  const float = useRef(new Animated.Value(0)).current;
  useEffect(() => { const a = Animated.loop(Animated.sequence([Animated.timing(float, { toValue: -13, duration: 1500, useNativeDriver: true }), Animated.timing(float, { toValue: 0, duration: 1500, useNativeDriver: true })])); a.start(); return () => a.stop(); }, [float]);
  return <LinearGradient colors={['#DEE4FF', '#FFF0F7', '#E2E8FF']} style={[s.page, { alignItems: 'center', justifyContent: 'center', padding: 30 }]}><Animated.View style={{ transform: [{ translateY: float }], marginBottom: 35 }}><Cloud size={210} /></Animated.View><Text style={[s.title, { fontSize: 24, textAlign: 'center', lineHeight: 36 }]}>지금, 당신의 감정을{ '\n' }살펴보고 있어요…</Text><Text style={[s.body, { marginTop: 16 }]}>조금만 기다려주세요.</Text><ActivityIndicator style={{ marginTop: 45 }} size="large" color="#A494F1" /><Text style={[s.small, { position: 'absolute', bottom: 48, textAlign: 'center' }]}>당신의 감정은 소중하니까,{ '\n' }Feelody가 함께할게요.</Text></LinearGradient>;
}

export function Result({ result, name, save, saving, back, play, stored, remove }: { result: Entry; name: string; save: () => void; saving: boolean; back: () => void; play: (t: Track) => void; stored: boolean; remove: () => void }) {
  return <LinearGradient colors={['#FFF9E3', '#FFFDF4', '#FFFFFF']} style={s.page}><ScrollView contentContainerStyle={[s.content, { flexGrow: 1 }]}><View style={{ alignSelf: 'flex-start', marginLeft: -12 }}><IconButton name="chevron-back" label="뒤로" onPress={back} /></View><View style={{ alignItems: 'flex-end', marginTop: 5, marginBottom: -10 }}><Cloud size={140} /></View><Text style={s.title}>{name}님,</Text>
    {stored && <Text style={[s.small, { marginTop: 12 }]}>{result.localDate}의 마음</Text>}
    <Text selectable style={[s.body, { marginTop: 12, color: '#615879' }]}>“{result.text}”</Text>
    <Text style={[s.body, { fontSize: 19, lineHeight: 32, marginTop: 20, marginBottom: 24 }]}>{result.message}</Text>
    {result.source === 'demo' && <Text style={[s.small, { marginBottom: 14 }]}>체험용 분석 예시 · 실제 OpenAI 분석이 아닙니다.</Text>}
    {result.tracks[0] && <Pressable accessibilityRole="button" onPress={() => play(result.tracks[0]!)}><Card><Text style={s.small}>오늘의 마음을 위한 음악</Text><Text style={[s.heading,{marginVertical:8}]}>{result.musicMood} · {result.tracks.length}곡</Text><Text style={{color:C.purple}}>추천곡 보기  ›</Text></Card></Pressable>}
    <Card style={{ marginTop: 22, minHeight: 140 }}><Text style={[s.heading, { fontSize: 17 }]}>이런 감정이 느껴졌어요</Text><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginTop: 20 }}>{[result.primaryEmotion, ...result.secondaryEmotions].map(mood => <MoodChip key={mood} mood={mood} />)}</View></Card>
    <Text style={[s.small, { marginTop: 18, marginBottom: 25, textAlign: 'center', fontSize: 11 }]}>감정 해석은 참고용이며 의료적 진단이 아닙니다.</Text><View style={{ flex: 1 }} />
    {stored ? <Button title="이 기록 삭제하기" onPress={remove} subtle disabled={saving} /> : <Button title="감정 기록 저장하기" onPress={save} loading={saving} />}
  </ScrollView></LinearGradient>;
}

const calendarMoodColors: Record<string, string> = { 기쁨: '#F4C542', 슬픔: '#619DE6', 분노: '#EA6B6B', 우울: '#A5A7AF', 평온: '#A18ADE', '잘 모르겠어요': '#76B88A', 기타: '#76B88A' };

export function Records({ entries, graph, open }: { entries: Entry[]; graph: () => void; open: (entry: Entry) => void }) {
  const now = new Date(); const [month, setMonth] = useState(new Date(now.getFullYear(), now.getMonth(), 1));
  const [selected, setSelected] = useState(localDate(now));
  const prefix = localDate(month).slice(0, 7);
  const cells = calendarCells(month.getFullYear(), month.getMonth());
  const selectedEntries = entries.filter(e => e.localDate === selected);
  const stats = monthStats(entries, prefix).filter(x => x.count > 0);
  function shift(delta: number) { const next = new Date(month.getFullYear(), month.getMonth() + delta, 1); setMonth(next); setSelected(localDate(next)); }
  return <ScrollView style={s.page} contentContainerStyle={s.content}><View style={s.sectionRow}><Text style={s.title}>감정 기록</Text><Icon name="calendar-outline" size={28} /></View><View style={[s.sectionRow, { marginTop: 16 }]}><IconButton name="chevron-back" label="이전 달" onPress={() => shift(-1)} /><Text style={s.heading}>{month.getFullYear()}년 {month.getMonth() + 1}월</Text><IconButton name="chevron-forward" label="다음 달" onPress={() => shift(1)} /></View>
    <View style={{ flexDirection: 'row', paddingVertical: 10, borderRadius: 20, backgroundColor: '#F1F0FA', borderWidth: 1, borderColor: '#E5E2F4' }}>{['일', '월', '화', '수', '목', '금', '토'].map(d => <Text key={d} style={{ width: `${100 / 7}%`, textAlign: 'center', color: '#67759C', fontWeight: '500' }}>{d}</Text>)}</View>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 }}>{cells.map((day, i) => {
      const date = day ? `${prefix}-${String(day).padStart(2, '0')}` : '';
      const dayEntries = entries.filter(e => e.localDate === date);
      const current = selected === date;
      return <Pressable key={i} disabled={!day} accessibilityRole="button" accessibilityLabel={day ? `${date}, 기록 ${dayEntries.length}개` : undefined} onPress={() => setSelected(date)} style={{ width: `${100 / 7}%`, minHeight: 66, alignItems: 'center', paddingTop: 12, borderRadius: 20, backgroundColor: current ? '#F0ECFF' : 'transparent' }}><Text style={{ color: current ? C.purple : C.ink, fontSize: 16, fontWeight: current ? '700' : '400' }}>{day || ''}</Text><View style={{ flexDirection: 'row', gap: 2, marginTop: 9 }}>{dayEntries.slice(0, 3).map(e => <View key={e.id} style={{ width: 7, height: 7, borderRadius: 7, backgroundColor: calendarMoodColors[e.primaryEmotion] ?? moodColors[e.primaryEmotion] }} />)}</View></Pressable>;
    })}</View>
    <Card style={{ marginTop: 18 }}><View style={s.sectionRow}><Text style={[s.heading, { fontSize: 17 }]}>{Number(selected.slice(5, 7))}월 {Number(selected.slice(8))}일의 마음</Text><Text style={{ color: C.purple, fontSize: 12 }}>{selectedEntries.length}회 기록</Text></View><DailyEntriesPager key={selected + ':' + selectedEntries.map(entry => entry.id).join(',')} entries={selectedEntries} open={open} /></Card>
    <Pressable accessibilityRole="button" onPress={graph}><Card style={{ marginTop: 16 }}><View style={s.sectionRow}><Text style={[s.heading, { fontSize: 17 }]}>월간 감정 그래프</Text><Icon name="chevron-forward" size={19} color={C.purple} /></View><Text style={s.small}>기록한 마음을 한눈에 돌아보세요.</Text><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>{stats.length ? stats.map(x => <View key={x.mood} style={{ padding: 10, borderRadius: 16, backgroundColor: moodColors[x.mood] + '25', alignItems: 'center', minWidth: 60 }}><Text style={{ fontSize: 22, color: C.ink }}>{moodFaces[x.mood]}</Text><Text style={s.small}>{x.mood} {x.count}회</Text></View>) : <Text style={s.small}>첫 기록을 기다리고 있어요.</Text>}</View></Card></Pressable>
  </ScrollView>;
}

export function Graph({ entries, back }: { entries: Entry[]; back: () => void }) {
  const [month, setMonth] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const stats = monthStats(entries, localDate(month).slice(0, 7));
  const total = stats.reduce((sum, x) => sum + x.count, 0);
  let offset = 0;
  return <ScrollView style={s.page} contentContainerStyle={s.content}><View style={{ marginLeft: -12 }}><IconButton name="chevron-back" label="기록으로 돌아가기" onPress={back} /></View><Text style={s.title}>월간 감정 그래프</Text><View style={[s.sectionRow, { marginTop: 28 }]}><IconButton name="chevron-back" label="이전 달" onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} /><Text style={s.heading}>{month.getFullYear()}년 {month.getMonth() + 1}월</Text><IconButton name="chevron-forward" label="다음 달" onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} /></View>
    <View style={{ alignSelf: 'center', width: 280, height: 280, marginTop: 25 }}><Svg width={280} height={280} viewBox="0 0 280 280"><Circle cx={140} cy={140} r={103} fill="none" stroke="#F0EFF9" strokeWidth={48} />{stats.filter(x => x.count > 0).map(x => { const length = x.fraction * 2 * Math.PI * 103; const dashOffset = -offset; offset += length; return <Circle key={x.mood} cx={140} cy={140} r={103} fill="none" stroke={moodColors[x.mood]} strokeWidth={48} strokeDasharray={`${length} ${2 * Math.PI * 103 - length}`} strokeDashoffset={dashOffset} rotation={-90} origin="140,140" />; })}</Svg><View style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center' }}><Text style={s.heading}>이번 달 감정</Text><Text style={[s.small, { marginTop: 8 }]}>{total}개의 마음</Text></View></View>
    {total ? <View style={{ gap: 14, marginTop: 30 }}>{stats.filter(x => x.count > 0).map(x => <View key={x.mood} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}><View style={{ width: 12, height: 12, borderRadius: 10, backgroundColor: moodColors[x.mood] }} /><Text style={[s.body, { flex: 1 }]}>{x.mood}</Text><Text style={s.small}>{x.count}회</Text><Text style={{ width: 65, textAlign: 'right', color: C.ink, fontSize: 20, fontWeight: '600' }}>{Math.round(x.fraction * 100)}%</Text></View>)}</View> : <Empty title="아직 기록이 없어요" detail="이 달의 마음을 기록하면 그래프가 나타나요." />}
    <Text style={[s.small, { marginTop: 30, fontSize: 11 }]}>기록별 대표 감정 1개를 기준으로 계산합니다.{ '\n' }표시 비율은 반올림으로 합계가 100%와 조금 다를 수 있어요.</Text>
  </ScrollView>;
}

export function LibraryScreen({ library, play, create, open, toggleFavorite }: { library: Library; play: (t: Track) => void; create: () => void; open: (p: Playlist) => void; toggleFavorite: (id: string) => void }) {
  const [tab, setTab] = useState<'mine' | 'likes'>('mine');
  return <ScrollView style={s.page} contentContainerStyle={s.content}><Text style={s.title}>플레이리스트</Text><View style={{ flexDirection: 'row', borderBottomWidth: 1, borderColor: C.border, marginTop: 24, marginBottom: 24 }}>{(['mine', 'likes'] as const).map(t => <Pressable key={t} onPress={() => setTab(t)} style={{ flex: 1, alignItems: 'center', paddingVertical: 16, borderBottomWidth: 2, borderColor: tab === t ? C.ink : 'transparent' }}><Text style={{ color: tab === t ? C.ink : C.muted, fontWeight: '600' }}>{t === 'mine' ? '내 플레이리스트' : '좋아요한 음악'}</Text></Pressable>)}</View>
    {tab === 'mine' ? <><Button title="＋ 새 플레이리스트 만들기" onPress={create} subtle />{library.playlists.length ? library.playlists.map(p => { const cover = [...tracks,...savedTracks].find(t => t.id === p.trackIds[0]) || tracks[0]!; return <Pressable key={p.id} onPress={() => open(p)} style={{ flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 22, borderBottomWidth: 1, borderColor: '#F0F0F8' }}><View>{p.coverUri ? <Image source={{ uri: p.coverUri }} style={{ width: 74, height: 74, borderRadius: 14 }} resizeMode="cover" /> : <Cover track={cover} size={74} />}</View><View style={{ flex: 1 }}><Text style={s.trackTitle}>{p.name}</Text><Text style={[s.small, { marginTop: 6 }]}>{p.trackIds.length}곡 · 생성일 {p.createdAt.slice(0, 10).replace(/-/g, '.')}</Text></View><Icon name="chevron-forward" size={20} /></Pressable>; }) : <Empty title="나만의 음악을 모아보세요" detail="플레이리스트를 만들고 음악 화면에서 곡을 추가할 수 있어요." />}</> : <>{[...tracks,...savedTracks].filter(t => library.favorites.includes(t.id)).map(t => <TrackRow key={t.id} track={t} onPress={() => play(t)} action={<IconButton name="heart" color={C.purple} label="좋아요 취소" onPress={() => toggleFavorite(t.id)} />} />)}{!library.favorites.length && <Empty title="아직 좋아요한 음악이 없어요" detail="음악 화면에서 하트를 눌러 마음에 드는 곡을 모아보세요." />}</>}
  </ScrollView>;
}

export function PlaylistDetail({ playlist, back, play, removeTrack, rename, remove }: { playlist: Playlist; back: () => void; play: (t: Track) => void; removeTrack: (id: string) => void; rename: () => void; remove: () => void }) {
  return <ScrollView style={s.page} contentContainerStyle={s.content}><View style={[s.sectionRow, { marginHorizontal: -12 }]}><IconButton name="chevron-back" label="목록으로" onPress={back} /><IconButton name="create-outline" label="플레이리스트 수정" onPress={rename} /></View>{playlist.coverUri && <Image source={{ uri: playlist.coverUri }} accessibilityLabel={`${playlist.name} 표지`} style={{ width: 160, height: 160, borderRadius: 24, alignSelf: 'center', marginBottom: 24 }} resizeMode="cover" />}<Text style={s.title}>{playlist.name}</Text><Text style={[s.small, { marginTop: 10, marginBottom: 18 }]}>{playlist.trackIds.length}곡 · Feelody에 저장한 플레이리스트</Text>{playlist.trackIds.map(id => [...tracks,...savedTracks].find(t => t.id === id)).filter((t): t is Track => !!t).map(t => <TrackRow key={t.id} track={t} onPress={() => play(t)} action={<IconButton name="remove-circle-outline" label={`${t.title} 목록에서 제거`} onPress={() => removeTrack(t.id)} />} />)}{!playlist.trackIds.length && <Empty title="첫 곡을 추가해보세요" detail="음악 재생 화면에서 ‘플레이리스트’를 누르면 곡을 담을 수 있어요." />}<View style={{ marginTop: 30 }}><Button title="플레이리스트 삭제" onPress={remove} subtle /></View></ScrollView>;
}

export function Profile({ library, saveName, openRecords, logout, clear, busy }: { library: Library; saveName: (name: string, done: () => void) => void; openRecords: () => void; logout: () => void; clear: () => void; busy: boolean }) {
  const [name, setName] = useState(library.name);
  const [editing, setEditing] = useState(false);
  const close = () => { if (!busy) setEditing(false); };
  return <>
    <ScrollView style={s.page} contentContainerStyle={s.content}>
      <Text style={s.title}>프로필</Text>
      <View style={{ alignItems: 'center', marginVertical: 30 }}><Cloud size={135} /><Text style={[s.heading, { marginTop: 16 }]}>{library.name}님의 작은 쉼터</Text></View>
      <Card>
        <Text style={s.heading}>내 프로필</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 22 }}>
          <View style={{ flex: 1, gap: 8 }}><Text style={s.body}>닉네임</Text><Text style={s.heading}>{library.name}</Text></View>
          <Pressable accessibilityRole="button" accessibilityLabel="닉네임 수정하기" disabled={busy} onPress={() => { setName(library.name); setEditing(true); }} style={{ borderRadius: 24, backgroundColor: '#F0EBFF', paddingHorizontal: 16, paddingVertical: 10 }}><Text style={{ color: C.purple, fontSize: 14 }}>수정하기</Text></Pressable>
        </View>
      </Card>
      <Card style={{ marginTop: 18 }}>
        <Text style={s.heading}>나의 감정 기록</Text>
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 22 }}>
          {[{ value: library.entries.length, unit: '회', label: '전체 감정 기록' }, { value: weeklyRecordDays(library.entries), unit: '일', label: '이번 주 기록 일수' }].map(item => <View key={item.label} style={{ flex: 1, minWidth: 0, backgroundColor: '#F5F2FC', borderRadius: 18, padding: 14, gap: 22 }}>
            <Text style={{ color: C.ink, fontSize: 32, fontWeight: '700' }}>{item.value}<Text style={{ fontSize: 24 }}>{item.unit}</Text></Text>
            <Text style={[s.small, { fontSize: 13 }]}>{item.label}</Text>
          </View>)}
        </View>
        <Pressable accessibilityRole="button" onPress={openRecords} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingTop: 20, paddingBottom: 2 }}><Text style={[s.body, { fontSize: 15 }]}>나의 감정 기록 확인하기</Text><Icon name="chevron-forward" color={C.purple} size={21} /></Pressable>
      </Card>
      {cloudMode && <PasswordSettings />}
      <Text style={[s.small, { marginVertical: 22, fontSize: 12 }]}>Feelody는 감정 기록과 음악 탐색을 돕는 서비스입니다. 의료적 진단이나 전문 심리치료를 제공하지 않습니다.</Text>
      <Button title={cloudMode ? '로그아웃' : '체험 데이터 모두 지우기'} onPress={cloudMode ? logout : clear} subtle disabled={busy} />
    </ScrollView>
    <Modal visible={editing} transparent animationType="fade" onRequestClose={close}>
      <View style={s.sheetBackdrop}><View style={s.sheet}>
        <View style={[s.sectionRow, { marginBottom: 0 }]}><Text style={s.heading}>닉네임 변경</Text><IconButton name="close" label="닉네임 변경 닫기" onPress={close} /></View>
        <TextInput accessibilityLabel="새 닉네임" style={s.input} maxLength={20} value={name} onChangeText={setName} editable={!busy} autoFocus />
        <Button title="저장" onPress={() => saveName(name.trim(), () => setEditing(false))} loading={busy} disabled={!name.trim() || name.trim() === library.name} />
        <Button title="취소" onPress={close} subtle disabled={busy} />
      </View></View>
    </Modal>
  </>;
}

export type Mix = { title: string; reason: string; songs: Track[] };
export function MixDetail({ mix, back, play, save, saved, busy, liked, toggle }: { mix: Mix; back: () => void; play: (t: Track) => void; save: () => void; saved: boolean; busy: boolean; liked: string[]; toggle: (id: string) => void }) {
  const first = mix.songs[0];
  return <ScrollView style={mixStyles.page} contentContainerStyle={mixStyles.content}>
    <View style={mixStyles.nav}>
      <IconButton name="chevron-back" label="추천 목록 닫기" onPress={back} />
      <Text style={mixStyles.navTitle}>추천 플레이리스트</Text>
    </View>

    <LinearGradient colors={['#E6E2FF', '#E0ECFA', '#F7F1FB']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={mixStyles.hero}>
      <View accessible={false} importantForAccessibility="no-hide-descendants" style={mixStyles.sleeve}>
        <LinearGradient colors={['#29253F', '#55516D', '#242039']} style={mixStyles.disc}>
          <View style={mixStyles.groove}><View style={mixStyles.label}><View style={mixStyles.spindle} /></View></View>
        </LinearGradient>
        <Image accessible={false} source={first?.thumbnail ? { uri: first.thumbnail } : require('../assets/sky.png')} style={mixStyles.art} />
      </View>
      <Text style={mixStyles.title}>{mix.title}</Text>
      <Text style={mixStyles.reason}>{mix.reason}</Text>
      <View style={mixStyles.actions}>
        {first && <Pressable accessibilityRole="button" accessibilityLabel="첫 곡 재생 화면 열기" onPress={() => play(first)} style={mixStyles.play}>
          <Icon name="play" size={16} color="white" /><Text style={mixStyles.playText}>첫 곡 듣기</Text>
        </Pressable>}
        <Pressable accessibilityRole="button" accessibilityLabel={saved ? '플레이리스트 저장됨' : '내 플레이리스트에 저장'} disabled={saved || busy} accessibilityState={{ disabled: saved || busy }} onPress={save} style={mixStyles.save}>
          <Icon name={saved ? 'checkmark' : 'add'} size={18} color={C.ink} /><Text style={mixStyles.saveText}>{saved ? '저장됨' : '목록 저장'}</Text>
        </Pressable>
      </View>
    </LinearGradient>

    <View style={mixStyles.listTitle}><Text style={s.heading}>추천곡</Text><Text style={mixStyles.count}>{mix.songs.length}곡</Text></View>
    {mix.songs.map(track => <View key={track.id} style={mixStyles.row}>
      <Pressable accessibilityRole="button" accessibilityLabel={track.title + ' 재생 화면 열기'} onPress={() => play(track)} style={mixStyles.track}>
        <Cover track={track} size={52} />
        <View style={mixStyles.details}><Text numberOfLines={2} style={mixStyles.songTitle}>{track.title}</Text><Text numberOfLines={1} style={mixStyles.artist}>{track.artist}</Text></View>
      </Pressable>
      <IconButton label={liked.includes(track.id) ? '좋아요 취소' : '좋아요'} name={liked.includes(track.id) ? 'heart' : 'heart-outline'} color={liked.includes(track.id) ? '#7862BD' : '#766F81'} onPress={() => toggle(track.id)} />
    </View>)}
  </ScrollView>;
}

const mixStyles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#FFFDFF' },
  content: { paddingHorizontal: 20, paddingBottom: 32 },
  nav: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, marginLeft: -10 },
  navTitle: { fontSize: 15, fontWeight: '600', color: C.ink },
  hero: { borderRadius: 24, padding: 22, alignItems: 'center' },
  sleeve: { width: 154, height: 108, marginVertical: 6, justifyContent: 'center' },
  disc: { position: 'absolute', right: 0, width: 104, height: 104, borderRadius: 52, alignItems: 'center', justifyContent: 'center' },
  groove: { width: 84, height: 84, borderRadius: 42, borderWidth: 1, borderColor: '#716D85', alignItems: 'center', justifyContent: 'center' },
  label: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#C6B8DF', alignItems: 'center', justifyContent: 'center' },
  spindle: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#383348' },
  art: { width: 106, height: 106, borderRadius: 6, backgroundColor: '#AEBFE3', transform: [{ rotate: '-5deg' }] },
  title: { marginTop: 14, color: C.ink, fontSize: 24, lineHeight: 32, fontWeight: '700', letterSpacing: -0.8, textAlign: 'center' },
  reason: { marginTop: 6, fontSize: 14, lineHeight: 21, color: '#56536F', textAlign: 'center' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 18 },
  play: { minHeight: 44, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 22, backgroundColor: '#393052' },
  playText: { color: 'white', fontWeight: '700' },
  save: { minHeight: 44, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 22, backgroundColor: '#FFFFFFCC' },
  saveText: { color: C.ink, fontWeight: '600' },
  listTitle: { marginTop: 26, marginBottom: 6, flexDirection: 'row', gap: 8, alignItems: 'baseline' },
  count: { fontSize: 13, color: '#6B637D' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#E6E2EC' },
  track: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  details: { flex: 1 },
  songTitle: { color: C.ink, fontSize: 16, lineHeight: 22, fontWeight: '600' },
  artist: { marginTop: 3, color: '#6B637D', fontSize: 13 },
});

export function Notifications({ back }: { back: () => void }) {
  return <View style={s.page}>
    <View style={[s.content, { paddingBottom: 0 }]}>
      <View style={[s.sectionRow, { marginHorizontal: -12 }]}><IconButton name="chevron-back" label="홈으로 돌아가기" onPress={back} /><Text style={s.heading}>알림</Text><View style={{ width: 44 }} /></View>
    </View>
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, paddingBottom: 70 }}>
      <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: '#F0EBFF', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}><Icon name="notifications-outline" size={43} color={C.purple} /></View>
      <Text style={[s.heading, { textAlign: 'center' }]}>아직 도착한 알림이 없어요</Text>
      <Text style={[s.body, { fontSize: 14, textAlign: 'center', marginTop: 12 }]}>새로운 알림이 도착하면{ '\n' }이곳에서 확인할 수 있어요.</Text>
    </View>
  </View>;
}
