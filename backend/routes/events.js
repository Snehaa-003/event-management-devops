const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '..', 'uploads'));
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '_' + file.originalname);
    }
});
const upload = multer({ storage: storage });

// Get all events
router.get('/', async (req, res) => {
    try {
        const events = await Event.findAll();
        res.json(events);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Search events
router.get('/search', async (req, res) => {
    try {
        const { term } = req.query;
        const events = await Event.search(term);
        res.json(events);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Create new event with file upload
router.post('/', upload.fields([
    { name: 'proofPhoto1', maxCount: 1 },
    { name: 'proofPhoto2', maxCount: 1 },
    { name: 'certificate', maxCount: 1 }
]), async (req, res) => {
    try {
        const eventData = req.body;
        if (req.files['proofPhoto1']) {
            eventData.proofPhoto1 = req.files['proofPhoto1'][0].filename;
        }
        if (req.files['proofPhoto2']) {
            eventData.proofPhoto2 = req.files['proofPhoto2'][0].filename;
        }
        if (req.files['certificate']) {
            eventData.certificate = req.files['certificate'][0].filename;
        }

        // Sanitize date and file fields
        function sanitizeNull(value) {
            if (value === undefined || value === null || value === '' || value === 'null') return null;
            return value;
        }
        eventData.eventDate = sanitizeNull(eventData.eventDate);
        eventData.eventStartDate = sanitizeNull(eventData.eventStartDate);
        eventData.eventEndDate = sanitizeNull(eventData.eventEndDate);
        eventData.proofPhoto1 = sanitizeNull(eventData.proofPhoto1);
        eventData.proofPhoto2 = sanitizeNull(eventData.proofPhoto2);
        eventData.certificate = sanitizeNull(eventData.certificate);

        const eventId = await Event.create(eventData);
        res.status(201).json({ message: 'Event created successfully', eventId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get event by ID
router.get('/:id', async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }
        res.json(event);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Download file route
router.get('/download/:eventId/:fileType', async (req, res) => {
    try {
        const { eventId, fileType } = req.params;
        
        // Get the event details from the database using the Event model
        const event = await Event.findById(eventId);

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        let filePath;
        let fileName;
        let contentType;

        switch (fileType) {
            case 'photo1':
                filePath = event.proof_photo1;
                fileName = `photo1_${event.student_id}.jpg`;
                contentType = 'image/jpeg';
                break;
            case 'photo2':
                filePath = event.proof_photo2;
                fileName = `photo2_${event.student_id}.jpg`;
                contentType = 'image/jpeg';
                break;
            case 'certificate':
                filePath = event.certificate;
                fileName = `certificate_${event.student_id}.pdf`;
                contentType = 'application/pdf';
                break;
            default:
                return res.status(400).json({ message: 'Invalid file type' });
        }

        if (!filePath) {
            return res.status(404).json({ message: 'File not found' });
        }

        // Construct the full path to the file
        const fullPath = path.join(__dirname, '..', 'uploads', filePath);

        // Check if file exists
        if (!fs.existsSync(fullPath)) {
            return res.status(404).json({ message: 'File not found' });
        }

        // Get file stats
        const stats = fs.statSync(fullPath);
        const fileSize = stats.size;

        // Set headers for file download
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Length', fileSize);
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');

        // Stream the file
        const fileStream = fs.createReadStream(fullPath);
        fileStream.pipe(res);

        fileStream.on('error', (error) => {
            console.error('File stream error:', error);
            if (!res.headersSent) {
                res.status(500).json({ message: 'Error streaming file' });
            }
        });

        res.on('error', (error) => {
            console.error('Response error:', error);
        });

    } catch (error) {
        console.error('Download error:', error);
        if (!res.headersSent) {
            res.status(500).json({ message: 'Error downloading file' });
        }
    }
});

module.exports = router; 