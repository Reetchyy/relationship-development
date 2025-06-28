import jwt from 'jsonwebtoken';
import { supabase } from '../config/supabase.js';
import { logger } from '../utils/logger.js';

export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No valid authorization token provided'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify the JWT token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      logger.warn(`Authentication failed: ${error?.message || 'Invalid token'}`);
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired token'
      });
    }

    // Get user profile from database
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      logger.error(`Profile fetch error: ${profileError.message}`);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch user profile'
      });
    }

    // Attach user and profile to request
    req.user = user;
    req.profile = profile;
    
    next();
  } catch (error) {
    logger.error(`Auth middleware error: ${error.message}`);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Authentication verification failed'
    });
  }
};

export const requireVerification = (req, res, next) => {
  if (!req.profile?.is_verified) {
    return res.status(403).json({
      error: 'Verification Required',
      message: 'This action requires a verified profile'
    });
  }
  next();
};

export const requireAdmin = (req, res, next) => {
  // Check if user has admin role (you can implement this based on your admin logic)
  const isAdmin = req.user?.user_metadata?.role === 'admin' || 
                  req.user?.email === process.env.ADMIN_EMAIL;
  
  if (!isAdmin) {
    return res.status(403).json({
      error: 'Admin Access Required',
      message: 'This action requires admin privileges'
    });
  }
  next();
};