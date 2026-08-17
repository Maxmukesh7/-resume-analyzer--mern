import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Verifies a Google ID token server-side and extracts authenticated user payload.
 * Cryptographically verifies Google signature, expiry, and client audience.
 *
 * @param {string} idToken - Raw Google ID token (JWT) from Google Identity Services.
 * @returns {Promise<{googleId: string, email: string, fullName: string, avatar: string, isEmailVerified: boolean}>}
 */
export const verifyGoogleIdToken = async (idToken) => {
  if (!idToken || typeof idToken !== 'string') {
    throw new Error('Google ID token is required and must be a valid string.');
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;

  // 1. Primary: Verify token signature using google-auth-library
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: clientId || undefined
    });
    const payload = ticket.getPayload();

    if (!payload || !payload.email) {
      throw new Error('Google ID token payload is missing email.');
    }

    return {
      googleId: payload.sub,
      email: payload.email.toLowerCase().trim(),
      fullName: payload.name || payload.given_name || payload.email.split('@')[0],
      avatar: payload.picture || '',
      isEmailVerified: payload.email_verified === true
    };
  } catch (primaryError) {
    console.warn('⚠️ [GoogleAuth] Primary verification warning:', primaryError.message);

    // 2. Fallback: Query Google's tokeninfo endpoint
    try {
      const response = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
      );

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Google tokeninfo endpoint returned ${response.status}: ${errText}`);
      }

      const data = await response.json();

      if (!data.email) {
        throw new Error('Google token does not contain a valid email address.');
      }

      // Check audience if client ID is configured
      if (clientId && data.aud !== clientId && data.azp !== clientId) {
        throw new Error('Google token audience does not match configured Google Client ID.');
      }

      return {
        googleId: data.sub,
        email: data.email.toLowerCase().trim(),
        fullName: data.name || data.given_name || data.email.split('@')[0],
        avatar: data.picture || '',
        isEmailVerified: data.email_verified === 'true' || data.email_verified === true
      };
    } catch (fallbackError) {
      console.error('💥 [GoogleAuth] Token verification failed:', fallbackError.message);
      throw new Error('Google authentication verification failed. Token is invalid or expired.');
    }
  }
};
