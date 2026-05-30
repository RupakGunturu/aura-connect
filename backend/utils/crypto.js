import crypto from 'crypto';

export function generateAes256GcmKey() {
  return crypto.randomBytes(32);
}

export function encryptAes256Gcm(secret, plaintext, additionalData = '') {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', secret, iv);
  if (additionalData) cipher.setAAD(Buffer.from(additionalData, 'utf8'));

  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
    ciphertext: encrypted.toString('base64'),
  };
}

export function decryptAes256Gcm(secret, ciphertext, iv, authTag, additionalData = '') {
  const decipher = crypto.createDecipheriv('aes-256-gcm', secret, Buffer.from(iv, 'base64'));
  if (additionalData) decipher.setAAD(Buffer.from(additionalData, 'utf8'));
  decipher.setAuthTag(Buffer.from(authTag, 'base64'));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(ciphertext, 'base64')),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
}

export function generateEcdhKeyPair() {
  return crypto.createECDH('x25519');
}

export function deriveSharedSecret(privateKey, publicKey) {
  const ecdh = crypto.createECDH('x25519');
  ecdh.setPrivateKey(privateKey, 'base64');
  return ecdh.computeSecret(publicKey, 'base64');
}
