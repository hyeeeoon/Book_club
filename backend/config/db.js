const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const path = require('path');

// 데이터베이스 파일 연결 함수
async function connectDB() {
  return open({
    // backend 폴더 바로 안에 database.sqlite라는 파일이 생성됩니다.
    filename: path.join(__dirname, '../database.sqlite'), 
    driver: sqlite3.Database
  });
}

module.exports = connectDB;