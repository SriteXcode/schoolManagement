const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

const isConfigured = process.env.CLOUDINARY_CLOUD_NAME && 
                    process.env.CLOUDINARY_API_KEY && 
                    process.env.CLOUDINARY_API_SECRET;

let storage;

if (isConfigured) {
    console.log("☁️  Configuring Cloudinary with:", {
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY ? "EXISTS" : "MISSING"
    });

    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    storage = new CloudinaryStorage({
      cloudinary: cloudinary,
      params: {
        folder: 'school_management',
        allowed_formats: ['jpg', 'png', 'webp', 'jpeg'],
        transformation: [{ width: 1000, height: 1000, crop: "limit" }]
      },
    });
    console.log("✨ Cloudinary Media Engine Initialized");
} else {
    console.warn("⚠️ WARNING: Cloudinary keys missing in .env. Image uploads will be disabled.");
    storage = multer.memoryStorage(); // Fallback to avoid crash
}

const upload = multer({ storage: storage });

module.exports = upload;
