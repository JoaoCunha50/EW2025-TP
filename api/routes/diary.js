const express = require('express');
const router = express.Router();
const DiaryContent = require('../controllers/diaryContent');

router.get('/', async (req, res) => {
    try {
        let query = {};
        if (req.query.isPublic) query.isPublic = req.query.isPublic === 'true';
        if (req.query.tags) query.tags = { $in: req.query.tags.split(',') };
        
        const entries = await DiaryContent.list(query);
        res.status(200).json(entries);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const entry = await DiaryContent.getOne(req.params.id);
        if (!entry) return res.status(404).json({ error: 'Entry not found' });
        res.status(200).json(entry);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/', async (req, res) => {
    try {
        const entry = await DiaryContent.create(req.body);
        res.status(201).json(entry);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const entry = await DiaryContent.update(req.params.id, req.body);
        if (!entry) return res.status(404).json({ error: 'Entry not found' });
        res.status(200).json(entry);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const entry = await DiaryContent.delete(req.params.id);
        if (!entry) return res.status(404).json({ error: 'Entry not found' });
        res.status(200).json({ message: 'Entry deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/:id/comments', async (req, res) => {
    try {
        const entry = await DiaryContent.addComment(req.params.id, {
            user: req.body.user,
            text: req.body.text
        });
        if (!entry) return res.status(404).json({ error: 'Entry not found' });
        res.status(200).json(entry);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
