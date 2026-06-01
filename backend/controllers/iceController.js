import { getIceServers } from '../config/iceServers.js';

export function getIceConfig(req, res) {
  const iceServers = getIceServers();
  res.status(200).json({ iceServers });
}
