const cloudinary = require('cloudinary').v2;

// The SDK automatically looks for 'CLOUDINARY_URL' in your .env
// You don't need to manually pass the key/secret here!
cloudinary.config(); 

module.exports = cloudinary;