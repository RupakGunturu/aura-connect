import { User } from '../models/User.js';

export async function getUserProfile(userId) {
  return User.findById(userId).select('-passwordHash -refreshToken').lean();
}

export async function updateUserProfile(userId, profileChanges) {
  const allowed = ['name', 'bio', 'avatarUrl'];
  const update = {};
  for (const key of allowed) {
    if (profileChanges[key] !== undefined) {
      update[`profile.${key}`] = profileChanges[key];
    }
  }
  return User.findByIdAndUpdate(userId, update, { new: true }).select('-passwordHash -refreshToken');
}

export async function updateUserSettings(userId, settings) {
  return User.findByIdAndUpdate(userId, { settings }, { new: true }).select('-passwordHash -refreshToken');
}

export async function findUserByHandle(handle) {
  return User.findOne({ 'profile.handle': handle }).select('-passwordHash -refreshToken');
}

export async function searchUsers(query) {
  return User.find({
    $or: [
      { email: query },
      { 'profile.handle': query },
      { 'profile.name': { $regex: query, $options: 'i' } },
    ],
  }).select('-passwordHash -refreshToken');
}
