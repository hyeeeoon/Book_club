import React, { useMemo, useState, useEffect } from 'react';
import './RankPage.css';

const RankPage = ({ data }) => {
  // [추가] 명예의 전당 데이터를 담을 상태
  const [completedList, setCompletedList] = useState([]);

  // [추가] 서버에서 완독 기록(명예의 전당) 가져오기
  useEffect(() => {
    const fetchHallOfFame = async () => {
      try {
        // 현재 data에 있는 첫 번째 날짜의 연/월을 기준으로 요청
        if (!data || data.length === 0) return;
        const [year, month] = data[0].date.split('-');
        const response = await fetch(`http://localhost:4000/api/hall-of-fame?year=${year}&month=${month}`);
        const result = await response.json();
        setCompletedList(result);
      } catch (err) {
        console.error("명예의 전당 로드 실패:", err);
      }
    };
    fetchHallOfFame();
  }, [data]);

  // 1. 랭킹 가공 로직 (기존과 동일하되 actualDays로 뻥튀기 방지)
  const rankingData = useMemo(() => {
    if (!data || data.length === 0) return [];
    const scores = {};
    data.forEach(day => {
      day.memberStatus.forEach(member => {
        if (!scores[member.name]) {
          scores[member.name] = { name: member.name, count: 0, starCount: 0 };
        }
        if (member.status === 'O' || member.status === 'W') scores[member.name].count += 1;
        if (member.status === 'W') scores[member.name].starCount += 1;
      });
    });
    return Object.values(scores).sort((a, b) => b.count - a.count);
  }, [data]);

  // [이행률 뻥튀기 방지] 실제 출석 기록이 있는 날짜만 분모로 사용
  const actualDays = useMemo(() => {
    return data.filter(day => day.memberStatus.some(m => m.status !== 'X')).length || 1;
  }, [data]);

  if (rankingData.length === 0) {
    return <div className="rank-container"><p className="rank-title">데이터 로딩 중... 📚</p></div>;
  }

  return (
    <div className="rank-container">
      <h2 className="rank-title">🏆 독서 왕 랭킹</h2>

      <div className="ranking-list-section">
        {rankingData.map((member, index) => {
          // [수정] actualDays를 사용하여 참여율 계산
          const progressPercent = Math.min(100, (member.count / actualDays) * 100);
          return (
            <div key={member.name} className={`rank-item rank-${index + 1}`}>
              <div className="rank-number">{index + 1}</div>
              <div className="rank-info">
                <span className="rank-name">
                  {member.name}
                  {member.starCount > 0 && <span className="name-star"> ★{member.starCount}</span>}
                </span>
                <span className="rank-count">{member.count}회 참여</span>
              </div>
              <div className="rank-progress-bar">
                <div 
                  className="rank-progress-fill" 
                  style={{ width: `${progressPercent}%`, backgroundColor: index === 0 ? '#749F73' : '#A2D9A1' }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 2. [수정] 서버에서 가져온 completedList로 명예의 전당 렌더링 */}
      <div className="hall-of-fame-section">
        <h3 className="hall-title">✨ 이달의 완독 명예의 전당 ✨</h3>
        <div className="hall-grid">
          {completedList.length > 0 ? (
            completedList.map((item, idx) => (
              <div key={idx} className="hall-card">
                <div className="hall-star-bg">★</div>
                <div className="hall-info-box">
                  <span className="hall-date">{item.completed_date.split('-')[2].substring(0, 2)}일</span>
                  <span className="hall-member">{item.name}님</span>
                  <p className="hall-book-name">「{item.book_title}」</p>
                </div>
                <div className="hall-congrats">완독 완료! 🎉</div>
              </div>
            ))
          ) : (
            <p className="no-hall-msg">첫 완독의 주인공이 되어보세요! 📖</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default RankPage;