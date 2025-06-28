import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validate, schemas } from '../middleware/validation.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   GET /api/chat/conversations
 * @desc    Get user's conversations
 * @access  Private
 */
router.get('/conversations', authenticateToken, asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  const { data: conversations, error, count } = await supabaseAdmin
    .from('conversations')
    .select(`
      *,
      user1:profiles!conversations_user1_id_fkey(*),
      user2:profiles!conversations_user2_id_fkey(*),
      match:matches!conversations_match_id_fkey(*)
    `)
    .or(`user1_id.eq.${req.user.id},user2_id.eq.${req.user.id}`)
    .eq('is_active', true)
    .order('last_message_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return res.status(500).json({
      error: 'Failed to fetch conversations',
      code: 'FETCH_ERROR'
    });
  }

  // Transform conversations to show the other user
  const transformedConversations = conversations.map(conv => {
    const isUser1 = conv.user1_id === req.user.id;
    const otherUser = isUser1 ? conv.user2 : conv.user1;
    const unreadCount = isUser1 ? conv.user1_unread_count : conv.user2_unread_count;

    return {
      ...conv,
      other_user: otherUser,
      unread_count: unreadCount
    };
  });

  res.json({
    conversations: transformedConversations,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: count,
      pages: Math.ceil(count / limit)
    }
  });
}));

/**
 * @route   GET /api/chat/conversations/:id/messages
 * @desc    Get messages for a conversation
 * @access  Private
 */
router.get('/conversations/:id/messages', authenticateToken, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;

  // Verify user is part of this conversation
  const { data: conversation, error: convError } = await supabaseAdmin
    .from('conversations')
    .select('user1_id, user2_id')
    .eq('id', id)
    .single();

  if (convError || !conversation) {
    return res.status(404).json({
      error: 'Conversation not found',
      code: 'CONVERSATION_NOT_FOUND'
    });
  }

  if (conversation.user1_id !== req.user.id && conversation.user2_id !== req.user.id) {
    return res.status(403).json({
      error: 'Access denied to this conversation',
      code: 'ACCESS_DENIED'
    });
  }

  // Get messages
  const { data: messages, error, count } = await supabaseAdmin
    .from('messages')
    .select(`
      *,
      sender:profiles!messages_sender_id_fkey(id, first_name, last_name, profile_photo_url)
    `)
    .eq('conversation_id', id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return res.status(500).json({
      error: 'Failed to fetch messages',
      code: 'FETCH_ERROR'
    });
  }

  // Mark messages as read
  await supabaseAdmin
    .from('messages')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('conversation_id', id)
    .neq('sender_id', req.user.id)
    .eq('is_read', false);

  // Reset unread count for current user
  const isUser1 = conversation.user1_id === req.user.id;
  const unreadField = isUser1 ? 'user1_unread_count' : 'user2_unread_count';
  
  await supabaseAdmin
    .from('conversations')
    .update({ [unreadField]: 0 })
    .eq('id', id);

  res.json({
    messages: messages.reverse(), // Return in chronological order
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: count,
      pages: Math.ceil(count / limit)
    }
  });
}));

/**
 * @route   POST /api/chat/conversations/:id/messages
 * @desc    Send a message
 * @access  Private
 */
router.post('/conversations/:id/messages',
  authenticateToken,
  validate(schemas.message),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { content, message_type = 'text', original_language, translated_content } = req.body;

    // Verify user is part of this conversation
    const { data: conversation, error: convError } = await supabaseAdmin
      .from('conversations')
      .select('user1_id, user2_id')
      .eq('id', id)
      .single();

    if (convError || !conversation) {
      return res.status(404).json({
        error: 'Conversation not found',
        code: 'CONVERSATION_NOT_FOUND'
      });
    }

    if (conversation.user1_id !== req.user.id && conversation.user2_id !== req.user.id) {
      return res.status(403).json({
        error: 'Access denied to this conversation',
        code: 'ACCESS_DENIED'
      });
    }

    // Create message
    const { data: message, error } = await supabaseAdmin
      .from('messages')
      .insert({
        conversation_id: id,
        sender_id: req.user.id,
        content,
        message_type,
        original_language,
        translated_content
      })
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(id, first_name, last_name, profile_photo_url)
      `)
      .single();

    if (error) {
      return res.status(500).json({
        error: 'Failed to send message',
        code: 'SEND_ERROR'
      });
    }

    // Update conversation
    const isUser1 = conversation.user1_id === req.user.id;
    const otherUserUnreadField = isUser1 ? 'user2_unread_count' : 'user1_unread_count';
    
    await supabaseAdmin
      .from('conversations')
      .update({
        last_message_at: new Date().toISOString(),
        [otherUserUnreadField]: supabaseAdmin.rpc('increment_unread', { conversation_id: id, is_user1: !isUser1 })
      })
      .eq('id', id);

    // Log activity
    await supabaseAdmin
      .from('user_activities')
      .insert({
        user_id: req.user.id,
        activity_type: 'message_sent',
        target_user_id: isUser1 ? conversation.user2_id : conversation.user1_id,
        metadata: { conversation_id: id, message_type }
      });

    res.status(201).json({
      message: 'Message sent successfully',
      data: message
    });
  })
);

/**
 * @route   PUT /api/chat/messages/:id/read
 * @desc    Mark message as read
 * @access  Private
 */
router.put('/messages/:id/read', authenticateToken, asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Get message and verify access
  const { data: message, error: msgError } = await supabaseAdmin
    .from('messages')
    .select(`
      *,
      conversation:conversations!messages_conversation_id_fkey(user1_id, user2_id)
    `)
    .eq('id', id)
    .single();

  if (msgError || !message) {
    return res.status(404).json({
      error: 'Message not found',
      code: 'MESSAGE_NOT_FOUND'
    });
  }

  // Verify user is recipient
  if (message.sender_id === req.user.id) {
    return res.status(400).json({
      error: 'Cannot mark own message as read',
      code: 'INVALID_OPERATION'
    });
  }

  const conversation = message.conversation;
  if (conversation.user1_id !== req.user.id && conversation.user2_id !== req.user.id) {
    return res.status(403).json({
      error: 'Access denied',
      code: 'ACCESS_DENIED'
    });
  }

  // Mark as read
  const { error } = await supabaseAdmin
    .from('messages')
    .update({
      is_read: true,
      read_at: new Date().toISOString()
    })
    .eq('id', id);

  if (error) {
    return res.status(500).json({
      error: 'Failed to mark message as read',
      code: 'UPDATE_ERROR'
    });
  }

  res.json({
    message: 'Message marked as read'
  });
}));

export default router;