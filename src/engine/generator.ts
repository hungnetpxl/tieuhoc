import type { MathQuestion, MathType, QuestionMode, DifficultyLevel } from '../types';
import { AntiRepeatFilter } from './antiRepeat';

// TẬP HỢP CÁC EMOJI ĐÁNG YÊU CHO PHÉP TÍNH TRỰC QUAN & STORY
const CUTE_EMOJIS = {
  apple: '🍎',
  banana: '🍌',
  orange: '🍊',
  candy: '🍬',
  cookie: '🍪',
  car: '🚗',
  cat: '🐱',
  dog: '🐶',
  bird: '🐦',
  fish: '🐟',
  star: '⭐',
  balloon: '🎈',
  bee: '🐝',
  flower: '🌸'
};

const VIETNAMESE_NAMES = ['An', 'Bình', 'Chi', 'Dũng', 'Minh', 'Nam', 'Hoa', 'Lan', 'Vy', 'Khang', 'Tú', 'Ngọc'];

export class QuestionGenerator {
  private antiRepeat: AntiRepeatFilter;

  constructor(antiRepeatWindow = 10) {
    this.antiRepeat = new AntiRepeatFilter(antiRepeatWindow);
  }

  /**
   * Sinh ngẫu nhiên một emoji từ danh sách
   */
  private getRandomEmoji(): { name: string; icon: string } {
    const keys = Object.keys(CUTE_EMOJIS) as Array<keyof typeof CUTE_EMOJIS>;
    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    // Tên tiếng Việt phù hợp cho Story
    const viNames: Record<string, string> = {
      apple: 'quả táo',
      banana: 'quả chuối',
      orange: 'quả cam',
      candy: 'viên kẹo',
      cookie: 'chiếc bánh',
      car: 'chiếc ô tô',
      cat: 'chú mèo',
      dog: 'chú cún',
      bird: 'chú chim',
      fish: 'chú cá',
      star: 'ngôi sao',
      balloon: 'quả bóng bay',
      bee: 'chú ong',
      flower: 'bông hoa'
    };
    return {
      name: viNames[randomKey],
      icon: CUTE_EMOJIS[randomKey]
    };
  }

  /**
   * Sinh đáp án nhiễu thông minh cho phép tính
   */
  private generateSmartOptions(correctAnswer: number, numA: number, numB: number, operator: string): number[] {
    const optionsSet = new Set<number>();
    optionsSet.add(correctAnswer);

    // Sinh các đáp án gây nhiễu gần đúng
    const candidateOffsets = [-1, 1, -2, 2, -3, 3, -5, 5, 10, -10];
    
    // Thêm các lỗi sai phổ biến của trẻ em:
    // 1. Bé nhầm phép cộng sang phép trừ hoặc ngược lại
    if (operator === '+') {
      const wrongOp = numA - numB;
      if (wrongOp >= 0) optionsSet.add(wrongOp);
    } else if (operator === '-') {
      optionsSet.add(numA + numB);
    } else if (operator === 'x') {
      optionsSet.add(numA + numB); // Bé nhầm phép nhân sang phép cộng
    }

    // 2. Bé ghi nhớ nhầm số hoặc đếm thiếu/thừa 1-2 đơn vị
    while (optionsSet.size < 4) {
      const offset = candidateOffsets[Math.floor(Math.random() * candidateOffsets.length)];
      const candidate = correctAnswer + offset;
      
      // Giới hạn câu trả lời cho trẻ lớp 1 là không âm và không quá lớn (dưới 110)
      if (candidate >= 0 && candidate !== correctAnswer && candidate <= 110) {
        optionsSet.add(candidate);
      }

      // Tránh lặp vô hạn, nếu không tìm được số phù hợp, sinh ngẫu nhiên
      if (optionsSet.size < 4 && Math.random() > 0.8) {
        const fallbackRandom = Math.max(0, correctAnswer + Math.floor(Math.random() * 7) - 3);
        if (fallbackRandom >= 0) {
          optionsSet.add(fallbackRandom);
        }
      }
    }

    // Chuyển set sang array và xáo trộn ngẫu nhiên
    return Array.from(optionsSet).sort(() => Math.random() - 0.5);
  }

