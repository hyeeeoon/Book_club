import React from 'react';
import { Calendar } from 'lucide-react';

const CheckPage = ({ data, setData, memberNames }) => {
  const toggleCell = (rowIndex, colIndex) => {
    const newData = [...data];
    const currentVal = newData[rowIndex].status[colIndex];

    if (!currentVal || String(currentVal).trim() === "") {
      newData[rowIndex].status[colIndex] = "○";
    } else if (currentVal === "○") {
      const note = prompt("메모를 입력하세요:");
      newData[rowIndex].status[colIndex] = note || "";
    } else {
      newData[rowIndex].status[colIndex] = "";
    }
    setData(newData);
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-500 text-xs font-bold uppercase tracking-wider">
              <th className="p-5 sticky left-0 bg-slate-50 z-10 w-32 border-r border-slate-100"><div className="flex items-center gap-2"><Calendar size={14}/> 날짜</div></th>
              {memberNames.map((name, i) => (
                <th key={i} className="p-5 text-center min-w-[110px] text-slate-700">{name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rIdx) => (
              <tr key={rIdx} className="border-b border-slate-50 hover:bg-blue-50/20 transition-all">
                <td className="p-5 text-slate-400 font-medium text-sm sticky left-0 bg-white z-10 border-r border-slate-100">{row.date}</td>
                {row.status.map((cell, cIdx) => (
                  <td key={cIdx} onClick={() => toggleCell(rIdx, cIdx)} className="p-5 text-center cursor-pointer">
                    {cell === '○' ? (
                      <span className="text-blue-500 font-black text-2xl drop-shadow-sm">○</span>
                    ) : cell ? (
                      <span className="inline-block bg-blue-50 text-blue-700 text-[10px] px-2.5 py-1.5 rounded-lg font-bold shadow-sm border border-blue-100">
                        📝 {String(cell).substring(0, 5)}..
                      </span>
                    ) : <span className="text-slate-200">·</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CheckPage;