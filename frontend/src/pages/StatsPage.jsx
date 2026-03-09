import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, Legend 
} from 'recharts';
import './StatsPage.css';

const StatsPage = ({ data }) => {
  
  // 1. 데이터 가공: 멤버별 독서 이행률 (막대 그래프)
  const memberPerformance = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    // 분모를 '기록된 날짜'가 아니라 '이번 달 전체 날짜 수'로 설정
    // 데이터 배열의 길이가 곧 이번 달의 전체 일수(28, 30, 31일 등)입니다.
    const totalMonthDays = data.length; 

    const scores = {};

    data.forEach(day => {
      day.memberStatus.forEach(m => {
        if (!scores[m.name]) scores[m.name] = 0;
        // 'O' 또는 'W'인 경우만 참여 횟수로 합산
        if (m.status === 'O' || m.status === 'W') {
          scores[m.name] += 1;
        }
      });
    });

    return Object.keys(scores).map(name => ({
      name: name,
      // (현재까지 참여 횟수 / 이번 달 전체 일수) * 100
      // 예: 31일 중 9일 참여 시 약 29%로 표시됨
      percentage: Math.round((scores[name] / totalMonthDays) * 100)
    })).sort((a, b) => b.percentage - a.percentage);
  }, [data]);

  // 2. 데이터 가공: 날짜별 전체 참여 인원 추이 (꺾은선 그래프용)
  const dailyTrend = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    return data.map(day => ({
      date: day.date.split('-')[2] + '일', 
      count: day.memberStatus.filter(m => m.status === 'O' || m.status === 'W').length
    }));
  }, [data]);

  return (
    <div className="stats-container">
      <div className="stats-header">
        <h2>📊 이번 달 독서 데이터 분석</h2>
        <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '5px' }}>
          * 이행률은 이번 달 전체 일수 대비 참여 횟수로 계산됩니다.
        </p>
      </div>

      <div className="stats-grid">
        <div className="chart-card">
          <h3>멤버별 독서 이행률 (%)</h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={memberPerformance}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis unit="%" domain={[0, 100]} /> {/* Y축을 0~100으로 고정 */}
                <Tooltip />
                <Bar 
                  dataKey="percentage" 
                  fill="#A2D9A1" 
                  radius={[4, 4, 0, 0]} 
                  name="이행률" 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card">
          <h3>일별 참여 인원 추이 (명)</h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#749F73" 
                  strokeWidth={3} 
                  dot={{ r: 5 }} 
                  activeDot={{ r: 8 }} 
                  name="참여 인원"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsPage;