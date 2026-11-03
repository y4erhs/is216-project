const mongoose = require('mongoose');
const Image = require('../models/image');

exports.getImage = async (req, res) => {
    try {
        const image = mongoose.isValidObjectId(req.params.id) ? await Image.findById(req.params.id) : null;
        if (!image) return res.status(404).json({ message: 'Image not found' });

        // a new picture gets a new id, so browsers can keep this one
        res.set({
            'Content-Type': image.contentType,
            'Cache-Control': 'public, max-age=31536000, immutable',
            'X-Content-Type-Options': 'nosniff'
        });
        return res.send(image.data);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};
