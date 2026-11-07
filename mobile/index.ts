import { registerRootComponent } from 'expo';
import App from './App';
const callback = typeof window !== 'undefined' && window.opener
  ? new URLSearchParams(window.location.search) : null;
if (callback?.get('state')?.startsWith('feelody-spotify-') && (callback.has('code') || callback.has('error'))) {
  window.opener.postMessage({ state: callback.get('state'), code: callback.get('code') }, window.location.origin);
  window.history.replaceState(null, '', '/');
} else {
  registerRootComponent(App);
}
