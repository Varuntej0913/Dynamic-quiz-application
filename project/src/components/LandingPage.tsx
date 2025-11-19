import { BookOpen, Cpu, Globe, Microscope } from 'lucide-react';
import { categories } from '../data/quizData';

interface LandingPageProps {
  onStartQuiz: (category: string, difficulty: string) => void;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Microscope,
  BookOpen,
  Globe,
  Cpu,
};

export default function LandingPage({ onStartQuiz }: LandingPageProps) {
  const difficulties = ['easy', 'medium', 'hard'];

  const handleCategorySelect = (categoryId: string, difficulty: string) => {
    onStartQuiz(categoryId, difficulty);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-800 mb-4">Quiz Master</h1>
          <p className="text-xl text-gray-600">Test your knowledge across multiple categories</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {categories.map((category) => {
            const IconComponent = iconMap[category.icon];

            return (
              <div
                key={category.id}
                className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-shadow"
              >
                <div className="flex items-center mb-6">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                    <IconComponent className="w-8 h-8 text-blue-600" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-800">{category.name}</h2>
                </div>

                <p className="text-gray-600 mb-6">
                  Choose your difficulty level and start the quiz
                </p>

                <div className="space-y-3">
                  {difficulties.map((difficulty) => (
                    <button
                      key={difficulty}
                      onClick={() => handleCategorySelect(category.id, difficulty)}
                      className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition-all transform hover:scale-105 ${
                        difficulty === 'easy'
                          ? 'bg-green-500 hover:bg-green-600'
                          : difficulty === 'medium'
                          ? 'bg-yellow-500 hover:bg-yellow-600'
                          : 'bg-red-500 hover:bg-red-600'
                      }`}
                      id={`start-quiz-${category.id}-${difficulty}`}
                    >
                      {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} Level
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
