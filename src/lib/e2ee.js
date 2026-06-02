import { x25519 } from "@noble/curves/ed25519.js";

function base64Url(buf) {
  const bytes = new Uint8Array(buf);
  let result = "";
  for (let i = 0; i < bytes.length; i += 8192) {
    result += String.fromCharCode(...bytes.subarray(i, i + 8192));
  }
  return btoa(result)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function fromBase64Url(str) {
  const s = str.replace(/-/g, "+").replace(/_/g, "/");
  const pad = s.length % 4 ? 4 - (s.length % 4) : 0;
  return Uint8Array.from(atob(s + "=".repeat(pad)), (c) => c.charCodeAt(0));
}

export function generateKeyPair() {
  const privateKey = x25519.utils.randomSecretKey();
  const publicKey = x25519.getPublicKey(privateKey);
  return {
    privateKey: base64Url(privateKey),
    publicKey: base64Url(publicKey),
  };
}

export function deriveSharedSecret(privateKeyB64, theirPublicKeyB64) {
  const priv = fromBase64Url(privateKeyB64);
  const pub = fromBase64Url(theirPublicKeyB64);
  const shared = x25519.getSharedSecret(priv, pub);
  return base64Url(shared);
}

async function hkdfDerive(sharedSecretB64, salt, info, length = 32) {
  const key = await crypto.subtle.importKey("raw", fromBase64Url(sharedSecretB64), "HKDF", false, [
    "deriveBits",
  ]);
  const bits = await crypto.subtle.deriveBits(
    {
      name: "HKDF",
      salt: new TextEncoder().encode(salt),
      info: new TextEncoder().encode(info),
      hash: "SHA-256",
    },
    key,
    length * 8,
  );
  return new Uint8Array(bits);
}

export async function encryptMessage(sharedSecretB64, plaintext, conversationId, counter) {
  const msgKey = await hkdfDerive(
    sharedSecretB64,
    "aura-connect-msg-v1",
    `${conversationId}:${counter}`,
  );

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const aesKey = await crypto.subtle.importKey("raw", msgKey, "AES-GCM", false, ["encrypt"]);

  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    aesKey,
    new TextEncoder().encode(plaintext),
  );

  const ciphertext = encrypted.slice(0, -16);
  const authTag = encrypted.slice(-16);

  return {
    encryptedPayload: base64Url(new Uint8Array(ciphertext)),
    iv: base64Url(iv),
    authTag: base64Url(new Uint8Array(authTag)),
    counter,
  };
}

export async function decryptMessage(
  sharedSecretB64,
  encryptedPayloadB64,
  ivB64,
  authTagB64,
  conversationId,
  counter,
) {
  const msgKey = await hkdfDerive(
    sharedSecretB64,
    "aura-connect-msg-v1",
    `${conversationId}:${counter}`,
  );

  const iv = fromBase64Url(ivB64);
  const ciphertext = fromBase64Url(encryptedPayloadB64);
  const authTag = fromBase64Url(authTagB64);

  const combined = new Uint8Array(ciphertext.length + authTag.length);
  combined.set(ciphertext);
  combined.set(authTag, ciphertext.length);

  const aesKey = await crypto.subtle.importKey("raw", msgKey, "AES-GCM", false, ["decrypt"]);

  const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, aesKey, combined);

  return new TextDecoder().decode(decrypted);
}

export async function encryptFile(sharedSecretB64, file, conversationId, counter) {
  const fileKey = await hkdfDerive(
    sharedSecretB64,
    "aura-connect-file-v1",
    `${conversationId}:${counter}`,
  );

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const aesKey = await crypto.subtle.importKey("raw", fileKey, "AES-GCM", false, ["encrypt"]);

  const fileData = await file.arrayBuffer();
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, aesKey, fileData);

  const ciphertext = new Uint8Array(encrypted.slice(0, -16));
  const authTag = new Uint8Array(encrypted.slice(-16));

  return {
    encryptedPayload: base64Url(ciphertext),
    iv: base64Url(iv),
    authTag: base64Url(authTag),
  };
}

export async function decryptFile(
  sharedSecretB64,
  encryptedPayloadB64,
  ivB64,
  authTagB64,
  conversationId,
  counter,
) {
  const fileKey = await hkdfDerive(
    sharedSecretB64,
    "aura-connect-file-v1",
    `${conversationId}:${counter}`,
  );

  const iv = fromBase64Url(ivB64);
  const ciphertext = fromBase64Url(encryptedPayloadB64);
  const authTag = fromBase64Url(authTagB64);

  const combined = new Uint8Array(ciphertext.length + authTag.length);
  combined.set(ciphertext);
  combined.set(authTag, ciphertext.length);

  const aesKey = await crypto.subtle.importKey("raw", fileKey, "AES-GCM", false, ["decrypt"]);

  const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, aesKey, combined);

  return new Blob([decrypted]);
}

export { base64Url, fromBase64Url };
