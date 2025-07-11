import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authenticateToken } from '../middleware/auth.js';
import { uploadProfilePhoto, uploadDocument, uploadVideo, deleteFromCloudinary, cloudinary } from '../config/cloudinary.js';

const router = express.Router();

// Helper function to upload buffer to Cloudinary
const uploadToCloudinary = (buffer, options) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) reject(error);
      else resolve(result);
    }).end(buffer);
  });
};

/**
 * @route   POST /api/upload/profile-photo
 * @desc    Upload profile photo
 * @access  Private
 */
router.post('/profile-photo',
  authenticateToken,
  uploadProfilePhoto.single('profilePhoto'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({
        error: 'No file uploaded',
        code: 'NO_FILE'
      });
    }

    try {
      // Upload to Cloudinary
      const uploadResult = await uploadToCloudinary(req.file.buffer, {
        folder: 'diaspora-connect/profile-photos',
        public_id: `profile_${req.user.id}_${Date.now()}`,
        transformation: [
          { width: 500, height: 500, crop: 'fill', quality: 'auto' },
          { fetch_format: 'auto' }
        ]
      });

      // Update user profile with new photo URL
      const { data: profile, error } = await supabaseAdmin
        .from('profiles')
        .update({
          profile_photo_url: uploadResult.secure_url,
          updated_at: new Date().toISOString()
        })
        .eq('id', req.user.id)
        .select()
        .single();

      if (error) {
        // If database update fails, delete the uploaded file
        await deleteFromCloudinary(uploadResult.public_id);
        throw error;
      }

      res.json({
        message: 'Profile photo uploaded successfully',
        profile_photo_url: uploadResult.secure_url,
        profile
      });

    } catch (error) {
      console.error('Profile photo upload error:', error);
      res.status(500).json({
        error: 'Failed to upload profile photo',
        code: 'UPLOAD_ERROR'
      });
    }
  })
);

/**
 * @route   POST /api/upload/document
 * @desc    Upload identity document
 * @access  Private
 */
router.post('/document',
  authenticateToken,
  uploadDocument.single('document'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({
        error: 'No file uploaded',
        code: 'NO_FILE'
      });
    }

    const { document_type = 'government_id' } = req.body;

    try {
      // Upload to Cloudinary
      const uploadResult = await uploadToCloudinary(req.file.buffer, {
        folder: 'diaspora-connect/documents',
        public_id: `doc_${req.user.id}_${document_type}_${Date.now()}`,
        resource_type: 'auto'
      });

      // Save document record to database
      const { data: document, error } = await supabaseAdmin
        .from('verification_documents')
        .insert({
          user_id: req.user.id,
          document_type,
          file_url: uploadResult.secure_url,
          verification_status: 'pending'
        })
        .select()
        .single();

      if (error) {
        // If database insert fails, delete the uploaded file
        await deleteFromCloudinary(uploadResult.public_id);
        throw error;
      }

      res.json({
        message: 'Document uploaded successfully',
        document
      });

    } catch (error) {
      console.error('Document upload error:', error);
      res.status(500).json({
        error: 'Failed to upload document',
        code: 'UPLOAD_ERROR'
      });
    }
  })
);

/**
 * @route   POST /api/upload/video
 * @desc    Upload video (e.g., video selfie)
 * @access  Private
 */
router.post('/video',
  authenticateToken,
  uploadVideo.single('video'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({
        error: 'No file uploaded',
        code: 'NO_FILE'
      });
    }

    const { document_type = 'video_selfie' } = req.body;

    try {
      // Upload to Cloudinary
      const uploadResult = await uploadToCloudinary(req.file.buffer, {
        folder: 'diaspora-connect/videos',
        public_id: `video_${req.user.id}_${Date.now()}`,
        resource_type: 'video'
      });

      // Save video document record to database
      const { data: document, error } = await supabaseAdmin
        .from('verification_documents')
        .insert({
          user_id: req.user.id,
          document_type,
          file_url: uploadResult.secure_url,
          verification_status: 'pending'
        })
        .select()
        .single();

      if (error) {
        // If database insert fails, delete the uploaded file
        await deleteFromCloudinary(uploadResult.public_id, 'video');
        throw error;
      }

      res.json({
        message: 'Video uploaded successfully',
        document
      });

    } catch (error) {
      console.error('Video upload error:', error);
      res.status(500).json({
        error: 'Failed to upload video',
        code: 'UPLOAD_ERROR'
      });
    }
  })
);

/**
 * @route   DELETE /api/upload/file/:publicId
 * @desc    Delete file from Cloudinary
 * @access  Private
 */
router.delete('/file/:publicId',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { publicId } = req.params;
    const { resource_type = 'image' } = req.query;

    try {
      // Verify the file belongs to the user
      const { data: document } = await supabaseAdmin
        .from('verification_documents')
        .select('*')
        .eq('user_id', req.user.id)
        .like('file_url', `%${publicId}%`)
        .single();

      if (!document) {
        return res.status(404).json({
          error: 'File not found or access denied',
          code: 'FILE_NOT_FOUND'
        });
      }

      // Delete from Cloudinary
      await deleteFromCloudinary(publicId, resource_type);

      // Delete from database
      await supabaseAdmin
        .from('verification_documents')
        .delete()
        .eq('id', document.id);

      res.json({
        message: 'File deleted successfully'
      });

    } catch (error) {
      console.error('File deletion error:', error);
      res.status(500).json({
        error: 'Failed to delete file',
        code: 'DELETE_ERROR'
      });
    }
  })
);

/**
 * @route   GET /api/upload/documents
 * @desc    Get user's uploaded documents
 * @access  Private
 */
router.get('/documents',
  authenticateToken,
  asyncHandler(async (req, res) => {
    try {
      const { data: documents, error } = await supabaseAdmin
        .from('verification_documents')
        .select('*')
        .eq('user_id', req.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      res.json({
        documents: documents || []
      });

    } catch (error) {
      console.error('Get documents error:', error);
      res.status(500).json({
        error: 'Failed to fetch documents',
        code: 'FETCH_ERROR'
      });
    }
  })
);

export default router;