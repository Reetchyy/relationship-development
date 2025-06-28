import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   GET /api/admin/stats
 * @desc    Get platform statistics
 * @access  Admin
 */
router.get('/stats', authenticateToken, requireAdmin, asyncHandler(async (req, res) => {
  // Get total users
  const { count: totalUsers } = await supabaseAdmin
    .from('profiles')
    .select('*', { count: 'exact', head: true });

  // Get active users (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const { count: activeUsers } = await supabaseAdmin
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .gte('last_active_at', thirtyDaysAgo.toISOString());

  // Get total matches
  const { count: totalMatches } = await supabaseAdmin
    .from('matches')
    .select('*', { count: 'exact', head: true })
    .eq('is_mutual_match', true);

  // Get total messages
  const { count: totalMessages } = await supabaseAdmin
    .from('messages')
    .select('*', { count: 'exact', head: true });

  // Get pending verifications
  const { count: verificationsPending } = await supabaseAdmin
    .from('verification_documents')
    .select('*', { count: 'exact', head: true })
    .eq('verification_status', 'pending');

  // Get open reports (you might need to create a reports table)
  const reportsOpen = 0; // Placeholder

  res.json({
    stats: {
      total_users: totalUsers || 0,
      active_users: activeUsers || 0,
      total_matches: totalMatches || 0,
      total_messages: totalMessages || 0,
      verifications_pending: verificationsPending || 0,
      reports_open: reportsOpen
    }
  });
}));

/**
 * @route   GET /api/admin/users
 * @desc    Get all users with admin details
 * @access  Admin
 */
router.get('/users', authenticateToken, requireAdmin, asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search, status } = req.query;
  const offset = (page - 1) * limit;

  let query = supabaseAdmin
    .from('profiles')
    .select(`
      *,
      cultural_backgrounds(*),
      cultural_quiz_results(*)
    `)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  // Apply search filter
  if (search) {
    query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);
  }

  // Apply status filter
  if (status === 'active') {
    query = query.eq('is_active', true);
  } else if (status === 'inactive') {
    query = query.eq('is_active', false);
  } else if (status === 'verified') {
    query = query.eq('is_verified', true);
  }

  const { data: users, error, count } = await query;

  if (error) {
    return res.status(500).json({
      error: 'Failed to fetch users',
      code: 'FETCH_ERROR'
    });
  }

  res.json({
    users,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: count,
      pages: Math.ceil(count / limit)
    }
  });
}));

/**
 * @route   PUT /api/admin/users/:id/status
 * @desc    Update user status (activate/deactivate)
 * @access  Admin
 */
router.put('/users/:id/status', authenticateToken, requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { is_active, reason } = req.body;

  if (typeof is_active !== 'boolean') {
    return res.status(400).json({
      error: 'is_active must be a boolean',
      code: 'INVALID_STATUS'
    });
  }

  const { data: user, error } = await supabaseAdmin
    .from('profiles')
    .update({
      is_active,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return res.status(500).json({
      error: 'Failed to update user status',
      code: 'UPDATE_ERROR'
    });
  }

  // Log admin action
  await supabaseAdmin
    .from('user_activities')
    .insert({
      user_id: req.user.id,
      activity_type: is_active ? 'user_activated' : 'user_deactivated',
      target_user_id: id,
      metadata: { reason, admin_action: true }
    });

  res.json({
    message: `User ${is_active ? 'activated' : 'deactivated'} successfully`,
    user
  });
}));

/**
 * @route   GET /api/admin/reports
 * @desc    Get user reports (placeholder - you'd need to create a reports table)
 * @access  Admin
 */
router.get('/reports', authenticateToken, requireAdmin, asyncHandler(async (req, res) => {
  // This is a placeholder - you would implement a proper reports system
  const mockReports = [
    {
      id: '1',
      reported_user_id: 'user1',
      reporter_user_id: 'user2',
      reason: 'Inappropriate behavior',
      description: 'User sent inappropriate messages',
      status: 'pending',
      created_at: new Date().toISOString()
    }
  ];

  res.json({
    reports: mockReports,
    pagination: {
      page: 1,
      limit: 20,
      total: mockReports.length,
      pages: 1
    }
  });
}));

export default router;