import { env } from './env.js';

export function getIceServers() {
  const servers = [{ urls: 'stun:stun.l.google.com:19302' }];

  if (env.turnUrl && env.turnUsername && env.turnCredential) {
    servers.push({
      urls: env.turnUrl,
      username: env.turnUsername,
      credential: env.turnCredential,
    });
  }

  return servers;
}
