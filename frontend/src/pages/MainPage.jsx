import React, { useState, useEffect } from 'react';
import '../components/Components.css';

const MainPage = ({ data, selectedDayIdx, onDaySelect, refreshData }) => {
  // 데이터가 아직 없을 때를 위한 방어 코드
  const currentDay = data && data[selectedDayIdx] ? data[selectedDayIdx] : null;

  // [상태 관리] 디자인하신 그대로 임시 상태 유지
  const [tempStatus, setTempStatus] = useState([]);
  
  // [추가 상태] 새 멤버 이름을 담는 상태
  const [newMemberName, setNewMemberName] = useState('');

  useEffect(() => {
    if (currentDay) {
      setTempStatus(currentDay.memberStatus);
    }
  }, [selectedDayIdx, data, currentDay]);

  // 1. 클릭 시 출석 토글 로직 (X -> O -> W 순환)
  const toggleTempStatus = (memberIdx) => {
    const updated = tempStatus.map((item, idx) => {
      if (idx === memberIdx) {
        let nextStatus;
        if (item.status === 'X') nextStatus = 'O';
        else if (item.status === 'O') nextStatus = 'W'; 
        else nextStatus = 'X';
        
        return { ...item, status: nextStatus };
      }
      return item;
    });
    setTempStatus(updated);
  };

  // 2. 도서 제목 직접 수정 로직
  const handleBookTitleChange = (memberIdx, newTitle) => {
    const updated = tempStatus.map((item, idx) => {
      if (idx === memberIdx) {
        return { ...item, book_title: newTitle };
      }
      return item;
    });
    setTempStatus(updated);
  };
  
  // 3. 저장 로직 (출석 상태 + 도서 제목 함께 전송)
  const handleSaveClick = async () => {
    try {
      const savePromises = tempStatus.map(member => {
        const pureDate = currentDay.date; 

        return fetch('http://localhost:4000/api/attendance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            member_id: member.id,
            date: pureDate,
            status: member.status,
            book_title: member.book_title 
          })
        });
      });

      await Promise.all(savePromises);
      alert('출석 및 도서 정보가 저장되었습니다! 🎉');
      refreshData(); 
    } catch (err) {
      console.error("저장 실패:", err);
      alert('저장에 실패했습니다.');
    }
  };

  // --- [새로 추가된 멤버 관리 함수들] ---

  // 멤버 추가
  const onAddMember = async () => {
    if (!newMemberName.trim()) return alert("이름을 입력해주세요.");
    try {
      await fetch('http://localhost:4000/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newMemberName })
      });
      setNewMemberName('');
      alert(`${newMemberName}님이 추가되었습니다.`);
      refreshData(); 
    } catch (err) { alert("멤버 추가 실패"); }
  };

  // 멤버 수정
  const onUpdateMember = async (id, oldName) => {
    const nextName = prompt(`${oldName}님의 이름을 무엇으로 변경할까요?`, oldName);
    if (!nextName || nextName === oldName) return;
    try {
      await fetch(`http://localhost:4000/api/members/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nextName })
      });
      refreshData();
    } catch (err) { alert("이름 수정 실패"); }
  };

  // 멤버 삭제
  const onDeleteMember = async (id, name) => {
    if (!window.confirm(`${name}님을 삭제하시겠습니까?\n삭제 시 이 멤버의 모든 과거 출석 기록이 영구적으로 사라집니다.`)) return;
    try {
      await fetch(`http://localhost:4000/api/members/${id}`, { method: 'DELETE' });
      refreshData();
    } catch (err) { alert("삭제 실패"); }
  };

  if (!currentDay) return <div className="loading-msg">데이터를 불러오는 중...</div>;

  return (
    <div className="dashboard-content">
      {/* [왼쪽] 전체 출석 테이블 */}
      <div className="attendance-section">
        <table className="attendance-table">
          <thead>
            <tr>
              <th>날짜</th>
              {data[0]?.memberStatus.map((m) => (
                <th key={m.id}>{m.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr 
                key={idx} 
                onClick={() => onDaySelect(idx)} 
                className={selectedDayIdx === idx ? 'selected-row' : ''}
              >
                <td className="date-cell">{row.date}</td>
                {row.memberStatus.map((m, i) => (
                  <td key={i} className={m.status === 'W' ? 'complete-cell' : ''}>
                    {m.status === 'O' ? '○' : m.status === 'W' ? '⭐' : ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* [오른쪽] 상세 관리 섹션 */}
      <div className="right-section">
        <div className="detail-header">
          <span className="date-label">{currentDay.date} 상세 관리</span>
          <button className="edit-btn" onClick={handleSaveClick}>
            수정 및 저장
          </button>
        </div>

        {/* O/X/⭐ 체크 영역 */}
        <div className="today-status-container">
          <table className="status-check-table">
            <thead>
              <tr>
                {tempStatus.map((m, i) => (
                  <th key={i} className="status-name-th">{m.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                {tempStatus.map((m, i) => (
                  <td 
                    key={i} 
                    className={`status-icon-td ${m.status === 'O' ? 'is-active' : m.status === 'W' ? 'is-complete' : 'is-inactive'}`}
                    onClick={() => toggleTempStatus(i)}
                  >
                    {m.status === 'O' ? '○' : m.status === 'W' ? '⭐' : 'X'}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* 도서 목록 테이블 */}
        <table className="book-table">
          <thead>
            <tr>
              <th>진행 도서 (수정)</th>
              <th>멤버</th>
            </tr>
          </thead>
          <tbody>
            {tempStatus.map((m, i) => (
              <tr key={i}>
                <td>
                  <input 
                    type="text"
                    className="book-title-input"
                    value={m.book_title || ''}
                    placeholder="책 제목을 입력하세요"
                    onChange={(e) => handleBookTitleChange(i, e.target.value)}
                  />
                </td>
                <td>{m.name}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* [새로 추가] 하단 멤버 관리 섹션 */}
        <div className="member-management-footer" style={{ marginTop: '40px', padding: '20px', backgroundColor: '#fdfdfd', borderRadius: '10px', border: '1px solid #eee' }}>
          <h3 style={{ fontSize: '1rem', color: '#555', marginBottom: '15px' }}>👥 멤버 명단 설정</h3>
          
          {/* 멤버 추가 한 줄 */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <input 
              type="text"
              className="book-title-input"
              style={{ flex: 1, margin: 0 }}
              placeholder="새로운 멤버 이름을 입력하세요"
              value={newMemberName}
              onChange={(e) => setNewMemberName(e.target.value)}
            />
            <button 
              className="edit-btn" 
              style={{ backgroundColor: '#4CAF50', margin: 0, padding: '0 20px' }}
              onClick={onAddMember}
            >
              추가
            </button>
          </div>

          {/* 현재 멤버들 편집/삭제 칩 리스트 */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {tempStatus.map((m, i) => (
              <div key={i} style={{ 
                display: 'flex', 
                alignItems: 'center', 
                backgroundColor: '#fff', 
                border: '1px solid #ddd', 
                borderRadius: '20px', 
                padding: '5px 12px',
                fontSize: '0.85rem',
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
              }}>
                <span 
                  style={{ fontWeight: '600', cursor: 'pointer', marginRight: '8px' }}
                  onClick={() => onUpdateMember(m.id, m.name)}
                  title="이름 수정"
                >
                  {m.name} ✏️
                </span>
                <span 
                  style={{ color: '#ff4d4f', cursor: 'pointer', fontWeight: 'bold', padding: '0 4px' }}
                  onClick={() => onDeleteMember(m.id, m.name)}
                  title="삭제"
                >
                  ✕
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainPage;