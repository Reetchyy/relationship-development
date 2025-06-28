import { supabaseAdmin, supabaseClient } from '../config/supabase.js';

/**
 * Service class for Supabase operations
 */
export class SupabaseService {
  constructor(client = supabaseAdmin) {
    this.client = client;
  }

  /**
   * Generic CRUD operations
   */
  async create(table, data) {
    const { data: result, error } = await this.client
      .from(table)
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  async findById(table, id, select = '*') {
    const { data, error } = await this.client
      .from(table)
      .select(select)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async findMany(table, options = {}) {
    const {
      select = '*',
      filters = {},
      orderBy = { column: 'created_at', ascending: false },
      limit,
      offset
    } = options;

    let query = this.client.from(table).select(select);

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        query = query.in(key, value);
      } else if (typeof value === 'object' && value.operator) {
        query = query[value.operator](key, value.value);
      } else {
        query = query.eq(key, value);
      }
    });

    // Apply ordering
    query = query.order(orderBy.column, { ascending: orderBy.ascending });

    // Apply pagination
    if (limit) {
      const start = offset || 0;
      query = query.range(start, start + limit - 1);
    }

    const { data, error, count } = await query;

    if (error) throw error;
    return { data, count };
  }

  async update(table, id, data) {
    const { data: result, error } = await this.client
      .from(table)
      .update({
        ...data,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  async delete(table, id) {
    const { error } = await this.client
      .from(table)
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }

  /**
   * Specialized methods for common operations
   */
  async getUserProfile(userId, includeRelations = true) {
    const select = includeRelations
      ? `
          *,
          cultural_backgrounds(*),
          personality_assessments(*),
          user_preferences(*)
        `
      : '*';

    return this.findById('profiles', userId, select);
  }

  async getUserMatches(userId, options = {}) {
    const { status = 'all', limit = 10, offset = 0 } = options;

    let query = this.client
      .from('matches')
      .select(`
        *,
        user1:profiles!matches_user1_id_fkey(*),
        user2:profiles!matches_user2_id_fkey(*)
      `)
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (status === 'mutual') {
      query = query.eq('is_mutual_match', true);
    } else if (status === 'pending') {
      query = query.eq('is_mutual_match', false);
    }

    if (limit) {
      query = query.range(offset, offset + limit - 1);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    return { data, count };
  }

  async getUserConversations(userId, options = {}) {
    const { limit = 20, offset = 0 } = options;

    const { data, error, count } = await this.client
      .from('conversations')
      .select(`
        *,
        user1:profiles!conversations_user1_id_fkey(*),
        user2:profiles!conversations_user2_id_fkey(*),
        match:matches!conversations_match_id_fkey(*)
      `)
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .eq('is_active', true)
      .order('last_message_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return { data, count };
  }

  async getConversationMessages(conversationId, options = {}) {
    const { limit = 50, offset = 0 } = options;

    const { data, error, count } = await this.client
      .from('messages')
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(id, first_name, last_name, profile_photo_url)
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return { data, count };
  }

  /**
   * Real-time subscriptions
   */
  subscribeToUserMessages(userId, callback) {
    return this.client
      .channel('user-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=in.(${userId})`
        },
        callback
      )
      .subscribe();
  }

  subscribeToUserMatches(userId, callback) {
    return this.client
      .channel('user-matches')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'matches',
          filter: `user1_id=eq.${userId}`
        },
        callback
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'matches',
          filter: `user2_id=eq.${userId}`
        },
        callback
      )
      .subscribe();
  }
}

// Export singleton instances
export const supabaseService = new SupabaseService(supabaseAdmin);
export const userSupabaseService = new SupabaseService(supabaseClient);