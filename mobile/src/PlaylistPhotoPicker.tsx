import React, { useState } from 'react';
import { ActivityIndicator, Image, Pressable, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { C, Icon, s } from './ui';

export function PlaylistPhotoPicker({ value, onChange, disabled, onBusyChange }: { value?: string; onChange: (uri?: string) => void; disabled: boolean; onBusyChange: (busy: boolean) => void }) {
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');
  async function choose() {
    setLoading(true); onBusyChange(true); setNotice('');
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 1 });
      if (result.canceled) return;
      const photo = result.assets[0];
      if (!photo) return;
      const resize = photo.width >= photo.height ? { width: Math.min(400, photo.width) } : { height: Math.min(400, photo.height) };
      const compressed = await manipulateAsync(photo.uri, [{ resize }], { compress: 0.6, format: SaveFormat.JPEG, base64: true });
      if (!compressed.base64 || compressed.base64.length > 180000) throw new Error('사진 용량이 커요. 다른 사진을 선택해주세요.');
      onChange(`data:image/jpeg;base64,${compressed.base64}`);
    } catch (error) { setNotice(error instanceof Error ? error.message : '사진을 불러오지 못했어요. 다시 시도해주세요.'); }
    finally { setLoading(false); onBusyChange(false); }
  }
  return <View style={{ alignItems: 'center', gap: 10 }}>
    <Pressable accessibilityRole="button" accessibilityLabel={value ? '플레이리스트 사진 변경' : '플레이리스트 사진 추가'} disabled={disabled || loading} onPress={() => void choose()}
      style={{ width: 112, height: 112, borderRadius: 22, overflow: 'hidden', backgroundColor: '#F0EBFF', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#DFD5FA' }}>
      {value ? <Image source={{ uri: value }} style={{ width: '100%', height: '100%' }} resizeMode="cover" /> : <Icon name="camera-outline" size={32} color={C.purple} />}
      {loading && <View style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFFAA' }}><ActivityIndicator color={C.purple} /></View>}
    </Pressable>
    <Text style={[s.small, { color: C.purple }]}>사진 {value ? '변경' : '추가'} · 선택사항</Text>
    {value && <Pressable accessibilityRole="button" disabled={disabled || loading} onPress={() => onChange(undefined)}><Text style={s.small}>사진 빼기</Text></Pressable>}
    {!!notice && <Text accessibilityLiveRegion="polite" style={[s.small, { textAlign: 'center' }]}>{notice}</Text>}
  </View>;
}
