import { Message } from '../models/Message.js';

export async function getConversationMessages(conversationId, limit = 50) {
  return Message.find({ conversationId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
}

export async function createMessage(messagePayload) {
  const message = new Message(messagePayload);
  return message.save();
}

export async function markMessageDelivered(messageId) {
  return Message.findByIdAndUpdate(messageId, { delivered: true }, { new: true }).lean();
}

export async function markMessageRead(messageId) {
  return Message.findByIdAndUpdate(messageId, { read: true }, { new: true }).lean();
}
