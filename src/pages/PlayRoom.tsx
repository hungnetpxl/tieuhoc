import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../stores/useGameStore';
import { useAuthStore } from '../stores/useAuthStore';
import { Button3D } from '../components/Button3D';
import { ProgressBar } from '../components/ProgressBar';
import { DinoPet } from '../components/DinoPet';
import { ConfettiEffect } from '../components/ConfettiEffect';
import { GameDialog } from '../components/GameDialog';
import { motion, AnimatePresence } from 'framer-motion';
import { shakeVariants, popInVariants } from '../animations/presets';

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

export const PlayRoom: React.FC = () => {
  const navigate = useNavigate();
  const currentChild = useAuthStore(state => state.currentChild);
  
  const {
    questions,
    currentQuestionIndex,
    selectedAnswer,
    isAnswerChecked,
    isCorrect,
    lives,
    starsEarned,
    xpEarned,
    showLevelUp,
    showConfetti,
    unlockedBadges,
    activeSession,
    timeLimit,
    selectAnswer,
    checkAnswer,
    nextQuestion,
    endSessionEarly,
    resetFlags
  } = useGameStore();

  // Timer tracking for current question
  const [timeTaken, setTimeTaken] = useState(0);
  const timerRef = useRef<any>(null);

  // Countdown timer for the whole session
  const [timeLeft, setTimeLeft] = useState<number>(0);

  // Exit Confirmation state
  const [showExitWarning, setShowExitWarning] = useState(false);

  // Sync timeLeft with store timeLimit when session loads
  useEffect(() => {
    if (timeLimit > 0) {
      setTimeLeft(timeLimit);
    }
  }, [timeLimit]);

  // Countdown timer for the whole session
  useEffect(() => {
    if (timeLimit <= 0) return;
    if (isAnswerChecked) return;
    if (showExitWarning) return;
    if (activeSession?.status !== 'active') return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          // Auto timeout ending
          endSessionEarly();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLimit, isAnswerChecked, showExitWarning, activeSession, endSessionEarly]);

  // Tự động chuyển sang câu tiếp theo sau 1.5 giây nếu bé làm đúng
  useEffect(() => {
    if (isAnswerChecked && isCorrect) {
      const timer = setTimeout(() => {
        nextQuestion();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isAnswerChecked, isCorrect, nextQuestion]);

  // Victory Dialog state
  const [showVictoryDialog, setShowVictoryDialog] = useState(false);

  // Badge unlock tracking
  const [activeBadgeUnlock, setActiveBadgeUnlock] = useState<any>(null);

  // Reset timer on new question
  useEffect(() => {
    setTimeTaken(0);
    if (timerRef.current) clearInterval(timerRef.current);
    
    timerRef.current = setInterval(() => {
      setTimeTaken(prev => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentQuestionIndex]);

  // Clean timer when checked
  useEffect(() => {
    if (isAnswerChecked && timerRef.current) {
      clearInterval(timerRef.current);
    }
  }, [isAnswerChecked]);

  // Track session completion to show victory dialog
  useEffect(() => {
    if (activeSession && activeSession.status !== 'active') {
      if (activeSession.status === 'completed') {
        setShowVictoryDialog(true);
      } else if (activeSession.status === 'failed') {
        // Nếu hết tim, tự động dẫn đến dialog báo thất bại
        setShowVictoryDialog(true); 
      }
    }
  }, [activeSession]);

  // Track badge unlocks to show alert dialogs sequentially
  useEffect(() => {
    if (unlockedBadges.length > 0) {
      setActiveBadgeUnlock(unlockedBadges[0]);
    }
  }, [unlockedBadges]);

  if (!currentChild || questions.length === 0) return null;

  const question = questions[currentQuestionIndex];
  
  // Xử lý nộp câu trả lời
  const handleCheck = () => {
    if (selectedAnswer === null || isAnswerChecked) return;
    checkAnswer(timeTaken);
  };

  // Xác nhận thoát game giữa chừng
  const handleExitConfirm = async () => {
    await endSessionEarly();
    setShowExitWarning(false);
    navigate('/map');
  };

  // Về Map sau khi hoàn thành
  const handleVictoryClose = () => {
    setShowVictoryDialog(false);
    resetFlags();
    navigate('/map');
  };

  const handleBadgeClose = () => {
    // Xóa badge đầu tiên vừa xem, chuyển sang cái tiếp theo nếu có
    setActiveBadgeUnlock(null);
    if (unlockedBadges.length > 1) {
      // Có thể shift hoặc xóa
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfcfc] flex flex-col justify-between overflow-x-hidden font-sans relative">
      
      {/* Hiệu ứng pháo bông Confetti lấp lánh khi trả lời đúng */}
      <ConfettiEffect active={showConfetti} />

      {/* 1. THANH TOP BAR TIẾN TRÌNH */}
      <div className="w-full max-w-4xl mx-auto px-4 py-4 flex items-center justify-between gap-4 z-10 select-none">
        
        {/* Nút Hủy (X) */}
        <button 
          onClick={() => setShowExitWarning(true)}
          className="text-3xl font-black text-[#afafaf] hover:text-[#4b4b4b] cursor-pointer transition-colors"
        >
          ✕
        </button>

        {/* ProgressBar mượt mà */}
        <div className="flex-1">
          <ProgressBar current={currentQuestionIndex} total={questions.length} color="green" size="md" />
        </div>

        {/* Đồng hồ đếm ngược hạn giờ học (nếu có cấu hình) */}
        {timeLimit > 0 && (
          <div 
            className={`flex items-center gap-1.5 px-3 py-1 border-2 rounded-2xl bg-white shadow-sm transition-all duration-300 select-none
              ${timeLeft <= 10 
                ? 'border-red-400 bg-red-50 text-red-600 animate-pulse scale-105 font-extrabold' 
                : 'border-[#e5e5e5] text-gray-700 font-bold'}`}
          >
            <span className="text-xl filter drop-shadow">⏱️</span>
            <span className="text-base font-mono">{formatTime(timeLeft)}</span>
          </div>
        )}

        {/* Số tim ❤️ sinh mạng hiện tại */}
        <div className="flex items-center gap-1.5 px-3 py-1 border-2 border-[#e5e5e5] rounded-2xl bg-white shadow-sm">
          <span className="text-xl filter drop-shadow">❤️</span>
          <span className="text-base font-black text-red-500">{lives}</span>
        </div>

        {/* Số sao ⭐ kiếm được trong session */}
        <div className="flex items-center gap-1.5 px-3 py-1 border-2 border-[#e5e5e5] rounded-2xl bg-white shadow-sm">
          <span className="text-xl filter drop-shadow">⭐</span>
          <span className="text-base font-black text-yellow-500">{starsEarned}</span>
        </div>
      </div>

      {/* 2. KHU VỰC CÂU HỎI CHÍNH */}
      <div className="flex-1 w-full max-w-2xl mx-auto px-6 py-6 flex flex-col items-center justify-center">
        <div className="w-full flex flex-col items-center">
          
          {/* Card Câu Hỏi Bouncy tròn trịa */}
          <motion.div
            key={currentQuestionIndex}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={isAnswerChecked && !isCorrect ? "shake" : { scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            // Rung lắc nếu chọn sai đáp án
            variants={shakeVariants}
            className="w-full bg-white border-[6px] border-[#e5e5e5] rounded-[2.5rem] shadow-[0_10px_0_0_#e5e5e5] p-6 md:p-8 flex flex-col items-center mb-8 relative"
          >
            
            {/* Đề bài chữ to khổng lồ (Chỉ hiện nếu có text và không phải chế độ thuần số hàng ngang) */}
            {question.question_text && question.mode !== 'basic' && question.mode !== 'kumon' && (
              <h2 className="text-2xl md:text-3xl font-black text-[#3c3c3c] text-center leading-relaxed mb-6 select-none">
                {question.question_text}
              </h2>
            )}

            {/* Khung Biểu diễn Visual (Nếu ở chế độ trực quan bằng Emoji) */}
            {question.question_visual && (
              <div className="w-full bg-[#f8f9fa] border-4 border-dashed border-[#e5e5e5] rounded-3xl p-6 mb-4 flex items-center justify-center text-4xl md:text-5xl tracking-widest select-none select-all min-h-[100px] text-center">
                <span className="filter drop-shadow-sm font-sans">{question.question_visual}</span>
              </div>
            )}

            {/* PHẦN HIỂN THỊ TOÁN DẠNG SỐ HÀNG NGANG TRỰC QUAN (100% Không dùng chữ dài dòng) */}
            {(question.mode === 'kumon' || question.mode === 'basic') && (
              <div className="w-full flex flex-col items-center justify-center my-2">
                
                {/* 1. Toán cột dọc ô ly */}
                {question.kumon_style === 'vertical' && (
                  <div 
                    className="relative bg-[#f0f9ff] border-[6px] border-[#bae6fd] rounded-[2.5rem] p-8 px-12 min-w-[230px] flex flex-col items-end font-mono text-5xl md:text-6xl font-black text-[#1e293b] select-none shadow-[inset_0_4px_10px_rgba(0,0,0,0.06),0_10px_20px_rgba(0,0,0,0.05)]"
                    style={{
                      backgroundImage: 'linear-gradient(#bae6fd 1.5px, transparent 1.5px), linear-gradient(90deg, #bae6fd 1.5px, transparent 1.5px)',
                      backgroundSize: '32px 32px',
                      lineHeight: '1.2'
                    }}
                  >
                    {/* Số thứ nhất */}
                    <div className="pr-4 tracking-wider">{question.number_a}</div>
                    
                    {/* Phép toán và Số thứ hai */}
                    <div className="w-full flex justify-between items-center pr-4 border-b-[8px] border-[#334155] pb-2 mt-2">
                      <span className="text-4xl text-[#0284c7] font-sans font-black">{question.operator}</span>
                      <span className="tracking-wider">{question.number_b}</span>
                    </div>

                    {/* Ô trống điền kết quả */}
                    <div className="w-full flex justify-end pt-4 pr-1">
                      {selectedAnswer !== null ? (
                        <motion.div 
                          key={selectedAnswer}
                          initial={{ scale: 0.8, y: 10 }}
                          animate={{ scale: 1, y: 0 }}
                          className={`min-w-[75px] h-[75px] flex items-center justify-center border-[5px] rounded-3xl px-3 font-mono font-black text-5xl shadow-[0_6px_0_0_currentColor]
                            ${isAnswerChecked 
                              ? isCorrect 
                                ? 'border-[#46a302] text-[#46a302] bg-[#d7ffb7]' 
                                : 'border-[#ea2b2b] text-[#ea2b2b] bg-[#ffdfe0]'
                              : 'border-[#1899d6] text-[#1899d6] bg-[#ddf4ff]'
                            }`}
                        >
                          {selectedAnswer}
                        </motion.div>
                      ) : (
                        <motion.div 
                          animate={{ scale: [1, 1.08, 1], borderColor: ['#94a3b8', '#38bdf8', '#94a3b8'] }}
                          transition={{ repeat: Infinity, duration: 1.5 }}
                          className="min-w-[75px] h-[75px] flex items-center justify-center border-4 border-dashed border-[#94a3b8] rounded-3xl px-3 font-sans text-5xl text-[#64748b] bg-[#f8fafc]"
                        >
                          ?
                        </motion.div>
                      )}
                    </div>
                  </div>
                )}

                {/* 2. Điền số vào ô trống đại số */}
                {(question.kumon_style === 'fill_blank' || !question.kumon_style) && (
                  <div className="flex items-center justify-center gap-3 md:gap-5 flex-wrap py-4 select-none">
                    {/* Slot A */}
                    {question.kumon_blank_position === 'a' ? (
                      selectedAnswer !== null ? (
                        <motion.div
                          key={selectedAnswer}
                          initial={{ scale: 0.8, y: -10 }}
                          animate={{ scale: 1, y: 0 }}
                          className={`min-w-[70px] h-[80px] px-4 border-[5px] rounded-3xl flex items-center justify-center text-4xl md:text-5xl font-black shadow-[0_6px_0_0_currentColor]
                            ${isAnswerChecked 
                              ? isCorrect 
                                ? 'border-[#46a302] text-[#46a302] bg-[#d7ffb7]' 
                                : 'border-[#ea2b2b] text-[#ea2b2b] bg-[#ffdfe0]'
                              : 'border-[#1899d6] text-[#1899d6] bg-[#ddf4ff]'
                            }`}
                        >
                          {selectedAnswer}
                        </motion.div>
                      ) : (
                        <motion.div
                          animate={{ scale: [1, 1.08, 1], borderColor: ['#94a3b8', '#0ea5e9', '#94a3b8'] }}
                          transition={{ repeat: Infinity, duration: 1.5 }}
                          className="min-w-[70px] h-[80px] px-4 border-4 border-dashed border-[#94a3b8] rounded-3xl bg-[#f8fafc] flex items-center justify-center text-4xl md:text-5xl font-black text-[#64748b]"
                        >
                          ?
                        </motion.div>
                      )
                    ) : (
                      <div className="min-w-[70px] h-[80px] px-4 bg-white border-[5px] border-[#e5e5e5] rounded-3xl shadow-[0_6px_0_0_#e5e5e5] flex items-center justify-center text-4xl md:text-5xl font-black text-[#2c2c2c]">
                        {question.number_a}
                      </div>
                    )}

                    {/* Operator */}
                    <div className={`text-4xl md:text-5xl font-black px-2 md:px-3 select-none
                      ${question.operator === '+' ? 'text-[#58cc02]' :
                        question.operator === '-' ? 'text-[#1cb0f6]' :
                        question.operator === 'x' ? 'text-[#ff9600]' :
                        'text-[#ffc800]'}`}>
                      {question.operator === 'x' ? '×' : question.operator === '/' ? '÷' : question.operator}
                    </div>

                    {/* Slot B */}
                    {question.kumon_blank_position === 'b' ? (
                      selectedAnswer !== null ? (
                        <motion.div
                          key={selectedAnswer}
                          initial={{ scale: 0.8, y: -10 }}
                          animate={{ scale: 1, y: 0 }}
                          className={`min-w-[70px] h-[80px] px-4 border-[5px] rounded-3xl flex items-center justify-center text-4xl md:text-5xl font-black shadow-[0_6px_0_0_currentColor]
                            ${isAnswerChecked 
                              ? isCorrect 
                                ? 'border-[#46a302] text-[#46a302] bg-[#d7ffb7]' 
                                : 'border-[#ea2b2b] text-[#ea2b2b] bg-[#ffdfe0]'
                              : 'border-[#1899d6] text-[#1899d6] bg-[#ddf4ff]'
                            }`}
                        >
                          {selectedAnswer}
                        </motion.div>
                      ) : (
                        <motion.div
                          animate={{ scale: [1, 1.08, 1], borderColor: ['#94a3b8', '#0ea5e9', '#94a3b8'] }}
                          transition={{ repeat: Infinity, duration: 1.5 }}
                          className="min-w-[70px] h-[80px] px-4 border-4 border-dashed border-[#94a3b8] rounded-3xl bg-[#f8fafc] flex items-center justify-center text-4xl md:text-5xl font-black text-[#64748b]"
                        >
                          ?
                        </motion.div>
                      )
                    ) : (
                      <div className="min-w-[70px] h-[80px] px-4 bg-white border-[5px] border-[#e5e5e5] rounded-3xl shadow-[0_6px_0_0_#e5e5e5] flex items-center justify-center text-4xl md:text-5xl font-black text-[#2c2c2c]">
                        {question.number_b}
                      </div>
                    )}

                    {/* Dấu bằng */}
                    <div className="text-4xl md:text-5xl font-black px-2 md:px-3 text-[#a855f7] select-none">
                      =
                    </div>

                    {/* Số kết quả bên phải */}
                    {(question.kumon_blank_position === 'c' || !question.kumon_blank_position) ? (
                      selectedAnswer !== null ? (
                        <motion.div
                          key={selectedAnswer}
                          initial={{ scale: 0.8, y: -10 }}
                          animate={{ scale: 1, y: 0 }}
                          className={`min-w-[70px] h-[80px] px-4 border-[5px] rounded-3xl flex items-center justify-center text-4xl md:text-5xl font-black shadow-[0_6px_0_0_currentColor]
                            ${isAnswerChecked 
                              ? isCorrect 
                                ? 'border-[#46a302] text-[#46a302] bg-[#d7ffb7]' 
                                : 'border-[#ea2b2b] text-[#ea2b2b] bg-[#ffdfe0]'
                              : 'border-[#1899d6] text-[#1899d6] bg-[#ddf4ff]'
                            }`}
                        >
                          {selectedAnswer}
                        </motion.div>
                      ) : (
                        <motion.div
                          animate={{ scale: [1, 1.08, 1], borderColor: ['#94a3b8', '#0ea5e9', '#94a3b8'] }}
                          transition={{ repeat: Infinity, duration: 1.5 }}
                          className="min-w-[70px] h-[80px] px-4 border-4 border-dashed border-[#94a3b8] rounded-3xl bg-[#f8fafc] flex items-center justify-center text-4xl md:text-5xl font-black text-[#64748b]"
                        >
                          ?
                        </motion.div>
                      )
                    ) : (
                      <div className="min-w-[70px] h-[80px] px-4 bg-white border-[5px] border-[#e5e5e5] rounded-3xl shadow-[0_6px_0_0_#e5e5e5] flex items-center justify-center text-4xl md:text-5xl font-black text-[#2c2c2c]">
                        {question.math_type === 'addition' ? question.number_a + question.number_b :
                         question.math_type === 'subtraction' ? question.number_a - question.number_b :
                         question.math_type === 'multiplication' ? question.number_a * question.number_b :
                         Math.round(question.number_a / question.number_b)}
                      </div>
                    )}
                  </div>
                )}

                {/* 3. Sơ đồ chuỗi hạt toán học */}
                {question.kumon_style === 'chain' && (
                  <div className="w-full flex items-center justify-center gap-2 md:gap-4 py-6 select-none overflow-x-auto">
                    {/* Hạt bắt đầu */}
                    <div className="w-20 h-20 rounded-full bg-[#3b82f6] border-[5px] border-[#2563eb] text-white flex items-center justify-center text-3xl font-black shadow-[0_8px_0_0_#1d4ed8]">
                      {question.number_a}
                    </div>

                    {/* Mũi tên liên kết và bong bóng phép tính */}
                    <div className="flex flex-col items-center justify-center min-w-[110px] md:min-w-[140px] relative px-1">
                      {/* Operation Pill */}
                      <div className="bg-[#f59e0b] border-[4px] border-[#d97706] text-white font-black text-xl md:text-2xl px-3.5 py-1.5 rounded-full shadow-[0_4px_0_0_#b45309] z-10 -mb-1 flex items-center gap-1.5 select-none">
                        <span className="text-lg">{question.operator === 'x' ? '✖' : question.operator === '/' ? '➗' : question.operator}</span>
                        <span>{question.number_b}</span>
                      </div>
                      {/* SVG Connector Arrow */}
                      <svg className="w-full h-8 text-[#94a3b8] drop-shadow-sm" fill="none" stroke="currentColor" strokeWidth="4">
                        <defs>
                          <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                            <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
                          </marker>
                        </defs>
                        <line x1="10" y1="16" x2="88%" y2="16" markerEnd="url(#arrow)" />
                      </svg>
                    </div>

                    {/* Hạt kết quả (Đang pulsing hoặc chứa kết quả bé chọn) */}
                    {selectedAnswer !== null ? (
                      <motion.div
                        key={selectedAnswer}
                        initial={{ scale: 0.8, rotate: -5 }}
                        animate={{ scale: 1, rotate: 0 }}
                        className={`w-20 h-20 rounded-full border-[5px] flex items-center justify-center text-3xl font-black shadow-[0_8px_0_0_currentColor]
                          ${isAnswerChecked 
                            ? isCorrect 
                              ? 'border-[#46a302] text-[#46a302] bg-[#d7ffb7]' 
                              : 'border-[#ea2b2b] text-[#ea2b2b] bg-[#ffdfe0]'
                            : 'border-[#1899d6] text-[#1899d6] bg-[#ddf4ff]'
                          }`}
                      >
                        {selectedAnswer}
                      </motion.div>
                    ) : (
                      <motion.div
                        animate={{ scale: [1, 1.08, 1], borderColor: ['#94a3b8', '#0ea5e9', '#94a3b8'] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className="w-20 h-20 rounded-full border-[5px] border-dashed border-[#94a3b8] bg-[#f8fafc] text-3xl font-black text-[#64748b] flex items-center justify-center"
                      >
                        ?
                      </motion.div>
                    )}
                  </div>
                )}
              </div>
            )}
          </motion.div>

          {/* Hộp Chứa Các Đáp Án 3D Lớn */}
          <div className="grid grid-cols-2 gap-4 w-full px-2">
            {question.options.map((opt, idx) => {
              const isSelected = selectedAnswer === opt;
              
              // Màu sắc các thẻ đáp án dựa trên trạng thái
              let btnBorderColor = 'border-[#e5e5e5]';
              let btnBgColor = 'bg-white hover:bg-[#fafafa]';
              let btnTextColor = 'text-[#4b4b4b]';
              let btnShadow = 'shadow-[0_8px_0_0_#e5e5e5]';

              if (isSelected) {
                // Đang chọn nhưng chưa check: hiển thị viền xanh dương
                btnBorderColor = 'border-[#1899d6]';
                btnBgColor = 'bg-[#ddf4ff]';
                btnTextColor = 'text-[#1899d6]';
                btnShadow = 'shadow-[0_8px_0_0_#1899d6]';
              }

              if (isAnswerChecked) {
                if (opt === question.correct_answer) {
                  // Đắp viền xanh lá cho đáp án ĐÚNG
                  btnBorderColor = 'border-[#46a302]';
                  btnBgColor = 'bg-[#d7ffb7]';
                  btnTextColor = 'text-[#46a302]';
                  btnShadow = 'shadow-[0_8px_0_0_#46a302]';
                } else if (isSelected && !isCorrect) {
                  // Đắp viền đỏ cho đáp án SAI bé chọn
                  btnBorderColor = 'border-[#ea2b2b]';
                  btnBgColor = 'bg-[#ffdfe0]';
                  btnTextColor = 'text-[#ea2b2b]';
                  btnShadow = 'shadow-[0_8px_0_0_#ea2b2b]';
                }
              }

              return (
                <motion.button
                  key={idx}
                  onClick={() => selectAnswer(opt)}
                  disabled={isAnswerChecked}
                  whileTap={isAnswerChecked ? {} : { y: 8 }}
                  className={`
                    border-[5px] rounded-3xl p-5 text-2xl font-black text-center select-none cursor-pointer transition-all duration-75 outline-none flex items-center justify-center min-h-[75px] active:translate-y-2 active:shadow-[0_0_0_0]
                    ${btnBorderColor} ${btnBgColor} ${btnTextColor} ${btnShadow}
                  `}
                >
                  {opt}
                </motion.button>
              );
            })}
          </div>

        </div>
      </div>

      {/* 3. THANH TRẢ LỜI TRƯỢT TỪ DƯỚI LÊN (BOTTOM ACTION BAR) */}
      <div 
        className={`w-full border-t-[5px] border-[#e5e5e5] py-6 px-6 z-20 transition-colors duration-150 select-none
          ${isAnswerChecked 
            ? isCorrect 
              ? 'bg-[#d7ffb7] border-[#46a302]' // Nền xanh lá khi đúng
              : 'bg-[#ffdfe0] border-[#ea2b2b]' // Nền đỏ khi sai
            : 'bg-white'
          }
        `}
      >
        <div className="max-w-2xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Nhãn văn bản thông báo cảm xúc của Mascot */}
          <div className="flex items-center gap-4">
            {isAnswerChecked ? (
              <>
                <DinoPet state={isCorrect ? 'cheering' : 'sad'} size={65} />
                <div className="text-left">
                  <h4 className={`text-xl font-black ${isCorrect ? 'text-[#46a302]' : 'text-[#ea2b2b]'}`}>
                    {isCorrect ? 'BÉ LÀM QUÁ ĐỈNH! 🎉' : 'TIẾC QUÁ BÉ ƠI! 😢'}
                  </h4>
                  <p className={`text-sm font-bold ${isCorrect ? 'text-[#58cc02]' : 'text-[#ff4b4b]'}`}>
                    {isCorrect 
                      ? 'Nốt nhạc vui tươi đang réo rắt nè!' 
                      : `Đáp án đúng là: ${question.correct_answer}`
                    }
                  </p>
                </div>
              </>
            ) : (
              <div className="hidden sm:flex items-center gap-3">
                <DinoPet state={selectedAnswer !== null ? 'thinking' : 'normal'} size={60} />
                <p className="text-sm font-bold text-[#777] text-left leading-tight">
                  {selectedAnswer !== null 
                    ? 'Bé chắc chắn chưa? Nhấp nút Kiểm tra nhé!' 
                    : 'Hãy suy nghĩ thật kỹ rồi chọn 1 đáp án nha!'
                  }
                </p>
              </div>
            )}
          </div>

          {/* Nút hành động kiểm tra hoặc tiếp tục */}
          <div className="w-full sm:w-auto">
            {!isAnswerChecked ? (
              <Button3D
                variant={selectedAnswer !== null ? 'primary' : 'ghost'}
                size="lg"
                onClick={handleCheck}
                disabled={selectedAnswer === null}
                className="w-full sm:w-56"
              >
                KIỂM TRA ✅
              </Button3D>
            ) : (
              <Button3D
                variant={isCorrect ? 'primary' : 'orange'}
                size="lg"
                onClick={nextQuestion}
                className="w-full sm:w-56"
              >
                TIẾP TỤC ➡️
              </Button3D>
            )}
          </div>

        </div>
      </div>

      {/* 4. DIALOG CẢNH BÁO THOÁT (EXIT WARNING) */}
      <AnimatePresence>
        {showExitWarning && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowExitWarning(false)}
              className="absolute inset-0 bg-[#4b4b4b]/60 backdrop-blur-sm"
            />
            
            <motion.div
              variants={popInVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="relative bg-white rounded-[2.5rem] border-[6px] border-[#e5e5e5] shadow-[0_12px_0_0_#d5d5d5] p-8 max-w-sm w-full z-10 text-center"
            >
              <span className="text-6xl mb-3 inline-block">🦖⚠️</span>
              <h3 className="text-2xl font-black text-[#3c3c3c] mb-2">
                Bé muốn dừng học sao?
              </h3>
              <p className="text-sm font-bold text-[#888] mb-6 leading-relaxed">
                Mọi tiến độ của bài học hiện tại sẽ bị mất đó. Hãy kiên trì học xong để nhận Sao ⭐ và kinh nghiệm ⚡ thăng cấp nha bé!
              </p>

              <div className="flex flex-col gap-2">
                <Button3D variant="primary" size="md" className="w-full" onClick={() => setShowExitWarning(false)}>
                  HỌC TIẾP THÔI 🚀
                </Button3D>
                <Button3D variant="ghost" size="md" className="w-full text-red-500 font-extrabold" onClick={handleExitConfirm}>
                  Dừng chơi thoát ra 🚪
                </Button3D>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. DIALOG KẾT THÚC BÀI HỌC (VICTORY OR LOSS DIALOG) */}
      {activeSession && (
        <GameDialog
          isOpen={showVictoryDialog}
          onClose={handleVictoryClose}
          type={activeSession.status === 'failed' ? 'lives_empty' : 'victory'}
          childName={currentChild.name}
          starsEarned={starsEarned}
          xpEarned={xpEarned}
          onAction={activeSession.status === 'failed' ? async () => {
            // Đổi tim trực tiếp nếu có đủ sao
            if (currentChild.stars >= 20) {
              const success = await useAuthStore.getState().refillLives(20);
              if (success) {
                setShowVictoryDialog(false);
                resetFlags();
                // Khởi chạy lại màn chơi
                navigate('/map');
              }
            } else {
              alert('Bé không đủ sao đổi tim rồi! Thử chơi lại chặng khác nhé!');
              setShowVictoryDialog(false);
              resetFlags();
              navigate('/map');
            }
          } : handleVictoryClose}
        />
      )}

      {/* 6. DIALOG THĂNG CẤP (LEVEL UP CELEBRATION) */}
      <GameDialog
        isOpen={showLevelUp}
        onClose={resetFlags}
        type="level_up"
        childName={currentChild.name}
        level={currentChild.level}
      />

      {/* 7. DIALOG MỞ KHÓA HUY HIỆU (BADGE UNLOCKED CELEBRATION) */}
      {activeBadgeUnlock && (
        <GameDialog
          isOpen={!!activeBadgeUnlock}
          onClose={handleBadgeClose}
          type="badge_unlocked"
          badge={activeBadgeUnlock}
          childName={currentChild.name}
          onAction={handleBadgeClose}
        />
      )}

    </div>
  );
};
export default PlayRoom;
