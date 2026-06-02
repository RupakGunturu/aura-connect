import sharp from "sharp";

export async function uploadFile(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file provided" });
    }

    const { buffer, mimetype, originalname, size } = req.file;
    let finalBuffer = buffer;
    let finalMime = mimetype;

    if (mimetype.startsWith("image/") && mimetype !== "image/gif") {
      finalBuffer = await sharp(buffer)
        .resize(1920, undefined, { fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toBuffer();
      finalMime = "image/jpeg";
    }

    const base64 = finalBuffer.toString("base64");
    const dataUrl = `data:${finalMime};base64,${base64}`;

    res.status(200).json({
      file: {
        url: dataUrl,
        name: originalname,
        size: finalBuffer.length,
        mimetype: finalMime,
      },
    });
  } catch (error) {
    next(error);
  }
}
