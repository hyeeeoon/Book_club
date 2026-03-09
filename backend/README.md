backend/
├── config/
│   └── db.js          # MySQL 연결 설정 (Connection Pool)
├── routes/
│   ├── attendance.js  # 출석 관련 API 경로 및 로직
│   ├── books.js       # 도서 관련 API 경로 및 로직
│   └── members.js     # 멤버 관련 API 경로 및 로직
├── sql/
│   └── schema.sql     # [중요] SQL 테이블 생성 쿼리 모음 (따로 저장!)
├── .env               # DB 비밀번호 등 보안 정보
└── server.js          # 모든 노선을 연결하는 메인 입구