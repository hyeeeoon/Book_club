const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// 전체 도서 목록 조회
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM books");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 새로운 도서 등록
router.post('/', async (req, res) => {
  const { title, author, total_pages } = req.body;
  try {
    const [result] = await pool.query(
      "INSERT INTO books (title, author, total_pages) VALUES (?, ?, ?)",
      [title, author, total_pages]
    );
    res.json({ success: true, bookId: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 멤버별 독서 진행도 업데이트
router.patch('/progress', async (req, res) => {
  const { member_id, current_page } = req.body;
  try {
    await pool.query(
      "UPDATE reading_progress SET current_page = ? WHERE member_id = ?",
      [current_page, member_id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;