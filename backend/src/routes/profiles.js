import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { supabase } from '../config/supabase.js';
import { logger } from '../utils/logger.js';
import { requireVerification } from '../middleware/auth.js';

const router = express.Router();

// Get current user's profile
router.get('/me', async (req, res) => {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select(`
        *,
        cultural_backgrounds (*),
        personality_assessments (*),
        cultural_quiz_results (*),
        user_preferences (*)
      `)
      .eq('id', req.user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    res.json({
      profile: profile || null
    });

  } catch (error) {
    logger.error(`Get profile error: ${error.message}`);
    res.status(500).json({
      error: 'Failed to fetch profile'
    });
  }
});

// Update user profile
router.put('/me', [
  body('firstName').optional().trim().isLength({ min: 1 }),
  body('lastName').optional().trim().isLength({ min: 1 }),
  body('bio').optional().trim().isLength({ max: 1000 }),
  body('occupation').optional().trim(),
  body('educationLevel').optional().trim(),
  body('location.city').optional().trim(),
  body('location.country').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const updates = {};
    const { 
      firstName, 
      lastName, 
      bio, 
      occupation, 
      educationLevel, 
      location 
    } = req.body;

    if (firstName) updates.first_name = firstName;
    if (lastName) updates.last_name = lastName;
    if (bio !== undefined) updates.bio = bio;
    if (occupation) updates.occupation = occupation;
    if (educationLevel) updates.education_level = educationLevel;
    if (location?.city) updates.location_city = location.city;
    if (location?.country) updates.location_country = location.country;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        error: 'No valid fields to update'
      });
    }

    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', req.user.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    logger.info(`Profile updated for user: ${req.user.id}`);

    res.json({
      message: 'Profile updated successfully',
      profile: data
    });

  } catch (error) {
    logger.error(`Update profile error: ${error.message}`);
    res.status(500).json({
      error: 'Failed to update profile'
    });
  }
});

// Get public profile by ID
router.get('/:userId', [
  param('userId').isUUID().withMessage('Valid user ID required')
], requireVerification, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { userId } = req.params;

    // Check if users are matched or have interacted
    const { data: matchData } = await supabase
      .from('matches')
      .select('*')
      .or(`and(user1_id.eq.${req.user.id},user2_id.eq.${userId}),and(user1_id.eq.${userId},user2_id.eq.${req.user.id})`)
      .single();

    const canViewFullProfile = matchData?.is_mutual_match || false;

    // Select fields based on access level
    const selectFields = canViewFullProfile 
      ? `
        id, first_name, last_name, date_of_birth, location_city, 
        location_country, occupation, education_level, bio, 
        profile_photo_url, is_verified, last_active_at,
        cultural_backgrounds (
          primary_tribe, languages_spoken, religion, 
          traditional_values_importance, family_involvement_preference
        )
      `
      : `
        id, first_name, last_name, location_city, location_country, 
        occupation, education_level, bio, profile_photo_url, 
        is_verified,
        cultural_backgrounds (primary_tribe, religion)
      `;

    const { data: profile, error } = await supabase
      .from('profiles')
      .select(selectFields)
      .eq('id', userId)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Profile not found'
        });
      }
      throw error;
    }

    // Log profile view activity
    await supabase
      .from('user_activities')
      .insert({
        user_id: req.user.id,
        activity_type: 'profile_view',
        target_user_id: userId
      });

    res.json({
      profile,
      access_level: canViewFullProfile ? 'full' : 'limited'
    });

  } catch (error) {
    logger.error(`Get public profile error: ${error.message}`);
    res.status(500).json({
      error: 'Failed to fetch profile'
    });
  }
});

// Update cultural background
router.put('/cultural-background', [
  body('primaryTribe').notEmpty().withMessage('Primary tribe is required'),
  body('languagesSpoken').isArray().withMessage('Languages must be an array'),
  body('religion').optional().trim(),
  body('religiousImportance').optional().isInt({ min: 1, max: 5 }),
  body('traditionalValuesImportance').optional().isInt({ min: 1, max: 5 }),
  body('familyInvolvementPreference').optional().isInt({ min: 1, max: 5 })
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
      primaryTribe,
      secondaryTribes,
      birthCountry,
      languagesSpoken,
      languageFluency,
      religion,
      religiousImportance,
      traditionalValuesImportance,
      familyInvolvementPreference,
      culturalPractices,
      dietaryRestrictions
    } = req.body;

    const culturalData = {
      user_id: req.user.id,
      primary_tribe: primaryTribe,
      secondary_tribes: secondaryTribes || [],
      birth_country: birthCountry,
      languages_spoken: languagesSpoken,
      language_fluency: languageFluency || {},
      religion,
      religious_importance: religiousImportance,
      traditional_values_importance: traditionalValuesImportance,
      family_involvement_preference: familyInvolvementPreference,
      cultural_practices: culturalPractices || {},
      dietary_restrictions: dietaryRestrictions || [],
      updated_at: new Date().toISOString()
    };

    // Upsert cultural background
    const { data, error } = await supabase
      .from('cultural_backgrounds')
      .upsert(culturalData, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) {
      throw error;
    }

    logger.info(`Cultural background updated for user: ${req.user.id}`);

    res.json({
      message: 'Cultural background updated successfully',
      culturalBackground: data
    });

  } catch (error) {
    logger.error(`Update cultural background error: ${error.message}`);
    res.status(500).json({
      error: 'Failed to update cultural background'
    });
  }
});

// Search profiles
router.get('/', [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
  query('tribe').optional().trim(),
  query('location').optional().trim(),
  query('ageMin').optional().isInt({ min: 18, max: 100 }).toInt(),
  query('ageMax').optional().isInt({ min: 18, max: 100 }).toInt(),
  query('search').optional().trim()
], requireVerification, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const {
      page = 1,
      limit = 20,
      tribe,
      location,
      ageMin,
      ageMax,
      search
    } = req.query;

    const offset = (page - 1) * limit;

    let query = supabase
      .from('profiles')
      .select(`
        id, first_name, last_name, location_city, location_country,
        occupation, education_level, bio, profile_photo_url, 
        is_verified, last_active_at,
        cultural_backgrounds (primary_tribe, religion)
      `)
      .eq('is_active', true)
      .neq('id', req.user.id)
      .range(offset, offset + limit - 1);

    // Apply filters
    if (tribe) {
      query = query.eq('cultural_backgrounds.primary_tribe', tribe);
    }

    if (location) {
      query = query.or(`location_city.ilike.%${location}%,location_country.ilike.%${location}%`);
    }

    if (ageMin || ageMax) {
      const today = new Date();
      if (ageMax) {
        const minBirthDate = new Date(today.getFullYear() - ageMax - 1, today.getMonth(), today.getDate());
        query = query.gte('date_of_birth', minBirthDate.toISOString().split('T')[0]);
      }
      if (ageMin) {
        const maxBirthDate = new Date(today.getFullYear() - ageMin, today.getMonth(), today.getDate());
        query = query.lte('date_of_birth', maxBirthDate.toISOString().split('T')[0]);
      }
    }

    if (search) {
      query = query.textSearch('fts', search);
    }

    const { data: profiles, error, count } = await query;

    if (error) {
      throw error;
    }

    res.json({
      profiles: profiles || [],
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    logger.error(`Search profiles error: ${error.message}`);
    res.status(500).json({
      error: 'Failed to search profiles'
    });
  }
});

export default router;