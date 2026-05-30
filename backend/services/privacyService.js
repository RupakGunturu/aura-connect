import { User } from '../models/User.js';

export async function updatePrivacySettings(userId, settings) {
  const allowed = ['privacyMode', 'allowUnknownMessages'];
  const payload = {};
  for (const key of allowed) {
    if (settings[key] !== undefined) {
      payload[`settings.${key}`] = settings[key];
    }
  }
  return User.findByIdAndUpdate(userId, payload, { new: true }).select('-passwordHash -refreshToken');
}

export async function getPrivacySettings(userId) {
  const user = await User.findById(userId).select('settings');
  return user?.settings || null;
}
