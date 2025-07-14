import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   GET /api/community/members
 * @desc    Get community members
 * @access  Private
 */
router.get('/members', authenticateToken, asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, tribe, location, role } = req.query;
  const offset = (page - 1) * limit;

  let query = supabaseAdmin
    .from('profiles')
    .select(`
      *,
      cultural_backgrounds(*),
      endorsements_received:endorsements!endorsements_endorsed_id_fkey(*)
    `)
    .eq('is_active', true)
    .neq('id', req.user.id)
    .range(offset, offset + limit - 1);

  // Apply filters
  if (tribe) {
    // Filter by tribe in cultural_backgrounds
    query = query.contains('cultural_backgrounds', [{ primary_tribe: tribe }]);
  }
  
  if (location) {
    query = query.ilike('location_city', `%${location}%`);
  }

  const { data: members, error, count } = await query;

  if (error) {
    console.error('Community members fetch error:', error);
    return res.status(500).json({
      error: 'Failed to fetch community members',
      code: 'FETCH_ERROR'
    });
  }

  // Transform the data to include endorsement count
  const transformedMembers = members?.map(member => ({
    ...member,
    endorsement_count: member.endorsements_received?.length || 0
  })) || [];

  res.json({
    members: transformedMembers,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: count,
      pages: Math.ceil(count / limit)
    }
  });
}));

/**
 * @route   GET /api/community/endorsements
 * @desc    Get endorsements
 * @access  Private
 */
router.get('/endorsements', authenticateToken, asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, type, user_id } = req.query;
  const offset = (page - 1) * limit;

  let query = supabaseAdmin
    .from('endorsements')
    .select(`
      *,
      endorser:profiles!endorsements_endorser_id_fkey(*),
      endorsed:profiles!endorsements_endorsed_id_fkey(*)
    `)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  // Apply filters
  if (type) {
    query = query.eq('endorsement_type', type);
  }
  
  if (user_id) {
    query = query.eq('endorsed_id', user_id);
  }

  const { data: endorsements, error, count } = await query;

  if (error) {
    return res.status(500).json({
      error: 'Failed to fetch endorsements',
      code: 'FETCH_ERROR'
    });
  }

  res.json({
    endorsements,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: count,
      pages: Math.ceil(count / limit)
    }
  });
}));

/**
 * @route   POST /api/community/endorsements
 * @desc    Create an endorsement
 * @access  Private
 */
router.post('/endorsements', authenticateToken, asyncHandler(async (req, res) => {
  const { endorsed_id, endorsement_type, message } = req.body;

  if (!endorsed_id || !endorsement_type || !message) {
    return res.status(400).json({
      error: 'endorsed_id, endorsement_type, and message are required',
      code: 'MISSING_FIELDS'
    });
  }

  if (endorsed_id === req.user.id) {
    return res.status(400).json({
      error: 'Cannot endorse yourself',
      code: 'SELF_ENDORSEMENT'
    });
  }

  const validTypes = ['cultural_knowledge', 'character', 'family_values', 'community_service'];
  if (!validTypes.includes(endorsement_type)) {
    return res.status(400).json({
      error: 'Invalid endorsement type',
      code: 'INVALID_TYPE'
    });
  }

  // Check if endorsement already exists
  const { data: existing } = await supabaseAdmin
    .from('endorsements')
    .select('id')
    .eq('endorser_id', req.user.id)
    .eq('endorsed_id', endorsed_id)
    .eq('endorsement_type', endorsement_type)
    .single();

  if (existing) {
    return res.status(409).json({
      error: 'You have already endorsed this user for this type',
      code: 'DUPLICATE_ENDORSEMENT'
    });
  }

  const { data: endorsement, error } = await supabaseAdmin
    .from('endorsements')
    .insert({
      endorser_id: req.user.id,
      endorsed_id,
      endorsement_type,
      message
    })
    .select(`
      *,
      endorser:profiles!endorsements_endorser_id_fkey(*),
      endorsed:profiles!endorsements_endorsed_id_fkey(*)
    `)
    .single();

  if (error) {
    return res.status(500).json({
      error: 'Failed to create endorsement',
      code: 'CREATE_ERROR'
    });
  }

  res.status(201).json({
    message: 'Endorsement created successfully',
    endorsement
  });
}));

/**
 * @route   GET /api/community/events
 * @desc    Get community events
 * @access  Private
 */
