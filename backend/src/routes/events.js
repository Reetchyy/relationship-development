import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { supabase } from '../config/supabase.js';
import { logger } from '../utils/logger.js';
import { requireVerification } from '../middleware/auth.js';

const router = express.Router();

// Get cultural events
router.get('/', [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
  query('type').optional().isIn(['cultural', 'social', 'educational', 'religious']),
  query('location').optional().trim(),
  query('tribe').optional().trim(),
  query('upcoming').optional().isBoolean()
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
      type, 
      location, 
      tribe, 
      upcoming = true 
    } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('cultural_events')
      .select(`
        *,
        organizer:profiles!cultural_events_organizer_id_fkey (
          id, first_name, last_name, profile_photo_url, is_verified
        ),
        attendee_count:event_attendees(count)
      `)
      .eq('is_public', true)
      .order('event_date', { ascending: true })
      .range(offset, offset + limit - 1);

    // Filter by upcoming events
    if (upcoming) {
      query = query.gte('event_date', new Date().toISOString());
    }

    // Apply filters
    if (type) {
      query = query.eq('event_type', type);
    }

    if (location) {
      query = query.or(`location_name.ilike.%${location}%,location_address.ilike.%${location}%`);
    }

    if (tribe) {
      query = query.contains('target_tribes', [tribe]);
    }

    const { data: events, error, count } = await query;

    if (error) {
      throw error;
    }

    res.json({
      events: events || [],
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    logger.error(`Get events error: ${error.message}`);
    res.status(500).json({
      error: 'Failed to fetch events'
    });
  }
});

// Create new event
router.post('/', [
  body('title').trim().isLength({ min: 1, max: 200 }).withMessage('Title is required and must be under 200 characters'),
  body('description').trim().isLength({ min: 1, max: 2000 }).withMessage('Description is required and must be under 2000 characters'),
  body('eventType').isIn(['cultural', 'social', 'educational', 'religious']).withMessage('Valid event type required'),
  body('eventDate').isISO8601().withMessage('Valid event date required'),
  body('locationName').trim().isLength({ min: 1 }).withMessage('Location name is required'),
  body('maxAttendees').optional().isInt({ min: 1 }).withMessage('Max attendees must be a positive number'),
  body('targetTribes').optional().isArray().withMessage('Target tribes must be an array'),
  body('isPublic').optional().isBoolean().withMessage('isPublic must be a boolean')
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
      title,
      description,
      eventType,
      eventDate,
      locationName,
      locationAddress,
      maxAttendees,
      targetTribes,
      isPublic = true,
      imageUrl
    } = req.body;

    // Validate event date is in the future
    if (new Date(eventDate) <= new Date()) {
      return res.status(400).json({
        error: 'Event date must be in the future'
      });
    }

    const { data: event, error } = await supabase
      .from('cultural_events')
      .insert({
        organizer_id: req.user.id,
        title,
        description,
        event_type: eventType,
        event_date: eventDate,
        location_name: locationName,
        location_address: locationAddress,
        max_attendees: maxAttendees,
        target_tribes: targetTribes || [],
        is_public: isPublic,
        image_url: imageUrl
      })
      .select(`
        *,
        organizer:profiles!cultural_events_organizer_id_fkey (
          id, first_name, last_name, profile_photo_url, is_verified
        )
      `)
      .single();

    if (error) {
      throw error;
    }

    // Automatically register organizer as attendee
    await supabase
      .from('event_attendees')
      .insert({
        event_id: event.id,
        user_id: req.user.id,
        attendance_status: 'going'
      });

    // Update current attendees count
    await supabase
      .from('cultural_events')
      .update({ current_attendees: 1 })
      .eq('id', event.id);

    logger.info(`Event created: ${event.id} by user ${req.user.id}`);

    res.status(201).json({
      message: 'Event created successfully',
      event
    });

  } catch (error) {
    logger.error(`Create event error: ${error.message}`);
    res.status(500).json({
      error: 'Failed to create event'
    });
  }
});

// Get event details
router.get('/:eventId', [
  param('eventId').isUUID().withMessage('Valid event ID required')
], requireVerification, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { eventId } = req.params;

    const { data: event, error } = await supabase
      .from('cultural_events')
      .select(`
        *,
        organizer:profiles!cultural_events_organizer_id_fkey (
          id, first_name, last_name, profile_photo_url, is_verified
        ),
        attendees:event_attendees (
          id, attendance_status, registered_at,
          user:profiles!event_attendees_user_id_fkey (
            id, first_name, last_name, profile_photo_url, is_verified
          )
        )
      `)
      .eq('id', eventId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Event not found'
        });
      }
      throw error;
    }

    // Check if user is attending
    const userAttendance = event.attendees?.find(
      attendee => attendee.user.id === req.user.id
    );

    res.json({
      event: {
        ...event,
        user_attendance: userAttendance?.attendance_status || null,
        attendee_count: event.attendees?.filter(a => a.attendance_status === 'going').length || 0
      }
    });

  } catch (error) {
    logger.error(`Get event details error: ${error.message}`);
    res.status(500).json({
      error: 'Failed to fetch event details'
    });
  }
});

