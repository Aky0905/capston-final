import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Button, C, IconButton, s } from './ui';

export function NicknameSetup({ busy, back, save }: { busy: boolean; back: () => void; save: (name: string) => void }) {
  const [name, setName] = useState('');
  const [focused, setFocused] = useState(false);
  const nickname = name.trim();
  function complete() {
    if (nickname && nickname.length <= 20 && !busy) save(nickname);
  }
  return <ScrollView style={s.page} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.page}>
    <View style={{ alignSelf: 'flex-start', marginLeft: -12 }}>
      <IconButton name="chevron-back" label="로그인 화면으로 돌아가기" onPress={() => { if (!busy) back(); }} color={C.purple} />
    </View>
    <View style={styles.content}>
      <Text style={styles.title}>닉네임을 정해주세요</Text>
      <Text style={styles.description}>앞으로 사용할 닉네임을 입력해주세요!</Text>
      <View style={[styles.field, focused && { borderColor: C.purple }, busy && { opacity: 0.65 }]}>
        <TextInput accessibilityLabel="닉네임" placeholder="닉네임을 입력해주세요" placeholderTextColor="#AAA1C5"
          value={name} onChangeText={setName} maxLength={20} editable={!busy} autoCapitalize="none" autoCorrect={false}
          returnKeyType="done" onSubmitEditing={complete} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={styles.input} />
        <Text style={styles.count}>{name.length} / 20</Text>
      </View>
      <View style={styles.complete}><Button title="완료" onPress={complete} loading={busy} disabled={!nickname || nickname.length > 20} /></View>
    </View>
  </ScrollView>;
}

const styles = StyleSheet.create({
  page: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 14, paddingBottom: 44 },
  content: { flex: 1, justifyContent: 'center', paddingTop: 40, paddingBottom: 90 },
  title: { fontSize: 27, fontWeight: '700', color: C.ink, textAlign: 'center', letterSpacing: -0.8 },
  description: { fontSize: 15, lineHeight: 24, color: C.muted, textAlign: 'center', marginTop: 14 },
  field: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#DED6F6', borderRadius: 16, backgroundColor: '#FBF9FF', marginTop: 40, minHeight: 64, paddingHorizontal: 18, gap: 8 },
  input: { flex: 1, minWidth: 0, paddingVertical: 18, fontSize: 16, color: C.ink },
  count: { fontSize: 14, color: '#9B8FBB' },
  complete: { marginTop: 54 },
});
