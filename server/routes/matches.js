import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   GET /api/matches
 * @desc    Get user's matches
 * @access  Private
 */
router.get('/', authenticateToken, asyncHandler(async (req, res) => {
  const { status = 'all', page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;

  let query = supabaseAdmin
    .from('matches')
    .select(`
      *,
      user1:profiles!matches_user1_id_fkey(*),
      user2:profiles!matches_user2_id_fkey(*)
    `)
    .or(`user1_id.eq.${req.user.id},user2_id.eq.${req.user.id}`)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  // Filter by status
  if (status === 'mutual') {
    query = query.eq('is_mutual_match', true);
  } else if (status === 'pending') {
    query = query.eq('is_mutual_match', false);
  }

  const { data: matches, error, count } = await query;

  if (error) {
    return res.status(500).json({
      error: 'Failed to fetch matches',
      code: 'FETCH_ERROR'
    });
  }

  // Transform matches to show the other user's profile
  const transformedMatches = matches.map(match => {
    const isUser1 = match.user1_id === req.user.id;
    const otherUser = isUser1 ? match.user2 : match.user1;
    const userAction = isUser1 ? match.user1_action : match.user2_action;
    const otherUserAction = isUser1 ? match.user2_action : match.user1_action;

    return {
      ...match,
      other_user: otherUser,
      user_action: userAction,
      other_user_action: otherUserAction
    };
  });

  res.json({
    matches: transformedMatches,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: count,
      pages: Math.ceil(count / limit)
    }
  });
}));

/**
 * @route   GET /api/matches/suggestions
 * @desc    Get match suggestions for user
 * @access  Private
 */
