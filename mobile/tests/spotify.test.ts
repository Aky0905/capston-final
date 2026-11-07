import assert from 'node:assert/strict';
import { test } from 'node:test';
import { startPlayback } from '../src/spotify';

test('재생 장치가 사라지면 한 번만 전송 후 같은 곡을 다시 요청한다', async () => {
  const calls: string[] = [];
  const originalStorage = Object.getOwnPropertyDescriptor(globalThis, 'sessionStorage');
  const originalFetch = globalThis.fetch;
  Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: {
    getItem: () => JSON.stringify({ token: 'test', expires: Date.now() + 3600000 })
  } });
  try {
    globalThis.fetch = async (url, options) => {
      calls.push(String(url).replace('https://api.spotify.com/v1/', '') + ' ' + options?.body);
      return new Response(null, { status: calls.length === 1 ? 404 : 204 });
    };
    await startPlayback('device1', 'song1');
    assert.deepEqual(calls, [
      'me/player/play?device_id=device1 {"uris":["spotify:track:song1"]}',
      'me/player {"device_ids":["device1"],"play":false}',
      'me/player/play?device_id=device1 {"uris":["spotify:track:song1"]}'
    ]);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalStorage) Object.defineProperty(globalThis, 'sessionStorage', originalStorage);
    else Reflect.deleteProperty(globalThis, 'sessionStorage');
  }
});
