const pool = require('../config/db');
const path = require('path');
const multer = require('multer');

class Event {
    static async create(eventData) {
        const {
            eventId,
            studentId,
            name,
            eventName,
            eventDate,
            eventStartDate,
            eventEndDate,
            proofPhoto1,
            proofPhoto2,
            certificate
        } = eventData;

        // Convert undefined to null for all fields
        const values = [
            eventId ?? null,
            studentId ?? null,
            name ?? null,
            eventName ?? null,
            eventDate ?? null,
            eventStartDate ?? null,
            eventEndDate ?? null,
            proofPhoto1 ?? null,
            proofPhoto2 ?? null,
            certificate ?? null
        ];

        const [result] = await pool.execute(
            `INSERT INTO events (
                event_id, student_id, name, event_name, 
                event_date, event_start_date, event_end_date,
                proof_photo1, proof_photo2, certificate
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            values
        );
        return result.insertId;
    }

    static async findAll() {
        const [rows] = await pool.execute('SELECT * FROM events ORDER BY submitted_at DESC');
        return rows;
    }

    static async search(searchTerm) {
        const [rows] = await pool.execute(
            `SELECT * FROM events 
            WHERE student_id LIKE ? 
            OR name LIKE ? 
            OR event_name LIKE ?
            ORDER BY submitted_at DESC`,
            [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`]
        );
        return rows;
    }

    static async findById(id) {
        const [rows] = await pool.execute(
            'SELECT * FROM events WHERE id = ?',
            [id]
        );
        return rows[0];
    }

    static async saveFile(file, eventId, fileType) {
        const fileName = `${fileType}_${eventId}_${Date.now()}${path.extname(file.originalname)}`;
        const filePath = path.join('uploads', fileName);
        
        // Save file to uploads directory
        await file.mv(path.join(__dirname, '..', filePath));
        
        return {
            fileName,
            filePath
        };
    }
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '..', 'uploads'));
    },
    filename: function (req, file, cb) {
        // Use Date.now() to make filename unique
        cb(null, Date.now() + '_' + file.originalname);
    }
});
const upload = multer({ storage: storage });

module.exports = Event; 