import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { supabase } from '../config/supabase.js';
import { logger } from '../utils/logger.js';
import { requireVerification } from '../middleware/auth.js';
import { calculateCompatibility } from '../services/matchingService.js';

const router = express.Router();

// Get potential matches for user
router.get('/discover', [
  query('limit').optional().isInt({ min: 1, max: 50 }).toInt()
], requireVerification, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { limit = 10 } = req.query;
    const userId = req.user.id;

    // Get user's preferences and cultural background
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select(`
        *,
        cultural_backgrounds (*),
        personality_assessments (*),
        user_preferences (*)
      `)
      .eq('id', userId)
      .single();

    if (profileError) {
      throw profileError;
    }

    // Get users that haven't been matched with yet
    const { data: existingMatches } = await supabase
      .from('matches')
      .select('user1_id, user2_id')
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

    const excludeIds = [userId];
    if (existingMatches) {
      existingMatches.forEach(match => {
        if (match.user1_id === userId) {
          excludeIds.push(match.user2_id);
        } else {
          excludeIds.push(match.user1_id);
        }
      });
    }

    // Get potential matches based on preferences
    let query = supabase
      .from('profiles')
      .select(`
        *,
        cultural_backgrounds (*),
        personality_assessments (*)
      `)
      .eq('is_active', true)
      .eq('is_verified', true)
      .not('id', 'in', `(${excludeIds.join(',')})`)
      .limit(limit * 3); // Get more to filter and rank

    // Apply user preferences
    const preferences = userProfile.user_preferences?.[0];
    if (preferences) {
      // Age filter
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

      // Gender filter
      if (preferences.preferred_genders?.length > 0) {
        query = query.in('gender', preferences.preferred_genders);
      }
    }

    const { data: potentialMatches, error: matchError } = await query;

    if (matchError) {
      throw matchError;
    }

    // Calculate compatibility scores and rank matches
    const rankedMatches = [];
    
    for (const candidate of potentialMatches || []) {
      const compatibility = await calculateCompatibility(userProfile, candidate);
      
      if (compatibility.overall >= 50) { // Minimum compatibility threshold
        rankedMatches.push({
          ...candidate,
          compatibility_scores: compatibility
        });
      }
    }

    // Sort by compatibility score and limit results
    rankedMatches.sort((a, b) => b.compatibility_scores.overall - a.compatibility_scores.overall);
    const finalMatches = rankedMatches.slice(0, limit);

    // Store match records for tracking
    const matchRecords = finalMatches.map(match => ({
      user1_id: userId,
      user2_id: match.id,
      compatibility_score: match.compatibility_scores.overall,
      cultural_compatibility: match.compatibility_scores.cultural,
      personality_compatibility: match.compatibility_scores.personality,
      location_compatibility: match.compatibility_scores.location
    }));

    if (matchRecords.length > 0) {
      await supabase
        .from('matches')
        .upsert(matchRecords, { onConflict: 'user1_id,user2_id' });
    }

    res.json({
      matches: finalMatches,
      total: finalMatches.length
    });

  } catch (error) {
    logger.error(`Discover matches error: ${error.message}`);
    res.status(500).json({
      error: 'Failed to discover matches'
    });
  }
});

