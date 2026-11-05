import React, { useEffect, useRef, useState } from 'react';
import { AppState, Linking, Platform, ScrollView, Text, View } from 'react-native';
import WebView from 'react-native-webview';
import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';
import type { Track } from './domain';
import { C, s, IconButton, Button, TrackRow } from './ui';
import { apiUrl, tracks } from './services';

export function Player({ track, close, favorite, toggleFavorite, addToPlaylist, play }: { track: Track; close: () => void; favorite: boolean; toggleFavorite: () => void; addToPlaylist: () => void; play: (t: Track) => void }) {
  const [active, setActive] = useState(AppState.currentState === 'active');
  const [failed, setFailed] = useState(false);
  const ref = useRef<WebView>(null);
  const appId = Platform.OS === 'ios' ? Constants.expoConfig?.ios?.bundleIdentifier : Constants.expoConfig?.android?.package;
  const origin = `https://${appId || 'com.feelody.app'}`;
  const hosted = process.env.EXPO_PUBLIC_PLAYER_URL || (Platform.OS === 'web' ? '/player.html' : apiUrl ? `${apiUrl}/player.html` : '');
  const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="referrer" content="strict-origin-when-cross-origin"><style>html,body,#player{margin:0;width:100%;height:100%;background:#151a32}</style></head><body><div id="player"></div><script>var p;function onYouTubeIframeAPIReady(){p=new YT.Player('player',{videoId:'${track.videoId}',playerVars:{playsinline:1,origin:'${origin}'},events:{onError:function(e){window.ReactNativeWebView&&window.ReactNativeWebView.postMessage(JSON.stringify({error:e.data}))}}})}window.pauseVideo=function(){if(p&&p.pauseVideo)p.pauseVideo()};document.addEventListener('visibilitychange',function(){if(document.hidden)window.pauseVideo()})</script><script src="https://www.youtube.com/iframe_api"></script></body></html>`;
  useEffect(() => {
    setFailed(false);
    const subscription = AppState.addEventListener('change', state => {
      if (state !== 'active') ref.current?.injectJavaScript('window.pauseVideo&&window.pauseVideo();true;');
      setActive(state === 'active');
    });
    return () => subscription.remove();
  }, [track.id]);
  const external = async () => { try { await Linking.openURL(`https://music.youtube.com/watch?v=${track.videoId}`); } catch { setFailed(true); } };
  return <LinearGradient colors={['#E4E0F7', '#F9E9ED', '#FFFDF9']} style={s.page}><View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18, paddingTop: 8 }}><IconButton name="chevron-back" label="음악 화면 닫기" onPress={close} /><Text style={{ color: C.ink, fontWeight: '600' }}>YouTube · Feelody</Text><View style={{ width: 44 }} /></View>
    <ScrollView contentContainerStyle={s.content}>
      <View style={{ height: 230, backgroundColor: '#151A32', marginTop: 12 }}>
        {active && Platform.OS !== 'web' && <WebView key={track.id} ref={ref} source={{ html, baseUrl: origin + '/' }} originWhitelist={['https://*']} allowsInlineMediaPlayback mediaPlaybackRequiresUserAction allowsFullscreenVideo javaScriptEnabled style={{ backgroundColor: '#151A32' }} onMessage={() => setFailed(true)} onError={() => setFailed(true)} />}
        {active && Platform.OS === 'web' && (hosted ? React.createElement('iframe', { key: track.id, src: `${hosted}?v=${track.videoId}`, title: track.title, width: '100%', height: '230', allow: 'autoplay; encrypted-media; fullscreen', style: { border: 0 } }) : <View style={{ padding: 30 }}><Text style={{ color: 'white', lineHeight: 24 }}>웹 미리보기에서는 아래 버튼으로 감상할 수 있어요. 앱에서는 이 위치에 YouTube 플레이어가 표시됩니다.</Text></View>)}
      </View>
      {failed && <Text style={[s.small, { marginTop: 12 }]}>이 영상은 앱 안에서 재생할 수 없거나 연결에 실패했어요. YouTube Music에서 열어주세요.</Text>}
      <Text style={[s.title, { textAlign: 'center', fontSize: 25, marginTop: 28 }]}>{track.title}</Text><Text style={[s.body, { textAlign: 'center', marginTop: 8 }]}>{track.artist}</Text>
      <Text style={[s.small, { textAlign: 'center', marginVertical: 18 }]}>영상 안의 재생 버튼을 눌러 감상해주세요.</Text>
      <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 16, marginBottom: 16 }}><IconButton name={favorite ? 'heart' : 'heart-outline'} label={favorite ? '좋아요 취소' : '좋아요'} color={C.purple} onPress={toggleFavorite} /><Button title="＋ 플레이리스트" onPress={addToPlaylist} subtle /></View>
      <Button title="YouTube Music에서 열기 ↗" onPress={external} subtle />
      <Text style={[s.small, { textAlign: 'center', marginTop: 12 }]}>화면을 벗어나면 앱 내부 재생은 중지됩니다.</Text>
      <View style={{ marginTop: 32 }}><Text style={s.heading}>함께 들어보세요</Text>{tracks.filter(t => t.id !== track.id).map(t => <TrackRow key={t.id} track={t} onPress={() => play(t)} />)}</View>
    </ScrollView>
  </LinearGradient>;
}
