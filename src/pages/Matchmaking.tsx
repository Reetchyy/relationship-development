import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, 
  X, 
  Star, 
  MapPin, 
  Globe, 
  MessageSquare, 
  Info,
  Sparkles,
  Users,
  Clock,
  Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';

interface MatchUser {
  id: string;
  first_name: string;
  last_name: string;
  age: number;
  location_city: string;
  location_country: string;
  occupation: string;
  education_level: string;
  profile_photo_url: string;
  bio: string;
  is_verified: boolean;
  last_active_at: string;
  cultural_backgrounds?: {
    primary_tribe: string;
    languages_spoken: string[];
    religion: string;
  }[];
  compatibility_scores?: {
    overall: number;
    cultural: number;
    personality: number;
    location: number;
  };
}


export default function Matchmaking() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const [matches, setMatches] = useState<MatchUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [likedProfiles, setLikedProfiles] = useState<string[]>([]);
  const [passedProfiles, setPassedProfiles] = useState<string[]>([]);
  const { state } = useAuth();

  const currentMatch = matches[currentIndex];

  // Load match suggestions on component mount
  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    try {
      setLoading(true);
      const response = await apiService.getMatchSuggestions(10);
      
      if (response.suggestions && response.suggestions.length > 0) {
        setMatches(response.suggestions);
      } else {
        setMatches([]);
      }
    } catch (error: any) {
      console.error('Failed to load matches:', error);
      toast.error('Failed to load potential matches');
      setMatches([]);
    } finally {
      setLoading(false);
    }
  };

  const performMatchAction = async (action: 'like' | 'pass' | 'super_like') => {
    if (!currentMatch || actionLoading) return;

    try {
      setActionLoading(true);
      
      await apiService.performMatchAction(currentMatch.id, action);
      
      if (action === 'like') {
        setLikedProfiles([...likedProfiles, currentMatch.id]);
        toast.success('Profile liked! 💖');
      } else if (action === 'super_like') {
        setLikedProfiles([...likedProfiles, currentMatch.id]);
        toast.success('Super liked! ⭐');
      } else {
        setPassedProfiles([...passedProfiles, currentMatch.id]);
      }
      
      nextMatch();
    } catch (error: any) {
      console.error('Match action failed:', error);
      toast.error('Action failed. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLike = () => {
    performMatchAction('like');
  };

  const handlePass = () => {
    performMatchAction('pass');
  };

  const handleSuperLike = () => {
    performMatchAction('super_like');
  };

  const nextMatch = () => {
    if (currentIndex < matches.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowDetails(false);
    } else {
      // Load more matches when we reach the end
      loadMatches();
      setCurrentIndex(0);
    }
  };

  const calculateAge = (dateOfBirth: string): number => {
    const today = new Date();
    const birth = new Date(dateOfBirth);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  const formatLastActive = (lastActiveAt: string): string => {
    if (!lastActiveAt) return 'Recently active';
    
    const now = new Date();
    const lastActive = new Date(lastActiveAt);
    const diffInMinutes = Math.floor((now.getTime() - lastActive.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 5) return 'Online now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    }
    const days = Math.floor(diffInMinutes / 1440);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  const getCompatibilityColor = (score: number) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 80) return 'text-primary-400';
    if (score >= 70) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getVerificationBadge = (isVerified: boolean) => {
    return isVerified 
      ? <div className="w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
      : <div className="w-3 h-3 bg-slate-500 rounded-full border-2 border-white"></div>;
  };

  // Loading state
  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Finding Your Matches</h2>
            <p className="text-slate-400">
              Discovering culturally compatible profiles...
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  // No matches state
  if (!currentMatch) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Sparkles className="w-16 h-16 text-primary-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">No More Matches</h2>
            <p className="text-slate-400 mb-6">
              {matches.length === 0 
                ? "No potential matches found. Try adjusting your preferences or check back later for new profiles!"
                : "You've seen all available matches. Check back later for new profiles!"
              }
            </p>
            <button 
              onClick={loadMatches}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Refresh Matches
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  // Get user data with fallbacks
  const displayName = `${currentMatch.first_name} ${currentMatch.last_name}`;
  const age = calculateAge(currentMatch.date_of_birth || '1990-01-01');
  const location = `${currentMatch.location_city}, ${currentMatch.location_country}`;
  const tribe = currentMatch.cultural_backgrounds?.[0]?.primary_tribe || 'Not specified';
  const religion = currentMatch.cultural_backgrounds?.[0]?.religion || 'Not specified';
  const languages = currentMatch.cultural_backgrounds?.[0]?.languages_spoken || ['English'];
  const profilePhoto = currentMatch.profile_photo_url || 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=600';
  const compatibility = currentMatch.compatibility_scores || { overall: 75, cultural: 80, personality: 70, location: 75 };
  const lastActive = formatLastActive(currentMatch.last_active_at);

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">Discover Your Match</h1>
          <p className="text-slate-400">
            {matches.length - currentIndex} profiles remaining
          </p>
        </div>

        {/* Main Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentMatch.id}
            initial={{ opacity: 0, scale: 0.8, rotateY: -90 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            exit={{ opacity: 0, scale: 0.8, rotateY: 90 }}
            transition={{ duration: 0.6, type: "spring" }}
            className="relative bg-slate-800/50 backdrop-blur-sm rounded-2xl overflow-hidden border border-slate-700 shadow-2xl"
          >
            {/* Hero Image */}
            <div className="relative h-96 md:h-[500px]">
              <img
                src={profilePhoto}
                alt={displayName}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
              
              {/* Verification Badge */}
              <div className="absolute top-4 right-4">
                {getVerificationBadge(currentMatch.is_verified)}
              </div>

              {/* Online Status */}
              {lastActive === 'Online now' && (
                <div className="absolute top-4 left-4 flex items-center space-x-2 bg-green-500/20 backdrop-blur-sm rounded-full px-3 py-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-green-300 text-sm font-medium">Online</span>
                </div>
              )}

              {/* Basic Info Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <div className="flex items-end justify-between">
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-1">
                      {displayName}, {age}
                    </h2>
                    <div className="flex items-center space-x-4 text-white/80">
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-4 h-4" />
                        <span>{location}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Globe className="w-4 h-4" />
                        <span>{tribe}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-1 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className={`font-bold ${getCompatibilityColor(compatibility.overall)}`}>
                      {compatibility.overall}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Compatibility Scores */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getCompatibilityColor(compatibility.overall)}`}>
                    {compatibility.overall}%
                  </div>
                  <div className="text-sm text-slate-400">Overall</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getCompatibilityColor(compatibility.cultural)}`}>
                    {compatibility.cultural}%
                  </div>
                  <div className="text-sm text-slate-400">Cultural</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getCompatibilityColor(compatibility.personality)}`}>
                    {compatibility.personality}%
                  </div>
                  <div className="text-sm text-slate-400">Personality</div>
                </div>
              </div>

              {/* Quick Info */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Occupation</span>
                  <span className="text-white font-medium">{currentMatch.occupation || 'Not specified'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Education</span>
                  <span className="text-white font-medium">{currentMatch.education_level || 'Not specified'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Religion</span>
                  <span className="text-white font-medium">{religion}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Last Active</span>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span className="text-white font-medium">{lastActive}</span>
                  </div>
                </div>
              </div>

              {/* Languages */}
              <div className="mb-6">
                <h4 className="text-white font-semibold mb-2">Languages</h4>
                <div className="flex flex-wrap gap-2">
                  {languages.map((language) => (
                    <span
                      key={language}
                      className="px-3 py-1 bg-blue-600/20 text-blue-300 rounded-full text-sm border border-blue-600/30"
                    >
                      {language}
                    </span>
                  ))}
                </div>
              </div>

              {/* Interests */}

              {/* Bio Preview */}
              <div className="mb-6">
                <h4 className="text-white font-semibold mb-2">About</h4>
                <p className="text-slate-300 leading-relaxed">
                  {showDetails 
                    ? (currentMatch.bio || 'No bio available.')
                    : `${(currentMatch.bio || 'No bio available.').slice(0, 120)}${(currentMatch.bio || '').length > 120 ? '...' : ''}`
                  }
                </p>
                {(currentMatch.bio || '').length > 120 && (
                  <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="text-primary-400 hover:text-primary-300 text-sm mt-2"
                  >
                    {showDetails ? 'Show less' : 'Read more'}
                  </button>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-center space-x-4">
                <button
                  onClick={handlePass}
                  disabled={actionLoading}
                  className="w-16 h-16 bg-slate-600 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <X className="w-8 h-8" />}
                </button>
                
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="w-12 h-12 bg-slate-600 hover:bg-blue-600 text-white rounded-full flex items-center justify-center transition-all duration-200"
                >
                  <Info className="w-5 h-5" />
                </button>
                
                <button
                  onClick={handleLike}
                  disabled={actionLoading}
                  className="w-16 h-16 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-full flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Heart className="w-8 h-8" />}
                </button>
                
                <button 
                  onClick={handleSuperLike}
                  disabled={actionLoading}
                  className="w-12 h-12 bg-slate-600 hover:bg-yellow-600 text-white rounded-full flex items-center justify-center transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Star className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Match Stats */}
        <div className="mt-6 bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2 text-green-400">
              <Heart className="w-4 h-4" />
              <span>{likedProfiles.length} Liked</span>
            </div>
            <div className="flex items-center space-x-2 text-slate-400">
              <Users className="w-4 h-4" />
              <span>Profile {currentIndex + 1} of {matches.length}</span>
            </div>
            <div className="flex items-center space-x-2 text-slate-400">
              <X className="w-4 h-4" />
              <span>{passedProfiles.length} Passed</span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}