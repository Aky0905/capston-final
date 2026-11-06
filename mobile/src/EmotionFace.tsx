import React from 'react';
import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';
import type { Mood } from './domain';

const palette: Record<Mood, string> = {
  기쁨: '#FFE9B0', 슬픔: '#DCEAFF', 분노: '#FFDDD9', 불안: '#E6DDF8', 평온: '#DCF0E9', 설렘: '#FADDEB', 기타: '#E8E4F5',
};
const ink = '#665585';
export function EmotionFace({ mood, size = 58 }: { mood: Mood; size?: number }) {
  return <Svg width={size} height={size} viewBox="0 0 64 64" accessibilityLabel={`${mood} 표정`}>
    <Circle cx={32} cy={32} r={28} fill={palette[mood]} />
    <Ellipse cx={18} cy={38} rx={5} ry={3} fill="#EA9DB6" opacity={0.35} />
    <Ellipse cx={46} cy={38} rx={5} ry={3} fill="#EA9DB6" opacity={0.35} />
    <G stroke={ink} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" fill="none">
      {mood === '기쁨' && <>
        <Path d="M19 29 Q23 22 27 29 M37 29 Q41 22 45 29" />
        <Path d="M23 37 Q32 51 41 37 Z" fill="#FFFFFF" />
      </>}
      {mood === '슬픔' && <>
        <Path d="M19 22 L26 25 M38 25 L45 22 M26 44 Q32 37 38 44" />
        <Path d="M22 30 L22 33 M42 30 L42 33" />
      </>}
      {mood === '분노' && <>
        <Path d="M18 23 L27 27 M37 27 L46 23 M23 31 L23 34 M41 31 L41 34 M25 44 Q32 37 39 44" />
        <Path d="M45 12 L45 16 M49 17 L53 17" stroke="#CE817F" strokeWidth={2} />
      </>}
      {mood === '불안' && <>
        <Path d="M18 23 L26 20 M38 20 L46 23 M23 29 L23 33 M41 29 L41 33 M24 43 L28 40 L32 43 L36 40 L40 43" />
      </>}
      {mood === '평온' && <>
        <Path d="M18 28 Q23 34 28 28 M36 28 Q41 34 46 28 M27 40 Q32 44 37 40" />
      </>}
      {mood === '설렘' && <>
        <Path d="M23 25 C18 19 14 27 23 33 C32 27 28 19 23 25 Z M41 25 C36 19 32 27 41 33 C50 27 46 19 41 25 Z" fill="#CB83A9" stroke="#CB83A9" strokeWidth={1} />
        <Path d="M25 39 Q32 47 39 39" />
      </>}
      {mood === '기타' && <>
        <Path d="M21 29 L21 32 M41 27 L41 30 M28 42 L36 42 M17 22 Q21 19 25 22 M38 19 L45 19" />
      </>}
    </G>
    {mood === '슬픔' && <Path d="M43 33 C39 39 38 41 40 43 C44 47 49 41 43 33 Z" fill="#91B6E8" />}
    {mood === '불안' && <Path d="M49 19 C46 23 46 26 49 26 C53 26 52 23 49 19 Z" fill="#A89DD6" />}
  </Svg>;
}
