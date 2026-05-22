import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, CUTE_AVATARS } from '../stores/useAuthStore';
import { Button3D } from '../components/Button3D';
import { DinoPet } from '../components/DinoPet';
import { motion, AnimatePresence } from 'framer-motion';
import { slideUpVariants, popInVariants } from '../animations/presets';

export const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const { 
    parent, 
    children, 
    isAuthenticated, 
    isLoading, 
    signIn, 
    signUp, 
    addChild, 
    selectChild, 
    signOut,
    initialize 
  } = useAuthStore();

  // States
  const [email, setEmail] = useState('');
  const [parentName, setParentName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [showAddChildModal, setShowAddChildModal] = useState(false);
  const [newChildName, setNewChildName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('dino');

  // Parent Gate Lock (Cổng phụ huynh)
  const [showParentGate, setShowParentGate] = useState(false);
  const [gateQuestion, setGateQuestion] = useState({ a: 0, b: 0, ans: 0 });
  const [parentGateAnswer, setParentGateAnswer] = useState('');
  const [gateError, setGateError] = useState(false);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (isAuthenticated && children.length > 0) {
      // Nếu đã login và có bé, tự động trỏ đến Map chơi của bé được chọn
      const savedChildId = localStorage.getItem('selected_child_id');
      if (savedChildId) {
        selectChild(savedChildId);
        navigate('/map');
      }
    }
  }, [isAuthenticated, children, navigate, selectChild]);

  // Sinh ngẫu nhiên câu đố cổng phụ huynh (vd: 12 + 15)
  const triggerParentGate = () => {
    const a = Math.floor(Math.random() * 15) + 10; // 10 -> 24
    const b = Math.floor(Math.random() * 15) + 5;  // 5 -> 19
    setGateQuestion({ a, b, ans: a + b });
    setParentGateAnswer('');
    setGateError(false);
    setShowParentGate(true);
  };

  const handleParentGateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (parseInt(parentGateAnswer) === gateQuestion.ans) {
      setShowParentGate(false);
      navigate('/parent'); // Vào trang quản trị phụ huynh
    } else {
      setGateError(true);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    try {
      if (isRegistering) {
        await signUp(email, parentName || 'Phụ Huynh');
      } else {
        await signIn(email);
      }
    } catch (err) {
      alert('Có lỗi xảy ra, vui lòng thử lại!');
    }
  };

  const handleCreateChildSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChildName) return;

    try {
      await addChild(newChildName, selectedAvatar);
      setShowAddChildModal(false);
      setNewChildName('');
      setSelectedAvatar('dino');
      navigate('/map'); // Trỏ trực tiếp bé vào đảo toán học học ngay
    } catch (err) {
      alert('Không thể tạo hồ sơ bé!');
    }
  };

  const handleSelectChild = (id: string) => {
    selectChild(id);
    navigate('/map');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#baffeb] to-[#e8faff] flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      
      {/* Vòng nền màu pastel bay bay */}
      <div className="absolute top-10 left-[-80px] w-96 h-96 bg-[#ffeed0]/50 rounded-full filter blur-3xl" />
      <div className="absolute bottom-10 right-[-80px] w-[500px] h-[500px] bg-[#d3f5ff]/60 rounded-full filter blur-3xl" />

      <div className="max-w-2xl w-full z-10 flex flex-col items-center">
        {/* Logo vui tươi */}
        <div className="flex flex-col items-center gap-2 mb-8">
          <motion.div
            animate={{ rotate: [0, 5, -5, 0], y: [0, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <DinoPet state="normal" size={140} />
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-black text-[#58cc02] tracking-wide text-center drop-shadow-sm select-none">
            TOÁN CÚ CON <span className="text-[#ff9600]">🦖</span>
          </h1>
          <p className="text-lg md:text-xl font-bold text-[#777] text-center max-w-md">
            Học toán siêu vui nhộn cho bé 5–7 tuổi phong cách Duolingo!
          </p>
        </div>

        {/* 1. KHI CHƯA ĐĂNG NHẬP PHỤ HUYNH */}
        {!isAuthenticated ? (
          <motion.div 
            variants={slideUpVariants}
            initial="hidden"
            animate="visible"
            className="w-full max-w-md bg-white border-[6px] border-[#e5e5e5] rounded-[2.5rem] shadow-[0_12px_0_0_#d5d5d5] p-8 flex flex-col"
          >
            <div className="flex border-b-4 border-[#e5e5e5] mb-6">
              <button
                className={`flex-1 pb-3 text-lg font-black ${!isRegistering ? 'text-[#58cc02] border-b-4 border-[#58cc02] -mb-1' : 'text-[#888]'}`}
                onClick={() => setIsRegistering(false)}
              >
                Đăng Nhập
              </button>
              <button
                className={`flex-1 pb-3 text-lg font-black ${isRegistering ? 'text-[#58cc02] border-b-4 border-[#58cc02] -mb-1' : 'text-[#888]'}`}
                onClick={() => setIsRegistering(true)}
              >
                Đăng Ký Mới
              </button>
            </div>

            <form onSubmit={handleAuthSubmit} className="flex flex-col gap-4">
              {isRegistering && (
                <div>
                  <label className="block text-sm font-black text-[#4b4b4b] mb-1.5 uppercase tracking-wider">
                    Tên Phụ Huynh
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Tên của bạn"
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    className="w-full px-5 py-3.5 border-4 border-[#e5e5e5] hover:border-[#1cb0f6] focus:border-[#1cb0f6] rounded-2xl outline-none font-bold text-lg transition-colors bg-[#f7f7f7]"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-black text-[#4b4b4b] mb-1.5 uppercase tracking-wider">
                  Địa chỉ Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-5 py-3.5 border-4 border-[#e5e5e5] hover:border-[#1cb0f6] focus:border-[#1cb0f6] rounded-2xl outline-none font-bold text-lg transition-colors bg-[#f7f7f7]"
                />
                <p className="text-xs text-[#888] font-bold mt-1.5 italic">
                  * Chạy Offline: Mọi email đều đăng nhập được ngay lập tức!
                </p>
              </div>

              <Button3D variant="primary" size="lg" className="w-full text-lg mt-2" disabled={isLoading}>
                {isLoading ? 'Đang tải...' : isRegistering ? 'Bắt Đầu Học Thôi! 🎉' : 'Đăng Nhập Ngay 🚀'}
              </Button3D>
            </form>
          </motion.div>
        ) : (
          /* 2. KHI ĐÃ ĐĂNG NHẬP - DANH SÁCH BÉ */
          <motion.div
            variants={slideUpVariants}
            initial="hidden"
            animate="visible"
            className="w-full bg-white border-[6px] border-[#e5e5e5] rounded-[2.5rem] shadow-[0_12px_0_0_#d5d5d5] p-8 flex flex-col items-center"
          >
            <div className="w-full flex items-center justify-between border-b-4 border-[#e5e5e5] pb-4 mb-6">
              <div>
                <h3 className="text-xl font-black text-[#3c3c3c]">Chào Phụ huynh! 👋</h3>
                <p className="text-xs font-bold text-[#888]">{parent?.email}</p>
              </div>
              <Button3D variant="ghost" size="sm" onClick={signOut}>
                Đăng xuất 🚪
              </Button3D>
            </div>

            <h2 className="text-2xl font-black text-[#3c3c3c] mb-6 text-center">
              Chọn hồ sơ của Bé để học nào!
            </h2>

            {children.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-6 border-4 border-dashed border-[#e5e5e5] rounded-3xl w-full mb-6 bg-[#fafafa]">
                <span className="text-5xl mb-2">🦕</span>
                <p className="text-lg font-extrabold text-[#777] text-center mb-4">
                  Chưa có hồ sơ Bé nào. Tạo ngay hồ sơ đầu tiên nhé!
                </p>
                <Button3D variant="yellow" size="md" onClick={() => setShowAddChildModal(true)}>
                  + Tạo hồ sơ cho Bé 🦖
                </Button3D>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full mb-6">
                {children.map((child) => {
                  const avatarDetail = CUTE_AVATARS.find(a => a.id === child.avatar);
                  return (
                    <motion.div
                      key={child.id}
                      whileHover={{ scale: 1.03 }}
                      className="border-[5px] border-[#e5e5e5] hover:border-[#58cc02] rounded-3xl p-5 flex items-center gap-4 cursor-pointer transition-colors shadow-sm bg-white"
                      onClick={() => handleSelectChild(child.id)}
                    >
                      <div className="text-5xl p-2 bg-[#f7f7f7] rounded-2xl border-2 border-[#e5e5e5] shadow-inner select-none">
                        {avatarDetail?.emoji || '🦖'}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-xl font-black text-[#3c3c3c] truncate">{child.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="bg-[#58cc02] text-white text-xs font-black px-2 py-0.5 rounded-full shadow-sm">
                            Lv {child.level}
                          </span>
                          <span className="text-xs font-bold text-yellow-500 flex items-center gap-0.5">
                            ⭐ {child.stars}
                          </span>
                          <span className="text-xs font-bold text-red-500 flex items-center gap-0.5">
                            ❤️ {child.lives}
                          </span>
                        </div>
                      </div>
                      <span className="text-2xl text-[#afafaf] font-black">➡️</span>
                    </motion.div>
                  );
                })}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 w-full border-t-4 border-[#e5e5e5] pt-6">
              {children.length > 0 && (
                <Button3D variant="primary" size="md" className="flex-1" onClick={() => setShowAddChildModal(true)}>
                  + Thêm Bé Khác 👶
                </Button3D>
              )}
              <Button3D variant="secondary" size="md" className="flex-1" onClick={triggerParentGate}>
                ⚙️ Góc Phụ Huynh
              </Button3D>
            </div>
          </motion.div>
        )}
      </div>

      {/* 3. MODAL TẠO BÉ MỚI (ADD CHILD MODAL) */}
      <AnimatePresence>
        {showAddChildModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddChildModal(false)}
              className="absolute inset-0 bg-[#4b4b4b]/60 backdrop-blur-sm"
            />
            
            <motion.div
              variants={popInVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="relative bg-white rounded-[2.5rem] border-[6px] border-[#e5e5e5] shadow-[0_12px_0_0_#d5d5d5] p-8 max-w-md w-full z-10"
            >
              <h3 className="text-2xl font-black text-[#3c3c3c] text-center mb-5">
                🎉 Tạo Hồ Sơ Bé Mới 🎉
              </h3>

              <form onSubmit={handleCreateChildSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-black text-[#4b4b4b] mb-1.5 uppercase">
                    Tên của Bé
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Cu Tin, Bé Na..."
                    value={newChildName}
                    onChange={(e) => setNewChildName(e.target.value)}
                    className="w-full px-4 py-3 border-4 border-[#e5e5e5] hover:border-[#1cb0f6] focus:border-[#1cb0f6] rounded-2xl outline-none font-bold text-lg bg-[#f7f7f7]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-black text-[#4b4b4b] mb-2 uppercase">
                    Chọn Linh Vật Đại Diện
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {CUTE_AVATARS.map((av) => (
                      <div
                        key={av.id}
                        onClick={() => setSelectedAvatar(av.id)}
                        className={`text-3xl p-2 rounded-2xl cursor-pointer border-4 text-center transition-all select-none bg-[#f7f7f7] hover:scale-105 ${selectedAvatar === av.id ? 'border-[#58cc02] scale-105 shadow-md' : 'border-[#e5e5e5]'}`}
                        title={av.label}
                      >
                        {av.emoji}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 mt-4">
                  <Button3D variant="ghost" size="md" className="flex-1" onClick={() => setShowAddChildModal(false)}>
                    Hủy Bỏ
                  </Button3D>
                  <Button3D variant="primary" size="md" type="submit" className="flex-1">
                    Tạo Bé Thôi! 🚀
                  </Button3D>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. MODAL KHÓA PHỤ HUYNH (PARENT GATE MODAL) */}
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
              <p className="text-sm font-bold text-[#888] mb-4">
                Xin hãy giải phép toán sau để chứng minh bạn là Phụ huynh (tránh các bé tự ý vào chỉnh sửa).
              </p>

              <form onSubmit={handleParentGateSubmit} className="flex flex-col gap-4">
                <div className="text-3xl font-black text-[#1cb0f6] bg-[#f7f7f7] py-3 rounded-2xl border-2 border-[#e5e5e5] tracking-widest shadow-inner select-none">
                  {gateQuestion.a} + {gateQuestion.b} = ?
                </div>

                <input
                  type="number"
                  required
                  placeholder="Đáp án"
                  value={parentGateAnswer}
                  onChange={(e) => setParentGateAnswer(e.target.value)}
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
                    Vào Thiết Lập ⚙️
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
export default AuthPage;
