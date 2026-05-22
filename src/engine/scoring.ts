export interface ScoreResult {
  baseXp: number;
  bonusXp: number;
  starsEarned: number;
  totalXp: number;
}

export class ScoringEngine {
  /**
   * Tính toán điểm số và ngôi sao nhận được cho một câu trả lời đúng
   * @param streak Chuỗi trả lời đúng liên tiếp hiện tại (trước khi tính câu này)
   * @param timeTakenSeconds Thời gian trả lời câu hỏi bằng giây
   * @param questionMode Chế độ câu hỏi (basic, visual, story, kumon)
   */
  public static calculateQuestionScore(
    streak: number,
    timeTakenSeconds: number,
    questionMode: 'basic' | 'visual' | 'story' | 'kumon'
  ): { xp: number; stars: number; isCombo: boolean; isSpeedy: boolean } {
    let xp = 10; // Điểm kinh nghiệm cơ bản cho mỗi câu đúng
    let stars = 1; // Số sao cơ bản
    let isCombo = false;
    let isSpeedy = false;

    // 1. Thưởng Combo Streak (Bắt đầu từ chuỗi 3 câu đúng trở lên)
    if (streak >= 8) {
      xp += 10;
      stars += 2;
      isCombo = true;
    } else if (streak >= 5) {
      xp += 5;
      stars += 1;
      isCombo = true;
    } else if (streak >= 3) {
      xp += 2;
      isCombo = true;
    }

    // 2. Thưởng tốc độ (Trả lời nhanh xuất sắc)
    // Chế độ cơ bản: < 4 giây, Trực quan & Kumon: < 6 giây, Story đọc hiểu: < 10 giây
    const speedThresholds = {
      basic: 4,
      visual: 6,
      kumon: 6,
      story: 10
    };

    const threshold = speedThresholds[questionMode] || 5;
    if (timeTakenSeconds <= threshold) {
      xp += 3;
      isSpeedy = true;
    }

    return {
      xp,
      stars,
      isCombo,
      isSpeedy
    };
  }

  /**
   * Tính toán điểm thưởng khi hoàn thành toàn bộ bài học (Session)
   * @param correctAnswers Số câu trả lời đúng
   * @param totalQuestions Tổng số câu hỏi
   * @param remainingLives Số tim còn lại (❤️)
   */
  public static calculateSessionRewards(
    correctAnswers: number,
    totalQuestions: number,
    remainingLives: number
  ): ScoreResult {
    const baseXp = correctAnswers * 10;
    let bonusXp = 0;
    let starsEarned = correctAnswers * 1; // 1 sao mỗi câu đúng

    // Bé đạt điểm tuyệt đối 10/10
    if (correctAnswers === totalQuestions) {
      bonusXp += 50; // Thưởng 50 XP
      starsEarned += 10; // Thưởng 10 sao
    } else if (correctAnswers >= totalQuestions * 0.8) {
      // Bé làm đúng trên 80%
      bonusXp += 20;
      starsEarned += 3;
    }

    // Thưởng giữ mạng (Giữ tim ❤️) - Chỉ cộng nếu bé làm đúng ít nhất 1 câu
    if (correctAnswers > 0) {
      if (remainingLives === 5) {
        bonusXp += 20; // Giữ nguyên 5 tim được thưởng thêm 20 XP
        starsEarned += 5; // và 5 sao
      } else if (remainingLives > 0) {
        bonusXp += remainingLives * 2; // Mỗi tim còn lại được 2 XP
      }
    }

    return {
      baseXp,
      bonusXp,
      starsEarned,
      totalXp: baseXp + bonusXp
    };
  }
}
