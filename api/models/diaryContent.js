var mongoose = require('mongoose');

var fileSchema = new mongoose.Schema({
    filename: String,
    path: String,
    url: String,
    type: String,
    size: Number
}, { _id: false });

var commentSchema = new mongoose.Schema({
    user: String,
    text: String,
    createdAt: Date
}, { _id: false });

var diaryContentSchema = new mongoose.Schema({
    producer: String,
    title: String,
    content: String,
    createdAt: Date,
    isPublic: Boolean,
    tags: [String],
    files: [fileSchema],
    comments: [commentSchema]
}, { versionKey: false });

module.exports = mongoose.model('diary', diaryContentSchema);