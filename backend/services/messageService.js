import { Message } from '../models/Message.js';
import { Conversation } from '../models/Conversation.js';

export async function getConversationMessages(conversationId, limit = 50, userId = null) {
  const filter = { conversationId };
  if (userId) {
    const conv = await Conversation.findById(conversationId).select('clearedHistoryAt').lean();
    const clearedAt = conv?.clearedHistoryAt?.[userId];
    if (clearedAt) {
      filter.createdAt = { $gt: clearedAt };
    }
  }
  return Message.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate({
      path: 'replyTo',
      select: 'senderId body encryptedPayload iv authTag metadata createdAt',
      populate: { path: 'senderId', select: 'profile.name' },
    })
    .lean();
}

export async function createMessage(messagePayload) {
  const conversationId = messagePayload.conversationId;

  const conversation = await Conversation.findById(conversationId);
  if (conversation && conversation.disappearDuration > 0) {
    messagePayload.disappearsAt = new Date(Date.now() + conversation.disappearDuration * 1000);
  }

  const message = new Message(messagePayload);
  await message.save();

  const senderId = messagePayload.senderId;

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

  if (message.replyTo) {
    await message.populate({
      path: 'replyTo',
      select: 'senderId body encryptedPayload iv authTag metadata createdAt',
      populate: { path: 'senderId', select: 'profile.name profile.handle' },
    });
  }

  return message;
}

export async function markMessageDelivered(messageId) {
  return Message.findByIdAndUpdate(messageId, { delivered: true }, { new: true }).lean();
}

export async function markMessageRead(messageId) {
  return Message.findByIdAndUpdate(messageId, { read: true }, { new: true }).lean();
}

export async function softDeleteMessage(messageId, userId) {
  const message = await Message.findById(messageId);
  if (!message) return null;
  if (message.senderId.toString() !== userId) {
    const err = new Error('Not authorized to delete this message');
    err.status = 403;
    throw err;
  }
  message.deletedAt = new Date();
  return message.save();
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
