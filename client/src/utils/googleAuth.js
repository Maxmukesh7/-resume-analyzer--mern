/**
 * Google Identity Services (GIS) Frontend Integration Helper
 */

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

/**
 * Ensures the Google Identity Services SDK script is loaded.
 */
export const loadGoogleScript = () => {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve(window.google.accounts.id);
      return;
    }

    const existingScript = document.getElementById('google-identity-services-script');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(window.google?.accounts?.id));
      existingScript.addEventListener('error', () => reject(new Error('Failed to load Google script.')));
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-identity-services-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google?.accounts?.id);
    script.onerror = () => reject(new Error('Failed to load Google Identity Services SDK.'));
    document.head.appendChild(script);
  });
};

/**
 * Initializes Google Sign-In and triggers Google OAuth Popup.
 *
 * @param {Object} options
 * @param {Function} options.onSuccess - Called with Google credential ID token
 * @param {Function} options.onError - Called with error message
 * @param {Function} options.onStart - Called when authentication starts
 */
export const triggerGoogleSignIn = async ({ onStart, onSuccess, onError }) => {
  try {
    if (!GOOGLE_CLIENT_ID) {
      const msg = 'Google Client ID is not configured. Please set VITE_GOOGLE_CLIENT_ID in client/.env and GOOGLE_CLIENT_ID in server/.env.';
      console.warn('⚠️ [GoogleAuth]', msg);
      if (onError) onError(msg);
      return;
    }

    if (onStart) onStart();

    await loadGoogleScript();

    if (!window.google?.accounts?.id) {
      throw new Error('Google Identity Services SDK is not available.');
    }

    // Initialize Google Identity Services
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (response) => {
        if (response?.credential) {
          if (onSuccess) onSuccess(response.credential);
        } else {
          if (onError) onError('Google authentication did not return a valid credential.');
        }
      },
      auto_select: false,
      cancel_on_tap_outside: true
    });

    // Render a temporary button and trigger click to open standard Google OAuth popup
    let hiddenContainer = document.getElementById('g_id_hidden_signin_container');
    if (!hiddenContainer) {
      hiddenContainer = document.createElement('div');
      hiddenContainer.id = 'g_id_hidden_signin_container';
      hiddenContainer.style.display = 'none';
      document.body.appendChild(hiddenContainer);
    }

    window.google.accounts.id.renderButton(hiddenContainer, {
      theme: 'outline',
      size: 'large',
      type: 'standard'
    });

    // Also trigger prompt
    window.google.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed()) {
        console.log('ℹ️ [GoogleAuth] Prompt not displayed reason:', notification.getNotDisplayedReason());
        // Fallback: Click the rendered hidden button to force popup
        const button = hiddenContainer.querySelector('div[role="button"]');
        if (button) {
          button.click();
        }
      } else if (notification.isSkippedMoment()) {
        console.log('ℹ️ [GoogleAuth] Prompt skipped:', notification.getSkippedReason());
        if (onError) onError('Google sign-in was closed or skipped.');
      } else if (notification.isDismissedMoment()) {
        console.log('ℹ️ [GoogleAuth] Prompt dismissed:', notification.getDismissedReason());
        if (onError) onError('Google sign-in prompt was dismissed.');
      }
    });

    // Trigger button click directly if available
    const button = hiddenContainer.querySelector('div[role="button"]');
    if (button) {
      button.click();
    }
  } catch (error) {
    console.error('💥 [GoogleAuth] Error during Google sign in:', error);
    if (onError) onError(error.message || 'Google authentication encountered an unexpected error.');
  }
};
