const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cloudinary = require('../config/cloudinary');
const env = require('../config/env');

const storage = multer.memoryStorage();

const ALLOWED_MIME_TYPES = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp'
};

const fileFilter = (req, file, cb) => {
  if (Object.prototype.hasOwnProperty.call(ALLOWED_MIME_TYPES, file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        'Invalid file type. Only JPEG, JPG, PNG and WEBP image files are allowed.'
      ),
      false
    );
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter
});

const handleImageUpload = async (req, res, next) => {
  req.uploadedImages = [];

  try {
    if (!req.files && !req.file) {
      return next();
    }

    const filesToUpload = req.files
      ? Array.isArray(req.files)
        ? req.files
        : Object.values(req.files).flat()
      : [req.file];

    if (filesToUpload.length === 0) {
      return next();
    }

    const isCloudinaryConfigured =
      env.CLOUDINARY_CLOUD_NAME &&
      env.CLOUDINARY_CLOUD_NAME !== 'demo_cloud' &&
      env.CLOUDINARY_CLOUD_NAME !== 'your_cloudinary_cloud_name';

    const uploadsDir = path.join(__dirname, '../uploads');

    if (!isCloudinaryConfigured && !fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const uploadedImages = [];
    const cloudinaryPublicIds = [];
    const localFilePaths = [];

    try {
      for (const file of filesToUpload) {
        if (isCloudinaryConfigured) {
          const b64 = file.buffer.toString('base64');
          const dataURI = `data:${file.mimetype};base64,${b64}`;

          const result = await cloudinary.uploader.upload(dataURI, {
            folder: 'fikrnot/reports',
            resource_type: 'image'
          });

          uploadedImages.push({
            url: result.secure_url,
            publicId: result.public_id
          });

          cloudinaryPublicIds.push(result.public_id);
        } else {
          const ext = ALLOWED_MIME_TYPES[file.mimetype] || '.jpg';

          const uniqueName = `img_${Date.now()}_${Math.random()
            .toString(36)
            .substring(2, 8)}${ext}`;

          const filePath = path.join(uploadsDir, uniqueName);

          fs.writeFileSync(filePath, file.buffer);
          localFilePaths.push(filePath);

          const baseUrl =
            env.CLIENT_URL ||
            `http://localhost:${env.PORT || 5000}`;

          uploadedImages.push({
            url: `${baseUrl}/uploads/${uniqueName}`,
            publicId: `local_${uniqueName}`
          });
        }
      }

      req.uploadedImages = uploadedImages;

      return next();
    } catch (uploadError) {
      // Clean up Cloudinary files already uploaded in this request.
      if (isCloudinaryConfigured && cloudinaryPublicIds.length > 0) {
        await Promise.allSettled(
          cloudinaryPublicIds.map((publicId) =>
            cloudinary.uploader.destroy(publicId, {
              resource_type: 'image'
            })
          )
        );
      }

      // Clean up local files already written in this request.
      if (!isCloudinaryConfigured && localFilePaths.length > 0) {
        for (const filePath of localFilePaths) {
          try {
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }
          } catch (cleanupError) {
            // Ignore cleanup failures.
          }
        }
      }

      throw uploadError;
    }
  } catch (error) {
    req.uploadedImages = [];
    next(error);
  }
};

module.exports = {
  upload,
  handleImageUpload
};