import type { MathType, DifficultyLevel, ChildMistake, ChildProfile, GameSettings } from '../types';

export class AdaptiveLearningEngine {
  /**
   * Tính toán cấu hình học tối ưu cho bé dựa trên cấp độ và lịch sử lỗi sai.
   * @param childProfile Hồ sơ của bé hiện tại
   * @param recentMistakes Lịch sử các câu trả lời sai của bé
   * @param preferredMathTypes Phép toán được chọn (hoặc tự chọn nếu để trống)
   */
  public static calculateSettings(
    childProfile: ChildProfile,
    recentMistakes: ChildMistake[],
    preferredMathTypes?: MathType[]
  ): GameSettings {
    const level = childProfile.level;
    let minNumber = 1;
    let maxNumber = 20;
    let mode: 'mixed' | 'visual' | 'story' | 'basic' | 'kumon' = 'mixed';
    let questionCount = 10;
    let timeLimit = level > 10 ? 300 : 0;

    // 1. Phân cấp độ khó của đề dựa trên Cấp độ (Level) của bé: Luôn luôn giới hạn 1 - 20 theo yêu cầu người dùng
    minNumber = 1;
    maxNumber = 20;
    mode = 'mixed';

    // Tải cấu hình riêng biệt từ phụ huynh nếu có
    const savedConfigKey = `dt_custom_settings_${childProfile.id}`;
    const savedConfigStr = localStorage.getItem(savedConfigKey);
    if (savedConfigStr) {
      try {
        const savedConfig = JSON.parse(savedConfigStr);
        if (savedConfig.minNumber !== undefined) minNumber = Math.max(1, savedConfig.minNumber);
        if (savedConfig.maxNumber !== undefined) maxNumber = Math.min(20, savedConfig.maxNumber);
        if (savedConfig.questionCount !== undefined) questionCount = savedConfig.questionCount;
        if (savedConfig.timeLimit !== undefined) timeLimit = savedConfig.timeLimit;
      } catch (err) {
        console.error('Lỗi khi đọc cấu hình tùy chỉnh của phụ huynh:', err);
      }
    }

    // 2. Tự động xác định các phép toán cần học nếu bé không chọn thủ công
    let mathTypes: MathType[] = preferredMathTypes && preferredMathTypes.length > 0
      ? preferredMathTypes.filter(t => t === 'addition' || t === 'subtraction')
      : ['addition', 'subtraction']; // Mặc định là phép cộng và phép trừ cho lớp 1

    if (mathTypes.length === 0) {
      mathTypes = ['addition', 'subtraction'];
    }

    // 3. Phân tích lỗi sai để tăng cường ôn tập (Ưu tiên dạng toán yếu)
    const activeMistakes = recentMistakes.filter(m => !m.last_attempt_correct && m.wrong_count > 0);
    
    if (activeMistakes.length > 0 && (!preferredMathTypes || preferredMathTypes.length === 0)) {
      // Tính toán tần suất lỗi sai theo loại phép toán
      const mistakeCounts: Record<MathType, number> = {
        addition: 0,
        subtraction: 0,
        multiplication: 0,
        division: 0
      };

      activeMistakes.forEach(m => {
        if (mistakeCounts[m.math_type] !== undefined) {
          mistakeCounts[m.math_type] += m.wrong_count;
        }
      });

      // Tìm phép tính sai nhiều nhất
      let worstMathType: MathType | null = null;
      let maxWrong = 0;
      (Object.keys(mistakeCounts) as MathType[]).forEach(type => {
        if (mistakeCounts[type] > maxWrong) {
          maxWrong = mistakeCounts[type];
          worstMathType = type;
        }
      });

      // Nếu tìm thấy dạng toán bé yếu nhất và phép tính đó nằm trong danh sách được phép
      if (worstMathType && mathTypes.includes(worstMathType)) {
        // Tăng tỉ lệ bằng cách chèn phép toán đó thêm vào mảng random lựa chọn
        mathTypes.push(worstMathType);
        mathTypes.push(worstMathType); // Nhân đôi/nhân ba xác suất sinh đề dạng này
      }
    }

    return {
      minNumber,
      maxNumber,
      questionCount,
      timeLimit,
      mathTypes,
      mode
    };
  }

  /**
   * Cập nhật chỉ số thích ứng dựa trên kết quả làm bài của bé ngay trong phiên học
   * @param currentDifficulty Cấp độ khó hiện tại
   * @param currentStreak Chuỗi làm đúng liên tiếp hiện tại
   * @param wrongStreak Chuỗi làm sai liên tiếp hiện tại
   * @returns Cấp độ khó mới điều chỉnh
   */
  public static adjustDifficultyDuringSession(
    currentDifficulty: DifficultyLevel,
    currentStreak: number,
    wrongStreak: number
  ): DifficultyLevel {
    // Nếu bé đúng liên tiếp 3 câu: tăng cấp độ khó lên 1 nấc
    if (currentStreak >= 3) {
      if (currentDifficulty === 'easy') return 'medium';
      if (currentDifficulty === 'medium') return 'hard';
    }

    // Nếu bé làm sai liên tiếp 2 câu: giảm cấp độ khó xuống 1 nấc để giữ tinh thần cho bé
    if (wrongStreak >= 2) {
      if (currentDifficulty === 'hard') return 'medium';
      if (currentDifficulty === 'medium') return 'easy';
    }

    return currentDifficulty;
  }
}
