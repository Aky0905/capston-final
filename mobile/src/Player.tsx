import React from 'react';
import { Linking, Text, View } from 'react-native';
import type { Track } from './domain';
import { Button, s } from './ui';

export type PlayerProps = { queue: Track[]; visible?: boolean; track: Track; close: () => void; favorite: boolean; toggleFavorite: () => void; addToPlaylist: () => void; play: (track: Track) => void };
export function Player({ track, close, favorite, toggleFavorite, addToPlaylist }: PlayerProps) {
  const url = track.spotifyId ? 'https://open.spotify.com/track/' + track.spotifyId : 'https://open.spotify.com/search/' + encodeURIComponent(track.title + ' ' + track.artist);
  return <View style={[s.content, { gap: 16 }]}><Button title="돌아가기" onPress={close} subtle />
    <Text style={s.title}>{track.title}</Text><Text style={s.body}>{track.artist}</Text>
    <Button title="재생" onPress={() => void Linking.openURL(url)} />
    <Button title={favorite ? '좋아요 취소' : '좋아요'} onPress={toggleFavorite} subtle />
    <Button title="플레이리스트에 추가" onPress={addToPlaylist} subtle /></View>;
}