router.get('/events', authenticateToken, asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, type, upcoming = true } = req.query;
  const offset = (page - 1) * limit;

  let query = supabaseAdmin
    .from('cultural_events')
    .select(`
      *,
      organizer:profiles!cultural_events_organizer_id_fkey(*),
      attendees:event_attendees(count)
    `)
    .eq('is_public', true)
    .order('event_date', { ascending: true })
    .range(offset, offset + limit - 1);

  // Filter by upcoming events
  if (upcoming === 'true') {
    query = query.gte('event_date', new Date().toISOString());
  }

  // Filter by type
  if (type) {
    query = query.eq('event_type', type);
  }

  const { data: events, error, count } = await query;

  if (error) {
    return res.status(500).json({
      error: 'Failed to fetch events',
      code: 'FETCH_ERROR'
    });
  }

  res.json({
    events,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: count,
      pages: Math.ceil(count / limit)
    }
  });
}));

/**
 * @route   POST /api/community/events
 * @desc    Create a community event
 * @access  Private
 */
router.post('/events', authenticateToken, asyncHandler(async (req, res) => {
  const {
    title,
    description,
    event_type,
    event_date,
    location_name,
    location_address,
    max_attendees,
    target_tribes,
    image_url
  } = req.body;

  if (!title || !description || !event_type || !event_date || !location_name) {
    return res.status(400).json({
      error: 'title, description, event_type, event_date, and location_name are required',
      code: 'MISSING_FIELDS'
    });
  }

  const validTypes = ['cultural', 'social', 'educational', 'religious'];
  if (!validTypes.includes(event_type)) {
    return res.status(400).json({
      error: 'Invalid event type',
      code: 'INVALID_TYPE'
    });
  }

  const { data: event, error } = await supabaseAdmin
    .from('cultural_events')
    .insert({
      organizer_id: req.user.id,
      title,
      description,
      event_type,
      event_date,
      location_name,
      location_address,
      max_attendees,
      target_tribes,
      image_url
    })
    .select(`
      *,
      organizer:profiles!cultural_events_organizer_id_fkey(*)
    `)
    .single();

  if (error) {
    return res.status(500).json({
      error: 'Failed to create event',
      code: 'CREATE_ERROR'
    });
  }

  res.status(201).json({
    message: 'Event created successfully',
    event
  });
}));

/**
 * @route   POST /api/community/events/:id/join
 * @desc    Join an event
 * @access  Private
 */
router.post('/events/:id/join', authenticateToken, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { attendance_status = 'going' } = req.body;

  const validStatuses = ['going', 'maybe', 'not_going'];
  if (!validStatuses.includes(attendance_status)) {
    return res.status(400).json({
      error: 'Invalid attendance status',
      code: 'INVALID_STATUS'
    });
  }

  // Check if event exists
  const { data: event, error: eventError } = await supabaseAdmin
    .from('cultural_events')
    .select('*')
    .eq('id', id)
    .single();

  if (eventError || !event) {
    return res.status(404).json({
      error: 'Event not found',
      code: 'EVENT_NOT_FOUND'
    });
  }

  // Check if already attending
  const { data: existing } = await supabaseAdmin
    .from('event_attendees')
    .select('id, attendance_status')
    .eq('event_id', id)
    .eq('user_id', req.user.id)
    .single();

  let result;
  if (existing) {
    // Update existing attendance
    const { data, error } = await supabaseAdmin
      .from('event_attendees')
      .update({ attendance_status })
      .eq('id', existing.id)
      .select()
      .single();
    
    result = { data, error };
  } else {
    // Create new attendance
    const { data, error } = await supabaseAdmin
      .from('event_attendees')
      .insert({
        event_id: id,
        user_id: req.user.id,
        attendance_status
      })
      .select()
      .single();
    
    result = { data, error };
  }

  if (result.error) {
    return res.status(500).json({
      error: 'Failed to update event attendance',
      code: 'UPDATE_ERROR'
    });
  }

  // Update event attendee count if going
  if (attendance_status === 'going') {
    await supabaseAdmin.rpc('update_event_attendee_count', { event_id: id });
  }

  // Log activity
  await supabaseAdmin
    .from('user_activities')
    .insert({
      user_id: req.user.id,
      activity_type: 'event_join',
      target_event_id: id,
      metadata: { attendance_status }
    });

  res.json({
    message: 'Event attendance updated successfully',
    attendance: result.data
  });
}));

export default router;