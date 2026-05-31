import { Conversation } from '../models/Conversation.js';

export async function getUserConversations(userId) {
  return Conversation.find({ participants: userId })
    .populate('participants', 'email profile')
    .populate('lastMessage')
    .sort({ updatedAt: -1 })
    .lean();
}

export async function getConversationById(conversationId) {
  return Conversation.findById(conversationId)
    .populate('participants', 'email profile')
    .populate('lastMessage')
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

export async function removeParticipant(conversationId, userId) {
  return Conversation.findByIdAndUpdate(
    conversationId,
    { $pull: { participants: userId } },
    { new: true },
  ).lean();
}
