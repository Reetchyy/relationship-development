import React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Heart, 
  MessageSquare, 
  Users, 
  Star, 
  TrendingUp,
  Calendar,
  MapPin,
  Clock,
  Loader2
} from 'lucide-react';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';


export default function Dashboard() {
  const { state } = useAuth();
  const navigate = useNavigate();
  const { user, profile } = state;
  
  // State for real data
  const [stats, setStats] = useState({
    profile_views: 0,
    matches: 0,
    messages: 0,
    endorsements: 0
  });
  const [matchSuggestions, setMatchSuggestions] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  // Provide fallback values if profile data is not available
  const displayName = profile ? `${profile.first_name} ${profile.last_name}` : 'User';
  const firstName = profile?.first_name || 'User';
  const profilePhoto = profile?.profile_photo_url || 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=400';
  const tribe = profile?.cultural_backgrounds?.[0]?.primary_tribe || 'Not specified';
  const location = profile ? `${profile.location_city}, ${profile.location_country}` : 'Location not set';

  // Load dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user?.id) return;
      
      try {
        setLoading(true);
        
        // Load user stats
        const statsResponse = await apiService.getProfileStats(user.id);
        if (statsResponse.stats) {
          setStats(statsResponse.stats);
        }
        
        // Load match suggestions
        const matchesResponse = await apiService.getMatchSuggestions(3);
        if (matchesResponse.suggestions) {
          setMatchSuggestions(matchesResponse.suggestions);
        }
        
        // Load recent activity
        const activityResponse = await apiService.getUserActivities(5);
        if (activityResponse.activities) {
          setRecentActivity(activityResponse.activities);
        }
        
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [user?.id]);

  // Quick action handlers
  const handleDiscoverMatches = () => {
    navigate('/matchmaking');
  };

  const handleViewMessages = () => {
    navigate('/chat');
  };

  const handleViewCommunity = () => {
    navigate('/community');
  };

  const statsCards = [
    { label: 'Profile Views', value: stats.profile_views.toString(), icon: TrendingUp, color: 'text-blue-400' },
    { label: 'Matches', value: stats.matches.toString(), icon: Heart, color: 'text-red-400' },
    { label: 'Messages', value: stats.messages.toString(), icon: MessageSquare, color: 'text-green-400' },
    { label: 'Endorsements', value: stats.endorsements.toString(), icon: Star, color: 'text-yellow-400' },
  ];

  const calculateAge = (dateOfBirth) => {
    const today = new Date();
    const birth = new Date(dateOfBirth);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  const formatLastActive = (lastActiveAt) => {
    if (!lastActiveAt) return 'Recently active';
    
    const now = new Date();
    const lastActive = new Date(lastActiveAt);
    const diffInMinutes = Math.floor((now - lastActive) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return diffInMinutes < 5 ? 'Online now' : `${diffInMinutes} minutes ago`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  };

  const getActivityIcon = (activityType) => {
    switch (activityType) {
      case 'like':
        return <Heart className="w-4 h-4 text-red-400" />;
      case 'message_sent':
        return <MessageSquare className="w-4 h-4 text-blue-400" />;
      case 'profile_view':
        return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'endorsement':
        return <Star className="w-4 h-4 text-yellow-400" />;
      default:
        return <Users className="w-4 h-4 text-slate-400" />;
    }
  };

  const getActivityMessage = (activity) => {
    switch (activity.activity_type) {
      case 'like':
        return 'liked your profile';
      case 'message_sent':
        return 'sent you a message';
      case 'profile_view':
        return 'viewed your profile';
      case 'endorsement':
        return 'endorsed your profile';
      default:
        return 'interacted with your profile';
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary-400 mx-auto mb-4" />
            <p className="text-white/80 text-lg">Loading your dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Welcome Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-6 text-white"
        >
          <div className="flex items-center space-x-4">
            <img
              src={profilePhoto}
              alt={displayName}
              className="w-16 h-16 rounded-full border-4 border-white/20 object-cover"
            />
            <div>
              <h1 className="text-2xl font-bold">Welcome back, {firstName}!</h1>
              <p className="text-primary-100">
                {tribe} • {location}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statsCards.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-4 border border-slate-700"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">{stat.label}</p>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                </div>
                <stat.icon className={`w-8 h-8 ${stat.color}`} />
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Match Suggestions */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700"
            >
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                <Heart className="w-5 h-5 text-red-400 mr-2" />
                Your Best Matches
              </h2>
              
              {matchSuggestions.length > 0 ? (
                <div className="space-y-4">
                  {matchSuggestions.map((match) => (
                    <div
                      key={match.id}
                      className="flex items-center space-x-4 p-4 bg-slate-700/50 rounded-lg hover:bg-slate-700/70 transition-colors cursor-pointer"
                      onClick={() => navigate('/matchmaking')}
                    >
                      <div className="relative">
                        <img
                          src={match.profile_photo_url || 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=400'}
                          alt={`${match.first_name} ${match.last_name}`}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        {formatLastActive(match.last_active_at) === 'Online now' && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-slate-800"></div>
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-1">
                          <h3 className="font-semibold text-white">
                            {match.first_name} {match.last_name}, {calculateAge(match.date_of_birth)}
                          </h3>
                          <div className="flex items-center space-x-1">
                            <Star className="w-4 h-4 text-yellow-400 fill-current" />
                            <span className="text-yellow-400 font-semibold">{match.compatibility_score || 85}%</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 text-sm text-slate-400">
                          <MapPin className="w-3 h-3" />
                          <span>{match.location_city}, {match.location_country}</span>
                          <span>•</span>
                          <span>{match.cultural_backgrounds?.[0]?.primary_tribe || 'Not specified'}</span>
                        </div>
                        
                        <div className="flex items-center space-x-2 text-sm text-slate-400 mt-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatLastActive(match.last_active_at)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Heart className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-400 mb-4">No matches found yet</p>
                  <button
                    onClick={handleDiscoverMatches}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    Discover Matches
                  </button>
                </div>
              )}
              
            <button
              onClick={handleDiscoverMatches}
              className="w-full mt-4 py-2 text-primary-400 hover:text-primary-300 font-medium transition-colors"
            >
              View All Matches
            </button>
            </motion.div>
          </div>

          {/* Recent Activity */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700"
            >
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                <TrendingUp className="w-5 h-5 text-blue-400 mr-2" />
                Recent Activity
              </h2>
              
              {recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        {getActivityIcon(activity.activity_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-300">
                          <span className="font-medium text-white">
                            {activity.target_user?.first_name} {activity.target_user?.last_name}
                          </span>{' '}
                          {getActivityMessage(activity)}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {formatLastActive(activity.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <TrendingUp className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-400">No recent activity</p>
                </div>
              )}
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700 mt-6"
            >
              <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
              
              <div className="space-y-3">
                <button 
                  onClick={handleDiscoverMatches}
                  className="w-full p-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center"
                >
                  <Heart className="w-4 h-4 mr-2" />
                  Discover Matches
                </button>
                
                <button 
                  onClick={handleViewMessages}
                  className="w-full p-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors flex items-center justify-center"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  View Messages
                </button>
                
                <button 
                  onClick={handleViewCommunity}
                  className="w-full p-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors flex items-center justify-center"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Community
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </Layout>
  );
}