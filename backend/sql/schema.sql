-- Active: 1765246080374@@127.0.0.1@3306@book_club_db
-- 1. 멤버 테이블 (서비스를 이용하는 기본 인원 정보)
CREATE TABLE IF NOT EXISTS members (
  id INT AUTO_INCREMENT PRIMARY KEY, -- 멤버 고유 ID
  name VARCHAR(50) NOT NULL           -- 멤버 성함
);

-- 2. 도서 테이블 (등록된 책들의 메타 데이터)
CREATE TABLE IF NOT EXISTS books (
  id INT AUTO_INCREMENT PRIMARY KEY, -- 도서 고유 ID
  title VARCHAR(255) NOT NULL,        -- 책 제목
  author VARCHAR(100),                -- 저자
  total_pages INT                     -- 전체 페이지 수
);

-- 3. 독서 진행 현황 (멤버가 '현재' 읽고 있는 책과 페이지 기록)
-- 멤버당 한 권의 책만 진행한다고 가정하여 member_id에 UNIQUE 설정
CREATE TABLE IF NOT EXISTS reading_progress (
  id INT AUTO_INCREMENT PRIMARY KEY,
  member_id INT UNIQUE,               -- 어떤 멤버인지 (members.id 참조)
  book_id INT,                        -- 어떤 책인지 (books.id 참조)
  current_page INT DEFAULT 0,         -- 현재까지 읽은 페이지 번호
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (member_id) REFERENCES members(id),
  FOREIGN KEY (book_id) REFERENCES books(id)
);

-- 4. 출석 테이블 (날짜별 멤버들의 독서 이행 여부 기록)
DROP TABLE IF EXISTS attendance;
CREATE TABLE attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  date DATE NOT NULL,                 -- 기록 날짜 (YYYY-MM-DD)
  member_id INT,                      -- 어떤 멤버인지 (members.id 참조)
  status ENUM('O', 'X', 'W') DEFAULT 'X', -- 상태: O(독서함), X(안함), W(완독)
  FOREIGN KEY (member_id) REFERENCES members(id),
  
  -- [중복 방지] 한 멤버가 같은 날짜에 데이터를 두 번 생성하지 못하도록 차단
  UNIQUE KEY unique_member_date (member_id, date),
  
  -- [성능 최적화] 특정 날짜의 데이터를 빠르게 불러오기 위한 인덱스
  INDEX idx_attendance_date (date) 
);

-- 5. 완독 기록 테이블 (역대 완독한 도서들의 히스토리 보관)
-- 현재 읽는 책이 바뀌어도 과거 완독 기록은 여기에 영구 보관됨
CREATE TABLE IF NOT EXISTS completed_books (
  id INT AUTO_INCREMENT PRIMARY KEY,
  member_id INT,                      -- 완독한 멤버 (members.id 참조)
  book_title VARCHAR(255),            -- 완독 당시의 책 제목
  completed_date DATE,                -- 완독한 날짜
  FOREIGN KEY (member_id) REFERENCES members(id)
);