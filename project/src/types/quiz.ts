export interface UserAnswer {
  questionId: number;
  selectedAnswer: number;
  timeSpent: number;
  isCorrect: boolean;
}

export interface QuizState {
  category: string | null;
  difficulty: string | null;
  currentQuestionIndex: number;
  answers: UserAnswer[];
  startTime: number;
  questionStartTime: number;
}

export interface QuizResult {
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  totalTimeSpent: number;
  answers: UserAnswer[];
  score: number;
}
