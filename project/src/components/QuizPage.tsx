import { useEffect, useState } from 'react';
import { Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { Question } from '../data/quizData';
import { UserAnswer } from '../types/quiz';

interface QuizPageProps {
  questions: Question[];
  onQuizComplete: (answers: UserAnswer[], totalTime: number) => void;
}

export default function QuizPage({ questions, onQuizComplete }: QuizPageProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answers, setAnswers] = useState<UserAnswer[]>([]);
  const [timeLeft, setTimeLeft] = useState(30);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [quizStartTime] = useState(Date.now());
  const [isAnswered, setIsAnswered] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;

  useEffect(() => {
    setTimeLeft(30);
    setSelectedAnswer(null);
    setQuestionStartTime(Date.now());
    setIsAnswered(false);

    const existingAnswer = answers.find(
      (a) => a.questionId === currentQuestion.id
    );
    if (existingAnswer) {
      setSelectedAnswer(existingAnswer.selectedAnswer);
      setIsAnswered(true);
    }
  }, [currentQuestionIndex]);

  useEffect(() => {
    if (timeLeft <= 0 && !isAnswered) {
      handleTimeout();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isAnswered]);

  const handleTimeout = () => {
    if (isAnswered) return;

    const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);
    const answer: UserAnswer = {
      questionId: currentQuestion.id,
      selectedAnswer: -1,
      timeSpent,
      isCorrect: false,
    };

    const newAnswers = [...answers.filter((a) => a.questionId !== currentQuestion.id), answer];
    setAnswers(newAnswers);
    setIsAnswered(true);

    if (currentQuestionIndex < totalQuestions - 1) {
      setTimeout(() => {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      }, 1000);
    } else {
      setTimeout(() => {
        const totalTime = Math.floor((Date.now() - quizStartTime) / 1000);
        onQuizComplete(newAnswers, totalTime);
      }, 1000);
    }
  };

  const handleAnswerSelect = (answerIndex: number) => {
    if (isAnswered) return;

    setSelectedAnswer(answerIndex);
    const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);
    const isCorrect = answerIndex === currentQuestion.correctAnswer;

    const answer: UserAnswer = {
      questionId: currentQuestion.id,
      selectedAnswer: answerIndex,
      timeSpent,
      isCorrect,
    };

    const newAnswers = [...answers.filter((a) => a.questionId !== currentQuestion.id), answer];
    setAnswers(newAnswers);
    setIsAnswered(true);
  };

  const handleNext = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = () => {
    const totalTime = Math.floor((Date.now() - quizStartTime) / 1000);
    onQuizComplete(answers, totalTime);
  };

  const allQuestionsAnswered = answers.length === totalQuestions;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex justify-between items-center mb-8">
            <div className="text-sm font-semibold text-gray-600">
              Question {currentQuestionIndex + 1} of {totalQuestions}
            </div>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              timeLeft <= 10 ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
            }`}>
              <Clock className="w-5 h-5" />
              <span className="font-bold text-lg">{timeLeft}s</span>
            </div>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-3 mb-8">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
            />
          </div>

          <h2 className="text-2xl font-bold text-gray-800 mb-8" id="question-text">
            {currentQuestion.question}
          </h2>

          <div className="space-y-4 mb-8">
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswerSelect(index)}
                disabled={isAnswered}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                  selectedAnswer === index
                    ? isAnswered
                      ? index === currentQuestion.correctAnswer
                        ? 'border-green-500 bg-green-50'
                        : 'border-red-500 bg-red-50'
                      : 'border-blue-500 bg-blue-50'
                    : isAnswered && index === currentQuestion.correctAnswer
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                } ${isAnswered ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                id={`option-${index}`}
              >
                <div className="flex items-center">
                  <span className="w-8 h-8 rounded-full border-2 flex items-center justify-center mr-4 font-semibold">
                    {index + 1}
                  </span>
                  <span className="font-medium">{option}</span>
                </div>
              </button>
            ))}
          </div>

          <div className="flex justify-between items-center">
            <button
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              className="flex items-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              id="previous-button"
            >
              <ChevronLeft className="w-5 h-5" />
              Previous
            </button>

            <div className="flex gap-2">
              {questions.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentQuestionIndex(index)}
                  className={`w-10 h-10 rounded-full font-semibold ${
                    index === currentQuestionIndex
                      ? 'bg-blue-600 text-white'
                      : answers.some((a) => a.questionId === questions[index].id)
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>

            {currentQuestionIndex < totalQuestions - 1 ? (
              <button
                onClick={handleNext}
                disabled={!isAnswered}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                id="next-button"
              >
                Next
                <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!allQuestionsAnswered}
                className="px-8 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                id="submit-button"
              >
                Submit Quiz
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
