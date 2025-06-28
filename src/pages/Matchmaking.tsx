import React, { useState } from 'react';
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
  Clock
} from 'lucide-react';
import Layout from '../components/Layout';

interface Match {
  id: string;
  name: string;
  age: number;
  location: string;
  tribe: string;
  religion: string;
  occupation: string;
  education: string;
  avatar: string;
  photos: string[];
  bio: string;
  languages: string[];
  interests: string[];
  compatibilityScore: number;
  culturalAlignment: number;
  personalityMatch: number;
  lastActive: string;
  verificationStatus: 'verified' | 'pending' | 'unverified';
}

const mockMatches: Match[] = [
  {
    id: '1',
    name: 'Kemi Adebayo',
    age: 28,
    location: 'Toronto, Canada',
    tribe: 'Yoruba',
    religion: 'Christian',
    occupation: 'Marketing Manager',
    education: 'Bachelor\'s in Business',
    avatar: 'https://images.pexels.com/photos/3763188/pexels-photo-3763188.jpeg?auto=compress&cs=tinysrgb&w=600',
    photos: [
      'https://images.pexels.com/photos/3763188/pexels-photo-3763188.jpeg?auto=compress&cs=tinysrgb&w=600',
      'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=600'
    ],
    bio: 'Born in Lagos, raised in Toronto. I love connecting with my Yoruba heritage through food, music, and community events. Looking for someone who values family and cultural traditions.',
    languages: ['English', 'Yoruba'],
    interests: ['Traditional Music', 'Cooking', 'Travel', 'Community Service', 'Dancing'],
    compatibilityScore: 94,
    culturalAlignment: 96,
    personalityMatch: 92,
    lastActive: '2 hours ago',
    verificationStatus: 'verified',
  },
  {
    id: '2',
    name: 'Kwame Asante',
    age: 32,
    location: 'London, UK',
    tribe: 'Akan',
    religion: 'Christian',
    occupation: 'Software Engineer',
    education: 'Master\'s in Computer Science',
    avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=600',
    photos: [
      'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=600'
    ],
    bio: 'Tech enthusiast with deep respect for Ghanaian traditions. I believe in balancing modern life with ancestral wisdom. Family-oriented and looking for genuine connection.',
    languages: ['English', 'Twi', 'French'],
    interests: ['Technology', 'Traditional Crafts', 'Football', 'Music Production', 'Mentoring'],
    compatibilityScore: 89,
    culturalAlignment: 91,
    personalityMatch: 87,
    lastActive: '1 day ago',
    verificationStatus: 'verified',
  },
  {
    id: '3',
    name: 'Zara Okonkwo',
    age: 26,
    location: 'Berlin, Germany',
    tribe: 'Igbo',
    religion: 'Christian',
    occupation: 'Medical Resident',
    education: 'Doctor of Medicine',
    avatar: 'https://images.pexels.com/photos/3762800/pexels-photo-3762800.jpeg?auto=compress&cs=tinysrgb&w=600',
    photos: [
      'https://images.pexels.com/photos/3762800/pexels-photo-3762800.jpeg?auto=compress&cs=tinysrgb&w=600'
    ],
    bio: 'Dedicated to healing and helping others. Strong believer in Igbo values of community, respect, and hard work. Looking for a partner who shares my commitment to making a difference.',
    languages: ['English', 'Igbo', 'German'],
    interests: ['Medicine', 'Community Health', 'Literature', 'Cultural Festivals', 'Volunteering'],
    compatibilityScore: 87,
    culturalAlignment: 89,
    personalityMatch: 85,
    lastActive: 'Online now',
    verificationStatus: 'verified',
  },
];

