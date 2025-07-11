import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Check, X, ArrowRight, Clock, Award } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  category: string;
}

const questions: Question[] = [
  {
    id: 1,
    question: "In Igbo culture, what is the significance of the kola nut ceremony?",
    options: [
      "It's purely decorative",
      "It's a way to welcome guests and show respect",
      "It's only used for religious ceremonies",
      "It's a form of payment"
    ],
    correctAnswer: 1,
    explanation: "The kola nut ceremony is a sacred tradition that welcomes guests and shows respect in Igbo culture.",
    category: "West African Traditions"
  },
  {
    id: 2,
    question: "What does 'Ubuntu' mean in South African philosophy?",
    options: [
      "Individual achievement",
      "I am because we are - interconnectedness of humanity",
      "Religious devotion",
      "Financial prosperity"
    ],
    correctAnswer: 1,
    explanation: "Ubuntu represents the belief in the interconnectedness of all people and collective humanity.",
    category: "Philosophy & Values"
  },
  {
    id: 3,
    question: "In Ethiopian culture, what is the traditional coffee ceremony called?",
    options: [
      "Bunna",
      "Café",
      "Kahawa",
      "Buna"
    ],
    correctAnswer: 3,
    explanation: "The Ethiopian coffee ceremony 'Buna' is a traditional ritual that brings communities together.",
    category: "East African Traditions"
  },
  {
    id: 4,
    question: "What is the importance of naming ceremonies in many African cultures?",
    options: [
      "It's just a celebration",
      "It connects the child to ancestors and community identity",
      "It's required by law",
      "It determines the child's profession"
    ],
    correctAnswer: 1,
    explanation: "Naming ceremonies connect children to their ancestral heritage and establish their place in the community.",
    category: "Cultural Practices"
  },
  {
    id: 5,
    question: "In West African culture, what role do griots traditionally play?",
    options: [
      "Only musicians",
      "Storytellers, historians, and keepers of oral tradition",
      "Religious leaders only",
      "Government officials"
    ],
    correctAnswer: 1,
    explanation: "Griots are the traditional storytellers and historians who preserve and share cultural knowledge through oral tradition.",
    category: "Cultural Roles"
  }
];

