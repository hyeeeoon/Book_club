const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const app = express();

app.use(cors());
app.use(express.json());

// 서버 시작 시 DB 초기화
async function initDB() {
  const db = await connectDB();
  await db.exec(`
    -- name 컬럼에 UNIQUE를 추가하여 중복 가입 방지
    CREATE TABLE IF NOT EXISTS members (
      id INTEGER PRIMARY KEY AUTOINCREMENT, 
      name TEXT UNIQUE 
    );
    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT, 
      member_id INTEGER, 
      date TEXT, 
      status TEXT, 
      UNIQUE(member_id, date)
    );
    CREATE TABLE IF NOT EXISTS books (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT);
    CREATE TABLE IF NOT EXISTS reading_progress (member_id INTEGER PRIMARY KEY, book_id INTEGER);
    CREATE TABLE IF NOT EXISTS completed_books (id INTEGER PRIMARY KEY AUTOINCREMENT, member_id INTEGER, book_title TEXT, completed_date TEXT);
  `);

  const row = await db.get("SELECT COUNT(*) as count FROM members");
  if (row.count === 0) {
    const defaultMembers = ['권투무지', '덜', '맅', '온', '왈왈', '자유', '잼', '틴절', '포도'];
    for (const name of defaultMembers) {
      // INSERT OR IGNORE를 사용하여 초기 데이터 중복 삽입 방지
      await db.run("INSERT OR IGNORE INTO members (name) VALUES (?)", [name.trim()]);
    }
    console.log("👥 초기 멤버 9명이 준비되었습니다.");
  }
  console.log("✅ SQLite DB 준비 완료!");
}
initDB();

/**
 * 1. 대시보드 데이터 조회
 */
app.get('/api/dashboard', async (req, res) => {
  const { year, month } = req.query;
  const filterYear = year || new Date().getFullYear();
  const filterMonth = String(month || (new Date().getMonth() + 1)).padStart(2, '0');

  const startDate = `${filterYear}-${filterMonth}-01`;
  const endDate = `${filterYear}-${filterMonth}-31`;

  try {
    const db = await connectDB();
    const members = await db.all(`
      SELECT m.id, m.name, b.title AS book_title 
      FROM members m
      LEFT JOIN reading_progress rp ON m.id = rp.member_id
      LEFT JOIN books b ON rp.book_id = b.id
      ORDER BY m.id ASC
    `);
    
    for (let member of members) {
      const attendance = await db.all(
        "SELECT date, status FROM attendance WHERE member_id = ? AND date BETWEEN ? AND ?", 
        [member.id, startDate, endDate]
      );
      member.attendance = attendance;
    }
    res.json(members);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 2. 출석 및 도서 정보 저장
 */
app.post('/api/attendance', async (req, res) => {
  const { member_id, date, status, book_title } = req.body; 
  const finalDate = date.split('T')[0];

  try {
    const db = await connectDB();
    
    await db.run(`
      INSERT INTO attendance (member_id, date, status)
      VALUES (?, ?, ?)
      ON CONFLICT(member_id, date) DO UPDATE SET status = excluded.status
    `, [member_id, finalDate, status]);

    if (status === 'W') {
      if (book_title) {
        await db.run(`
          INSERT INTO completed_books (member_id, book_title, completed_date)
          VALUES (?, ?, ?)
        `, [member_id, book_title, finalDate]);
      }
      await db.run("DELETE FROM reading_progress WHERE member_id = ?", [member_id]);
    } else if (book_title) {
      let book = await db.get("SELECT id FROM books WHERE title = ?", [book_title.trim()]);
      let bookId;

      if (!book) {
        const result = await db.run("INSERT INTO books (title) VALUES (?)", [book_title.trim()]);
        bookId = result.lastID;
      } else {
        bookId = book.id;
      }

      await db.run(`
        INSERT INTO reading_progress (member_id, book_id)
        VALUES (?, ?)
        ON CONFLICT(member_id) DO UPDATE SET book_id = excluded.book_id
      `, [member_id, bookId]);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 3. 멤버 관리 API (중복 방지 강화)
 */
app.post('/api/members', async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "이름이 없습니다." });
  try {
    const db = await connectDB();
    // 중복된 이름이 있으면 에러를 발생시킴 (UNIQUE 제약 조건)
    await db.run("INSERT INTO members (name) VALUES (?)", [name.trim()]);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: "이미 존재하는 멤버 이름입니다." });
  }
});

app.put('/api/members/:id', async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  try {
    const db = await connectDB();
    await db.run("UPDATE members SET name = ? WHERE id = ?", [name.trim(), id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/members/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const db = await connectDB();
    await db.run("DELETE FROM members WHERE id = ?", [id]);
    await db.run("DELETE FROM attendance WHERE member_id = ?", [id]);
    await db.run("DELETE FROM reading_progress WHERE member_id = ?", [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 4. 명예의 전당
 */
app.get('/api/hall-of-fame', async (req, res) => {
  const { year, month } = req.query;
  try {
    const db = await connectDB();
    const rows = await db.all(`
      SELECT m.name, cb.book_title, cb.completed_date 
      FROM completed_books cb
      JOIN members m ON cb.member_id = m.id
      WHERE strftime('%Y', cb.completed_date) = ? AND strftime('%m', cb.completed_date) = ?
      ORDER BY cb.completed_date DESC
    `, [year, String(month).padStart(2, '0')]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 5. 엑셀 데이터 저장 (중복 및 공백 방지 강화)
 */
app.post('/api/upload-excel', async (req, res) => {
  const { rows } = req.body; 
  if (!rows || rows.length < 1) return res.status(400).json({ error: "데이터가 비어있습니다." });

  const db = await connectDB();

  try {
    await db.run("BEGIN TRANSACTION");

    const header = rows[0];
    const memberNames = header.slice(1); 

    // 1. 멤버 처리
    for (let name of memberNames) {
      if (!name) continue;
      name = name.toString().trim();
      await db.run("INSERT OR IGNORE INTO members (name) VALUES (?)", [name]);
    }

    // 2. 출석 데이터 처리
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const date = row[0]; 
      if (!date) continue;

      for (let j = 1; j < row.length; j++) {
        const name = header[j].toString().trim();
        const status = row[j] ? row[j].toString().toUpperCase().trim() : ""; 

        const member = await db.get("SELECT id FROM members WHERE name = ?", [name]);
        
        // 유효한 상태값(O, X, W)인 경우에만 저장
        if (member && (status === 'O' || status === 'X' || status === 'W')) {
          await db.run(`
            INSERT INTO attendance (member_id, date, status)
            VALUES (?, ?, ?)
            ON CONFLICT(member_id, date) DO UPDATE SET status = excluded.status
          `, [member.id, date, status]);
        }
      }
    }
    await db.run("COMMIT");
    res.json({ success: true });
  } catch (err) {
    await db.run("ROLLBACK");
    res.status(500).json({ error: err.message });
  }
});

const PORT = 4000;
app.listen(PORT, () => console.log(`🚀 로컬 서버 가동 중: http://localhost:${PORT}`));