import { Message } from '../models/Message.js';
import { Conversation } from '../models/Conversation.js';
export async function getConversationMessages(conversationId, limit = 50, userId = null, before = null) {
  const filter = { conversationId };
  if (before) {
    const ref = await Message.findById(before).select('createdAt').lean();
    if (ref) filter.createdAt = { ...(filter.createdAt || {}), $lt: ref.createdAt };
  }
  if (userId) {
    const conv = await Conversation.findOne({ _id: conversationId, participants: userId }).select('clearedHistoryAt').lean();
    if (!conv) {
      const err = new Error('Access denied — you are not a participant of this conversation');
      err.status = 403;
      throw err;
    }
    const clearedAt = conv?.clearedHistoryAt?.[userId];
    if (clearedAt) {
      filter.createdAt = { ...(filter.createdAt || {}), $gt: clearedAt };
    }
  }
  const messages = await Message.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit + 1)
    .populate('replyTo', 'senderId body createdAt')
    .select('conversationId senderId body encryptedPayload iv authTag attachments replyTo metadata createdAt updatedAt delivered read deletedAt disappearsAt')
    .lean();
  const hasMore = messages.length > limit;
  if (hasMore) messages.pop();
  return { messages, hasMore };
}

export async function createMessage(messagePayload) {
  const conversationId = messagePayload.conversationId;
  const senderId = messagePayload.senderId;

  const conversation = await Conversation.findOne({ _id: conversationId, participants: senderId }).select('disappearDuration participants').lean();
  if (!conversation) {
    const err = new Error('Access denied — you are not a participant of this conversation');
    err.status = 403;
    throw err;
  }
  if (conversation.disappearDuration > 0) {
    messagePayload.disappearsAt = new Date(Date.now() + conversation.disappearDuration * 1000);
  }

  const message = new Message(messagePayload);
  message.delivered = false;
  message.read = false;
  await message.save();

  // EMIT CAN HAPPEN NOW — background ops below

  if (message.replyTo) {
    message.populate({
      path: 'replyTo',
      select: 'senderId body encryptedPayload iv authTag metadata createdAt',
      populate: { path: 'senderId', select: 'profile.name profile.handle' },
    }).catch(() => {});
  }

  Conversation.findByIdAndUpdate(conversationId, {
    lastMessage: message._id,
    $inc: Object.fromEntries(
      (conversation?.participants ?? [])
        .filter((p) => p.toString() !== senderId)
        .map((p) => [`unreadCounts.${p.toString()}`, 1]),
    ),
  }).catch((err) => console.error('Failed to update conversation after message', err));

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
