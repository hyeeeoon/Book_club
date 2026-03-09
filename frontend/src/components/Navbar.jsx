import React from 'react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { Download, Upload, BookOpen, Trophy, BarChart3, CheckCircle } from 'lucide-react';
import './Navbar.css';

const Navbar = ({ 
  activeTab, 
  setActiveTab, 
  data, 
  currentYear,
  setCurrentYear,
  currentMonth,
  setCurrentMonth,
  fileName,
  setFileName
}) => {

  // 1. 엑셀 파일 업로드 처리
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
  
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const workbook = XLSX.read(event.target.result, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        
        // 엑셀 데이터를 배열 형태로 변환
        const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
  
        if (rawRows.length > 0) {
          const response = await fetch('http://localhost:4000/api/upload-excel', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rows: rawRows })
          });
  
          // 1. 서버 응답이 성공(200 OK)일 때
          if (response.ok) {
            alert("엑셀 데이터가 성공적으로 DB에 저장되었습니다! 🎉");
            setFileName(file.name);
            
            // 부모로부터 받은 refreshData 실행 (화면 자동 갱신)
            if (typeof refreshData === 'function') {
              refreshData(); 
            }
            return; // 성공했으므로 함수 종료 (catch로 가지 않음)
          } else {
            // 서버에서 에러 응답(400, 500 등)을 줬을 때
            const errorData = await response.json();
            throw new Error(errorData.error || "서버 저장 실패");
          }
        }
      } catch (err) {
        // 2. 네트워크 에러나 위에서 throw한 에러가 여기로 옴
        console.error("업로드 상세 에러:", err);
        alert(`오류가 발생했습니다: ${err.message}`);
      } finally {
        // 입력창 초기화 (같은 파일을 다시 올릴 때도 인식되게 함)
        e.target.value = ''; 
      }
    };
    reader.readAsBinaryString(file);
  };

  // 2. 현재 화면의 데이터를 엑셀로 내보내기
  const exportToExcel = () => {
    if (!data || data.length === 0) return alert("저장할 데이터가 없습니다.");
    
    const memberNames = data[0].memberStatus.map(m => m.name);
    const exportHeader = ["날짜", ...memberNames];
    
    const exportRows = data.map(row => [
      row.date, 
      ...row.memberStatus.map(m => m.status)
    ]);
    
    const worksheet = XLSX.utils.aoa_to_sheet([exportHeader, ...exportRows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "독서기록");
    
    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([buffer]), `독서모임_기록_${currentYear}년_${currentMonth}월.xlsx`);
  };

  return (
    <nav className="custom-navbar">
      <div className="nav-inner-container">
        {/* 왼쪽: 로고 및 날짜 선택 */}
        <div className="nav-left">
          <div className="nav-logo">
            <BookOpen size={24} />
            <span>너와 보는 바다가 더 예뻐서</span>
          </div>

          <div className="date-selectors">
            <select 
              value={currentYear} 
              onChange={(e) => setCurrentYear(Number(e.target.value))}
            >
              {[2025, 2026, 2027].map(y => (
                <option key={y} value={y}>{y}년</option>
              ))}
            </select>

            <select 
              value={currentMonth} 
              onChange={(e) => setCurrentMonth(Number(e.target.value))}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => (
                <option key={m} value={m}>{m}월</option>
              ))}
            </select>
          </div>
        </div>

        {/* 중앙: 탭 메뉴 */}
        <div className="nav-center">
          <button 
            className={`nav-link ${activeTab === 'main' ? 'active' : ''}`}
            onClick={() => setActiveTab('main')}
          >
            <CheckCircle size={18} /> 출석체크
          </button>
          <button 
            className={`nav-link ${activeTab === 'rank' ? 'active' : ''}`}
            onClick={() => setActiveTab('rank')}
          >
            <Trophy size={18} /> 랭킹
          </button>
          <button 
            className={`nav-link ${activeTab === 'stats' ? 'active' : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            <BarChart3 size={18} /> 통계그래프
          </button>
        </div>

        {/* 오른쪽: 버튼들 */}
        <div className="nav-right">
          <label className="file-upload-btn">
            <Upload size={16} />
            <span>{fileName ? '변경' : '업로드'}</span>
            <input type="file" className="hidden-input" onChange={handleFileUpload} accept=".xlsx, .xls" />
          </label>
          <button onClick={exportToExcel} className="save-btn">
            <Download size={16} /> 엑셀저장
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;