import { User } from '../models/User.js';

const ALLOWED_SETTINGS = ['privacyMode', 'allowUnknownMessages', 'allowVoiceCalls', 'allowVideoCalls', 'showOnlineStatus'];

export async function updatePrivacySettings(userId, settings) {
  const payload = {};
  for (const [key, value] of Object.entries(settings)) {
    if (ALLOWED_SETTINGS.includes(key)) {
      payload[`settings.${key}`] = value;
    }
  }
  return User.findByIdAndUpdate(userId, payload, { new: true }).select('-passwordHash');
}

export async function getPrivacySettings(userId) {
  const user = await User.findById(userId).select('settings');
  return user?.settings || null;
}
