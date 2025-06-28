import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { supabase } from '../config/supabase.js';
import { logger } from '../utils/logger.js';
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Submit verification document
router.post('/documents', [
  body('documentType').isIn(['government_id', 'profile_photo', 'video_selfie']).withMessage('Valid document type required'),
  body('fileUrl').isURL().withMessage('Valid file URL required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { documentType, fileUrl } = req.body;
    const userId = req.user.id;

    // Check if document type already exists for user
    const { data: existingDoc } = await supabase
      .from('verification_documents')
      .select('id, verification_status')
      .eq('user_id', userId)
      .eq('document_type', documentType)
      .single();

    if (existingDoc && existingDoc.verification_status === 'approved') {
      return res.status(400).json({
        error: 'Document type already verified'
      });
    }

    // Insert or update verification document
    const documentData = {
      user_id: userId,
      document_type: documentType,
      file_url: fileUrl,
      verification_status: 'pending'
    };

    const { data, error } = existingDoc
      ? await supabase
          .from('verification_documents')
          .update(documentData)
          .eq('id', existingDoc.id)
          .select()
          .single()
      : await supabase
          .from('verification_documents')
          .insert(documentData)
          .select()
          .single();

    if (error) {
      throw error;
    }

    logger.info(`Verification document submitted: ${documentType} for user ${userId}`);

    res.status(201).json({
      message: 'Verification document submitted successfully',
      document: data
    });

  } catch (error) {
    logger.error(`Submit verification document error: ${error.message}`);
    res.status(500).json({
      error: 'Failed to submit verification document'
    });
  }
});

// Get user's verification documents
router.get('/documents', async (req, res) => {
  try {
    const { data: documents, error } = await supabase
      .from('verification_documents')
      .select('id, document_type, verification_status, verification_notes, verified_at, created_at')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    res.json({
      documents: documents || []
    });

  } catch (error) {
    logger.error(`Get verification documents error: ${error.message}`);
    res.status(500).json({
      error: 'Failed to fetch verification documents'
    });
  }
});

// Admin: Get pending verifications
router.get('/pending', [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('documentType').optional().isIn(['government_id', 'profile_photo', 'video_selfie'])
], requireAdmin, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { page = 1, limit = 20, documentType } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('verification_documents')
      .select(`
        *,
        user:profiles!verification_documents_user_id_fkey (
          id, first_name, last_name, email, profile_photo_url, created_at
        )
      `)
      .eq('verification_status', 'pending')
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (documentType) {
      query = query.eq('document_type', documentType);
    }

    const { data: documents, error, count } = await query;

    if (error) {
      throw error;
    }

    res.json({
      documents: documents || [],
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    logger.error(`Get pending verifications error: ${error.message}`);
    res.status(500).json({
      error: 'Failed to fetch pending verifications'
    });
  }
});

// Admin: Approve or reject verification
router.put('/documents/:documentId/review', [
  param('documentId').isUUID().withMessage('Valid document ID required'),
  body('status').isIn(['approved', 'rejected']).withMessage('Status must be approved or rejected'),
  body('notes').optional().trim().isLength({ max: 500 }).withMessage('Notes must be under 500 characters')
], requireAdmin, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { documentId } = req.params;
    const { status, notes } = req.body;
    const reviewerId = req.user.id;

    // Get document details
    const { data: document, error: docError } = await supabase
      .from('verification_documents')
      .select('user_id, document_type, verification_status')
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      return res.status(404).json({
        error: 'Verification document not found'
      });
    }

    if (document.verification_status !== 'pending') {
      return res.status(400).json({
        error: 'Document has already been reviewed'
      });
    }

    // Update document status
    const { data: updatedDoc, error: updateError } = await supabase
      .from('verification_documents')
      .update({
        verification_status: status,
        verified_by: reviewerId,
        verification_notes: notes,
        verified_at: new Date().toISOString()
      })
      .eq('id', documentId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    // If all required documents are approved, update profile verification
    if (status === 'approved') {
      const { data: userDocs } = await supabase
        .from('verification_documents')
        .select('document_type, verification_status')
        .eq('user_id', document.user_id);

      const requiredDocs = ['government_id', 'profile_photo'];
      const approvedDocs = userDocs?.filter(doc => doc.verification_status === 'approved').map(doc => doc.document_type) || [];
      
      const allRequiredApproved = requiredDocs.every(docType => approvedDocs.includes(docType));

      if (allRequiredApproved) {
        await supabase
          .from('profiles')
          .update({ is_verified: true })
          .eq('id', document.user_id);

        logger.info(`User ${document.user_id} fully verified`);
      }
    }

    logger.info(`Verification document ${documentId} ${status} by admin ${reviewerId}`);

    res.json({
      message: `Document ${status} successfully`,
      document: updatedDoc
    });

  } catch (error) {
    logger.error(`Review verification error: ${error.message}`);
    res.status(500).json({
      error: 'Failed to review verification document'
    });
  }
});

// Get verification statistics (admin)
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    const { data: stats, error } = await supabase
      .rpc('get_verification_stats');

    if (error) {
      // Fallback to manual calculation if RPC doesn't exist
      const [pendingCount, approvedCount, rejectedCount, totalUsers, verifiedUsers] = await Promise.all([
        supabase.from('verification_documents').select('id', { count: 'exact' }).eq('verification_status', 'pending'),
        supabase.from('verification_documents').select('id', { count: 'exact' }).eq('verification_status', 'approved'),
        supabase.from('verification_documents').select('id', { count: 'exact' }).eq('verification_status', 'rejected'),
        supabase.from('profiles').select('id', { count: 'exact' }),
        supabase.from('profiles').select('id', { count: 'exact' }).eq('is_verified', true)
      ]);

      const calculatedStats = {
        pending_documents: pendingCount.count || 0,
        approved_documents: approvedCount.count || 0,
        rejected_documents: rejectedCount.count || 0,
        total_users: totalUsers.count || 0,
        verified_users: verifiedUsers.count || 0,
        verification_rate: totalUsers.count > 0 ? ((verifiedUsers.count || 0) / totalUsers.count * 100).toFixed(2) : 0
      };

      return res.json({ stats: calculatedStats });
    }

    res.json({ stats });

  } catch (error) {
    logger.error(`Get verification stats error: ${error.message}`);
    res.status(500).json({
      error: 'Failed to fetch verification statistics'
    });
  }
});

export default router;