var DiaryContent = require('../models/diaryContent')

module.exports.list = (query = {}) => {
    return DiaryContent
        .find(query)
        .sort({ createdAt: -1 })
        .exec();
}

module.exports.getOne = (id) => {
    return DiaryContent
        .findOne({_id: id})
        .exec();
}

module.exports.create = (entry) => {
    const newEntry = new DiaryContent({
        producer: entry.producer,
        title: entry.title,
        content: entry.content,
        createdAt: entry.createdAt || new Date(),
        isPublic: entry.isPublic || false,
        tags: entry.tags || [],
        files: entry.files || [],
        comments: []
    })
    return newEntry.save();
}

module.exports.update = (id, entry) => {
    return DiaryContent
        .findByIdAndUpdate(
            id,
            { $set: entry },
            { new: true }
        )
        .exec();
}

module.exports.delete = (id) => {
    return DiaryContent
        .findByIdAndDelete(id)
        .exec();
}

module.exports.addComment = (id, comment) => {
    const newComment = {
        ...comment,
        createdAt: new Date()
    }
    return DiaryContent
        .findByIdAndUpdate(
            id,
            { $push: { comments: newComment } },
            { new: true }
        )
        .exec();
}
