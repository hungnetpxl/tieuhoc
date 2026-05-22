import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, CUTE_AVATARS } from '../stores/useAuthStore';
import { useGameStore } from '../stores/useGameStore';
import { Button3D } from '../components/Button3D';
import { motion, AnimatePresence } from 'framer-motion';
import { pulseVariants, slideUpVariants, popInVariants } from '../animations/presets';
import type { MathType } from '../types';

interface IslandNode {
  id: string;
  title: string;
  mathTypes: MathType[];
  mode: 'basic' | 'visual' | 'story' | 'mixed' | 'kumon';
  emoji: string;
  color: 'green' | 'blue' | 'yellow' | 'orange' | 'danger';
  desc: string;
  reqLevel: number;
}

export const LessonMap: React.FC = () => {
  const navigate = useNavigate();
  const { currentChild, refillLives, selectChild } = useAuthStore();
  const { startNewSession, isLoading } = useGameStore();

  const [selectedIsland, setSelectedIsland] = useState<IslandNode | null>(null);
  
  // Parent Gate state
  const [showParentGate, setShowParentGate] = useState(false);
  const [gateQuestion, setGateQuestion] = useState({ a: 0, b: 0, ans: 0 });
  const [gateInput, setGateInput] = useState('');
  const [gateError, setGateError] = useState(false);

  // Shop state (Dùng đổi tim)
  const [showLivesModal, setShowLivesModal] = useState(false);

  useEffect(() => {
    // Nếu chưa chọn bé, trỏ ngược về trang đăng ký/chọn profile
    if (!currentChild) {
      navigate('/');
    }
  }, [currentChild, navigate]);

  if (!currentChild) return null;

  const childAvatar = CUTE_AVATARS.find(a => a.id === currentChild.avatar);

  // Cấu trúc hòn đảo zigzag tuyệt đẹp học toán
  const ISLANDS: IslandNode[] = [
    {
      id: 'island_addition',
      title: 'Đảo Phép Cộng ➕',
      mathTypes: ['addition'],
      mode: 'mixed',
      emoji: '🍎',
      color: 'green',
      desc: 'Bé luyện tính nhanh siêu tốc các phép toán cộng thuần số trong phạm vi từ 1 đến 20!',
      reqLevel: 1
    },
    {
      id: 'island_subtraction',
      title: 'Đảo Phép Trừ ➖',
      mathTypes: ['subtraction'],
      mode: 'mixed',
      emoji: '🎈',
      color: 'blue',
      desc: 'Bé luyện tính nhanh siêu tốc các phép toán trừ thuần số trong phạm vi từ 1 đến 20!',
      reqLevel: 1
    },
    {
      id: 'island_kumon',
      title: 'Đảo Tư Duy Kumon 🧩',
      mathTypes: ['addition', 'subtraction'],
      mode: 'kumon',
      emoji: '🧩',
      color: 'yellow',
      desc: 'Bé luyện tính nhanh các phép toán cộng trừ hàng ngang thuần số trong phạm vi từ 1 đến 20 cực hiệu quả nhé!',
      reqLevel: 2
    },
    {
      id: 'island_mixed',
      title: 'Siêu Đảo Thách Thức 🏝️',
      mathTypes: ['addition', 'subtraction'],
      mode: 'mixed',
      emoji: '🏆',
      color: 'danger',
      desc: 'Vương quốc hỗn hợp đầy thử thách! Bé có muốn chinh phục toàn bộ các phép toán cộng trừ trong phạm vi từ 1 đến 20 để giành cúp vàng?',
      reqLevel: 3
    }
  ];

  const handleStartGame = async (island: IslandNode) => {
    if (currentChild.lives <= 0) {
      setShowLivesModal(true);
      return;
    }
    // Lọc các phép toán hợp lệ dựa trên cấp độ của bé
    const finalMathTypes = island.mathTypes.filter(type => {
      if (type === 'multiplication' && currentChild.level < 5) return false;
      if (type === 'division' && currentChild.level < 10) return false;
      return true;
    });

    await startNewSession(finalMathTypes, island.mode);
    navigate('/play');
  };

  const handleRefillLives = async () => {
    if (currentChild.stars >= 20) {
      const success = await refillLives(20);
      if (success) {
        setShowLivesModal(false);
        alert('Cực đã! Tim đã được hồi phục đầy ❤️❤️❤️❤️❤️');
      }
    } else {
      alert('Bé không đủ Sao rồi! Hãy làm bài tập chăm chỉ để kiếm thêm sao nhé ⭐');
    }
  };

  const triggerParentGate = () => {
    const a = Math.floor(Math.random() * 12) + 9;
    const b = Math.floor(Math.random() * 9) + 5;
    setGateQuestion({ a, b, ans: a + b });
    setGateInput('');
    setGateError(false);
    setShowParentGate(true);
  };

  const handleParentGateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (parseInt(gateInput) === gateQuestion.ans) {
      setShowParentGate(false);
      navigate('/parent');
    } else {
      setGateError(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#b2ebf2] flex flex-col items-center justify-between pb-8 font-sans overflow-x-hidden relative">
      
      {/* 1. THANH HEADER ĐỘNG PHONG CÁCH DUOLINGO */}
      <div className="sticky top-0 w-full bg-white border-b-[5px] border-[#e5e5e5] px-4 py-3 z-30 flex items-center justify-between max-w-5xl mx-auto rounded-b-[2rem] shadow-sm select-none">
        
        {/* Avatar bé tròn & Tên */}
        <div className="flex items-center gap-2 cursor-pointer hover:opacity-85" onClick={() => navigate('/')}>
          <span className="text-3xl p-1 bg-[#f7f7f7] rounded-xl border-2 border-[#e5e5e5] shadow-inner">
            {childAvatar?.emoji || '🦖'}
          </span>
          <div>
            <h4 className="text-base font-black text-[#3c3c3c] leading-tight truncate max-w-[90px] md:max-w-none">{currentChild.name}</h4>
            <span className="bg-[#58cc02] text-white text-[10px] font-black px-1.5 py-0.5 rounded-full shadow-sm">
              Lv {currentChild.level}
            </span>
          </div>
        </div>

        {/* Tim ❤️ sinh mạng */}
        <div 
          onClick={() => setShowLivesModal(true)} 
          className="flex items-center gap-1.5 px-3 py-1.5 border-4 border-[#e5e5e5] active:border-b-2 hover:bg-[#fafafa] rounded-2xl cursor-pointer transition-all shadow-inner"
        >
          <span className="text-xl filter drop-shadow">❤️</span>
          <span className="text-lg font-black text-red-500">{currentChild.lives}</span>
        </div>

        {/* Sao ⭐ phần thưởng */}
        <div 
          onClick={() => navigate('/shop')}
          className="flex items-center gap-1.5 px-3 py-1.5 border-4 border-[#e5e5e5] active:border-b-2 hover:bg-[#fafafa] rounded-2xl cursor-pointer transition-all shadow-inner"
        >
          <span className="text-xl filter drop-shadow">⭐</span>
          <span className="text-lg font-black text-yellow-500">{currentChild.stars}</span>
        </div>

        {/* Chuỗi Streak 🔥 ngày */}
        <div className="flex items-center gap-1 px-2.5 py-1.5 border-4 border-[#e5e5e5] bg-orange-50/40 rounded-2xl">
          <span className="text-xl filter drop-shadow">🔥</span>
          <span className="text-lg font-black text-orange-500">{currentChild.streak_days}</span>
        </div>

        {/* Nút shop ngộ nghĩnh */}
        <button 
          onClick={() => navigate('/shop')}
          className="p-1.5 bg-yellow-400 hover:bg-yellow-300 text-white rounded-2xl border-b-4 border-yellow-600 active:border-b-0 active:translate-y-[4px] font-bold text-xl shadow-md transition-all"
          title="Cửa hàng Pet"
        >
          🦖🛒
        </button>
      </div>

      {/* 2. BẢN ĐỒ CHIẾN THUẬT MAP HỌC TẬP ZIGZAG */}
      <div className="flex-1 w-full max-w-2xl px-6 py-12 flex flex-col items-center relative">
        
        {/* Đường nối zigzag đứt nét cực nghệ thuật */}
        <svg className="absolute top-24 bottom-24 left-0 right-0 w-full h-[80%] pointer-events-none stroke-dashed z-0 opacity-40" stroke="#777" strokeWidth="6" strokeDasharray="12,12" fill="none">
          <path d="M 300,50 Q 150,220 300,380 T 300,720 T 300,1050" />
        </svg>

        <div className="flex flex-col gap-16 w-full z-10">
          {ISLANDS.map((island, index) => {
            const isLocked = currentChild.level < island.reqLevel;
            
            // Bố trí đảo zigzag so le trái phải: index % 2 === 0 là lệch trái, index % 2 !== 0 là lệch phải
            const alignmentClass = index % 2 === 0 
              ? 'self-start ml-2 md:ml-12' 
              : 'self-end mr-2 md:mr-12';

            const islandColors = {
              green: 'bg-[#58cc02] border-[#46a302] shadow-[0_10px_0_0_#46a302]',
              blue: 'bg-[#1cb0f6] border-[#1899d6] shadow-[0_10px_0_0_#1899d6]',
              yellow: 'bg-[#ffc800] border-[#e6b400] shadow-[0_10px_0_0_#e6b400]',
              orange: 'bg-[#ff9600] border-[#e68000] shadow-[0_10px_0_0_#e68000]',
              danger: 'bg-[#ff4b4b] border-[#ea2b2b] shadow-[0_10px_0_0_#ea2b2b]'
            };

            return (
              <motion.div
                key={island.id}
                className={`${alignmentClass} flex flex-col items-center`}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.15 }}
              >
                {/* Island Button Nodes */}
                <motion.button
                  variants={isLocked ? {} : pulseVariants}
                  animate={index === 0 && !isLocked ? "pulse" : ""}
                  onClick={() => isLocked ? alert(`Hòn đảo này đang khóa! Bé cần nâng Level lên ${island.reqLevel} để mở nhé 🔐`) : setSelectedIsland(island)}
                  className={`
                    w-28 h-28 md:w-36 md:h-36 rounded-full border-[6px] text-white flex flex-col items-center justify-center font-bold outline-none cursor-pointer select-none transition-transform relative
                    ${isLocked ? 'bg-[#afafaf] border-[#888] shadow-[0_10px_0_0_#888]' : islandColors[island.color]}
                    hover:scale-105 active:translate-y-2 active:shadow-[0_4px_0_0]
                  `}
                >
                  <span className="text-4xl md:text-5xl mb-1 filter drop-shadow">{island.emoji}</span>
                  <span className="text-xs md:text-sm font-black uppercase tracking-wide px-2 text-center leading-tight">
                    {island.title.split(' ')[1]}
                  </span>

                  {/* Icon khóa nếu chưa mở được */}
                  {isLocked && (
                    <div className="absolute inset-0 bg-[#4b4b4b]/60 rounded-full flex items-center justify-center text-3xl">
                      🔒
                    </div>
                  )}

                  {/* Icon cờ hiệu nhỏ chỉ báo cấp độ yêu cầu */}
                  {isLocked && (
                    <div className="absolute bottom-[-12px] bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full border-2 border-white shadow">
                      Lv {island.reqLevel}
                    </div>
                  )}
                </motion.button>

                <h4 className="text-lg font-black text-[#3c3c3c] mt-3 bg-white/70 px-3 py-1 rounded-full border-2 border-[#e5e5e5]/40 text-center shadow-sm select-none">
                  {island.title.split(' ')[0]}
                </h4>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* 3. PHẦN BOTTOM FOOTER GÓC PHỤ HUYNH */}
      <div className="w-full flex items-center justify-center gap-4 mt-8 px-4 z-10">
        <Button3D variant="ghost" size="md" className="bg-white/80 border-2 border-[#e5e5e5]" onClick={triggerParentGate}>
          ⚙️ Dành cho Bố Mẹ
        </Button3D>
        <Button3D variant="ghost" size="md" className="bg-white/80 border-2 border-[#e5e5e5]" onClick={() => { selectChild(null); navigate('/'); }}>
          👶 Đổi Tài Khoản Bé
        </Button3D>
      </div>

      {/* 4. DIALOG THÔNG TIN ĐẢO VÀ NÚT CHƠI (DRAWER/MODAL) */}
      <AnimatePresence>
        {selectedIsland && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedIsland(null)}
              className="absolute inset-0 bg-[#4b4b4b]/60 backdrop-blur-sm"
            />

            <motion.div
              variants={slideUpVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="relative bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] border-t-[8px] sm:border-[8px] border-[#e5e5e5] shadow-[0_16px_0_0_#d5d5d5] w-full sm:max-w-md p-8 flex flex-col items-center text-center z-10"
            >
              <div className="text-6xl mb-4 filter drop-shadow">{selectedIsland.emoji}</div>
              
              <h2 className="text-2xl md:text-3xl font-black text-[#3c3c3c] mb-2">
                {selectedIsland.title}
              </h2>
              
              <p className="text-base font-bold text-[#888] mb-6 px-4 leading-relaxed">
                {selectedIsland.desc}
              </p>

              <div className="flex flex-col gap-3 w-full">
                <Button3D
                  variant={selectedIsland.color === 'danger' ? 'danger' : selectedIsland.color === 'blue' ? 'secondary' : selectedIsland.color === 'yellow' ? 'yellow' : selectedIsland.color === 'orange' ? 'orange' : 'primary'}
                  size="lg"
                  className="w-full text-xl"
                  onClick={() => handleStartGame(selectedIsland)}
                  disabled={isLoading}
                >
                  {isLoading ? 'Đang Tải Đảo...' : 'BẮT ĐẦU CHƠI 🚀'}
                </Button3D>
                
                <Button3D
                  variant="ghost"
                  size="md"
                  onClick={() => setSelectedIsland(null)}
                  className="w-full"
                >
                  Quay lại Bản đồ 🗺️
                </Button3D>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. MODAL HỒI TIM (LIVES REFILL MODAL) */}
      <AnimatePresence>
        {showLivesModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLivesModal(false)}
              className="absolute inset-0 bg-[#4b4b4b]/60 backdrop-blur-sm"
            />

            <motion.div
              variants={popInVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="relative bg-white rounded-[2.5rem] border-[6px] border-[#e5e5e5] shadow-[0_12px_0_0_#d5d5d5] p-8 max-w-sm w-full z-10 text-center"
            >
              <span className="text-6xl mb-3 inline-block filter drop-shadow">❤️</span>
              <h3 className="text-2xl font-black text-[#3c3c3c] mb-2">
                Tiếp Máu Cho Khủng Long!
              </h3>
              <p className="text-sm font-bold text-[#888] mb-6 leading-relaxed">
                Khủng long Dino cần tim để tiếp tục đồng hành cùng bé giải toán! Đổi 20 Sao ⭐ để hồi phục đầy 5 Tim ❤️ ngay lập tức nhé.
              </p>

              <div className="bg-[#fafafa] border-4 border-[#e5e5e5] rounded-3xl p-4 mb-6 flex justify-around items-center">
                <div className="text-center">
                  <span className="block text-xs font-bold text-[#888]">SAO CỦA BÉ</span>
                  <span className="text-2xl font-black text-yellow-500">⭐ {currentChild.stars}</span>
                </div>
                <div className="text-2xl text-[#888] font-bold">➔</div>
                <div className="text-center">
                  <span className="block text-xs font-bold text-[#888]">TIM NHẬN ĐƯỢC</span>
                  <span className="text-2xl font-black text-red-500">❤️ 5 Tim</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button3D variant="ghost" size="md" className="flex-1" onClick={() => setShowLivesModal(false)}>
                  Hủy Bỏ
                </Button3D>
                <Button3D variant="danger" size="md" className="flex-1 text-sm font-extrabold" onClick={handleRefillLives}>
                  Đổi Tim ❤️ (20 Sao)
                </Button3D>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. MODAL KHÓA PHỤ HUYNH (PARENT GATE) */}
      <AnimatePresence>
        {showParentGate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowParentGate(false)}
              className="absolute inset-0 bg-[#4b4b4b]/60 backdrop-blur-sm"
            />

            <motion.div
              variants={popInVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="relative bg-white rounded-[2.5rem] border-[6px] border-[#e5e5e5] shadow-[0_12px_0_0_#d5d5d5] p-8 max-w-sm w-full z-10 text-center"
            >
              <span className="text-5xl mb-2 inline-block">🔐</span>
              <h3 className="text-xl font-black text-[#3c3c3c] mb-2">
                Cổng Xác Minh Phụ Huynh
              </h3>
              <p className="text-xs font-bold text-[#888] mb-4">
                Giải phép toán cộng sau để chứng minh bạn là Phụ huynh nhé!
              </p>

              <form onSubmit={handleParentGateSubmit} className="flex flex-col gap-4">
                <div className="text-3xl font-black text-[#1cb0f6] bg-[#f7f7f7] py-3 rounded-2xl border-2 border-[#e5e5e5] tracking-widest shadow-inner">
                  {gateQuestion.a} + {gateQuestion.b} = ?
                </div>

                <input
                  type="number"
                  required
                  placeholder="Đáp án"
                  value={gateInput}
                  onChange={(e) => setGateInput(e.target.value)}
                  className="w-full px-4 py-3 border-4 border-[#e5e5e5] hover:border-[#1cb0f6] focus:border-[#1cb0f6] rounded-2xl outline-none font-bold text-center text-2xl bg-[#f7f7f7]"
                />

                {gateError && (
                  <p className="text-red-500 font-extrabold text-sm animate-bounce">
                    Sai rồi ba mẹ ơi! Thử lại nha! 😢
                  </p>
                )}

                <div className="flex gap-2">
                  <Button3D variant="ghost" size="md" className="flex-1" onClick={() => setShowParentGate(false)}>
                    Hủy bỏ
                  </Button3D>
                  <Button3D variant="secondary" size="md" type="submit" className="flex-1">
                    Xác nhận
                  </Button3D>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
export default LessonMap;