  /**
   * Sinh một câu hỏi toán thông minh
   */
  public generateQuestion(
    mathTypes: MathType[],
    minNum: number,
    maxNum: number,
    mode: 'mixed' | QuestionMode = 'mixed',
    difficulty: DifficultyLevel = 'easy',
    forceType?: MathType,
    // Cho phép truyền đề bài bị sai của bé để ưu tiên sinh lại
    mistakePrompt?: { numA: number; numB: number; op: string; type: MathType }
  ): MathQuestion {
    let attempt = 0;
    let numberA = 0;
    let numberB = 0;
    let operator = '+';
    let selectedType: MathType = 'addition';
    let correctAnswer = 0;

    // Chọn ngẫu nhiên chế độ câu hỏi nếu là 'mixed', loại bỏ 'visual' và 'story' theo yêu cầu người dùng
    let finalMode: QuestionMode = mode === 'mixed' 
      ? (['basic', 'kumon'][Math.floor(Math.random() * 2)] as QuestionMode)
      : mode;

    if (finalMode === 'visual' || finalMode === 'story') {
      finalMode = Math.random() < 0.5 ? 'basic' : 'kumon';
    }

    // Chọn ngẫu nhiên phép toán từ danh sách cấu hình
    let finalMathTypes = mathTypes;
    if (finalMode === 'kumon') {
      finalMathTypes = mathTypes.filter(t => t === 'addition' || t === 'subtraction');
      if (finalMathTypes.length === 0) {
        finalMathTypes = ['addition', 'subtraction'];
      }
    }

    if (forceType && finalMathTypes.includes(forceType)) {
      selectedType = forceType;
    } else {
      selectedType = finalMathTypes[Math.floor(Math.random() * finalMathTypes.length)] || 'addition';
    }

    // Thiết lập toán tử tương ứng
    const operatorMap: Record<MathType, string> = {
      addition: '+',
      subtraction: '-',
      multiplication: 'x',
      division: '/'
    };
    operator = operatorMap[selectedType];

    while (attempt < 50) {
      if (mistakePrompt && attempt === 0 && finalMathTypes.includes(mistakePrompt.type)) {
        // Ưu tiên ôn tập câu hỏi bé đã sai trước đó
        numberA = mistakePrompt.numA;
        numberB = mistakePrompt.numB;
        selectedType = mistakePrompt.type;
        operator = mistakePrompt.op;
      } else {
        // Sinh số ngẫu nhiên theo cấu hình min/max
        numberA = Math.floor(Math.random() * (maxNum - minNum + 1)) + minNum;
        numberB = Math.floor(Math.random() * (maxNum - minNum + 1)) + minNum;
      }

      // Xử lý điều kiện sư phạm cho lớp 1:
      if (selectedType === 'addition') {
        if (maxNum <= 20) {
          // Tổng tối đa là 20, nên số thứ nhất phải nhỏ hơn 20 (tối đa 19 nếu minNum là 1)
          if (numberA >= 20) {
            numberA = Math.floor(Math.random() * 19) + 1;
          }
          if (numberA + numberB > 20) {
            numberB = Math.floor(Math.random() * (20 - numberA)) + 1;
          }
        }
        correctAnswer = numberA + numberB;
      } else if (selectedType === 'subtraction') {
        // Đảm bảo số bị trừ lớn hơn hoặc bằng số trừ để kết quả không âm
        if (numberA < numberB) {
          const temp = numberA;
          numberA = numberB;
          numberB = temp;
        }
        correctAnswer = numberA - numberB;
      } else if (selectedType === 'multiplication') {
        // Nhân lớp 1 chỉ nên ở mức đơn giản (Bảng nhân 2, 3, 5, hoặc nhân với 0, 1)
        // Giới hạn số nhân nhỏ hơn hoặc bằng 5
        numberA = Math.min(numberA, 5);
        numberB = Math.min(numberB, 5);
        // Tránh cả hai đều là 0 cho sinh động
        if (numberA === 0 && numberB === 0) numberA = 2;
        correctAnswer = numberA * numberB;
      } else if (selectedType === 'division') {
        // Chia hết cho trẻ em, số chia bé hơn hoặc bằng 5 và lớn hơn 0
        numberB = Math.max(1, Math.min(numberB, 5));
        // Đảm bảo chia hết bằng cách sinh ngược từ phép nhân
        const factor = Math.floor(Math.random() * 5) + 1; // 1 -> 5
        numberA = numberB * factor;
        correctAnswer = numberA / numberB;
      }

      // Kiểm tra bộ lọc chống trùng lặp (trừ khi quá nhiều lượt thử sẽ cho qua)
      if (!this.antiRepeat.hasBeenAsked(numberA, numberB, operator) || attempt > 30) {
        this.antiRepeat.recordQuestion(numberA, numberB, operator);
        break;
      }

      attempt++;
    }

    // finalMode đã được xác định từ đầu hàm

    // Thiết lập nội dung câu hỏi dựa trên chế độ
    let questionText = '';
    let questionVisual = '';
    let kumonStyle: 'vertical' | 'fill_blank' | 'chain' | undefined = undefined;
    let kumonBlankPosition: 'a' | 'b' | 'c' | undefined = undefined;
    let finalCorrectAnswer = correctAnswer;

    const item = this.getRandomEmoji();
    const name = VIETNAMESE_NAMES[Math.floor(Math.random() * VIETNAMESE_NAMES.length)];

    const checkMode = finalMode as QuestionMode;

    if (checkMode === 'basic') {
      questionText = `${numberA} ${operator} ${numberB} = ?`;
    } else if (checkMode === 'visual') {
      questionText = `Đếm xem có bao nhiêu ${item.name} nhé!`;
      
      const visualA = Array(numberA).fill(item.icon).join('');
      const visualB = Array(numberB).fill(item.icon).join('');

      if (operator === '+') {
        questionVisual = `${visualA}  ➕  ${visualB}`;
      } else if (operator === '-') {
        questionVisual = `${visualA}  ➖  ${visualB}`;
      } else if (operator === 'x') {
        questionVisual = Array(numberB).fill(`(${visualA})`).join(' ➕ ');
      } else if (operator === '/') {
        questionVisual = `${visualA}  ➗  ${numberB} nhóm`;
      }
    } else if (checkMode === 'story') {
      if (selectedType === 'addition') {
        questionText = `${name} có ${numberA} ${item.name} ${item.icon}. Mẹ cho thêm ${numberB} ${item.name} ${item.icon} nữa. Hỏi ${name} có tất cả mấy ${item.name}?`;
      } else if (selectedType === 'subtraction') {
        questionText = `${name} có ${numberA} ${item.name} ${item.icon}. ${name} ăn mất ${numberB} ${item.name} ${item.icon}. Hỏi ${name} còn lại mấy ${item.name}?`;
      } else if (selectedType === 'multiplication') {
        questionText = `Mỗi đĩa có ${numberA} ${item.name} ${item.icon}. Có tất cả ${numberB} đĩa như vậy. Hỏi có tổng cộng bao nhiêu ${item.name}?`;
      } else if (selectedType === 'division') {
        questionText = `${name} muốn chia đều ${numberA} ${item.name} ${item.icon} cho ${numberB} bạn. Hỏi mỗi bạn được mấy ${item.name}?`;
      }
    } else if (checkMode === 'kumon') {
      kumonStyle = 'fill_blank';
      kumonBlankPosition = 'c';
      questionText = '';
      questionVisual = '';
      finalCorrectAnswer = correctAnswer;
    }

    // Sinh các đáp án gây nhiễu thông minh dựa trên đáp án đúng
    let options: number[] = [];
    if (checkMode === 'kumon' && kumonStyle === 'fill_blank') {
      const blankPos = kumonBlankPosition as string;
      if (blankPos === 'a') {
        options = this.generateSmartOptions(numberA, numberA, numberB, operator);
      } else if (blankPos === 'b') {
        options = this.generateSmartOptions(numberB, numberA, numberB, operator);
      } else {
        options = this.generateSmartOptions(correctAnswer, numberA, numberB, operator);
      }
    } else {
      options = this.generateSmartOptions(finalCorrectAnswer, numberA, numberB, operator);
    }

    return {
      id: Math.random().toString(36).substring(2, 11),
      math_type: selectedType,
      number_a: numberA,
      number_b: numberB,
      operator,
      question_text: questionText,
      question_visual: questionVisual || undefined,
      correct_answer: finalCorrectAnswer,
      options,
      mode: finalMode,
      difficulty,
      kumon_style: kumonStyle,
      kumon_blank_position: kumonBlankPosition
    };
  }

  /**
   * Reset bộ chống lặp khi bắt đầu session mới
   */
  public resetHistory(): void {
    this.antiRepeat.reset();
  }
}
