import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: string;
  created_at: string;
  is_read: boolean;
}

interface UseRealTimeChatProps {
  conversationId?: string;
  onNewMessage?: (message: Message) => void;
  onMessageUpdate?: (message: Message) => void;
  onTyping?: (userId: string, isTyping: boolean) => void;
}

export function useRealTimeChat({
  conversationId,
  onNewMessage,
  onMessageUpdate,
  onTyping
}: UseRealTimeChatProps) {
  const { state } = useAuth();
  const channelRef = useRef<any>(null);

  const subscribeToMessages = useCallback(() => {
    if (!conversationId || !state.user?.id) return;

    // Clean up existing subscription
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    // Create new subscription
    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          console.log('New message received:', payload);
          if (onNewMessage && payload.new) {
            onNewMessage(payload.new as Message);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          console.log('Message updated:', payload);
          if (onMessageUpdate && payload.new) {
            onMessageUpdate(payload.new as Message);
          }
        }
      )
      .subscribe((status) => {
        console.log('Real-time subscription status:', status);
      });

    channelRef.current = channel;
  }, [conversationId, state.user?.id, onNewMessage, onMessageUpdate]);

  const subscribeToTyping = useCallback(() => {
    if (!conversationId || !state.user?.id) return;

    const typingChannel = supabase
      .channel(`typing:${conversationId}`)
      .on('broadcast', { event: 'typing' }, (payload) => {
        if (onTyping && payload.payload.userId !== state.user?.id) {
          onTyping(payload.payload.userId, payload.payload.isTyping);
        }
      })
      .subscribe();

    return typingChannel;
  }, [conversationId, state.user?.id, onTyping]);

  const sendTypingIndicator = useCallback((isTyping: boolean) => {
    if (!conversationId || !state.user?.id) return;

    const channel = supabase.channel(`typing:${conversationId}`);
    channel.send({
      type: 'broadcast',
      event: 'typing',
      payload: {
        userId: state.user.id,
        isTyping
      }
    });
  }, [conversationId, state.user?.id]);

  useEffect(() => {
    subscribeToMessages();
    const typingChannel = subscribeToTyping();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
      if (typingChannel) {
        supabase.removeChannel(typingChannel);
      }
    };
  }, [subscribeToMessages, subscribeToTyping]);

  return {
    sendTypingIndicator
  };
}

export default useRealTimeChat;