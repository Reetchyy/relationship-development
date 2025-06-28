import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { supabase } from '../config/supabase.js';
import { logger } from '../utils/logger.js';
import { requireVerification } from '../middleware/auth.js';

const router = express.Router();

// Get user's conversations
router.get('/conversations', [
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

    const { page = 1, limit = 20 } = req.query;
    const userId = req.user.id;
    const offset = (page - 1) * limit;

    const { data: conversations, error, count } = await supabase
      .from('conversations')
      .select(`
        *,
        match:matches (
          id, compatibility_score, is_mutual_match
        ),
        user1:profiles!conversations_user1_id_fkey (
          id, first_name, last_name, profile_photo_url, is_verified
        ),
        user2:profiles!conversations_user2_id_fkey (
          id, first_name, last_name, profile_photo_url, is_verified
        ),
        last_message:messages (
          id, content, message_type, created_at, sender_id
        )
      `)
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .eq('is_active', true)
      .order('last_message_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    // Format conversations to show the other user
    const formattedConversations = conversations?.map(conv => {
      const otherUser = conv.user1_id === userId ? conv.user2 : conv.user1;
      const unreadCount = conv.user1_id === userId ? conv.user1_unread_count : conv.user2_unread_count;
      
      return {
        id: conv.id,
        match_id: conv.match_id,
        other_user: otherUser,
        last_message: conv.last_message?.[0] || null,
        last_message_at: conv.last_message_at,
        unread_count: unreadCount,
        is_active: conv.is_active,
        match: conv.match,
        created_at: conv.created_at
      };
    }) || [];

    res.json({
      conversations: formattedConversations,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    logger.error(`Get conversations error: ${error.message}`);
    res.status(500).json({
      error: 'Failed to fetch conversations'
    });
  }
});

// Get messages for a conversation
router.get('/conversations/:conversationId/messages', [
  param('conversationId').isUUID().withMessage('Valid conversation ID required'),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt()
], requireVerification, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const userId = req.user.id;
    const offset = (page - 1) * limit;

    // Verify user has access to this conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('user1_id, user2_id')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      return res.status(404).json({
        error: 'Conversation not found'
      });
    }

    if (conversation.user1_id !== userId && conversation.user2_id !== userId) {
      return res.status(403).json({
        error: 'Access denied to this conversation'
      });
    }

    // Get messages
    const { data: messages, error, count } = await supabase
      .from('messages')
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey (
          id, first_name, last_name, profile_photo_url
        )
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    // Mark messages as read
    const unreadMessageIds = messages
      ?.filter(msg => msg.sender_id !== userId && !msg.is_read)
      .map(msg => msg.id) || [];

    if (unreadMessageIds.length > 0) {
      await supabase
        .from('messages')
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .in('id', unreadMessageIds);

      // Update conversation unread count
      const unreadField = conversation.user1_id === userId ? 'user1_unread_count' : 'user2_unread_count';
      await supabase
        .from('conversations')
        .update({ [unreadField]: 0 })
        .eq('id', conversationId);
    }

    res.json({
      messages: messages?.reverse() || [], // Reverse to show oldest first
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    logger.error(`Get messages error: ${error.message}`);
    res.status(500).json({
      error: 'Failed to fetch messages'
    });
  }
});

// Send a message
router.post('/conversations/:conversationId/messages', [
  param('conversationId').isUUID().withMessage('Valid conversation ID required'),
  body('content').trim().isLength({ min: 1, max: 2000 }).withMessage('Message content is required and must be under 2000 characters'),
  body('messageType').optional().isIn(['text', 'image', 'voice', 'video']).withMessage('Invalid message type')
], requireVerification, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { conversationId } = req.params;
    const { content, messageType = 'text', originalLanguage } = req.body;
    const userId = req.user.id;

    // Verify user has access to this conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('user1_id, user2_id, is_active')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      return res.status(404).json({
        error: 'Conversation not found'
      });
    }

    if (conversation.user1_id !== userId && conversation.user2_id !== userId) {
      return res.status(403).json({
        error: 'Access denied to this conversation'
      });
    }

    if (!conversation.is_active) {
      return res.status(400).json({
        error: 'Cannot send messages to inactive conversation'
      });
    }

    // Create message
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: userId,
        content,
        message_type: messageType,
        original_language: originalLanguage
      })
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey (
          id, first_name, last_name, profile_photo_url
        )
      `)
      .single();

    if (messageError) {
      throw messageError;
    }

    // Update conversation
    const otherUserId = conversation.user1_id === userId ? conversation.user2_id : conversation.user1_id;
    const unreadField = conversation.user1_id === userId ? 'user2_unread_count' : 'user1_unread_count';

    await supabase
      .from('conversations')
      .update({
        last_message_at: new Date().toISOString(),
        [unreadField]: supabase.rpc('increment_unread', { conversation_id: conversationId, user_field: unreadField })
      })
      .eq('id', conversationId);

    // Log activity
    await supabase
      .from('user_activities')
      .insert({
        user_id: userId,
        activity_type: 'message_sent',
        target_user_id: otherUserId,
        metadata: {
          conversation_id: conversationId,
          message_id: message.id
        }
      });

    logger.info(`Message sent from ${userId} to ${otherUserId} in conversation ${conversationId}`);

    res.status(201).json({
      message: 'Message sent successfully',
      data: message
    });

  } catch (error) {
    logger.error(`Send message error: ${error.message}`);
    res.status(500).json({
      error: 'Failed to send message'
    });
  }
});

// Delete a message
router.delete('/messages/:messageId', [
  param('messageId').isUUID().withMessage('Valid message ID required')
], requireVerification, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { messageId } = req.params;
    const userId = req.user.id;

    // Verify user owns this message
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .select('sender_id, conversation_id, created_at')
      .eq('id', messageId)
      .single();

    if (messageError || !message) {
      return res.status(404).json({
        error: 'Message not found'
      });
    }

    if (message.sender_id !== userId) {
      return res.status(403).json({
        error: 'Can only delete your own messages'
      });
    }

    // Check if message is recent (allow deletion within 5 minutes)
    const messageTime = new Date(message.created_at);
    const now = new Date();
    const timeDiff = (now.getTime() - messageTime.getTime()) / (1000 * 60); // minutes

    if (timeDiff > 5) {
      return res.status(400).json({
        error: 'Can only delete messages within 5 minutes of sending'
      });
    }

    // Delete message
    const { error: deleteError } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId);

    if (deleteError) {
      throw deleteError;
    }

    logger.info(`Message ${messageId} deleted by user ${userId}`);

    res.json({
      message: 'Message deleted successfully'
    });

  } catch (error) {
    logger.error(`Delete message error: ${error.message}`);
    res.status(500).json({
      error: 'Failed to delete message'
    });
  }
});

export default router;