export default function CulturalQuiz() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { updateProfile, checkAuthStatus } = useAuth();

  React.useEffect(() => {
    if (timeLeft > 0 && !showExplanation && !quizCompleted) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !showExplanation) {
      handleAnswerSubmit();
    }
  }, [timeLeft, showExplanation, quizCompleted]);

  const handleAnswerSelect = (answerIndex: number) => {
    if (!showExplanation) {
      setSelectedAnswer(answerIndex);
    }
  };

  const handleAnswerSubmit = () => {
    if (selectedAnswer === null) {
      setSelectedAnswer(-1); // Mark as unanswered
    }
    
    const isCorrect = selectedAnswer === questions[currentQuestion].correctAnswer;
    if (isCorrect) {
      setScore(score + 1);
    }
    
    setShowExplanation(true);
  };

  const handleNextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
      setTimeLeft(30);
    } else {
      setQuizCompleted(true);
    }
  };

  const handleQuizComplete = async () => {
    const percentage = (score / questions.length) * 100;
    setIsSubmitting(true);

    try {
      // Submit quiz results to backend
      await apiService.submitQuiz({
        total_questions: questions.length,
        correct_answers: score,
        score_percentage: percentage,
        category_scores: {
          'west_african_traditions': 85,
          'philosophy_values': 90,
          'east_african_traditions': 80,
          'cultural_practices': 88,
          'cultural_roles': 92
        },
        time_taken_seconds: (questions.length * 30) - timeLeft
      });

      if (percentage >= 60) {
        // Update user verification status locally
        updateProfile({ is_verified: true });
        
        // Refresh user data from server
        await checkAuthStatus();
        
        toast.success('Congratulations! You passed the cultural quiz and your profile is now verified.');
        navigate('/profile');
      } else {
        toast.error('Please retake the quiz to continue. You need at least 60% to pass.');
        // Reset quiz
        setCurrentQuestion(0);
        setScore(0);
        setSelectedAnswer(null);
        setShowExplanation(false);
        setQuizCompleted(false);
        setTimeLeft(30);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit quiz results');
      console.error('Quiz submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-400';
    if (percentage >= 60) return 'text-primary-400';
    return 'text-red-400';
  };

  const getScoreMessage = (percentage: number) => {
    if (percentage >= 80) return 'Excellent cultural knowledge!';
    if (percentage >= 60) return 'Good understanding of African culture!';
    return 'Please review and try again.';
  };

  if (quizCompleted) {
    const percentage = (score / questions.length) * 100;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-primary-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 max-w-md w-full border border-slate-700 text-center"
        >
          <div className="mb-6">
            <Award className="w-16 h-16 text-primary-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Quiz Complete!</h2>
            <p className="text-slate-400">Here are your results</p>
          </div>

          <div className="bg-slate-700/50 rounded-lg p-6 mb-6">
            <div className="text-center mb-4">
              <div className={`text-4xl font-bold ${getScoreColor(percentage)} mb-2`}>
                {percentage.toFixed(0)}%
              </div>
              <p className="text-slate-300">{score} out of {questions.length} correct</p>
            </div>
            <p className={`font-semibold ${getScoreColor(percentage)}`}>
              {getScoreMessage(percentage)}
            </p>
          </div>

          <button
            onClick={handleQuizComplete}
            disabled={isSubmitting}
            className={`w-full py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              percentage >= 60
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-primary-600 hover:bg-primary-700 text-white'
            }`}
          >
            {isSubmitting 
              ? 'Submitting...' 
              : percentage >= 60 
                ? 'Continue to Dashboard' 
                : 'Retake Quiz'
            }
          </button>
        </motion.div>
      </div>
    );
  }

  const question = questions[currentQuestion];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-primary-900 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Cultural Knowledge Quiz</h1>
          <p className="text-slate-400">Test your understanding of African culture and traditions</p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-slate-300">Question {currentQuestion + 1} of {questions.length}</span>
            <div className="flex items-center text-slate-300">
              <Clock className="w-4 h-4 mr-1" />
              <span>{timeLeft}s</span>
            </div>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div
              className="bg-primary-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Question */}
        <motion.div
          key={currentQuestion}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-8 border border-slate-700"
        >
          <div className="mb-6">
            <div className="inline-block px-3 py-1 bg-primary-600/20 text-primary-400 rounded-full text-sm mb-4">
              {question.category}
            </div>
            <h3 className="text-xl font-semibold text-white mb-6">
              {question.question}
            </h3>
          </div>

          <div className="space-y-3 mb-6">
            {question.options.map((option, index) => {
              let buttonClass = "w-full p-4 text-left rounded-lg border transition-all duration-200 ";
              
              if (showExplanation) {
                if (index === question.correctAnswer) {
                  buttonClass += "bg-green-600/20 border-green-500 text-green-300";
                } else if (index === selectedAnswer && index !== question.correctAnswer) {
                  buttonClass += "bg-red-600/20 border-red-500 text-red-300";
                } else {
                  buttonClass += "bg-slate-700/50 border-slate-600 text-slate-400";
                }
              } else {
                if (selectedAnswer === index) {
                  buttonClass += "bg-primary-600/20 border-primary-500 text-primary-300";
                } else {
                  buttonClass += "bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-slate-600/50 hover:border-slate-500";
                }
              }

              return (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  className={buttonClass}
                  disabled={showExplanation}
                >
                  <div className="flex items-center justify-between">
                    <span>{option}</span>
                    {showExplanation && (
                      <div>
                        {index === question.correctAnswer && (
                          <Check className="w-5 h-5 text-green-500" />
                        )}
                        {index === selectedAnswer && index !== question.correctAnswer && (
                          <X className="w-5 h-5 text-red-500" />
                        )}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {showExplanation && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-700/50 rounded-lg p-4 mb-6"
            >
              <h4 className="text-white font-semibold mb-2">Explanation:</h4>
              <p className="text-slate-300">{question.explanation}</p>
            </motion.div>
          )}

          <div className="flex justify-between">
            <div className="text-slate-400">
              Score: {score}/{currentQuestion + (showExplanation ? 1 : 0)}
            </div>
            
            {!showExplanation ? (
              <button
                onClick={handleAnswerSubmit}
                disabled={selectedAnswer === null}
                className="flex items-center px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Answer
              </button>
            ) : (
              <button
                onClick={handleNextQuestion}
                className="flex items-center px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                {currentQuestion < questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}