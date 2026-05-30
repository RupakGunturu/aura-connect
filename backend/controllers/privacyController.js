import { getPrivacySettings, updatePrivacySettings } from '../services/privacyService.js';
import { requireFields } from '../utils/validation.js';

export async function getPrivacy(req, res, next) {
  try {
    const settings = await getPrivacySettings(req.user.id);
    res.status(200).json({ settings });
  } catch (error) {
    next(error);
  }
}

export async function updatePrivacy(req, res, next) {
  try {
    requireFields(req.body, ['settings']);
    const settings = await updatePrivacySettings(req.user.id, req.body.settings);
    res.status(200).json({ settings });
  } catch (error) {
    next(error);
  }
}
