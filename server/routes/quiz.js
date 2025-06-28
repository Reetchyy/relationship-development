import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validate, schemas } from '../middleware/validation.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   POST /api/quiz/submit
 * @desc    Submit quiz results
 * @access  Private
 */
router.post('/submit',
  authenticateToken,
  validate(schemas.quizResult),
  asyncHandler(async (req, res) => {
    const {
      quiz_version = 'v1.0',
      total_questions,
      correct_answers,
      score_percentage,
      category_scores,
      time_taken_seconds
    } = req.body;

    // Check if user already has a quiz result
    const { data: existing } = await supabaseAdmin
      .from('cultural_quiz_results')
      .select('id, score_percentage')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Only allow retaking if previous score was below 60%
    if (existing && existing.score_percentage >= 60) {
      return res.status(409).json({
        error: 'You have already passed the cultural quiz',
        code: 'ALREADY_PASSED',
        previous_score: existing.score_percentage
      });
    }

    const { data: quizResult, error } = await supabaseAdmin
      .from('cultural_quiz_results')
      .insert({
        user_id: req.user.id,
        quiz_version,
        total_questions,
        correct_answers,
        score_percentage,
        category_scores,
        time_taken_seconds,
        passed: score_percentage >= 60
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({
        error: 'Failed to save quiz results',
        code: 'SAVE_ERROR'
      });
    }

    // If passed, update profile verification status
    if (score_percentage >= 60) {
      await supabaseAdmin
        .from('profiles')
        .update({ is_verified: true })
        .eq('id', req.user.id);

      // Log activity
      await supabaseAdmin
        .from('user_activities')
        .insert({
          user_id: req.user.id,
          activity_type: 'quiz_complete',
          metadata: { 
            score_percentage, 
            passed: true,
            quiz_version 
          }
        });
    }

    res.status(201).json({
      message: score_percentage >= 60 ? 'Quiz passed! Profile verified.' : 'Quiz completed. Please retake to pass.',
      quiz_result: quizResult,
      passed: score_percentage >= 60
    });
  })
);

/**
 * @route   GET /api/quiz/results
 * @desc    Get user's quiz results
 * @access  Private
 */
router.get('/results', authenticateToken, asyncHandler(async (req, res) => {
  const { data: results, error } = await supabaseAdmin
    .from('cultural_quiz_results')
    .select('*')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return res.status(500).json({
      error: 'Failed to fetch quiz results',
      code: 'FETCH_ERROR'
    });
  }

  res.json({
    results,
    latest: results[0] || null,
    has_passed: results.some(result => result.passed)
  });
}));

/**
 * @route   GET /api/quiz/questions
 * @desc    Get quiz questions (for development/testing)
 * @access  Private
 */
router.get('/questions', authenticateToken, asyncHandler(async (req, res) => {
  // This would typically come from a questions database table
  // For now, returning static questions
  const questions = [
    {
      id: 1,
      question: "In Igbo culture, what is the significance of the kola nut ceremony?",
      options: [
        "It's purely decorative",
        "It's a way to welcome guests and show respect",
        "It's only used for religious ceremonies",
        "It's a form of payment"
      ],
      category: "West African Traditions",
      difficulty: "medium"
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
      category: "Philosophy & Values",
      difficulty: "medium"
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
      category: "East African Traditions",
      difficulty: "easy"
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
      category: "Cultural Practices",
      difficulty: "medium"
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
      category: "Cultural Roles",
      difficulty: "hard"
    }
  ];

  res.json({
    questions: questions.map(q => ({
      id: q.id,
      question: q.question,
      options: q.options,
      category: q.category,
      difficulty: q.difficulty
    })),
    total: questions.length
  });
}));

export default router;