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
import Layout from '../components/Layout';
import { api } from '../lib/api';
import toast from 'react-hot-toast';

interface Match {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  location_city: string;
  location_country: string;
  occupation?: string;
  education_level?: string;
  bio?: string;
  profile_photo_url?: string;
  is_verified: boolean;
  last_active_at: string;
  cultural_backgrounds?: Array<{
    primary_tribe: string;
    languages_spoken: string[];
    religion?: string;
  }>;
  compatibility_scores?: {
    overall: number;
    cultural: number;
    personality: number;
    location: number;
  };
}

export default function Matchmaking() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const [likedProfiles, setLikedProfiles] = useState<string[]>([]);
  const [passedProfiles, setPassedProfiles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPerformingAction, setIsPerformingAction] = useState(false);

  const currentMatch = matches[currentIndex];

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    try {
      setIsLoading(true);
      const { matches: newMatches } = await api.discoverMatches(10);
      setMatches(newMatches || []);
      setCurrentIndex(0);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load matches');
      console.error('Load matches error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLike = async () => {
    if (!currentMatch || isPerformingAction) return;
    
    setIsPerformingAction(true);
    try {
      const { isNewMatch } = await api.performMatchAction(currentMatch.id, 'like');
      
      setLikedProfiles([...likedProfiles, currentMatch.id]);
      
      if (isNewMatch) {
        toast.success(`🎉 It's a match with ${currentMatch.first_name}!`);
      } else {
        toast.success(`You liked ${currentMatch.first_name}`);
      }
      
      nextMatch();
    } catch (error: any) {
      toast.error(error.message || 'Failed to like profile');
    } finally {
      setIsPerformingAction(false);
    }
  };

  const handlePass = async () => {
    if (!currentMatch || isPerformingAction) return;
    
    setIsPerformingAction(true);
    try {
      await api.performMatchAction(currentMatch.id, 'pass');
      setPassedProfiles([...passedProfiles, currentMatch.id]);
      nextMatch();
    } catch (error: any) {
      toast.error(error.message || 'Failed to pass profile');
    } finally {
      setIsPerformingAction(false);
    }
  };

  const nextMatch = () => {
    if (currentIndex < matches.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowDetails(false);
    } else {
      // Load more matches when we reach the end
      loadMatches();
    }
  };

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  const getCompatibilityColor = (score: number) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 80) return 'text-primary-400';
    if (score >= 70) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getVerificationBadge = (isVerified: boolean) => {
    return isVerified ? (
      <div className="w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
    ) : (
      <div className="w-3 h-3 bg-slate-500 rounded-full border-2 border-white"></div>
    );
  };

  const getLastActiveText = (lastActive: string) => {
    const now = new Date();
    const lastActiveDate = new Date(lastActive);
    const diffInHours = Math.floor((now.getTime() - lastActiveDate.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Online now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Finding Your Matches</h2>
            <p className="text-slate-400">
              We're discovering culturally compatible profiles for you...
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!currentMatch || matches.length === 0) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Sparkles className="w-16 h-16 text-primary-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">No More Matches</h2>
            <p className="text-slate-400 mb-6">
              You've seen all available matches. Check back later for new profiles!
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

  const age = calculateAge(currentMatch.date_of_birth);
  const culturalBackground = currentMatch.cultural_backgrounds?.[0];
  const compatibility = currentMatch.compatibility_scores;

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
                src={currentMatch.profile_photo_url || 'https://images.pexels.com/photos/3763188/pexels-photo-3763188.jpeg?auto=compress&cs=tinysrgb&w=600'}
                alt={`${currentMatch.first_name} ${currentMatch.last_name}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
              
              {/* Verification Badge */}
              <div className="absolute top-4 right-4">
                {getVerificationBadge(currentMatch.is_verified)}
              </div>

              {/* Online Status */}
              {getLastActiveText(currentMatch.last_active_at) === 'Online now' && (
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
                      {currentMatch.first_name} {currentMatch.last_name}, {age}
                    </h2>
                    <div className="flex items-center space-x-4 text-white/80">
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-4 h-4" />
                        <span>{currentMatch.location_city}, {currentMatch.location_country}</span>
                      </div>
                      {culturalBackground && (
                        <div className="flex items-center space-x-1">
                          <Globe className="w-4 h-4" />
                          <span>{culturalBackground.primary_tribe}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {compatibility && (
                    <div className="flex items-center space-x-1 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className={`font-bold ${getCompatibilityColor(compatibility.overall)}`}>
                        {compatibility.overall}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Compatibility Scores */}
              {compatibility && (
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
              )}

              {/* Quick Info */}
              <div className="space-y-3 mb-6">
                {currentMatch.occupation && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Occupation</span>
                    <span className="text-white font-medium">{currentMatch.occupation}</span>
                  </div>
                )}
                {currentMatch.education_level && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Education</span>
                    <span className="text-white font-medium">{currentMatch.education_level}</span>
                  </div>
                )}
                {culturalBackground?.religion && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Religion</span>
                    <span className="text-white font-medium">{culturalBackground.religion}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Last Active</span>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span className="text-white font-medium">{getLastActiveText(currentMatch.last_active_at)}</span>
                  </div>
                </div>
              </div>

              {/* Languages */}
              {culturalBackground?.languages_spoken && culturalBackground.languages_spoken.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-white font-semibold mb-2">Languages</h4>
                  <div className="flex flex-wrap gap-2">
                    {culturalBackground.languages_spoken.map((language) => (
                      <span
                        key={language}
                        className="px-3 py-1 bg-blue-600/20 text-blue-300 rounded-full text-sm border border-blue-600/30"
                      >
                        {language}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Bio Preview */}
              {currentMatch.bio && (
                <div className="mb-6">
                  <h4 className="text-white font-semibold mb-2">About</h4>
                  <p className="text-slate-300 leading-relaxed">
                    {showDetails 
                      ? currentMatch.bio 
                      : `${currentMatch.bio.slice(0, 120)}${currentMatch.bio.length > 120 ? '...' : ''}`
                    }
                  </p>
                  {currentMatch.bio.length > 120 && (
                    <button
                      onClick={() => setShowDetails(!showDetails)}
                      className="text-primary-400 hover:text-primary-300 text-sm mt-2"
                    >
                      {showDetails ? 'Show less' : 'Read more'}
                    </button>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-center space-x-4">
                <button
                  onClick={handlePass}
                  disabled={isPerformingAction}
                  className="w-16 h-16 bg-slate-600 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <X className="w-8 h-8" />
                </button>
                
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="w-12 h-12 bg-slate-600 hover:bg-blue-600 text-white rounded-full flex items-center justify-center transition-all duration-200"
                >
                  <Info className="w-5 h-5" />
                </button>
                
                <button
                  onClick={handleLike}
                  disabled={isPerformingAction}
                  className="w-16 h-16 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-full flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPerformingAction ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <Heart className="w-8 h-8" />
                  )}
                </button>
                
                <button className="w-12 h-12 bg-slate-600 hover:bg-green-600 text-white rounded-full flex items-center justify-center transition-all duration-200">
                  <MessageSquare className="w-5 h-5" />
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