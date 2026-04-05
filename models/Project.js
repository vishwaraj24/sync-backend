const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
    title: { type: String, required: true },
    thumbnail: { type: String, required: true }, // URL path to thumb image
    galleryImages: [{ type: String }] // Array of URL paths to gallery images
}, { timestamps: true });

module.exports = mongoose.model('Project', projectSchema);
