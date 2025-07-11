import React from 'react';
import { motion } from 'framer-motion';
import { 
  Heart, 
  MessageSquare, 
  Users, 
  Star, 
  TrendingUp,
  Calendar,
  MapPin,
  Clock
} from 'lucide-react';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';

interface MatchSuggestion {
  id: string;
  name: string;
  age: number;
  location: string;
  tribe: string;
  compatibilityScore: number;
  avatar: string;
  languages: string[];
  lastActive: string;
}

interface RecentActivity {
  id: string;
  type: 'like' | 'message' | 'match' | 'endorsement';
  user: string;
  avatar: string;
  time: string;
  content: string;
}

const mockMatches: MatchSuggestion[] = [
  {
    id: '1',
    name: 'Kemi Adebayo',
    age: 28,
    location: 'Toronto, Canada',
    tribe: 'Yoruba',
    compatibilityScore: 94,
    avatar: 'https://images.pexels.com/photos/3763188/pexels-photo-3763188.jpeg?auto=compress&cs=tinysrgb&w=400',
    languages: ['English', 'Yoruba'],
    lastActive: '2 hours ago'
  },
  {
    id: '2',
    name: 'Kwame Asante',
    age: 32,
    location: 'London, UK',
    tribe: 'Akan',
    compatibilityScore: 89,
    avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=400',
    languages: ['English', 'Twi'],
    lastActive: '1 day ago'
  },
  {
    id: '3',
    name: 'Zara Okonkwo',
    age: 26,
    location: 'Berlin, Germany',
    tribe: 'Igbo',
    compatibilityScore: 87,
    avatar: 'https://images.pexels.com/photos/3763188/pexels-photo-3763188.jpeg?auto=compress&cs=tinysrgb&w=400',
    languages: ['English', 'Igbo', 'German'],
    lastActive: 'Online now'
  }
];

const recentActivity: RecentActivity[] = [
  {
    id: '1',
    type: 'match',
    user: 'Amara Okafor',
    avatar: 'https://images.pexels.com/photos/3763188/pexels-photo-3763188.jpeg?auto=compress&cs=tinysrgb&w=400',
    time: '2 hours ago',
    content: 'You have a new match!'
  },
  {
    id: '2',
    type: 'endorsement',
    user: 'Cousin Sarah',
    avatar: 'https://images.pexels.com/photos/3763188/pexels-photo-3763188.jpeg?auto=compress&cs=tinysrgb&w=400',
    time: '4 hours ago',
    content: 'endorsed your profile for cultural authenticity'
  },
  {
    id: '3',
    type: 'message',
    user: 'Dele Akinola',
    avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=400',
    time: '1 day ago',
    content: 'sent you a message about your shared interest in traditional music'
  }
];

export default function Dashboard() {
  const { state } = useAuth();
  const { user, profile } = state;

  // Provide fallback values if profile data is not available
  const displayName = profile ? `${profile.first_name} ${profile.last_name}` : 'User';
  const firstName = profile?.first_name || 'User';
  const profilePhoto = profile?.profile_photo_url || 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=400';
  const tribe = profile?.cultural_backgrounds?.[0]?.primary_tribe || 'Not specified';
  const location = profile ? `${profile.location_city}, ${profile.location_country}` : 'Location not set';

  const stats = [
    { label: 'Profile Views', value: '47', icon: TrendingUp, color: 'text-blue-400' },
    { label: 'Matches', value: '12', icon: Heart, color: 'text-red-400' },
    { label: 'Messages', value: '8', icon: MessageSquare, color: 'text-green-400' },
    { label: 'Endorsements', value: '15', icon: Star, color: 'text-yellow-400' },
  ];

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
          {stats.map((stat, index) => (
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
              
              <div className="space-y-4">
                {mockMatches.map((match) => (
                  <div
                    key={match.id}
                    className="flex items-center space-x-4 p-4 bg-slate-700/50 rounded-lg hover:bg-slate-700/70 transition-colors cursor-pointer"
                  >
                    <div className="relative">
                      <img
                        src={match.avatar}
                        alt={match.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      {match.lastActive === 'Online now' && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-slate-800"></div>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-white">{match.name}, {match.age}</h3>
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="text-yellow-400 font-semibold">{match.compatibilityScore}%</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 text-sm text-slate-400">
                        <MapPin className="w-3 h-3" />
                        <span>{match.location}</span>
                        <span>•</span>
                        <span>{match.tribe}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2 text-sm text-slate-400 mt-1">
                        <Clock className="w-3 h-3" />
                        <span>{match.lastActive}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <button className="w-full mt-4 py-2 text-primary-400 hover:text-primary-300 font-medium transition-colors">
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
              
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <img
                      src={activity.avatar}
                      alt={activity.user}
                      className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-300">
                        <span className="font-medium text-white">{activity.user}</span>{' '}
                        {activity.content}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
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
                <button className="w-full p-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center">
                  <Heart className="w-4 h-4 mr-2" />
                  Discover Matches
                </button>
                
                <button className="w-full p-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  View Messages
                </button>
                
                <button className="w-full p-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors flex items-center justify-center">
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