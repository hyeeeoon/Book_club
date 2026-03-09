const express = require('express');
const router = express.Router();
const pool = require('../config/db.js');

// 전체 멤버 목록 조회 (ID와 이름만 간단히)
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT id, name FROM members");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;