router.get('/suggestions', authenticateToken, asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;

  // Get user's preferences
  const { data: userProfile } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', req.user.id)
    .single();

  if (!userProfile) {
    return res.status(404).json({
      error: 'User profile not found',
      code: 'PROFILE_NOT_FOUND'
    });
  }

  // Get user's preferences and cultural background
  const { data: preferences } = await supabaseAdmin
    .from('user_preferences')
    .select('*')
    .eq('user_id', req.user.id)
    .single();

  const { data: userCulture } = await supabaseAdmin
    .from('cultural_backgrounds')
    .select('*')
    .eq('user_id', req.user.id)
    .single();

  // Get users that haven't been matched with yet
  const { data: existingMatches } = await supabaseAdmin
    .from('matches')
    .select('user1_id, user2_id')
    .or(`user1_id.eq.${req.user.id},user2_id.eq.${req.user.id}`);

  const matchedUserIds = existingMatches?.flatMap(match => 
    [match.user1_id, match.user2_id]
  ).filter(id => id !== req.user.id) || [];

  // Build query for potential matches
  let query = supabaseAdmin
    .from('profiles')
    .select(`
      *,
      cultural_backgrounds(*),
      personality_assessments(*)
    `)
    .eq('is_active', true)
    .eq('is_verified', true)
    .neq('id', req.user.id);

  // Exclude already matched users
  if (matchedUserIds.length > 0) {
    query = query.not('id', 'in', `(${matchedUserIds.join(',')})`);
  }

  // Apply preferences if they exist
  if (preferences) {
    // Gender preference
    if (preferences.preferred_genders?.length > 0) {
      query = query.in('gender', preferences.preferred_genders);
    }

    // Age range
    if (preferences.age_min || preferences.age_max) {
      const today = new Date();
      if (preferences.age_max) {
        const minBirthDate = new Date(today.getFullYear() - preferences.age_max - 1, today.getMonth(), today.getDate());
        query = query.gte('date_of_birth', minBirthDate.toISOString().split('T')[0]);
      }
      if (preferences.age_min) {
        const maxBirthDate = new Date(today.getFullYear() - preferences.age_min, today.getMonth(), today.getDate());
        query = query.lte('date_of_birth', maxBirthDate.toISOString().split('T')[0]);
      }
    }
  }

  query = query.limit(limit * 2); // Get more to filter and score

  const { data: potentialMatches, error } = await query;

  if (error) {
    return res.status(500).json({
      error: 'Failed to fetch match suggestions',
      code: 'FETCH_ERROR'
    });
  }

  // Calculate compatibility scores
  const scoredMatches = potentialMatches.map(match => {
    let culturalScore = 0;
    let personalityScore = 0;
    let locationScore = 0;

    // Cultural compatibility
    if (userCulture && match.cultural_backgrounds?.[0]) {
      const matchCulture = match.cultural_backgrounds[0];
      
      // Same tribe bonus
      if (userCulture.primary_tribe === matchCulture.primary_tribe) {
        culturalScore += 40;
      }
      
      // Shared languages
      const sharedLanguages = userCulture.languages_spoken?.filter(lang => 
        matchCulture.languages_spoken?.includes(lang)
      ) || [];
      culturalScore += Math.min(sharedLanguages.length * 10, 30);
      
      // Same religion
      if (userCulture.religion === matchCulture.religion) {
        culturalScore += 20;
      }
      
      // Birth country similarity
      if (userCulture.birth_country === matchCulture.birth_country) {
        culturalScore += 10;
      }
    } else {
      // Default cultural score if no cultural background
      culturalScore = 50;
    }

    // Location compatibility
    if (userProfile.location_country === match.location_country) {
      locationScore = 100;
    } else {
      locationScore = 50; // Different country but still in diaspora
    }

    // Personality compatibility (if available)
    if (match.personality_assessments?.[0]) {
      personalityScore = Math.random() * 100; // Placeholder for actual personality matching
    } else {
      personalityScore = 70; // Default score if no assessment
    }

    const overallScore = (culturalScore * 0.5) + (personalityScore * 0.3) + (locationScore * 0.2);

    return {
      ...match,
      compatibility_scores: {
        overall: Math.round(overallScore),
        cultural: Math.round(culturalScore),
        personality: Math.round(personalityScore),
        location: Math.round(locationScore)
      }
    };
  });

router.post('/:targetUserId/action', authenticateToken, asyncHandler(async (req, res) => {
  const { targetUserId } = req.params;
    .sort((a, b) => b.compatibility_scores.overall - a.compatibility_scores.overall)
    .slice(0, limit);

    return res.status(400).json({
    suggestions: topMatches,
    total: topMatches.length
    });
  }

  if (targetUserId === req.user.id) {
    return res.status(400).json({
      error: 'Cannot perform action on yourself',
      code: 'SELF_ACTION'
    });
  }

  // Check if match already exists
  const { data: existingMatch } = await supabaseAdmin
    .from('matches')
    .select('*')
    .or(`and(user1_id.eq.${req.user.id},user2_id.eq.${targetUserId}),and(user1_id.eq.${targetUserId},user2_id.eq.${req.user.id})`)
    .single();

  let match;

  if (existingMatch) {
    // Update existing match
    const isUser1 = existingMatch.user1_id === req.user.id;
    const updateField = isUser1 ? 'user1_action' : 'user2_action';
    const otherUserAction = isUser1 ? existingMatch.user2_action : existingMatch.user1_action;
    
    const { data, error } = await supabaseAdmin
      .from('matches')
      .update({
        [updateField]: action,
        ...(action === 'like' && otherUserAction === 'like' && {
          is_mutual_match: true,
          matched_at: new Date().toISOString()
        })
      })
      .eq('id', existingMatch.id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({
        error: 'Failed to update match',
        code: 'UPDATE_ERROR'
      });
    }

    match = data;
  } else {
    // Create new match
    const { data, error } = await supabaseAdmin
      .from('matches')
      .insert({
        user1_id: req.user.id,
        user2_id: targetUserId,
        user1_action: action,
        user2_action: 'pending',
        compatibility_score: 0, // Will be calculated later
        cultural_compatibility: 0,
        personality_compatibility: 0,
        location_compatibility: 0
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({
        error: 'Failed to create match',
        code: 'CREATE_ERROR'
      });
    }

    match = data;
  }

  // Log activity
  await supabaseAdmin
    .from('user_activities')
    .insert({
      user_id: req.user.id,
      activity_type: action,
      target_user_id: targetUserId,
      metadata: { action_type: action }
    });

  // If it's a mutual match, create conversation
  if (match.is_mutual_match && !existingMatch?.is_mutual_match) {
    await supabaseAdmin
      .from('conversations')
      .insert({
        match_id: match.id,
        user1_id: match.user1_id,
        user2_id: match.user2_id
      });
  }

  res.json({
    message: `${action} action recorded successfully`,
    match,
    is_mutual: match.is_mutual_match
  });
}));

export default router;
 * @route   POST /api/matches/:targetUserId/action