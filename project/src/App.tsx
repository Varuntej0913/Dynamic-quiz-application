import { useState } from 'react';
import LandingPage from './components/LandingPage';
import QuizPage from './components/QuizPage';
import ResultPage from './components/ResultPage';
import { questions } from './data/quizData';
import { UserAnswer } from './types/quiz';
import { Question } from './data/quizData';

type AppState = 'landing' | 'quiz' | 'results';

function App() {
  const [appState, setAppState] = useState<AppState>('landing');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<Question[]>([]);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [totalTime, setTotalTime] = useState(0);

  const handleStartQuiz = (category: string, difficulty: string) => {
    setSelectedCategory(category);
    setSelectedDifficulty(difficulty);

    const filteredQuestions = questions.filter(
      (q) => q.category === category && q.difficulty === difficulty
    );

    setQuizQuestions(filteredQuestions);
    setAppState('quiz');
  };

  const handleQuizComplete = (answers: UserAnswer[], time: number) => {
    setUserAnswers(answers);
    setTotalTime(time);
    setAppState('results');
  };

  const handleReturnHome = () => {
    setAppState('landing');
    setSelectedCategory(null);
    setSelectedDifficulty(null);
    setQuizQuestions([]);
    setUserAnswers([]);
    setTotalTime(0);
  };

  return (
    <>
      {appState === 'landing' && <LandingPage onStartQuiz={handleStartQuiz} />}
      {appState === 'quiz' && (
        <QuizPage questions={quizQuestions} onQuizComplete={handleQuizComplete} />
      )}
      {appState === 'results' && (
        <ResultPage
          answers={userAnswers}
          questions={quizQuestions}
          totalTime={totalTime}
          onReturnHome={handleReturnHome}
        />
      )}
    </>
  );
}

export default App;
