import jwt from 'jsonwebtoken';
import { supabaseAdmin } from '../config/supabase.js';

/**
 * Middleware to authenticate requests using JWT tokens
 */
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    console.log('🔐 Auth check - Header present:', !!authHeader);
    console.log('🔐 Auth check - Token extracted:', !!token);

    if (!token) {
      console.log('❌ No token provided');
      return res.status(401).json({
        error: 'Access token required',
        code: 'MISSING_TOKEN'
      });
    }

    // Verify the JWT token with Supabase
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      console.log('❌ Token validation failed:', error?.message);
      return res.status(401).json({
        error: 'Invalid or expired token',
        code: 'INVALID_TOKEN'
      });
    }

    console.log('✅ User authenticated:', user.id);

    // Attach user to request object
    req.user = user;
    req.token = token;
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({
      error: 'Authentication failed',
      code: 'AUTH_ERROR'
    });
  }
};

/**
 * Middleware to check if user is admin
 */
export const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    // Check if user has admin role in profiles table
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (error || !profile) {
      return res.status(403).json({
        error: 'Profile not found',
        code: 'PROFILE_NOT_FOUND'
      });
    }

    // Check admin status (you might want to add an is_admin column to profiles)
    const isAdmin = profile.email?.includes('admin') || false; // Temporary check

    if (!isAdmin) {
      return res.status(403).json({
        error: 'Admin access required',
        code: 'ADMIN_REQUIRED'
      });
    }

    req.profile = profile;
    next();
  } catch (error) {
    console.error('Admin check error:', error);
    return res.status(500).json({
      error: 'Authorization check failed',
      code: 'AUTH_CHECK_ERROR'
    });
  }
};

/**
 * Optional authentication - doesn't fail if no token provided
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
      if (!error && user) {
        req.user = user;
        req.token = token;
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};