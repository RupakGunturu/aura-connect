import { FriendRequest } from '../models/FriendRequest.js';
import { User } from '../models/User.js';
import { createConversation } from './conversationService.js';

export async function sendFriendRequest(senderId, recipientId) {
  if (senderId === recipientId) {
    const err = new Error('Cannot send request to yourself');
    err.status = 400;
    throw err;
  }

  const existing = await FriendRequest.findOne({
    $or: [
      { sender: senderId, recipient: recipientId },
      { sender: recipientId, recipient: senderId },
    ],
  });

  if (existing) {
    if (existing.status === 'accepted') {
      const err = new Error('Already friends');
      err.status = 409;
      throw err;
    }
    if (existing.status === 'pending') {
      const err = new Error('Friend request already sent');
      err.status = 409;
      throw err;
    }
    existing.status = 'pending';
    return existing.save();
  }

  const request = new FriendRequest({ sender: senderId, recipient: recipientId });
  return request.save();
}

export async function acceptFriendRequest(requestId, userId) {
  const request = await FriendRequest.findById(requestId);
  if (!request) {
    const err = new Error('Friend request not found');
    err.status = 404;
    throw err;
  }
  if (request.recipient.toString() !== userId) {
    const err = new Error('Not authorized');
    err.status = 403;
    throw err;
  }
  request.status = 'accepted';
  await request.save();

  await User.findByIdAndUpdate(request.sender, { $addToSet: { friends: request.recipient } });
  await User.findByIdAndUpdate(request.recipient, { $addToSet: { friends: request.sender } });

  await createConversation([request.sender, request.recipient], null, true);

  return request;
}

export async function rejectFriendRequest(requestId, userId) {
  const request = await FriendRequest.findById(requestId);
  if (!request) {
    const err = new Error('Friend request not found');
    err.status = 404;
    throw err;
  }
  if (request.recipient.toString() !== userId) {
    const err = new Error('Not authorized');
    err.status = 403;
    throw err;
  }
  request.status = 'rejected';
  return request.save();
}

export async function getIncomingRequests(userId) {
  return FriendRequest.find({ recipient: userId, status: 'pending' })
    .populate('sender', 'profile.name profile.handle profile.avatarUrl')
    .sort({ createdAt: -1 })
    .lean();
}

export async function getOutgoingRequests(userId) {
  return FriendRequest.find({ sender: userId, status: 'pending' })
    .populate('recipient', 'profile.name profile.handle profile.avatarUrl')
    .sort({ createdAt: -1 })
    .lean();
}

export async function removeFriend(userId, friendId) {
  await User.findByIdAndUpdate(userId, { $pull: { friends: friendId } });
  await User.findByIdAndUpdate(friendId, { $pull: { friends: userId } });
  await FriendRequest.deleteOne({
    $or: [
      { sender: userId, recipient: friendId },
      { sender: friendId, recipient: userId },
    ],
  });
}

export async function getFriends(userId) {
  const user = await User.findById(userId)
    .populate('friends', 'profile.name profile.handle profile.avatarUrl profile.bio')
    .lean();
  return user?.friends ?? [];
}
