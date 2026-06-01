import { Conversation } from '../models/Conversation.js';

export async function getUserConversations(userId) {
  return Conversation.find({ participants: userId })
    .populate('participants', 'email profile')
    .populate('lastMessage')
    .populate('pinned.messageId', 'senderId body encryptedPayload iv authTag metadata createdAt')
    .sort({ updatedAt: -1 })
    .lean();
}

export async function getConversationById(conversationId) {
  return Conversation.findById(conversationId)
    .populate('participants', 'email profile')
    .populate('lastMessage')
    .populate('pinned.messageId', 'senderId body encryptedPayload iv authTag metadata createdAt')
    .lean();
}

export async function createConversation(participants, title, isPrivate = true) {
  const conversation = new Conversation({ participants, title, isPrivate });
  return conversation.save();
}

export async function addParticipant(conversationId, userId) {
  return Conversation.findByIdAndUpdate(
    conversationId,
    { $addToSet: { participants: userId } },
    { new: true },
  ).lean();
}

export async function setDisappearDuration(conversationId, duration) {
  return Conversation.findByIdAndUpdate(
    conversationId,
    { disappearDuration: duration },
    { new: true },
  ).lean();
}

export async function pinMessage(conversationId, messageId, userId) {
  return Conversation.findByIdAndUpdate(
    conversationId,
    {
      $push: {
        pinned: { messageId, pinnedBy: userId, pinnedAt: new Date() },
      },
    },
    { new: true },
  ).lean();
}

export async function unpinMessage(conversationId, messageId) {
  return Conversation.findByIdAndUpdate(
    conversationId,
    { $pull: { pinned: { messageId } } },
    { new: true },
  ).lean();
}

export async function clearConversationHistory(conversationId, userId) {
  return Conversation.findByIdAndUpdate(
    conversationId,
    { $set: { [`clearedHistoryAt.${userId}`]: new Date() } },
    { new: true },
  ).lean();
}

export async function removeParticipant(conversationId, userId) {
  return Conversation.findByIdAndUpdate(
    conversationId,
    { $pull: { participants: userId } },
    { new: true },
  ).lean();
}
