// Check if WebAuthn/biometric is available
export const isBiometricAvailable = () => {
  return !!(window.PublicKeyCredential &&
    window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable &&
    window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable());
};

// Register a passkey for the current device (after login)
export const registerBiometric = async (userId, email) => {
  if (!await isBiometricAvailable()) return { success: false, error: 'Biometric not available' };
  try {
    const publicKeyCredentialCreationOptions = {
      challenge: new Uint8Array(32),
      rp: { name: 'OnlinePT', id: window.location.hostname },
      user: { id: new TextEncoder().encode(userId), name: email, displayName: email },
      pubKeyCredParams: [{ alg: -7, type: 'public-key' }, { alg: -257, type: 'public-key' }],
      authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required' },
      timeout: 60000,
      attestation: 'none',
    };
    const credential = await navigator.credentials.create({ publicKey: publicKeyCredentialCreationOptions });
    // Store credential ID in localStorage for this user
    const creds = JSON.parse(localStorage.getItem('biometric_creds') || '{}');
    creds[userId] = { id: credential.id };
    localStorage.setItem('biometric_creds', JSON.stringify(creds));
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
};

// Authenticate using stored passkey
export const authenticateBiometric = async (userId) => {
  if (!await isBiometricAvailable()) return { success: false, error: 'Biometric not available' };
  const creds = JSON.parse(localStorage.getItem('biometric_creds' || '{}'));
  if (!creds[userId]) return { success: false, error: 'No passkey registered' };
  try {
    const publicKeyCredentialRequestOptions = {
      challenge: new Uint8Array(32),
      rpId: window.location.hostname,
      allowCredentials: [{ id: creds[userId].id, type: 'public-key' }],
      userVerification: 'required',
      timeout: 60000,
    };
    await navigator.credentials.get({ publicKey: publicKeyCredentialRequestOptions });
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
};
