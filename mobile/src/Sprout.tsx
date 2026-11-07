import React from 'react';
import { Image } from 'react-native';

const images = [
  require('../assets/sprout-1.png'),
  require('../assets/sprout-2.png'),
  require('../assets/sprout-3.png'),
  require('../assets/sprout-4.png'),
];

export function Sprout({ stage, size }: { stage: number; size: number | '100%' }) {
  return <Image source={images[Math.max(0, stage - 1)]} resizeMode="contain"
    accessibilityLabel={`새싹 성장 ${stage}/4단계`}
    style={{ width: size, height: size }} />;
}
