import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validate, schemas } from '../middleware/validation.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   GET /api/profiles
 * @desc    Get all profiles (with pagination and filters)
 * @access  Private
 */
router.get('/', authenticateToken, asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 10, 
    tribe, 
    location_country, 
    age_min, 
    age_max,
    is_active = true 
  } = req.query;

  const offset = (page - 1) * limit;

  let query = supabaseAdmin
    .from('profiles')
    .select(`
      *,
      cultural_backgrounds(*),
      personality_assessments(*)
    `)
    .eq('is_active', is_active)
    .neq('id', req.user.id) // Exclude current user
    .range(offset, offset + limit - 1);

  // Apply filters
  if (tribe) {
    query = query.eq('cultural_backgrounds.primary_tribe', tribe);
  }
  
  if (location_country) {
    query = query.eq('location_country', location_country);
  }

  // Age filtering (requires date calculation)
  if (age_min || age_max) {
    const today = new Date();
    if (age_max) {
      const minBirthDate = new Date(today.getFullYear() - age_max, today.getMonth(), today.getDate());
      query = query.gte('date_of_birth', minBirthDate.toISOString().split('T')[0]);
    }
    if (age_min) {
      const maxBirthDate = new Date(today.getFullYear() - age_min, today.getMonth(), today.getDate());
      query = query.lte('date_of_birth', maxBirthDate.toISOString().split('T')[0]);
    }
  }

  const { data: profiles, error, count } = await query;

  if (error) {
    return res.status(500).json({
      error: 'Failed to fetch profiles',
      code: 'FETCH_ERROR'
    });
  }

  res.json({
    profiles,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: count,
      pages: Math.ceil(count / limit)
    }
  });
}));

/**
 * @route   GET /api/profiles/:id
 * @desc    Get profile by ID
 * @access  Private
 */
router.get('/:id', authenticateToken, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .select(`
      *,
      cultural_backgrounds(*),
      personality_assessments(*),
      user_preferences(*)
    `)
    .eq('id', id)
    .eq('is_active', true)
    .single();

  if (error || !profile) {
    return res.status(404).json({
      error: 'Profile not found',
      code: 'PROFILE_NOT_FOUND'
    });
  }

  // Log profile view activity
  await supabaseAdmin
    .from('user_activities')
    .insert({
      user_id: req.user.id,
      activity_type: 'profile_view',
      target_user_id: id,
      metadata: { viewed_at: new Date().toISOString() }
    });

  res.json({ profile });
}));

/**
 * @route   PUT /api/profiles/:id
 * @desc    Update profile
 * @access  Private (own profile only)
 */
router.put('/:id', 
  authenticateToken, 
  validate(schemas.profile), 
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Ensure user can only update their own profile
    if (id !== req.user.id) {
      return res.status(403).json({
        error: 'You can only update your own profile',
        code: 'UNAUTHORIZED_UPDATE'
      });
    }

    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .update({
        ...req.body,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({
        error: 'Failed to update profile',
        code: 'UPDATE_ERROR'
      });
    }

    res.json({
      message: 'Profile updated successfully',
      profile
    });
  })
);

/**
 * @route   POST /api/profiles/:id/cultural-background
 * @desc    Create or update cultural background
 * @access  Private (own profile only)
 */
router.post('/:id/cultural-background',
  authenticateToken,
  validate(schemas.culturalBackground),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (id !== req.user.id) {
      return res.status(403).json({
        error: 'You can only update your own cultural background',
        code: 'UNAUTHORIZED_UPDATE'
      });
    }

    // Check if cultural background exists
    const { data: existing } = await supabaseAdmin
      .from('cultural_backgrounds')
      .select('id')
      .eq('user_id', id)
      .single();

    let result;
    if (existing) {
      // Update existing
      const { data, error } = await supabaseAdmin
        .from('cultural_backgrounds')
        .update({
          ...req.body,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', id)
        .select()
        .single();
      
      result = { data, error };
    } else {
      // Create new
      const { data, error } = await supabaseAdmin
        .from('cultural_backgrounds')
        .insert({
          user_id: id,
          ...req.body
        })
        .select()
        .single();
      
      result = { data, error };
    }

    if (result.error) {
      return res.status(500).json({
        error: 'Failed to save cultural background',
        code: 'SAVE_ERROR'
      });
    }

    res.json({
      message: 'Cultural background saved successfully',
      cultural_background: result.data
    });
  })
);

/**
 * @route   GET /api/profiles/:id/stats
 * @desc    Get profile statistics
 * @access  Private (own profile only)
 */
router.get('/:id/stats', authenticateToken, asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (id !== req.user.id) {
    return res.status(403).json({
      error: 'You can only view your own stats',
      code: 'UNAUTHORIZED_ACCESS'
    });
  }

  // Get profile views
  const { count: profileViews } = await supabaseAdmin
    .from('user_activities')
    .select('*', { count: 'exact', head: true })
    .eq('target_user_id', id)
    .eq('activity_type', 'profile_view');

  // Get likes received
  const { count: likesReceived } = await supabaseAdmin
    .from('matches')
    .select('*', { count: 'exact', head: true })
    .or(`user1_id.eq.${id},user2_id.eq.${id}`)
    .or('user1_action.eq.like,user1_action.eq.super_like,user2_action.eq.like,user2_action.eq.super_like');

  // Get total matches
  const { count: totalMatches } = await supabaseAdmin
    .from('matches')
    .select('*', { count: 'exact', head: true })
    .or(`user1_id.eq.${id},user2_id.eq.${id}`)
    .eq('is_mutual_match', true);

  // Get endorsements
  const { count: endorsements } = await supabaseAdmin
    .from('endorsements')
    .select('*', { count: 'exact', head: true })
    .eq('endorsed_id', id);

  res.json({
    stats: {
      profile_views: profileViews || 0,
      likes_received: likesReceived || 0,
      total_matches: totalMatches || 0,
      endorsements: endorsements || 0
    }
  });
}));

export default router;