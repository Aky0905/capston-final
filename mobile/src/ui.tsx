import React from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import type { Mood, Track } from './domain';
import { moodColors } from './domain';

export const C = { ink: '#172350', muted: '#7D86AB', purple: '#8172FF', border: '#EAE9FA', bg: '#FDFDFF' };
export type IconName = React.ComponentProps<typeof Ionicons>['name'];
export function Icon({ name, size = 24, color = C.muted }: { name: IconName; size?: number; color?: string }) { return <Ionicons name={name} size={size} color={color} />; }
export function IconButton({ name, onPress, label, color = C.ink }: { name: IconName; onPress: () => void; label: string; color?: string }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={s.iconButton}><Icon name={name} color={color} /></Pressable>;
}
export function Button({ title, onPress, disabled, loading, subtle = false }: { title: string; onPress: () => void; disabled?: boolean; loading?: boolean; subtle?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled: !!disabled || !!loading }} disabled={disabled || loading} onPress={onPress} style={{ opacity: disabled ? 0.45 : 1 }}>
    <LinearGradient colors={subtle ? ['#F2F0FF', '#F2F0FF'] : ['#9288FF', '#AAA1FF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.button}>
      {loading ? <ActivityIndicator color={subtle ? C.purple : 'white'} /> : <Text style={[s.buttonText, subtle && { color: C.purple }]}>{title}</Text>}
    </LinearGradient>
  </Pressable>;
}
export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) { return <View style={[s.card, style]}>{children}</View>; }
export function Cloud({ size = 150 }: { size?: number }) { return <Image source={require('../assets/cloud.png')} style={{ width: size, height: size * 0.77 }} resizeMode="contain" accessibilityLabel="눈을 감고 쉬는 구름 캐릭터" />; }
export function MoodChip({ mood }: { mood: Mood }) { return <View style={[s.chip, { backgroundColor: moodColors[mood] + '30' }]}><View style={{ width: 8, height: 8, borderRadius: 8, backgroundColor: moodColors[mood] }} /><Text style={{ color: C.ink, fontSize: 12 }}>{mood}</Text></View>; }
export function Cover({ track, size = 64 }: { track: Track; size?: number }) {
  if (track.spotifyId && track.thumbnail) return <Image accessibilityLabel={track.title + ' 앨범 커버'}
    source={{ uri: track.thumbnail }} resizeMode="cover" style={{ width: size, height: size, borderRadius: 12 }} />;
  return <View style={{ width: size, height: size, borderRadius: 14, overflow: 'hidden', backgroundColor: track.color }}><Image source={track.thumbnail ? {uri:track.thumbnail} : require('../assets/sky.png')} style={{ width: '100%', height: '100%', opacity: 0.72 }} /><View style={{ position: 'absolute', inset: 0, backgroundColor: track.color, opacity: 0.2 }} /><View style={{ position: 'absolute', bottom: 8, right: 8 }}><Icon name="musical-notes" size={18} color="white" /></View></View>;
}
export function TrackRow({ track, onPress, action }: { track: Track; onPress: () => void; action?: React.ReactNode }) {
  return <View style={s.trackRow}><Pressable accessibilityRole="button" onPress={onPress} accessibilityLabel={`${track.title} 재생 화면 열기`} style={{ flexDirection: 'row', alignItems: 'center', gap: 13, flex: 1 }}><Cover track={track} /><View style={{ flex: 1 }}><Text numberOfLines={2} style={s.trackTitle}>{track.title}</Text><Text style={s.small}>{track.artist}</Text></View></Pressable>{action || <IconButton name="play-circle" label="재생 화면 열기" color={C.purple} onPress={onPress} />}</View>;
}
export function Empty({ title, detail }: { title: string; detail: string }) { return <View style={s.empty}><Icon name="cloud-outline" size={38} color="#B8ADF7" /><Text style={[s.trackTitle, { marginTop: 12 }]}>{title}</Text><Text style={[s.small, { textAlign: 'center', marginTop: 7 }]}>{detail}</Text></View>; }
export const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.bg },
  content: { padding: 24, paddingBottom: 30 },
  title: { fontSize: 25, fontWeight: '700', color: C.ink, letterSpacing: -0.7 },
  heading: { fontSize: 18, fontWeight: '700', color: C.ink, letterSpacing: -0.4 },
  body: { fontSize: 14, lineHeight: 24, color: '#526084' },
  small: { fontSize: 11, color: C.muted, lineHeight: 18 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  card: { padding: 18, borderRadius: 24, backgroundColor: '#FFFFFFEE', borderWidth: 1, borderColor: C.border },
  button: { minHeight: 54, borderRadius: 29, paddingHorizontal: 20, paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: 'white', fontWeight: '700', fontSize: 15 },
  iconButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  chip: { borderRadius: 24, paddingVertical: 9, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', gap: 7 },
  trackRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 13 },
  trackTitle: { fontSize: 14, fontWeight: '600', color: C.ink, lineHeight: 20 },
  input: { borderWidth: 1, borderColor: '#DCD8F9', borderRadius: 20, padding: 18, color: C.ink, fontSize: 14, backgroundColor: '#FFFFFFBB', lineHeight: 23 },
  empty: { alignItems: 'center', padding: 28 },
  divider: { height: 1, backgroundColor: '#F0F0F8' },
  sheetBackdrop: { flex: 1, backgroundColor: '#18204655', justifyContent: 'center', padding: 24 },
  sheet: { backgroundColor: 'white', padding: 24, borderRadius: 28, gap: 18, width: '100%', maxWidth: 480, alignSelf: 'center' },
});
