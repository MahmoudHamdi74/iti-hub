let initializedApi;
let initializedClientId;
const listeners = new Set();
let activeListener;

// GIS configuration is global to the page, while login/register buttons mount
// independently. Keep one initialization and route credentials to the active UI.
export function registerGoogleIdentity(api, clientId, listener) {
  if (initializedApi !== api || initializedClientId !== clientId) {
    api.initialize({
      client_id: clientId,
      // Supported browsers mediate sign-in instead of relying on a JS popup.
      use_fedcm_for_button: true,
      callback: response => {
        if (response?.credential) activeListener?.success(response.credential);
        else activeListener?.error(new Error('Google Sign-In returned no credential'));
      },
    });
    initializedApi = api;
    initializedClientId = clientId;
  }
  listeners.add(listener);
  activeListener = listener;
  return {
    activate: () => { activeListener = listener; },
    release: () => {
      listeners.delete(listener);
      if (activeListener === listener) activeListener = [...listeners].at(-1);
    },
  };
}
