import React, { useState, useRef } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { supabase } from './services';
import { Button, Card, Icon, C, s } from './ui';

export function PasswordSettings() {
  const [expanded, expand] = useState(false);
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [repeat, setRepeat] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  function reset() { setCurrent(''); setNext(''); setRepeat(''); }
  async function save() {
    if (!supabase || lock.current) return;
    if (next.length < 8 || next !== repeat || next === current || !current) return;
    lock.current = true; setBusy(true); setNotice('');
    try {
      const { data } = await supabase.auth.getUser();
      if (!data.user?.email) { setNotice('다시 로그인한 뒤 시도해주세요.'); return; }
      const auth = await supabase.auth.signInWithPassword({ email: data.user.email, password: current });
      if (auth.error) { setNotice(auth.error.code === 'invalid_credentials' ? '현재 비밀번호가 맞지 않아요.' : '본인 확인에 실패했어요. 잠시 후 다시 시도해주세요.'); return; }
      const { error } = await supabase.auth.updateUser({ password: next, current_password: current });
      if (error) { setNotice(error.code === 'weak_password' ? '더 안전한 새 비밀번호를 입력해주세요.' : '변경하지 못했어요. 다시 로그인한 뒤 시도해주세요.'); return; }
      reset(); expand(false); setNotice('비밀번호를 변경했어요.');
    } catch { setNotice('연결을 확인한 뒤 다시 시도해주세요.'); }
    finally { lock.current = false; setBusy(false); }
  }
  const invalid = next && next.length < 8 ? '새 비밀번호는 8자 이상 입력해주세요.' : next && next === current ? '현재 비밀번호와 다른 비밀번호를 입력해주세요.' : repeat && repeat !== next ? '새 비밀번호가 서로 달라요.' : '';
  return <Card style={{ marginTop: 18 }}>
    <Pressable accessibilityRole="button" accessibilityState={{ expanded }} disabled={busy} onPress={() => { reset(); setNotice(''); expand(!expanded); }} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <Text style={s.heading}>비밀번호 변경</Text><Icon name={expanded ? 'chevron-up' : 'chevron-down'} color={C.purple} />
    </Pressable>
    {expanded && <View style={{ gap: 12, marginTop: 18 }}>
      {([{ label: '현재 비밀번호', value: current, set: setCurrent }, { label: '새 비밀번호 (8자 이상)', value: next, set: setNext }, { label: '새 비밀번호 확인', value: repeat, set: setRepeat }]).map((field, i) =>
        <TextInput key={field.label} accessibilityLabel={field.label} placeholder={field.label} style={s.input} value={field.value} onChangeText={v => { field.set(v); setNotice(''); }} secureTextEntry autoCapitalize="none" autoCorrect={false} autoComplete={i ? 'new-password' : 'current-password'} editable={!busy} />)}
      {!!invalid && <Text style={s.small}>{invalid}</Text>}
      <Button title="변경하기" loading={busy} disabled={!current || !next || !repeat || !!invalid} onPress={() => void save()} />
    </View>}
    {!!notice && <Text accessibilityLiveRegion="polite" style={[s.small, { marginTop: 12 }]}>{notice}</Text>}
  </Card>;
}
