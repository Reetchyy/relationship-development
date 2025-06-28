import express from 'express';
import { supabaseAdmin, supabaseClient } from '../config/supabase.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validate, schemas } from '../middleware/validation.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', asyncHandler(async (req, res) => {
  const { email, password, firstName, lastName } = req.body;

  if (!email || !password || !firstName || !lastName) {
    return res.status(400).json({
      error: 'Email, password, first name, and last name are required',
      code: 'MISSING_FIELDS'
    });
  }

  // Create user in Supabase Auth
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Auto-confirm for development
  });

  if (authError) {
    return res.status(400).json({
      error: authError.message,
      code: 'AUTH_ERROR'
    });
  }

  // Create profile record
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .insert({
      id: authData.user.id,
      first_name: firstName,
      last_name: lastName,
      date_of_birth: new Date('1990-01-01'), // Temporary default
      gender: 'other', // Temporary default
      location_city: 'Unknown',
      location_country: 'Unknown',
    })
    .select()
    .single();

  if (profileError) {
    // Clean up auth user if profile creation fails
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
    
    return res.status(500).json({
      error: 'Failed to create user profile',
      code: 'PROFILE_CREATION_ERROR'
    });
  }

  res.status(201).json({
    message: 'User registered successfully',
    user: {
      id: authData.user.id,
      email: authData.user.email,
      profile
    }
  });
}));

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      error: 'Email and password are required',
      code: 'MISSING_CREDENTIALS'
    });
  }

  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return res.status(401).json({
      error: error.message,
      code: 'LOGIN_FAILED'
    });
  }

  // Get user profile
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single();

  if (profileError) {
    return res.status(500).json({
      error: 'Failed to fetch user profile',
      code: 'PROFILE_FETCH_ERROR'
    });
  }

  res.json({
    message: 'Login successful',
    user: data.user,
    profile,
    session: data.session
  });
}));

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', authenticateToken, asyncHandler(async (req, res) => {
  const { error } = await supabaseClient.auth.signOut();

  if (error) {
    return res.status(500).json({
      error: error.message,
      code: 'LOGOUT_ERROR'
    });
  }

  res.json({
    message: 'Logout successful'
  });
}));

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', authenticateToken, asyncHandler(async (req, res) => {
  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .select(`
      *,
      cultural_backgrounds(*),
      personality_assessments(*),
      user_preferences(*)
    `)
    .eq('id', req.user.id)
    .single();

  if (error) {
    return res.status(404).json({
      error: 'Profile not found',
      code: 'PROFILE_NOT_FOUND'
    });
  }

  res.json({
    user: req.user,
    profile
  });
}));

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh', asyncHandler(async (req, res) => {
  const { refresh_token } = req.body;

  if (!refresh_token) {
    return res.status(400).json({
      error: 'Refresh token is required',
      code: 'MISSING_REFRESH_TOKEN'
    });
  }

  const { data, error } = await supabaseClient.auth.refreshSession({
    refresh_token
  });

  if (error) {
    return res.status(401).json({
      error: error.message,
      code: 'REFRESH_FAILED'
    });
  }

  res.json({
    session: data.session
  });
}));

export default router;