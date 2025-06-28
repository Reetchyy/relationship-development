import { logger } from '../utils/logger.js';
import { supabase } from '../config/supabase.js';

export function setupSocketHandlers(io) {
  // Middleware for socket authentication
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      // Verify token with Supabase
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (error || !user) {
        return next(new Error('Invalid authentication token'));
      }

      socket.userId = user.id;
      socket.user = user;
      next();
    } catch (error) {
      logger.error(`Socket authentication error: ${error.message}`);
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    logger.info(`User ${socket.userId} connected to socket`);

    // Join user to their personal room
    socket.join(`user:${socket.userId}`);

    // Handle joining conversation rooms
    socket.on('join_conversation', async (conversationId) => {
      try {
        // Verify user has access to this conversation
        const { data: conversation, error } = await supabase
          .from('conversations')
          .select('user1_id, user2_id')
          .eq('id', conversationId)
          .single();

        if (error || !conversation) {
          socket.emit('error', { message: 'Conversation not found' });
          return;
        }

        if (conversation.user1_id !== socket.userId && conversation.user2_id !== socket.userId) {
          socket.emit('error', { message: 'Access denied to conversation' });
          return;
        }

        socket.join(`conversation:${conversationId}`);
        logger.info(`User ${socket.userId} joined conversation ${conversationId}`);
        
      } catch (error) {
        logger.error(`Join conversation error: ${error.message}`);
        socket.emit('error', { message: 'Failed to join conversation' });
      }
    });

    // Handle leaving conversation rooms
    socket.on('leave_conversation', (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
      logger.info(`User ${socket.userId} left conversation ${conversationId}`);
    });

    // Handle new messages
    socket.on('send_message', async (data) => {
      try {
        const { conversationId, content, messageType = 'text' } = data;

        // Verify user has access to this conversation
        const { data: conversation, error: convError } = await supabase
          .from('conversations')
          .select('user1_id, user2_id, is_active')
          .eq('id', conversationId)
          .single();

        if (convError || !conversation) {
          socket.emit('error', { message: 'Conversation not found' });
          return;
        }

        if (conversation.user1_id !== socket.userId && conversation.user2_id !== socket.userId) {
          socket.emit('error', { message: 'Access denied to conversation' });
          return;
        }

        if (!conversation.is_active) {
          socket.emit('error', { message: 'Cannot send messages to inactive conversation' });
          return;
        }

        // Create message in database
        const { data: message, error: messageError } = await supabase
          .from('messages')
          .insert({
            conversation_id: conversationId,
            sender_id: socket.userId,
            content,
            message_type: messageType
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
        const otherUserId = conversation.user1_id === socket.userId ? conversation.user2_id : conversation.user1_id;
        const unreadField = conversation.user1_id === socket.userId ? 'user2_unread_count' : 'user1_unread_count';

        await supabase
          .from('conversations')
          .update({
            last_message_at: new Date().toISOString(),
            [unreadField]: supabase.rpc('increment_unread', { conversation_id: conversationId, user_field: unreadField })
          })
          .eq('id', conversationId);

        // Emit message to conversation room
        io.to(`conversation:${conversationId}`).emit('new_message', message);

        // Emit notification to other user if they're not in the conversation room
        const otherUserSockets = await io.in(`user:${otherUserId}`).fetchSockets();
        const otherUserInConversation = otherUserSockets.some(s => 
          s.rooms.has(`conversation:${conversationId}`)
        );

        if (!otherUserInConversation) {
          io.to(`user:${otherUserId}`).emit('message_notification', {
            conversationId,
            senderId: socket.userId,
            senderName: message.sender.first_name,
            content: content.substring(0, 100),
            timestamp: message.created_at
          });
        }

        logger.info(`Message sent from ${socket.userId} to conversation ${conversationId}`);

      } catch (error) {
        logger.error(`Send message error: ${error.message}`);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle typing indicators
    socket.on('typing_start', (conversationId) => {
      socket.to(`conversation:${conversationId}`).emit('user_typing', {
        userId: socket.userId,
        conversationId
      });
    });

    socket.on('typing_stop', (conversationId) => {
      socket.to(`conversation:${conversationId}`).emit('user_stopped_typing', {
        userId: socket.userId,
        conversationId
      });
    });

    // Handle message read receipts
    socket.on('mark_messages_read', async (data) => {
      try {
        const { conversationId, messageIds } = data;

        // Verify user has access to conversation
        const { data: conversation, error: convError } = await supabase
          .from('conversations')
          .select('user1_id, user2_id')
          .eq('id', conversationId)
          .single();

        if (convError || !conversation) {
          return;
        }

        if (conversation.user1_id !== socket.userId && conversation.user2_id !== socket.userId) {
          return;
        }

        // Mark messages as read
        await supabase
          .from('messages')
          .update({ 
            is_read: true, 
            read_at: new Date().toISOString() 
          })
          .in('id', messageIds)
          .neq('sender_id', socket.userId);

        // Update conversation unread count
        const unreadField = conversation.user1_id === socket.userId ? 'user1_unread_count' : 'user2_unread_count';
        await supabase
          .from('conversations')
          .update({ [unreadField]: 0 })
          .eq('id', conversationId);

        // Notify other user about read receipts
        const otherUserId = conversation.user1_id === socket.userId ? conversation.user2_id : conversation.user1_id;
        io.to(`user:${otherUserId}`).emit('messages_read', {
          conversationId,
          messageIds,
          readBy: socket.userId
        });

      } catch (error) {
        logger.error(`Mark messages read error: ${error.message}`);
      }
    });

    // Handle user status updates
    socket.on('update_status', async (status) => {
      try {
        if (['online', 'away', 'busy'].includes(status)) {
          await supabase
            .from('profiles')
            .update({ 
              last_active_at: new Date().toISOString(),
              // You could add a status field to profiles table
            })
            .eq('id', socket.userId);

          // Broadcast status to user's matches
          socket.broadcast.emit('user_status_update', {
            userId: socket.userId,
            status,
            lastActive: new Date().toISOString()
          });
        }
      } catch (error) {
        logger.error(`Update status error: ${error.message}`);
      }
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
      try {
        // Update last active timestamp
        await supabase
          .from('profiles')
          .update({ last_active_at: new Date().toISOString() })
          .eq('id', socket.userId);

        logger.info(`User ${socket.userId} disconnected from socket`);
      } catch (error) {
        logger.error(`Disconnect error: ${error.message}`);
      }
    });
  });

  logger.info('Socket.IO handlers set up successfully');
}