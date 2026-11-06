import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Entry, Mood, weeklyRecordDays } from './domain';
import { C, Card, s } from './ui';

const emoji: Record<Mood, string> = { 기쁨: '😊', 슬픔: '😢', 분노: '😠', 불안: '😟', 평온: '😌', 설렘: '🥰', 기타: '🤔' };
const backgrounds = ['#F0EBFF', '#EDF2FF', '#F7F0FF'];
export function EmotionHistoryPreview({ entries, openRecords, openEntry, input }: {
  entries: Entry[]; openRecords: () => void; openEntry: (entry: Entry) => void; input: () => void;
}) {
  const recent = [...entries].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 3);
  const days = weeklyRecordDays(entries);
  return <Card style={{ marginTop: 26, padding: 16 }}>
    <View style={s.sectionRow}>
      <Text style={[s.heading, { fontSize: 18 }]}>나의 감정 기록</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="감정 기록 전체보기" onPress={openRecords} hitSlop={10}>
        <Text style={[s.small, { color: '#7772AE' }]}>전체보기 ›</Text>
      </Pressable>
    </View>
    {recent.length ? <View style={{ flexDirection: 'row', gap: 9 }}>
      {recent.map((entry, index) => {
        const [, month, day] = entry.localDate.split('-').map(Number);
        return <Pressable key={entry.id} accessibilityRole="button" accessibilityLabel={`${month}월 ${day}일 ${entry.primaryEmotion} 기록 보기`} onPress={() => openEntry(entry)}
          style={{ flex: 1, minWidth: 0, alignItems: 'center', backgroundColor: backgrounds[index], borderRadius: 18, paddingVertical: 20, paddingHorizontal: 4 }}>
          <Text style={{ fontSize: 31, marginBottom: 18 }}>{emoji[entry.primaryEmotion]}</Text>
          <Text style={[s.trackTitle, { fontSize: 17 }]}>{entry.primaryEmotion}</Text>
          <Text style={[s.small, { marginTop: 5 }]}>{month}월 {day}일</Text>
        </Pressable>;
      })}
      {recent.length < 3 && Array.from({ length: 3 - recent.length }, (_, index) => <View key={`space-${index}`} style={{ flex: 1 }} />)}
    </View> : <Pressable accessibilityRole="button" onPress={input} style={{ backgroundColor: '#F5F1FF', borderRadius: 18, padding: 24, alignItems: 'center', gap: 8 }}>
      <Text style={{ fontSize: 30 }}>☁️</Text><Text style={s.trackTitle}>첫 마음을 기록해볼까요?</Text><Text style={[s.small, { textAlign: 'center' }]}>저장한 감정 기록이 여기에 모여요.</Text>
    </Pressable>}
    <View style={{ marginTop: 14, backgroundColor: '#F8F6FD', borderRadius: 16, padding: 14 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
        <Text style={[s.small, { fontWeight: '600', color: '#625A80' }]}>이번 주 감정 기록</Text><Text style={s.small}>{days} / 7일</Text>
      </View>
      <View accessible accessibilityLabel={`이번 주 7일 중 ${days}일 기록, 월요일 기준`} style={{ height: 8, borderRadius: 4, overflow: 'hidden', backgroundColor: '#E8E2F2' }}>
        <View style={{ height: '100%', width: `${days / 7 * 100}%`, borderRadius: 4, backgroundColor: '#9B83E6' }} />
      </View>
    </View>
  </Card>;
}
