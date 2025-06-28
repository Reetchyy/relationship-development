import express from 'express';
import { body, validationResult } from 'express-validator';
import { supabase } from '../config/supabase.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// Submit cultural quiz results
router.post('/quiz-results', [
  body('quizVersion').notEmpty().withMessage('Quiz version is required'),
  body('totalQuestions').isInt({ min: 1 }).withMessage('Total questions must be a positive integer'),
  body('correctAnswers').isInt({ min: 0 }).withMessage('Correct answers must be a non-negative integer'),
  body('scorePercentage').isFloat({ min: 0, max: 100 }).withMessage('Score percentage must be between 0 and 100'),
  body('categoryScores').isObject().withMessage('Category scores must be an object'),
  body('passed').isBoolean().withMessage('Passed must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const {
      quizVersion,
      totalQuestions,
      correctAnswers,
      scorePercentage,
      categoryScores,
      timeTakenSeconds,
      passed
    } = req.body;

    // Insert quiz results
    const { data, error } = await supabase
      .from('cultural_quiz_results')
      .insert({
        user_id: req.user.id,
        quiz_version: quizVersion,
        total_questions: totalQuestions,
        correct_answers: correctAnswers,
        score_percentage: scorePercentage,
        category_scores: categoryScores,
        time_taken_seconds: timeTakenSeconds,
        passed
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // If quiz passed, update profile verification status
    if (passed) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ is_verified: true })
        .eq('id', req.user.id);

      if (profileError) {
        logger.error(`Failed to update verification status: ${profileError.message}`);
      }
    }

    // Log activity
    await supabase
      .from('user_activities')
      .insert({
        user_id: req.user.id,
        activity_type: 'quiz_complete',
        metadata: {
          quiz_id: data.id,
          score: scorePercentage,
          passed
        }
      });

    logger.info(`Cultural quiz completed by user ${req.user.id}: ${scorePercentage}% (${passed ? 'PASSED' : 'FAILED'})`);

    res.status(201).json({
      message: 'Quiz results submitted successfully',
      results: data,
      verified: passed
    });

  } catch (error) {
    logger.error(`Submit quiz results error: ${error.message}`);
    res.status(500).json({
      error: 'Failed to submit quiz results'
    });
  }
});

// Get quiz questions (for future dynamic quiz implementation)
router.get('/quiz-questions', async (req, res) => {
  try {
    // For now, return static questions
    // In the future, this could be dynamic based on user's cultural background
    const questions = [
      {
        id: 1,
        category: 'west_african_traditions',
        question: "In Igbo culture, what is the significance of the kola nut ceremony?",
        options: [
          "It's purely decorative",
          "It's a way to welcome guests and show respect",
          "It's only used for religious ceremonies",
          "It's a form of payment"
        ],
        correctAnswer: 1,
        explanation: "The kola nut ceremony is a sacred tradition that welcomes guests and shows respect in Igbo culture."
      },
      {
        id: 2,
        category: 'philosophy_values',
        question: "What does 'Ubuntu' mean in South African philosophy?",
        options: [
          "Individual achievement",
          "I am because we are - interconnectedness of humanity",
          "Religious devotion",
          "Financial prosperity"
        ],
        correctAnswer: 1,
        explanation: "Ubuntu represents the belief in the interconnectedness of all people and collective humanity."
      },
      {
        id: 3,
        category: 'east_african_traditions',
        question: "In Ethiopian culture, what is the traditional coffee ceremony called?",
        options: [
          "Bunna",
          "Café",
          "Kahawa",
          "Buna"
        ],
        correctAnswer: 3,
        explanation: "The Ethiopian coffee ceremony 'Buna' is a traditional ritual that brings communities together."
      },
      {
        id: 4,
        category: 'cultural_practices',
        question: "What is the importance of naming ceremonies in many African cultures?",
        options: [
          "It's just a celebration",
          "It connects the child to ancestors and community identity",
          "It's required by law",
          "It determines the child's profession"
        ],
        correctAnswer: 1,
        explanation: "Naming ceremonies connect children to their ancestral heritage and establish their place in the community."
      },
      {
        id: 5,
        category: 'cultural_roles',
        question: "In West African culture, what role do griots traditionally play?",
        options: [
          "Only musicians",
          "Storytellers, historians, and keepers of oral tradition",
          "Religious leaders only",
          "Government officials"
        ],
        correctAnswer: 1,
        explanation: "Griots are the traditional storytellers and historians who preserve and share cultural knowledge through oral tradition."
      }
    ];

    res.json({
      questions,
      totalQuestions: questions.length,
      passingScore: 60
    });

  } catch (error) {
    logger.error(`Get quiz questions error: ${error.message}`);
    res.status(500).json({
      error: 'Failed to fetch quiz questions'
    });
  }
});

// Get user's quiz history
router.get('/quiz-history', async (req, res) => {
  try {
    const { data: quizResults, error } = await supabase
      .from('cultural_quiz_results')
      .select('*')
      .eq('user_id', req.user.id)
      .order('completed_at', { ascending: false });

    if (error) {
      throw error;
    }

    res.json({
      quizHistory: quizResults || [],
      totalAttempts: quizResults?.length || 0,
      bestScore: quizResults?.length > 0 ? Math.max(...quizResults.map(r => r.score_percentage)) : 0,
      isVerified: quizResults?.some(r => r.passed) || false
    });

  } catch (error) {
    logger.error(`Get quiz history error: ${error.message}`);
    res.status(500).json({
      error: 'Failed to fetch quiz history'
    });
  }
});

export default router;