// Like or pass on a user
router.post('/action', [
  body('targetUserId').isUUID().withMessage('Valid target user ID required'),
  body('action').isIn(['like', 'pass', 'super_like']).withMessage('Valid action required')
], requireVerification, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { targetUserId, action } = req.body;
    const userId = req.user.id;

    if (userId === targetUserId) {
      return res.status(400).json({
        error: 'Cannot perform action on yourself'
      });
    }

    // Check if match record exists
    const { data: existingMatch, error: matchError } = await supabase
      .from('matches')
      .select('*')
      .or(`and(user1_id.eq.${userId},user2_id.eq.${targetUserId}),and(user1_id.eq.${targetUserId},user2_id.eq.${userId})`)
      .single();

    let matchData;
    let isNewMatch = false;

    if (existingMatch) {
      // Update existing match
      const updateField = existingMatch.user1_id === userId ? 'user1_action' : 'user2_action';
      
      const { data, error } = await supabase
        .from('matches')
        .update({ 
          [updateField]: action,
          ...(action === 'like' && existingMatch[updateField === 'user1_action' ? 'user2_action' : 'user1_action'] === 'like' 
            ? { matched_at: new Date().toISOString() } 
            : {})
        })
        .eq('id', existingMatch.id)
        .select()
        .single();

      if (error) throw error;
      matchData = data;

      // Check if it's a new mutual match
      isNewMatch = matchData.is_mutual_match && !existingMatch.matched_at;

    } else {
      // Create new match record
      const { data, error } = await supabase
        .from('matches')
        .insert({
          user1_id: userId,
          user2_id: targetUserId,
          user1_action: action,
          compatibility_score: 0, // Will be calculated later
          cultural_compatibility: 0,
          personality_compatibility: 0,
          location_compatibility: 0
        })
        .select()
        .single();

      if (error) throw error;
      matchData = data;
    }

    // Log activity
    await supabase
      .from('user_activities')
      .insert({
        user_id: userId,
        activity_type: action,
        target_user_id: targetUserId,
        metadata: { match_id: matchData.id }
      });

    // If it's a new mutual match, create conversation
    if (isNewMatch) {
      const { error: conversationError } = await supabase
        .from('conversations')
        .insert({
          match_id: matchData.id,
          user1_id: matchData.user1_id,
          user2_id: matchData.user2_id
        });

      if (conversationError) {
        logger.error(`Failed to create conversation: ${conversationError.message}`);
      }

      logger.info(`New match created between ${userId} and ${targetUserId}`);
    }

    res.json({
      message: `${action} action recorded successfully`,
      match: matchData,
      isNewMatch
    });

  } catch (error) {
    logger.error(`Match action error: ${error.message}`);
    res.status(500).json({
      error: 'Failed to record match action'
    });
  }
});

// Get user's matches
router.get('/matches', [
  query('status').optional().isIn(['all', 'mutual', 'pending']),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 50 }).toInt()
], requireVerification, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { status = 'mutual', page = 1, limit = 20 } = req.query;
    const userId = req.user.id;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('matches')
      .select(`
        *,
        user1:profiles!matches_user1_id_fkey (
          id, first_name, last_name, profile_photo_url, 
          location_city, location_country, is_verified,
          cultural_backgrounds (primary_tribe)
        ),
        user2:profiles!matches_user2_id_fkey (
          id, first_name, last_name, profile_photo_url,
          location_city, location_country, is_verified,
          cultural_backgrounds (primary_tribe)
        )
      `)
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status === 'mutual') {
      query = query.eq('is_mutual_match', true);
    } else if (status === 'pending') {
      query = query.eq('is_mutual_match', false);
    }

    const { data: matches, error, count } = await query;

    if (error) {
      throw error;
    }

    // Format matches to show the other user's profile
    const formattedMatches = matches?.map(match => {
      const otherUser = match.user1_id === userId ? match.user2 : match.user1;
      const userAction = match.user1_id === userId ? match.user1_action : match.user2_action;
      const otherAction = match.user1_id === userId ? match.user2_action : match.user1_action;

      return {
        id: match.id,
        compatibility_score: match.compatibility_score,
        cultural_compatibility: match.cultural_compatibility,
        personality_compatibility: match.personality_compatibility,
        location_compatibility: match.location_compatibility,
        user_action: userAction,
        other_action: otherAction,
        is_mutual_match: match.is_mutual_match,
        matched_at: match.matched_at,
        created_at: match.created_at,
        other_user: otherUser
      };
    }) || [];

    res.json({
      matches: formattedMatches,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    logger.error(`Get matches error: ${error.message}`);
    res.status(500).json({
      error: 'Failed to fetch matches'
    });
  }
});

export default router;