import { useEffect, useRef, useState } from 'react';
import { cloudMode, transcribe } from './services';

type Phase = 'idle' | 'permission' | 'recording' | 'finishing' | 'upload';
const statusText = {
  idle: '', permission: '브라우저에서 마이크 사용을 허용해주세요.',
  recording: '', finishing: '녹음 파일을 준비하고 있어요…', upload: '목소리를 글로 옮기고 있어요…',
};
type Attempt = {
  recorder?: MediaRecorder;
  stream?: MediaStream;
  timer?: ReturnType<typeof setTimeout>;
  clock?: ReturnType<typeof setInterval>;
  abort: AbortController;
};
function release(attempt: Attempt) {
  clearTimeout(attempt.timer);
  clearInterval(attempt.clock);
  attempt.abort.abort();
  if (attempt.recorder?.state === 'recording') attempt.recorder.stop();
  attempt.stream?.getTracks().forEach(track => track.stop());
}

export function useVoiceInput(setText: (value: string) => void) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [notice, setNotice] = useState('');
  const [durationMillis, setDuration] = useState(0);
  const pending = useRef<Attempt | null>(null);
  useEffect(() => () => {
    const attempt = pending.current;
    pending.current = null;
    if (attempt) release(attempt);
  }, []);

  function finish(attempt: Attempt, message: string) {
    if (pending.current !== attempt) return;
    pending.current = null;
    release(attempt);
    setNotice(message);
    setPhase('idle');
  }
  function deadline(attempt: Attempt, ms: number, message: string) {
    clearTimeout(attempt.timer);
    attempt.timer = setTimeout(() => finish(attempt, message), ms);
  }
  function stop(attempt: Attempt) {
    if (pending.current !== attempt || attempt.recorder?.state !== 'recording') return;
    setPhase('finishing');
    deadline(attempt, 8000, '녹음 파일을 받지 못했어요. 마이크를 확인하고 다시 녹음해주세요.');
    attempt.recorder.stop();
  }
  async function record() {
    if (pending.current) { stop(pending.current); return; }
    if (!cloudMode) { setNotice('음성 인식은 실제 연동 모드에서 사용할 수 있어요.'); return; }
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setNotice('마이크를 사용하려면 PC에서는 로컬 주소로, 휴대폰에서는 HTTPS 주소로 열어주세요.'); return;
    }
    const attempt: Attempt = { abort: new AbortController() };
    pending.current = attempt;
    setNotice(''); setDuration(0); setPhase('permission');
    deadline(attempt, 30000, '마이크 권한을 기다리다 시간이 지났어요. 권한을 확인하고 다시 눌러주세요.');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (pending.current !== attempt) { stream.getTracks().forEach(track => track.stop()); return; }
      attempt.stream = stream;
      const mimeType = ['audio/webm;codecs=opus','audio/mp4','audio/webm'].find(type => MediaRecorder.isTypeSupported(type));
      if (!mimeType) throw new Error('이 브라우저에서 지원하는 녹음 형식을 찾지 못했어요.');
      const recorder = new MediaRecorder(stream, { mimeType });
      attempt.recorder = recorder;
      const chunks: Blob[] = [];
      recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
      recorder.onerror = () => finish(attempt, '녹음이 중단됐어요. 마이크 연결을 확인해주세요.');
      recorder.onstop = async () => {
        if (pending.current !== attempt) return;
        clearInterval(attempt.clock);
        stream.getTracks().forEach(track => track.stop());
        const audio = new Blob(chunks, { type: recorder.mimeType || mimeType });
        if (!audio.size) { finish(attempt, '녹음된 소리가 없어요. 마이크를 확인하고 다시 말해주세요.'); return; }
        setPhase('upload');
        deadline(attempt, 65000, '받아쓰기 응답 시간이 지났어요. 서버 연결을 확인하고 다시 시도해주세요.');
        try {
          const text = await transcribe(audio, attempt.abort.signal);
          if (pending.current !== attempt) return;
          setText(text.slice(0, 500));
          finish(attempt, text.length > 500 ? '받아쓴 내용 중 처음 500자를 입력했어요.' : '인식한 내용을 확인하고 자유롭게 수정해주세요.');
        } catch (error) { finish(attempt, error instanceof Error ? error.message : '음성 인식에 실패했어요.'); }
      };
      recorder.start(1000);
      clearTimeout(attempt.timer);
      setPhase('recording');
      const started = Date.now();
      attempt.clock = setInterval(() => setDuration(Date.now() - started), 250);
      attempt.timer = setTimeout(() => stop(attempt), 60000);
    } catch (error) {
      const denied = error instanceof Error && error.name === 'NotAllowedError';
      finish(attempt, denied ? '브라우저에서 마이크 권한을 허용해주세요.' : error instanceof Error ? error.message : '녹음을 시작하지 못했어요.');
    }
  }
  return { state: { isRecording: phase === 'recording', durationMillis }, busy: phase !== 'idle' && phase !== 'recording',
    notice, status: statusText[phase], record };
}