// Join/leave event
router.post('/:eventId/attend', [
  param('eventId').isUUID().withMessage('Valid event ID required'),
  body('status').isIn(['going', 'maybe', 'not_going']).withMessage('Valid attendance status required')
], requireVerification, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { eventId } = req.params;
    const { status } = req.body;
    const userId = req.user.id;

    // Get event details
    const { data: event, error: eventError } = await supabase
      .from('cultural_events')
      .select('max_attendees, current_attendees, organizer_id, event_date')
      .eq('id', eventId)
      .single();

    if (eventError) {
      if (eventError.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Event not found'
        });
      }
      throw eventError;
    }

    // Check if event is in the past
    if (new Date(event.event_date) <= new Date()) {
      return res.status(400).json({
        error: 'Cannot register for past events'
      });
    }

    // Check if event is full (only for 'going' status)
    if (status === 'going' && event.max_attendees && event.current_attendees >= event.max_attendees) {
      return res.status(400).json({
        error: 'Event is full'
      });
    }

    // Check existing attendance
    const { data: existingAttendance } = await supabase
      .from('event_attendees')
      .select('id, attendance_status')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .single();

    let attendanceData;

    if (existingAttendance) {
      // Update existing attendance
      const { data, error } = await supabase
        .from('event_attendees')
        .update({ attendance_status: status })
        .eq('id', existingAttendance.id)
        .select()
        .single();

      if (error) throw error;
      attendanceData = data;

      // Update attendee count if status changed from/to 'going'
      if (existingAttendance.attendance_status !== status) {
        let countChange = 0;
        if (existingAttendance.attendance_status === 'going' && status !== 'going') {
          countChange = -1;
        } else if (existingAttendance.attendance_status !== 'going' && status === 'going') {
          countChange = 1;
        }

        if (countChange !== 0) {
          await supabase
            .from('cultural_events')
            .update({ 
              current_attendees: Math.max(0, event.current_attendees + countChange)
            })
            .eq('id', eventId);
        }
      }
    } else {
      // Create new attendance record
      const { data, error } = await supabase
        .from('event_attendees')
        .insert({
          event_id: eventId,
          user_id: userId,
          attendance_status: status
        })
        .select()
        .single();

      if (error) throw error;
      attendanceData = data;

      // Update attendee count if joining
      if (status === 'going') {
        await supabase
          .from('cultural_events')
          .update({ 
            current_attendees: event.current_attendees + 1
          })
          .eq('id', eventId);
      }
    }

    // Log activity
    await supabase
      .from('user_activities')
      .insert({
        user_id: userId,
        activity_type: 'event_join',
        target_event_id: eventId,
        metadata: { attendance_status: status }
      });

    logger.info(`User ${userId} updated attendance for event ${eventId}: ${status}`);

    res.json({
      message: 'Attendance updated successfully',
      attendance: attendanceData
    });

  } catch (error) {
    logger.error(`Update event attendance error: ${error.message}`);
    res.status(500).json({
      error: 'Failed to update event attendance'
    });
  }
});

// Get user's events (organized and attending)
router.get('/user/my-events', [
  query('type').optional().isIn(['organized', 'attending', 'all']),
  query('upcoming').optional().isBoolean()
], requireVerification, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { type = 'all', upcoming = true } = req.query;
    const userId = req.user.id;

    let organizedEvents = [];
    let attendingEvents = [];

    // Get organized events
    if (type === 'organized' || type === 'all') {
      let organizedQuery = supabase
        .from('cultural_events')
        .select(`
          *,
          attendee_count:event_attendees(count)
        `)
        .eq('organizer_id', userId)
        .order('event_date', { ascending: true });

      if (upcoming) {
        organizedQuery = organizedQuery.gte('event_date', new Date().toISOString());
      }

      const { data, error } = await organizedQuery;
      if (error) throw error;
      organizedEvents = data || [];
    }

    // Get attending events
    if (type === 'attending' || type === 'all') {
      let attendingQuery = supabase
        .from('event_attendees')
        .select(`
          attendance_status, registered_at,
          event:cultural_events (
            *,
            organizer:profiles!cultural_events_organizer_id_fkey (
              id, first_name, last_name, profile_photo_url, is_verified
            )
          )
        `)
        .eq('user_id', userId)
        .in('attendance_status', ['going', 'maybe'])
        .order('event.event_date', { ascending: true });

      if (upcoming) {
        attendingQuery = attendingQuery.gte('event.event_date', new Date().toISOString());
      }

      const { data, error } = await attendingQuery;
      if (error) throw error;
      attendingEvents = data?.map(item => ({
        ...item.event,
        user_attendance: item.attendance_status,
        registered_at: item.registered_at
      })) || [];
    }

    res.json({
      organized_events: organizedEvents,
      attending_events: attendingEvents,
      total_organized: organizedEvents.length,
      total_attending: attendingEvents.length
    });

  } catch (error) {
    logger.error(`Get user events error: ${error.message}`);
    res.status(500).json({
      error: 'Failed to fetch user events'
    });
  }
});

export default router;