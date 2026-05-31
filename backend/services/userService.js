import { User } from '../models/User.js';

export async function getUserProfile(userId) {
  return User.findById(userId).select('-passwordHash').lean();
}

export async function updateUserProfile(userId, profileChanges) {
  const allowed = ['name', 'handle', 'bio', 'avatarUrl'];
  const update = {};
  for (const key of allowed) {
    if (profileChanges[key] !== undefined) {
      if (key === 'handle') {
        const existing = await User.findOne({ 'profile.handle': profileChanges.handle, _id: { $ne: userId } });
        if (existing) {
          const error = new Error('Handle already taken');
          error.status = 409;
          throw error;
        }
      }
      update[`profile.${key}`] = profileChanges[key];
    }
  }
  if (Object.keys(update).length === 0) return getUserProfile(userId);
  return User.findByIdAndUpdate(userId, update, { new: true }).select('-passwordHash');
}

export async function updateUserSettings(userId, settings) {
  const payload = {};
  for (const [key, value] of Object.entries(settings)) {
    payload[`settings.${key}`] = value;
  }
  return User.findByIdAndUpdate(userId, payload, { new: true }).select('-passwordHash');
}

export async function findUserByHandle(handle) {
  return User.findOne({ 'profile.handle': handle }).select('-passwordHash');
}

export async function searchUsers(query) {
  return User.find({
    $or: [
      { email: query },
      { 'profile.handle': query },
      { 'profile.name': { $regex: query, $options: 'i' } },
    ],
  }).select('-passwordHash');
}

export async function blockUser(userId, targetUserId) {
  const user = await User.findByIdAndUpdate(
    userId,
    { $addToSet: { blockedUsers: targetUserId } },
    { new: true },
  ).select('-passwordHash');
  return user;
}

export async function unblockUser(userId, targetUserId) {
  const user = await User.findByIdAndUpdate(
    userId,
    { $pull: { blockedUsers: targetUserId } },
    { new: true },
  ).select('-passwordHash');
  return user;
}

export async function listBlockedUsers(userId) {
  const user = await User.findById(userId)
    .select('blockedUsers')
    .populate('blockedUsers', 'email profile');
  return user?.blockedUsers || [];
}
