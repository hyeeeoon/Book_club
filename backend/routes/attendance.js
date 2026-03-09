const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// 전체 출석 기록 조회
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM attendance");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 특정 날짜 출석 체크 (O/X 수정 및 저장)
router.post('/', async (req, res) => {
  const { member_id, date, status } = req.body;
  try {
    // 실무 팁: ON DUPLICATE KEY UPDATE를 쓰면 코드가 한 줄로 끝납니다.
    const sql = `
      INSERT INTO attendance (member_id, date, status) 
      VALUES (?, ?, ?) 
      ON DUPLICATE KEY UPDATE status = ?
    `;
    await pool.query(sql, [member_id, date, status, status]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;