import { Trophy, Clock, CheckCircle, XCircle, Home, BarChart3 } from 'lucide-react';
import { UserAnswer } from '../types/quiz';
import { Question } from '../data/quizData';

interface ResultPageProps {
  answers: UserAnswer[];
  questions: Question[];
  totalTime: number;
  onReturnHome: () => void;
}

export default function ResultPage({
  answers,
  questions,
  totalTime,
  onReturnHome,
}: ResultPageProps) {
  const correctAnswers = answers.filter((a) => a.isCorrect).length;
  const incorrectAnswers = answers.length - correctAnswers;
  const score = Math.round((correctAnswers / questions.length) * 100);
  const avgTimePerQuestion = Math.round(totalTime / questions.length);

  const maxTime = Math.max(...answers.map((a) => a.timeSpent));

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="text-center mb-8">
            <div className="inline-block p-6 bg-yellow-100 rounded-full mb-4">
              <Trophy className="w-16 h-16 text-yellow-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Quiz Completed!</h1>
            <p className="text-xl text-gray-600">Here's how you performed</p>
          </div>

          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <span className="text-blue-100">Score</span>
                <BarChart3 className="w-6 h-6 text-blue-200" />
              </div>
              <div className="text-4xl font-bold" id="final-score">{score}%</div>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <span className="text-green-100">Correct</span>
                <CheckCircle className="w-6 h-6 text-green-200" />
              </div>
              <div className="text-4xl font-bold" id="correct-count">{correctAnswers}</div>
            </div>

            <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <span className="text-red-100">Incorrect</span>
                <XCircle className="w-6 h-6 text-red-200" />
              </div>
              <div className="text-4xl font-bold" id="incorrect-count">{incorrectAnswers}</div>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <span className="text-purple-100">Total Time</span>
                <Clock className="w-6 h-6 text-purple-200" />
              </div>
              <div className="text-4xl font-bold">{totalTime}s</div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Performance Chart</h2>
            <div className="bg-gray-50 rounded-xl p-6">
              <div className="flex items-end justify-between h-64 gap-2">
                <div className="flex-1 flex flex-col items-center">
                  <div className="w-full bg-green-500 rounded-t-lg transition-all" style={{ height: `${(correctAnswers / questions.length) * 100}%` }}></div>
                  <div className="mt-2 text-sm font-semibold text-gray-700">Correct</div>
                  <div className="text-2xl font-bold text-green-600">{correctAnswers}</div>
                </div>
                <div className="flex-1 flex flex-col items-center">
                  <div className="w-full bg-red-500 rounded-t-lg transition-all" style={{ height: `${(incorrectAnswers / questions.length) * 100}%` }}></div>
                  <div className="mt-2 text-sm font-semibold text-gray-700">Incorrect</div>
                  <div className="text-2xl font-bold text-red-600">{incorrectAnswers}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Time Spent Per Question</h2>
            <div className="bg-gray-50 rounded-xl p-6">
              <div className="space-y-4">
                {answers.map((answer, index) => {
                  const question = questions.find((q) => q.id === answer.questionId);
                  const percentage = (answer.timeSpent / maxTime) * 100;

                  return (
                    <div key={answer.questionId} className="flex items-center gap-4">
                      <div className="w-20 text-sm font-semibold text-gray-700">
                        Q{index + 1}
                      </div>
                      <div className="flex-1 bg-gray-200 rounded-full h-8 relative overflow-hidden">
                        <div
                          className={`h-full ${answer.isCorrect ? 'bg-green-500' : 'bg-red-500'} transition-all rounded-full`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                        <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-gray-800">
                          {answer.timeSpent}s
                        </div>
                      </div>
                      <div className="w-8">
                        {answer.isCorrect ? (
                          <CheckCircle className="w-6 h-6 text-green-600" />
                        ) : (
                          <XCircle className="w-6 h-6 text-red-600" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Detailed Results</h2>
            <div className="space-y-4">
              {answers.map((answer, index) => {
                const question = questions.find((q) => q.id === answer.questionId);
                if (!question) return null;

                return (
                  <div
                    key={answer.questionId}
                    className={`border-2 rounded-xl p-6 ${
                      answer.isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-bold text-gray-700">Question {index + 1}</span>
                          {answer.isCorrect ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-600" />
                          )}
                        </div>
                        <p className="text-gray-800 font-medium mb-4">{question.question}</p>
                      </div>
                      <div className="text-sm text-gray-600 flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {answer.timeSpent}s
                      </div>
                    </div>

                    <div className="space-y-2">
                      {question.options.map((option, optIndex) => (
                        <div
                          key={optIndex}
                          className={`p-3 rounded-lg ${
                            optIndex === question.correctAnswer
                              ? 'bg-green-200 border-2 border-green-400'
                              : optIndex === answer.selectedAnswer && !answer.isCorrect
                              ? 'bg-red-200 border-2 border-red-400'
                              : 'bg-white'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span>{option}</span>
                            {optIndex === question.correctAnswer && (
                              <span className="text-sm font-semibold text-green-700">Correct Answer</span>
                            )}
                            {optIndex === answer.selectedAnswer && !answer.isCorrect && (
                              <span className="text-sm font-semibold text-red-700">Your Answer</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={onReturnHome}
              className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all transform hover:scale-105"
              id="return-home-button"
            >
              <Home className="w-5 h-5" />
              Return to Home
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Performance Insights</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-blue-50 rounded-xl">
              <div className="text-3xl font-bold text-blue-600 mb-2">{avgTimePerQuestion}s</div>
              <div className="text-sm text-gray-600">Average Time Per Question</div>
            </div>
            <div className="text-center p-6 bg-green-50 rounded-xl">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {Math.round((correctAnswers / questions.length) * 100)}%
              </div>
              <div className="text-sm text-gray-600">Accuracy Rate</div>
            </div>
            <div className="text-center p-6 bg-purple-50 rounded-xl">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {questions.length}
              </div>
              <div className="text-sm text-gray-600">Total Questions</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