export default function Matchmaking() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const [matches, setMatches] = useState(mockMatches);
  const [likedProfiles, setLikedProfiles] = useState<string[]>([]);
  const [passedProfiles, setPassedProfiles] = useState<string[]>([]);

  const currentMatch = matches[currentIndex];

  const handleLike = () => {
    if (currentMatch) {
      setLikedProfiles([...likedProfiles, currentMatch.id]);
      nextMatch();
    }
  };

  const handlePass = () => {
    if (currentMatch) {
      setPassedProfiles([...passedProfiles, currentMatch.id]);
      nextMatch();
    }
  };

  const nextMatch = () => {
    if (currentIndex < matches.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowDetails(false);
    }
  };

  const getCompatibilityColor = (score: number) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 80) return 'text-primary-400';
    if (score >= 70) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getVerificationBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <div className="w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>;
      case 'pending':
        return <div className="w-3 h-3 bg-yellow-500 rounded-full border-2 border-white"></div>;
      default:
        return <div className="w-3 h-3 bg-slate-500 rounded-full border-2 border-white"></div>;
    }
  };

  if (!currentMatch) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Sparkles className="w-16 h-16 text-primary-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">No More Matches</h2>
            <p className="text-slate-400 mb-6">
              You've seen all available matches. Check back later for new profiles!
            </p>
            <button className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
              Adjust Preferences
            </button>
          </div>
        </div>
      </Layout>
    );
  }

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
                src={currentMatch.avatar}
                alt={currentMatch.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
              
              {/* Verification Badge */}
              <div className="absolute top-4 right-4">
                {getVerificationBadge(currentMatch.verificationStatus)}
              </div>

              {/* Online Status */}
              {currentMatch.lastActive === 'Online now' && (
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
                      {currentMatch.name}, {currentMatch.age}
                    </h2>
                    <div className="flex items-center space-x-4 text-white/80">
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-4 h-4" />
                        <span>{currentMatch.location}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Globe className="w-4 h-4" />
                        <span>{currentMatch.tribe}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-1 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className={`font-bold ${getCompatibilityColor(currentMatch.compatibilityScore)}`}>
                      {currentMatch.compatibilityScore}%
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
                  <div className={`text-2xl font-bold ${getCompatibilityColor(currentMatch.compatibilityScore)}`}>
                    {currentMatch.compatibilityScore}%
                  </div>
                  <div className="text-sm text-slate-400">Overall</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getCompatibilityColor(currentMatch.culturalAlignment)}`}>
                    {currentMatch.culturalAlignment}%
                  </div>
                  <div className="text-sm text-slate-400">Cultural</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getCompatibilityColor(currentMatch.personalityMatch)}`}>
                    {currentMatch.personalityMatch}%
                  </div>
                  <div className="text-sm text-slate-400">Personality</div>
                </div>
              </div>

              {/* Quick Info */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Occupation</span>
                  <span className="text-white font-medium">{currentMatch.occupation}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Education</span>
                  <span className="text-white font-medium">{currentMatch.education}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Religion</span>
                  <span className="text-white font-medium">{currentMatch.religion}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Last Active</span>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span className="text-white font-medium">{currentMatch.lastActive}</span>
                  </div>
                </div>
              </div>

              {/* Languages */}
              <div className="mb-6">
                <h4 className="text-white font-semibold mb-2">Languages</h4>
                <div className="flex flex-wrap gap-2">
                  {currentMatch.languages.map((language) => (
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
              <div className="mb-6">
                <h4 className="text-white font-semibold mb-2">Interests</h4>
                <div className="flex flex-wrap gap-2">
                  {currentMatch.interests.slice(0, 4).map((interest) => (
                    <span
                      key={interest}
                      className="px-3 py-1 bg-primary-600/20 text-primary-300 rounded-full text-sm border border-primary-600/30"
                    >
                      {interest}
                    </span>
                  ))}
                  {currentMatch.interests.length > 4 && (
                    <span className="text-slate-400 text-sm">
                      +{currentMatch.interests.length - 4} more
                    </span>
                  )}
                </div>
              </div>

              {/* Bio Preview */}
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

              {/* Action Buttons */}
              <div className="flex items-center justify-center space-x-4">
                <button
                  onClick={handlePass}
                  className="w-16 h-16 bg-slate-600 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
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
                  className="w-16 h-16 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-full flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <Heart className="w-8 h-8" />
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