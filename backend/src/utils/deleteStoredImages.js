const fs = require('fs/promises');
const path = require('path');
const cloudinary = require('../config/cloudinary');
const env = require('../config/env');

const deleteStoredImages = async (images = []) => {
  const uploadsDir = path.resolve(__dirname, '../uploads');
  const cloudinaryConfigured = Boolean(
    env.CLOUDINARY_CLOUD_NAME &&
    env.CLOUDINARY_CLOUD_NAME !== 'demo_cloud' &&
    env.CLOUDINARY_CLOUD_NAME !== 'your_cloudinary_cloud_name'
  );

  await Promise.allSettled(images.map(async (image) => {
    const publicId = image?.publicId || '';
    if (publicId.startsWith('local_')) {
      const fileName = path.basename(publicId.slice('local_'.length));
      const filePath = path.resolve(uploadsDir, fileName);
      if (!filePath.startsWith(`${uploadsDir}${path.sep}`)) return;
      try {
        await fs.unlink(filePath);
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }
      return;
    }

    if (publicId && cloudinaryConfigured) {
      const result = await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
      if (result?.result !== 'ok' && result?.result !== 'not found') {
        throw new Error(`Cloudinary did not confirm deletion for ${publicId}`);
      }
    }
  })).then((results) => {
    for (const result of results) {
      if (result.status === 'rejected') {
        console.error('[Image Cleanup Error]', result.reason?.message || result.reason);
      }
    }
  });
};

module.exports = deleteStoredImages;
