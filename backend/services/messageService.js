import { Message } from '../models/Message.js';
import { Conversation } from '../models/Conversation.js';

export async function getConversationMessages(conversationId, limit = 50) {
  return Message.find({ conversationId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
}

export async function createMessage(messagePayload) {
  const message = new Message(messagePayload);
  await message.save();

  const senderId = messagePayload.senderId;
  const conversationId = messagePayload.conversationId;

  const conversation = await Conversation.findById(conversationId);
  if (conversation) {
    conversation.lastMessage = message._id;
    for (const pid of conversation.participants) {
      if (pid.toString() !== senderId) {
        const key = pid.toString();
        conversation.unreadCounts.set(key, (conversation.unreadCounts.get(key) || 0) + 1);
      }
    }
    await conversation.save();
  }

  return message;
}

export async function markMessageDelivered(messageId) {
  return Message.findByIdAndUpdate(messageId, { delivered: true }, { new: true }).lean();
}

export async function markMessageRead(messageId) {
  return Message.findByIdAndUpdate(messageId, { read: true }, { new: true }).lean();
}

export async function markConversationRead(conversationId, userId) {
  await Conversation.findByIdAndUpdate(conversationId, {
    $set: { [`unreadCounts.${userId}`]: 0 },
  });
  await Message.updateMany(
    { conversationId, senderId: { $ne: userId }, read: false },
    { read: true },
  );
}
