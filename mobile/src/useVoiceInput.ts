import { useEffect, useRef, useState } from 'react';
import { AudioModule, RecordingPresets, setAudioModeAsync, useAudioRecorder, useAudioRecorderState } from 'expo-audio';
import { cloudMode, transcribe } from './services';

export function useVoiceInput(setText: (value: string) => void) {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const state = useAudioRecorderState(recorder, 250);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const operation = useRef(false);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; void setAudioModeAsync({ allowsRecording: false }); }; }, []);
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
      await recorder.prepareToRecordAsync(); recorder.record();
    } catch (e) { setNotice(e instanceof Error ? e.message : '녹음을 시작하지 못했어요.'); }
    finally { operation.current = false; setBusy(false); }
  }
  return { state, busy, notice, record, status: busy ? '음성 입력 처리 중…' : '' };
}
