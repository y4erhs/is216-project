const mongoose = require('mongoose');

const IMAGE_PATH = '/api/images/';

// Profile pictures and banners. They live in the database so every laptop and server sees the same ones.
const imageSchema = new mongoose.Schema({
    data: {
        type: Buffer,
        required: true
    },
    contentType: {
        type: String,
        required: true
    }
}, { timestamps: true });

// Saves an uploaded file and returns the link to store on the user
imageSchema.statics.saveUpload = async function(file) {
    const image = await this.create({ data: file.buffer, contentType: file.mimetype });
    return `${IMAGE_PATH}${image._id}`;
};

// Removes an image by its link. Other links, like the default picture, are left alone.
imageSchema.statics.removeByPath = async function(path) {
    if (!path || !path.startsWith(IMAGE_PATH)) return;
    await this.deleteOne({ _id: path.slice(IMAGE_PATH.length) });
};

module.exports = mongoose.model('Image', imageSchema);
