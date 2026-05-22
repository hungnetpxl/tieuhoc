import { create } from 'zustand';
import type { MathQuestion, MathType, QuestionMode, LearningSession, Badge } from '../types';
import { QuestionGenerator } from '../engine/generator';
import { AdaptiveLearningEngine } from '../engine/adaptive';
import { ScoringEngine } from '../engine/scoring';
import { RewardEngine } from '../engine/reward';
import { apiService } from '../services/apiService';
import { useAuthStore } from './useAuthStore';
import { audioSynth } from '../utils/audioSynth';

interface GameState {
  generator: QuestionGenerator;
  questions: MathQuestion[];
  currentQuestionIndex: number;
  selectedAnswer: number | null;
  isAnswerChecked: boolean;
  isCorrect: boolean | null;
  wrongStreak: number;
  streak: number;
  lives: number;
  starsEarned: number;
  xpEarned: number;
  sessionTimeStarted: number;
  showLevelUp: boolean;
  showConfetti: boolean;
  unlockedBadges: Badge[];
  activeSession: LearningSession | null;
  isLoading: boolean;
  timeLimit: number;
  correctCount: number;

  // Actions
  startNewSession: (mathTypes: MathType[], mode: 'mixed' | QuestionMode) => Promise<void>;
  selectAnswer: (answer: number) => void;
  checkAnswer: (timeTakenSeconds: number) => Promise<void>;
  nextQuestion: () => void;
  endSessionEarly: () => Promise<void>;
  resetFlags: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  generator: new QuestionGenerator(),
  questions: [],
  currentQuestionIndex: 0,
  selectedAnswer: null,
  isAnswerChecked: false,
  isCorrect: null,
  wrongStreak: 0,
  streak: 0,
  lives: 5,
  starsEarned: 0,
  xpEarned: 0,
  sessionTimeStarted: 0,
  showLevelUp: false,
  showConfetti: false,
  unlockedBadges: [],
  activeSession: null,
  isLoading: false,
  timeLimit: 0,
  correctCount: 0,

  startNewSession: async (mathTypes: MathType[], mode: 'mixed' | QuestionMode) => {
    const currentChild = useAuthStore.getState().currentChild;
    if (!currentChild) return;

    set({ isLoading: true, showConfetti: false, unlockedBadges: [], showLevelUp: false });
    get().generator.resetHistory();

    try {
      // 1. Lấy lịch sử lỗi sai gần đây của bé để đưa vào Adaptive Learning
      const recentMistakes = await apiService.getMistakes(currentChild.id);
      
      // 2. Tính toán cấu hình câu hỏi thích ứng (Adaptive Settings)
      const settings = AdaptiveLearningEngine.calculateSettings(currentChild, recentMistakes, mathTypes);

      // 3. Sinh 10 câu hỏi toán chất lượng không trùng lặp
      const sessionQuestions: MathQuestion[] = [];
      
      // Lấy lỗi sai tệ nhất nằm trong nhóm phép tính đang học để ưu tiên ôn tập câu đầu tiên
      const worstMistake = recentMistakes.find(m => 
        !m.last_attempt_correct && 
        m.wrong_count > 0 && 
        settings.mathTypes.includes(m.math_type)
      );
      let forcedMistakePrompt: any = undefined;
      
      if (worstMistake) {
        forcedMistakePrompt = {
          numA: worstMistake.number_a,
          numB: worstMistake.number_b,
          op: worstMistake.operator,
          type: worstMistake.math_type
        };
      }

      for (let i = 0; i < settings.questionCount; i++) {
        // Câu đầu tiên ưu tiên lấy câu làm sai để bé sửa sai (nếu có)
        const isFirstQuestion = i === 0 && forcedMistakePrompt !== undefined;
        
        const q = get().generator.generateQuestion(
          settings.mathTypes,
          settings.minNumber,
          settings.maxNumber,
          mode === 'mixed' ? settings.mode : mode,
          currentChild.level > 10 ? 'medium' : 'easy',
          isFirstQuestion ? forcedMistakePrompt.type : undefined,
          isFirstQuestion ? forcedMistakePrompt : undefined
        );
        sessionQuestions.push(q);
      }

      // 4. Tạo phiên học mới trên Supabase
      const newSession = await apiService.createSession(currentChild.id, settings.mathTypes);

      set({
        questions: sessionQuestions,
        currentQuestionIndex: 0,
        selectedAnswer: null,
        isAnswerChecked: false,
        isCorrect: null,
        wrongStreak: 0,
        streak: 0,
        lives: currentChild.lives, // Đồng bộ số tim thực tế của bé
        starsEarned: 0,
        xpEarned: 0,
        sessionTimeStarted: Date.now(),
        activeSession: newSession,
        timeLimit: settings.timeLimit || 0,
        correctCount: 0,
        isLoading: false
      });
    } catch (err) {
      console.error('Không thể bắt đầu phiên học mới:', err);
      set({ isLoading: false });
    }
  },

