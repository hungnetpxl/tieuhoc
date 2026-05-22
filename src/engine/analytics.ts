import type { MathType, ChildStatistics, QuestionHistoryEntry } from '../types';

export class AnalyticsEngine {
  /**
   * Tính toán lại toàn bộ chỉ số thống kê tổng hợp dựa trên lịch sử làm bài chi tiết của bé
   * @param childId ID của bé
   * @param history Lịch sử chi tiết tất cả các câu đã trả lời từ trước đến nay
   * @param currentStats Thống kê hiện tại để lấy fallback nếu lịch sử rỗng
   */
  public static aggregateStatistics(
    childId: string,
    history: QuestionHistoryEntry[],
    currentStats?: ChildStatistics
  ): ChildStatistics {
    const totalQuestions = history.length;
    
    if (totalQuestions === 0) {
      return currentStats || {
        child_id: childId,
        total_sessions: 0,
        total_questions: 0,
        correct_count: 0,
        accuracy_rate: 0.0,
        avg_time_per_question: 0.0,
        strongest_topic: 'Chưa xác định',
        weakest_topic: 'Chưa xác định',
        updated_at: new Date().toISOString()
      };
    }

    const correctCount = history.filter(h => h.is_correct).length;
    const accuracyRate = parseFloat(((correctCount / totalQuestions) * 100).toFixed(1));
    
    // Tính thời gian trung bình
    const totalTime = history.reduce((sum, h) => sum + h.time_taken_seconds, 0);
    const avgTimePerQuestion = parseFloat((totalTime / totalQuestions).toFixed(1));

    // Đếm số lượng câu hỏi và tỷ lệ đúng theo từng loại phép toán
    const topicStats: Record<MathType, { total: number; correct: number }> = {
      addition: { total: 0, correct: 0 },
      subtraction: { total: 0, correct: 0 },
      multiplication: { total: 0, correct: 0 },
      division: { total: 0, correct: 0 }
    };

    history.forEach(h => {
      if (topicStats[h.math_type]) {
        topicStats[h.math_type].total++;
        if (h.is_correct) {
          topicStats[h.math_type].correct++;
        }
      }
    });

    // Xác định điểm mạnh & điểm yếu dựa trên tỷ lệ trả lời đúng
    let strongestTopic = 'Chưa xác định';
    let weakestTopic = 'Chưa xác định';
    let maxAccuracy = -1.0;
    let minAccuracy = 101.0;

    const translateTopic = (type: MathType): string => {
      const names: Record<MathType, string> = {
        addition: 'Phép Cộng ➕',
        subtraction: 'Phép Trừ ➖',
        multiplication: 'Phép Nhân ✖️',
        division: 'Phép Chia ➗'
      };
      return names[type];
    };

    (Object.keys(topicStats) as MathType[]).forEach(type => {
      const { total, correct } = topicStats[type];
      
      // Chỉ xét các dạng toán bé đã làm tối thiểu 3 câu để đảm bảo thống kê khách quan
      if (total >= 3) {
        const rate = (correct / total) * 100;
        
        if (rate > maxAccuracy) {
          maxAccuracy = rate;
          strongestTopic = translateTopic(type);
        }
        
        if (rate < minAccuracy) {
          minAccuracy = rate;
          weakestTopic = translateTopic(type);
        }
      }
    });

    // Điều kiện biên nếu các chủ đề bằng nhau hoặc chưa làm đủ 3 câu
    if (strongestTopic === 'Chưa xác định' && totalQuestions > 0) {
      // Xét dựa trên số lượng làm đúng nhiều nhất nếu không đạt threshold 3 câu
      let bestType: MathType = 'addition';
      let maxCorrect = -1;
      (Object.keys(topicStats) as MathType[]).forEach(type => {
        if (topicStats[type].correct > maxCorrect) {
          maxCorrect = topicStats[type].correct;
          bestType = type;
        }
      });
      strongestTopic = translateTopic(bestType);
    }

    if (weakestTopic === 'Chưa xác định' && totalQuestions > 0) {
      // Tìm phép tính có tỷ lệ đúng thấp nhất hoặc số lượng sai nhiều nhất
      let worstType: MathType = 'subtraction';
      let maxWrong = -1;
      (Object.keys(topicStats) as MathType[]).forEach(type => {
        const wrong = topicStats[type].total - topicStats[type].correct;
        if (wrong > maxWrong) {
          maxWrong = wrong;
          worstType = type;
        }
      });
      weakestTopic = translateTopic(worstType);
    }

    // Đếm số lượng phiên học duy nhất trong lịch sử
    const sessionIds = new Set(history.map(h => h.session_id));
    const totalSessions = sessionIds.size;

    return {
      child_id: childId,
      total_sessions: totalSessions,
      total_questions: totalQuestions,
      correct_count: correctCount,
      accuracy_rate: accuracyRate,
      avg_time_per_question: avgTimePerQuestion,
      strongest_topic: strongestTopic,
      weakest_topic: weakestTopic,
      updated_at: new Date().toISOString()
    };
  }
}
