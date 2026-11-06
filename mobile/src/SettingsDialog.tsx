import React, { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, Switch, Text, TextInput, View } from 'react-native';
import { Button, C, Icon, IconButton, s } from './ui';

export function SettingsDialog({ name, notificationsEnabled, busy, close, save }: {
  name: string; notificationsEnabled: boolean; busy: boolean; close: () => void;
  save: (name: string, notificationsEnabled: boolean) => void;
}) {
  const [nickname, setNickname] = useState(name);
  const [notifications, setNotifications] = useState(notificationsEnabled);
  const changed = nickname.trim() !== name || notifications !== notificationsEnabled;
  function dismiss() { if (!busy) close(); }
  function submit() { if (!busy && nickname.trim() && changed) save(nickname.trim(), notifications); }
  return <Modal visible transparent animationType="fade" onRequestClose={dismiss}>
    <KeyboardAvoidingView style={s.sheetBackdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Pressable accessibilityLabel="설정 창 닫기" accessibilityRole="button" onPress={dismiss} style={{ position: 'absolute', inset: 0 }} />
      <View accessibilityViewIsModal style={[s.sheet, { gap: 22 }]}>
        <View style={[s.sectionRow, { marginBottom: 0 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}><Icon name="settings-outline" color={C.purple} /><Text style={s.heading}>설정</Text></View>
          <IconButton name="close" label="닫기" onPress={dismiss} />
        </View>
        <View style={{ gap: 10 }}>
          <Text style={s.trackTitle}>닉네임 변경</Text>
          <View style={[s.input, { flexDirection: 'row', alignItems: 'center', paddingVertical: 0, gap: 10 }]}>
            <TextInput accessibilityLabel="변경할 닉네임" value={nickname} onChangeText={setNickname} maxLength={20} editable={!busy}
              placeholder="닉네임을 입력해주세요" placeholderTextColor={C.muted} autoCapitalize="none" autoCorrect={false}
              returnKeyType="done" onSubmitEditing={submit} style={{ flex: 1, minWidth: 0, fontSize: 16, color: C.ink, paddingVertical: 16 }} />
            <Text style={s.small}>{nickname.length} / 20</Text>
          </View>
        </View>
        <View style={s.divider} />
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <Text style={s.trackTitle}>알림 받기</Text>
            <Switch accessibilityLabel="알림 받기" value={notifications} onValueChange={setNotifications} disabled={busy}
              trackColor={{ false: '#E7E1F7', true: C.purple }} thumbColor="white" />
          </View>
          <Text style={[s.small, { marginTop: 8 }]}>알림 수신 여부를 저장해요.{ '\n' }실제 알림 발송 기능은 준비 중이에요.</Text>
        </View>
        <Button title="저장" onPress={submit} loading={busy} disabled={!nickname.trim() || !changed} />
      </View>
    </KeyboardAvoidingView>
  </Modal>;
}