  selectAnswer: (answer: number) => {
    if (get().isAnswerChecked) return;
    set({ selectedAnswer: answer });
    audioSynth.playClick();
  },

  checkAnswer: async (timeTakenSeconds: number) => {
    const { questions, currentQuestionIndex, selectedAnswer, streak, wrongStreak, lives, starsEarned, xpEarned, activeSession } = get();
    const currentChild = useAuthStore.getState().currentChild;
    
    if (selectedAnswer === null || !currentChild || !activeSession) return;

    const question = questions[currentQuestionIndex];
    const isCorrect = selectedAnswer === question.correct_answer;
    
    let newStreak = streak;
    let newWrongStreak = wrongStreak;
    let newLives = lives;
    let newStars = starsEarned;
    let newXp = xpEarned;

    if (isCorrect) {
      // 1. TRẢ LỜI ĐÚNG
      newStreak += 1;
      newWrongStreak = 0;
      
      // Tính điểm và sao
      const questionRewards = ScoringEngine.calculateQuestionScore(streak, timeTakenSeconds, question.mode);
      newStars += questionRewards.stars;
      newXp += questionRewards.xp;

      set({ 
        isCorrect: true, 
        isAnswerChecked: true,
        streak: newStreak,
        wrongStreak: newWrongStreak,
        starsEarned: newStars,
        xpEarned: newXp,
        correctCount: get().correctCount + 1,
        showConfetti: true // Kích hoạt pháo hoa khi bé đúng
      });

      audioSynth.playCorrect();

      // Lưu nhật ký câu trả lời đúng
      await apiService.recordQuestionHistory({
        session_id: activeSession.id,
        child_id: currentChild.id,
        math_type: question.math_type,
        question_text: question.question_text,
        question_visual: question.question_visual,
        correct_answer: question.correct_answer,
        selected_answer: selectedAnswer,
        is_correct: true,
        time_taken_seconds: timeTakenSeconds,
        difficulty_level: question.difficulty
      });

      // Nếu câu này trước đó bé từng làm sai, cập nhật đã sửa đổi thành công
      await apiService.resolveMistake(currentChild.id, question.math_type, question.number_a, question.number_b, question.operator);

    } else {
      // 2. TRẢ LỜI SAI
      newStreak = 0;
      newWrongStreak += 1;
      newLives = Math.max(0, lives - 1);

      set({
        isCorrect: false,
        isAnswerChecked: true,
        streak: newStreak,
        wrongStreak: newWrongStreak,
        lives: newLives,
        showConfetti: false
      });

      audioSynth.playWrong();

      // Đồng bộ trừ mạng trực tiếp của bé trong hồ sơ
      await useAuthStore.getState().deductChildLife();

      // Lưu câu trả lời sai vào nhật ký
      await apiService.recordQuestionHistory({
        session_id: activeSession.id,
        child_id: currentChild.id,
        math_type: question.math_type,
        question_text: question.question_text,
        question_visual: question.question_visual,
        correct_answer: question.correct_answer,
        selected_answer: selectedAnswer,
        is_correct: false,
        time_taken_seconds: timeTakenSeconds,
        difficulty_level: question.difficulty
      });

      // Ghi nhận lỗi sai vào bảng mistakes để sau này sinh đề ôn tập
      await apiService.recordMistake(
        currentChild.id,
        question.math_type,
        question.number_a,
        question.number_b,
        question.operator
      );
    }
  },

