import Joi from 'joi';

/**
 * Validation middleware factory
 */
export const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));
      
      return res.status(400).json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: errors,
      });
    }
    
    next();
  };
};

// Common validation schemas
export const schemas = {
  // Profile validation - made first_name and last_name optional for updates
  profile: Joi.object({
    first_name: Joi.string().min(2).max(50).optional(),
    last_name: Joi.string().min(2).max(50).optional(),
    date_of_birth: Joi.date().max('now').optional(),
    gender: Joi.string().valid('male', 'female', 'non-binary', 'other').optional(),
    location_city: Joi.string().min(2).max(100).optional(),
    location_country: Joi.string().min(2).max(100).optional(),
    occupation: Joi.string().max(100).optional(),
    education_level: Joi.string().max(100).optional(),
    bio: Joi.string().max(1000).optional(),
  }),

  // Cultural background validation
  culturalBackground: Joi.object({
    primary_tribe: Joi.string().min(2).max(50).optional(),
    secondary_tribes: Joi.array().items(Joi.string().max(50)).optional(),
    birth_country: Joi.string().min(2).max(100).optional(),
    languages_spoken: Joi.array().items(Joi.string().max(50)).optional(),
    language_fluency: Joi.object().optional(),
    religion: Joi.string().max(50).optional(),
    religious_importance: Joi.number().integer().min(1).max(5).optional(),
    traditional_values_importance: Joi.number().integer().min(1).max(5).optional(),
    family_involvement_preference: Joi.number().integer().min(1).max(5).optional(),
    cultural_practices: Joi.object().optional(),
    dietary_restrictions: Joi.array().items(Joi.string().max(50)).optional(),
  }),

  // Quiz result validation
  quizResult: Joi.object({
    quiz_version: Joi.string().default('v1.0'),
    total_questions: Joi.number().integer().min(1).required(),
    correct_answers: Joi.number().integer().min(0).required(),
    score_percentage: Joi.number().min(0).max(100).required(),
    category_scores: Joi.object().optional(),
    time_taken_seconds: Joi.number().integer().min(0).optional(),
  }),

  // Message validation
  message: Joi.object({
    conversation_id: Joi.string().uuid().required(),
    content: Joi.string().min(1).max(1000).required(),
    message_type: Joi.string().valid('text', 'image', 'voice', 'video', 'translation').default('text'),
    original_language: Joi.string().max(10).optional(),
    translated_content: Joi.object().optional(),
  }),
};