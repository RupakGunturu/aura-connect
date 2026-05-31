export async function uploadFile(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file provided" });
    }
    res.status(200).json({
      file: {
        url: `/uploads/${req.file.filename}`,
        name: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
      },
    });
  } catch (error) {
    next(error);
  }
}
