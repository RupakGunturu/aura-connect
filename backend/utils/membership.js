import { Conversation } from '../models/Conversation.js';

const cache = new Map();
const TTL_MS = 30_000;

function cacheKey(conversationId, userId) {
  return `${conversationId}:${userId}`;
}

export async function isConversationMember(conversationId, userId) {
  const key = cacheKey(conversationId, userId);
  const cached = cache.get(key);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.isMember;
  }

  const count = await Conversation.countDocuments({
    _id: conversationId,
    participants: userId,
  }).maxTimeMS(3000);

  cache.set(key, { isMember: count > 0, expiresAt: Date.now() + TTL_MS });
  return count > 0;
}

export async function requireConversationMember(conversationId, userId) {
  const ok = await isConversationMember(conversationId, userId);
  if (!ok) {
    const error = new Error('Access denied — you are not a participant of this conversation');
    error.status = 403;
    throw error;
  }
}
