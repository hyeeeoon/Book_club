import React, { useState, useEffect } from 'react';
import './App.css';
import Navbar from './components/Navbar';
import MainPage from './pages/MainPage';
import StatsPage from './pages/StatsPage';
import RankPage from './pages/RankPage';

function App() {
  const [activeTab, setActiveTab] = useState('main');
  const [data, setData] = useState([]);
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // [추가] 엑셀 파일명을 관리할 상태
  const [fileName, setFileName] = useState("");

  const now = new Date();
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(now.getMonth() + 1);

  // 1. 백엔드 데이터 호출
  const fetchData = async () => {
    try {
      setLoading(true);
      // SQLite 데이터 조회 (연도와 월을 쿼리로 보냅니다)
      const res = await fetch(`http://localhost:4000/api/dashboard?year=${currentYear}&month=${currentMonth}`);
      const raw = await res.json();
      
      const transformed = transformData(raw, currentYear, currentMonth);
      setData(transformed);
      setLoading(false);
    } catch (err) {
      console.error("데이터 로드 실패:", err);
      setLoading(false);
    }
  };

  const transformData = (members, year, month) => {
    if (!members || members.length === 0) return [];

    const lastDay = new Date(year, month, 0).getDate();
    const allDatesInMonth = [];

    for (let i = 1; i <= lastDay; i++) {
      const dateString = `${year}-${String(month).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      allDatesInMonth.push(dateString);
    }

    return allDatesInMonth.map(date => ({
      date,
      memberStatus: members.map(m => {
        const att = m.attendance?.find(a => a.date === date);
        return {
          id: m.id,
          name: m.name,
          book_title: m.book_title || '',
          status: att ? att.status : 'X'
        };
      })
    }));
  };

  useEffect(() => {
    fetchData();
  }, [currentYear, currentMonth]);

  if (loading) return <div className="loading-container">데이터를 불러오는 중... </div>;

  return (
    <div className="app-container">
      {/* Navbar에 fileName과 setFileName, refreshData를 모두 전달 */}
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        currentYear={currentYear}
        setCurrentYear={setCurrentYear}
        currentMonth={currentMonth}
        setCurrentMonth={setCurrentMonth}
        data={data}
        fileName={fileName}
        setFileName={setFileName}
        refreshData={fetchData} 
      />

      <main className="content-area">
        {activeTab === 'main' && data.length > 0 && (
          <MainPage 
            data={data} 
            selectedDayIdx={selectedDayIdx} 
            onDaySelect={setSelectedDayIdx} 
            refreshData={fetchData} 
          />
        )}
        
        {activeTab === 'rank' && <RankPage data={data} />}
        
        {activeTab === 'stats' && <StatsPage data={data} />}
      </main>
    </div>
  );
}

export default App;