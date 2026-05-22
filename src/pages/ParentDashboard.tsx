import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { useParentStore } from '../stores/useParentStore';
import { Button3D } from '../components/Button3D';
import type { MathType } from '../types';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';

export const ParentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { children, currentChild, selectChild } = useAuthStore();
  const { statistics, history, mistakes, loadChildData, clearChildMistakes } = useParentStore();

  const [activeChildId, setActiveChildId] = useState<string>('');

  // Form custom settings states
  const [minNum, setMinNum] = useState(0);
  const [maxNum, setMaxNum] = useState(10);
  const [qCount, setQCount] = useState(10);
  const [customMathTypes, setCustomMathTypes] = useState<MathType[]>(['addition', 'subtraction']);
  const [limitMins, setLimitMins] = useState(0);

  useEffect(() => {
    if (children.length > 0) {
      const defaultId = currentChild?.id || children[0].id;
      setActiveChildId(defaultId);
      loadChildData(defaultId);
    }
  }, [children, currentChild, loadChildData]);

  // Load custom settings if exists
  useEffect(() => {
    if (activeChildId) {
      const customKey = `dt_custom_settings_${activeChildId}`;
      const saved = localStorage.getItem(customKey);
      if (saved) {
        const config = JSON.parse(saved);
        setMinNum(config.minNumber);
        setMaxNum(config.maxNumber);
        setQCount(config.questionCount);
        setCustomMathTypes(config.mathTypes);
        setLimitMins(Math.round((config.timeLimit || 0) / 60));
      } else {
        // Mặc định ban đầu
        setMinNum(0);
        setMaxNum(10);
        setQCount(10);
        setCustomMathTypes(['addition', 'subtraction']);
        setLimitMins(0);
      }
    }
  }, [activeChildId]);

  const handleChildChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setActiveChildId(id);
    selectChild(id);
    loadChildData(id);
  };

  // Lưu cấu hình học tập riêng biệt cho bé
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (customMathTypes.length === 0) {
      alert('Phụ huynh cần chọn ít nhất 1 phép toán luyện tập!');
      return;
    }
    if (minNum >= maxNum) {
      alert('Số nhỏ nhất phải bé hơn Số lớn nhất!');
      return;
    }

    const config = {
      minNumber: minNum,
      maxNumber: maxNum,
      questionCount: qCount,
      mathTypes: customMathTypes,
      timeLimit: limitMins * 60
    };

    localStorage.setItem(`dt_custom_settings_${activeChildId}`, JSON.stringify(config));
    alert('Đã cập nhật cấu hình luyện tập riêng biệt cho bé thành công! 🎉');
  };

  const handleToggleMathType = (type: MathType) => {
    if (customMathTypes.includes(type)) {
      setCustomMathTypes(prev => prev.filter(t => t !== type));
    } else {
      setCustomMathTypes(prev => [...prev, type]);
    }
  };

  const handleClearMistakes = async () => {
    if (window.confirm('Phụ huynh có chắc chắn muốn xóa lịch sử các câu làm sai của bé để làm mới dữ liệu ôn tập không?')) {
      await clearChildMistakes(activeChildId);
      alert('Đã xóa lịch sử câu hỏi sai thành công!');
    }
  };

  // Chuẩn bị dữ liệu vẽ Biểu đồ Recharts
  // 1. Biểu đồ Tỷ lệ chính xác & Số câu làm qua các phiên gần nhất
  const chartData = history
    .slice()
    .reverse() // Cho thời gian xuôi dần
    .slice(-8) // Lấy tối đa 8 câu gần nhất biểu diễn
    .map((h, i) => ({
      name: `Câu ${i + 1}`,
      'Thời gian (s)': h.time_taken_seconds,
      'Kết quả': h.is_correct ? 1 : 0
    }));

  // Gốc biểu đồ thống kê phiên học (Sessions stats)
  const sessionChartData = history.reduce((acc: any[], curr) => {
    // Nhóm theo ngày hoặc theo session để vẽ tiến trình
    const dateStr = new Date(curr.created_at).toLocaleDateString('vi-VN', { month: 'numeric', day: 'numeric' });
    const existing = acc.find(item => item.date === dateStr);
    
    if (existing) {
      existing.total += 1;
      existing.correct += curr.is_correct ? 1 : 0;
      existing.accuracy = Math.round((existing.correct / existing.total) * 100);
    } else {
      acc.push({
        date: dateStr,
        total: 1,
        correct: curr.is_correct ? 1 : 0,
        accuracy: curr.is_correct ? 100 : 0
      });
    }
    return acc;
  }, []).slice(-7); // Vẽ 7 ngày gần nhất bé học

  return (
    <div className="min-h-screen bg-[#f3f4f6] text-[#3c3c3c] font-sans pb-12">
      
      {/* 1. TOP HEADER BANNER */}
      <div className="bg-[#1cb0f6] text-white py-6 px-6 border-b-[5px] border-[#1899d6] shadow-sm select-none rounded-b-[2rem]">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-black tracking-wide">⚙️ GÓC PHỤ HUYNH & BÁO CÁO</h1>
            <p className="text-sm font-bold opacity-90 mt-1">Theo dõi tiến trình học tập, thống kê lỗi sai và tùy chỉnh giáo án cho bé.</p>
          </div>
          <div className="flex gap-3">
            <Button3D variant="yellow" size="sm" onClick={() => navigate('/map')}>
              ◀ Về Bản Đồ Học Tập 🗺️
            </Button3D>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* ================= CỘT TRÁI: CHỌN BÉ & CHỈ SỐ TỔNG HỢP ================= */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          
          {/* Hồ sơ các bé */}
          <div className="bg-white rounded-[2rem] border-4 border-[#e5e5e5] p-6 shadow-sm">
            <h3 className="text-lg font-black mb-4 border-b-2 border-gray-100 pb-2">👶 Lựa chọn Hồ Sơ Bé</h3>
            <select
              value={activeChildId}
              onChange={handleChildChange}
              className="w-full px-4 py-3 border-4 border-[#e5e5e5] focus:border-[#1cb0f6] rounded-2xl outline-none font-bold text-lg bg-[#f9fafb]"
            >
              {children.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} (Cấp độ {c.level})
                </option>
              ))}
            </select>
          </div>

          {/* Metric Blocks (Thống Kê Nhanh) */}
          {statistics && (
            <div className="bg-white rounded-[2rem] border-4 border-[#e5e5e5] p-6 shadow-sm flex flex-col gap-4">
              <h3 className="text-lg font-black border-b-2 border-gray-100 pb-2">📊 Chỉ Số Học Tập Tích Lũy</h3>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-green-50 rounded-2xl border-2 border-green-200 p-3 text-center">
                  <span className="block text-2xl">🎯</span>
                  <span className="block text-2xl font-black text-green-600">{statistics.accuracy_rate}%</span>
                  <span className="text-[10px] font-black text-green-500 uppercase">Tỷ lệ đúng</span>
                </div>
                <div className="bg-blue-50 rounded-2xl border-2 border-blue-200 p-3 text-center">
                  <span className="block text-2xl">⚡</span>
                  <span className="block text-2xl font-black text-blue-600">{statistics.avg_time_per_question}s</span>
                  <span className="text-[10px] font-black text-blue-500 uppercase">Tốc độ trung bình</span>
                </div>
                <div className="bg-yellow-50 rounded-2xl border-2 border-yellow-200 p-3 text-center">
                  <span className="block text-2xl">📚</span>
                  <span className="block text-2xl font-black text-yellow-600">{statistics.total_questions}</span>
                  <span className="text-[10px] font-black text-yellow-500 uppercase">Tổng số câu làm</span>
                </div>
                <div className="bg-orange-50 rounded-2xl border-2 border-orange-200 p-3 text-center">
                  <span className="block text-2xl">🏁</span>
                  <span className="block text-2xl font-black text-orange-600">{statistics.total_sessions}</span>
                  <span className="text-[10px] font-black text-orange-500 uppercase">Số bài hoàn thành</span>
                </div>
              </div>

              {/* Mạnh / Yếu */}
              <div className="mt-2 flex flex-col gap-2">
                <div className="bg-green-50 border-2 border-green-100 rounded-2xl p-3.5 flex items-center justify-between">
                  <span className="text-sm font-black text-green-700">Dạng toán mạnh nhất:</span>
                  <span className="font-extrabold text-green-800 text-sm">{statistics.strongest_topic}</span>
                </div>
                <div className="bg-red-50 border-2 border-red-100 rounded-2xl p-3.5 flex items-center justify-between">
                  <span className="text-sm font-black text-red-700">Dạng toán cần ôn tập:</span>
                  <span className="font-extrabold text-red-800 text-sm">{statistics.weakest_topic}</span>
                </div>
              </div>
            </div>
          )}

          {/* Cấu Hình Động Luyện Tập (Custom Settings) */}
          <div className="bg-white rounded-[2rem] border-4 border-[#e5e5e5] p-6 shadow-sm">
            <h3 className="text-lg font-black mb-4 border-b-2 border-gray-100 pb-2">🎯 Thiết Lập Đề Luyện Tập Cho Bé</h3>
            
            <form onSubmit={handleSaveSettings} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-black text-gray-500 uppercase mb-1.5">Phép tính luyện tập</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['addition', 'subtraction', 'multiplication', 'division'] as MathType[]).map(type => {
                    const titles: Record<MathType, string> = {
                      addition: 'Cộng (+)',
                      subtraction: 'Trừ (-)',
                      multiplication: 'Nhân (x)',
                      division: 'Chia (/)'
                    };
                    const isSelected = customMathTypes.includes(type);
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => handleToggleMathType(type)}
                        className={`py-2 px-3 rounded-xl border-2 font-bold text-xs cursor-pointer transition-all ${isSelected ? 'border-[#58cc02] bg-green-50 text-green-700' : 'border-[#e5e5e5] bg-white text-gray-500'}`}
                      >
                        {titles[type]}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase mb-1">Số nhỏ nhất</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={minNum}
                    onChange={e => setMinNum(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border-2 border-[#e5e5e5] rounded-xl outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase mb-1">Số lớn nhất</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={maxNum}
                    onChange={e => setMaxNum(parseInt(e.target.value) || 10)}
                    className="w-full px-3 py-2 border-2 border-[#e5e5e5] rounded-xl outline-none font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase mb-1">Số câu hỏi</label>
                  <input
                    type="number"
                    min="5"
                    max="20"
                    value={qCount}
                    onChange={e => setQCount(parseInt(e.target.value) || 10)}
                    className="w-full px-3 py-2 border-2 border-[#e5e5e5] rounded-xl outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase mb-1">Hạn giờ học (phút)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0 = Không giới hạn"
                    value={limitMins}
                    onChange={e => setLimitMins(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border-2 border-[#e5e5e5] rounded-xl outline-none font-bold"
                  />
                </div>
              </div>

              <Button3D variant="primary" size="sm" type="submit" className="w-full text-sm">
                Lưu cấu hình đề 💾
              </Button3D>
            </form>
          </div>

        </div>

        {/* ================= CỘT PHẢI: BIỂU ĐỒ & LIỆT KÊ LỖI SAI ================= */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Biểu đồ Recharts */}
          <div className="bg-white rounded-[2rem] border-4 border-[#e5e5e5] p-6 shadow-sm">
            <h3 className="text-lg font-black mb-4 border-b-2 border-gray-100 pb-2">📈 Biểu Đồ Tiến Trình Học Tập</h3>
            
            {sessionChartData.length === 0 ? (
              <div className="h-[250px] flex items-center justify-center border-2 border-dashed border-gray-100 rounded-3xl text-sm font-bold text-gray-400">
                Bé chưa thực hiện bài tập nào gần đây. Hãy để bé chơi game giải toán trước nhé! 🦕
              </div>
            ) : (
              <div className="w-full h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sessionChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" tickLine={false} style={{ fontSize: 12, fontWeight: 'bold' }} />
                    <YAxis tickLine={false} unit="%" style={{ fontSize: 12, fontWeight: 'bold' }} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: '2px solid #e5e5e5', fontWeight: 'bold' }} />
                    <Line type="monotone" dataKey="accuracy" stroke="#58cc02" strokeWidth={4} activeDot={{ r: 8 }} name="Tỉ lệ đúng (%)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="bg-white rounded-[2rem] border-4 border-[#e5e5e5] p-6 shadow-sm">
            <h3 className="text-lg font-black mb-4 border-b-2 border-gray-100 pb-2">⏱️ Tốc độ phản hồi câu hỏi (Giây)</h3>
            
            {chartData.length === 0 ? (
              <div className="h-[180px] flex items-center justify-center border-2 border-dashed border-gray-100 rounded-3xl text-sm font-bold text-gray-400">
                Chưa có dữ liệu phản hồi câu hỏi.
              </div>
            ) : (
              <div className="w-full h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tickLine={false} style={{ fontSize: 12, fontWeight: 'bold' }} />
                    <YAxis tickLine={false} unit="s" style={{ fontSize: 12, fontWeight: 'bold' }} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: '2px solid #e5e5e5', fontWeight: 'bold' }} />
                    <Bar dataKey="Thời gian (s)" fill="#1cb0f6" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Danh Sách Các Lỗi Sai Tích Lũy (Mistakes list for adaptive priority) */}
          <div className="bg-white rounded-[2rem] border-4 border-[#e5e5e5] p-6 shadow-sm">
            <div className="flex items-center justify-between border-b-2 border-gray-100 pb-3 mb-4">
              <h3 className="text-lg font-black">❌ Nhật Ký Lỗi Sai Của Bé ({mistakes.filter(m => !m.last_attempt_correct).length})</h3>
              {mistakes.length > 0 && (
                <button
                  onClick={handleClearMistakes}
                  className="bg-red-50 hover:bg-red-100 text-red-500 font-extrabold text-xs px-3 py-1.5 rounded-full border border-red-200 transition-colors cursor-pointer"
                >
                  Làm sạch nhật ký lỗi 🗑️
                </button>
              )}
            </div>

            {mistakes.filter(m => !m.last_attempt_correct).length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-gray-100 rounded-3xl text-sm font-bold text-green-500 bg-green-50/50">
                🦖 Dino reo hò! Bé chưa có câu hỏi nào bị sai hoặc đã ôn tập sửa đổi đúng hết 100% rồi! Siêu phàm quá bé ơi!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b-2 border-gray-100 text-xs font-black text-gray-400 uppercase tracking-wider">
                      <th className="py-2.5 px-3">Phép tính sai</th>
                      <th className="py-2.5 px-3">Số lần làm sai</th>
                      <th className="py-2.5 px-3">Trạng thái ôn tập</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mistakes.filter(m => !m.last_attempt_correct).map((item, idx) => (
                      <tr key={idx} className="border-b border-gray-100 text-sm font-bold hover:bg-[#fafafa]">
                        <td className="py-3 px-3 text-[#1cb0f6] text-lg font-black tracking-wide">
                          {item.number_a} {item.operator} {item.number_b} = ?
                        </td>
                        <td className="py-3 px-3 text-red-500 font-black">
                          {item.wrong_count} lần
                        </td>
                        <td className="py-3 px-3">
                          <span className="bg-red-100 text-red-600 text-xs font-black px-2.5 py-1 rounded-full border border-red-200">
                            Cần ôn tập
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
export default ParentDashboard;
