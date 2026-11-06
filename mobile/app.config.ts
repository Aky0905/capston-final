export default {
  expo: {
    name: 'Feelody', slug: 'feelody', scheme: 'feelody', version: '0.1.0',
    orientation: 'portrait', userInterfaceStyle: 'light',
    ios: { supportsTablet: false, bundleIdentifier: 'com.feelody.app' },
    android: { package: 'com.feelody.app', permissions: ['RECORD_AUDIO'] },
    plugins: [['expo-image-picker', { photosPermission: '플레이리스트 표지로 사용할 사진을 선택해주세요.', cameraPermission: false, microphonePermission: false }], ['expo-audio', { microphonePermission: '감정을 음성으로 입력하려면 마이크 접근이 필요해요.' }], 'expo-secure-store', 'expo-asset', 'expo-font'],
    web: { bundler: 'metro' }
  }
};
