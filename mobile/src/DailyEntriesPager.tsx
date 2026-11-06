import React, { useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import type { Entry } from './domain';
import { moodColors } from './domain';
import { C, Icon, IconButton, s } from './ui';

export function DailyEntriesPager({ entries, open }: { entries: Entry[]; open: (entry: Entry) => void }) {
  const [width, setWidth] = useState(0);
  const [page, setPage] = useState(0);
  const scroll = useRef<ScrollView>(null);
  const pages = Array.from({ length: Math.ceil(entries.length / 3) }, (_, i) => entries.slice(i * 3, i * 3 + 3));
  function go(next: number) {
    const target = Math.max(0, Math.min(pages.length - 1, next));
    scroll.current?.scrollTo({ x: target * width, animated: true });
    setPage(target);
  }
  if (!entries.length) return <Text style={s.small}>아직 기록이 없어요. 오늘의 마음을 남겨보세요.</Text>;
  return <View onLayout={event => setWidth(event.nativeEvent.layout.width)}>
    {width > 0 && <ScrollView key={width} ref={scroll} horizontal pagingEnabled directionalLockEnabled showsHorizontalScrollIndicator={false}
      onLayout={() => { scroll.current?.scrollTo({ x: 0, animated: false }); setPage(0); }}
      onScroll={event => setPage(Math.max(0, Math.min(pages.length - 1, Math.round(event.nativeEvent.contentOffset.x / width))))} scrollEventThrottle={32}>
      {pages.map((items, index) => <View key={index} style={{ width, minHeight: entries.length > 3 ? 222 : undefined }}>
        {items.map(entry => <Pressable key={entry.id} accessibilityRole="button" accessibilityLabel={`${entry.primaryEmotion}, ${entry.text}, 기록 상세 보기`} onPress={() => open(entry)} style={{ paddingVertical: 12, minHeight: 74 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
            <View style={{ width: 8, height: 8, borderRadius: 8, backgroundColor: moodColors[entry.primaryEmotion] }} />
            <Text style={[s.trackTitle, { flex: 1 }]} numberOfLines={1}>{entry.text}</Text><Icon name="chevron-forward" size={17} />
          </View>
          <Text style={[s.small, { marginTop: 4 }]}>{entry.primaryEmotion} · {new Date(entry.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}</Text>
        </Pressable>)}
      </View>)}
    </ScrollView>}
    {pages.length > 1 && <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderColor: C.border, paddingTop: 6 }}>
      <View style={{ opacity: page === 0 ? 0.3 : 1 }}><IconButton name="chevron-back" label="이전 기록 3개" onPress={() => go(page - 1)} color={C.purple} /></View>
      <Text accessibilityLiveRegion="polite" style={s.small}>{page + 1} / {pages.length} · 옆으로 넘겨보세요</Text>
      <View style={{ opacity: page === pages.length - 1 ? 0.3 : 1 }}><IconButton name="chevron-forward" label="다음 기록 3개" onPress={() => go(page + 1)} color={C.purple} /></View>
    </View>}
  </View>;
}