  nextQuestion: () => {
    const { currentQuestionIndex, questions, lives } = get();
    
    // Đã đi đến câu cuối hoặc hết tim (thua cuộc)
    if (currentQuestionIndex >= questions.length - 1 || lives <= 0) {
      get().endSessionEarly();
    } else {
      set({
        currentQuestionIndex: currentQuestionIndex + 1,
        selectedAnswer: null,
        isAnswerChecked: false,
        isCorrect: null,
        showConfetti: false
      });
    }
  },

  endSessionEarly: async () => {
    const { questions, currentQuestionIndex, lives, activeSession, starsEarned, sessionTimeStarted } = get();
    const currentChild = useAuthStore.getState().currentChild;

    if (!currentChild || !activeSession) return;

    set({ isLoading: true });

    try {
      const timeTakenTotal = Math.floor((Date.now() - sessionTimeStarted) / 1000);
      const isFailed = lives <= 0;
      const finalStatus = isFailed ? 'failed' : 'completed';

      // Tính tổng số câu đúng/sai thực tế đã hoàn thành
      const totalAttempted = get().isAnswerChecked ? currentQuestionIndex + 1 : currentQuestionIndex;
      const correctAnswers = get().correctCount;
      
      const wrongAnswers = Math.max(0, totalAttempted - correctAnswers);

      // 1. Tính điểm thưởng hoàn thành bài học (Session Rewards)
      const sessionRewards = ScoringEngine.calculateSessionRewards(
        correctAnswers, 
        questions.length, 
        lives
      );

      const finalStars = starsEarned + sessionRewards.starsEarned;

      // 2. Cập nhật phiên học trên Supabase
      const completedSession = await apiService.updateSession(activeSession.id, {
        status: finalStatus,
        total_questions: questions.length,
        correct_answers: correctAnswers,
        wrong_answers: wrongAnswers,
        stars_earned: finalStars,
        ended_at: new Date().toISOString()
      });

      // 3. Phân tích mở khóa danh hiệu (Reward Badges)
      const stats = await apiService.getStatistics(currentChild.id);
      const childBadges = await apiService.getChildrenBadges(currentChild.id);

      const newlyUnlockedBadges = RewardEngine.checkNewUnlockedBadges(
        childBadges,
        completedSession,
        stats,
        currentChild.streak_days,
        timeTakenTotal
      );

      // Lưu các huy hiệu mới mở khóa lên database
      for (const badge of newlyUnlockedBadges) {
        await apiService.unlockBadge(currentChild.id, badge.id);
      }

      // Cập nhật lại số sao và XP tích lũy cho bé trong Zustand Auth Store
      const levelBefore = currentChild.level;
      await useAuthStore.getState().updateChildStats(
        sessionRewards.totalXp, 
        sessionRewards.starsEarned, 
        true
      );

      // Cập nhật các chỉ số tổng hợp thống kê (Statistics)
      await apiService.refreshStatistics(currentChild.id);

      // Kiểm tra xem bé có thăng cấp (Level Up) không để chúc mừng
      const levelAfter = useAuthStore.getState().currentChild?.level || levelBefore;
      const didLevelUp = levelAfter > levelBefore;

      if (didLevelUp) {
        audioSynth.playLevelUp();
      } else if (newlyUnlockedBadges.length > 0) {
        audioSynth.playReward();
      }

      set({
        activeSession: completedSession,
        showLevelUp: didLevelUp,
        unlockedBadges: newlyUnlockedBadges,
        isLoading: false,
        lives // Đảm bảo giữ nguyên số mạng hiện tại
      });

    } catch (err) {
      console.error('Lỗi khi lưu kết quả bài học:', err);
      set({ isLoading: false });
    }
  },

  resetFlags: () => {
    set({ showLevelUp: false, unlockedBadges: [], showConfetti: false });
  }
}));
