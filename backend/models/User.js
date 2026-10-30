const pool = require('../config/db');

class User {
    static async findByEmail(email) {
        const [rows] = await pool.execute(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );
        return rows[0];
    }

    static async create(userData) {
        const { name, email, password, role, studentId } = userData;
        const [result] = await pool.execute(
            'INSERT INTO users (name, email, password, role, student_id) VALUES (?, ?, ?, ?, ?)',
            [name, email, password, role, studentId]
        );
        return result.insertId;
    }

    static async findById(id) {
        const [rows] = await pool.execute(
            'SELECT * FROM users WHERE id = ?',
            [id]
        );
        return rows[0];
    }
}

module.exports = User; 