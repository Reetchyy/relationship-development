import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  MapPin, 
  Heart, 
  Book, 
  Briefcase, 
  Globe, 
  Edit3, 
  Camera,
  Shield,
  Star,
  Languages
} from 'lucide-react';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';

export default function Profile() {
  const { state } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const user = state.user!;

  const profileSections = [
    {
      title: 'Cultural Background',
      icon: Globe,
      content: [
        { label: 'Tribe/Ethnicity', value: user.culturalBackground.tribe },
        { label: 'Region', value: user.culturalBackground.region },
        { label: 'Languages', value: user.culturalBackground.languages.join(', ') },
        { label: 'Religion', value: user.culturalBackground.religion },
      ]
    },
    {
      title: 'Personal Information',
      icon: User,
      content: [
        { label: 'Age', value: '28' },
        { label: 'Location', value: 'Toronto, Canada' },
        { label: 'Education', value: 'Master\'s in Engineering' },
        { label: 'Occupation', value: 'Software Engineer' },
      ]
    },
    {
      title: 'Relationship Preferences',
      icon: Heart,
      content: [
        { label: 'Looking for', value: 'Long-term relationship' },
        { label: 'Age Range', value: '25-35' },
        { label: 'Distance', value: 'Within 100km' },
        { label: 'Family Involvement', value: 'Important' },
      ]
    }
  ];

  const interests = [
    'Traditional Music', 'African Cuisine', 'Cultural Events', 'Travel', 
    'Languages', 'Community Service', 'Art & Crafts', 'Storytelling'
  ];

  const verificationStatus = [
    { type: 'Email', verified: true },
    { type: 'Phone', verified: true },
    { type: 'ID Document', verified: true },
    { type: 'Cultural Quiz', verified: true },
    { type: 'Community Endorsement', verified: false },
  ];

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-xl p-8 border border-slate-600"
        >
          <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
            <div className="relative">
              <img
                src={user.avatar}
                alt={user.name}
                className="w-32 h-32 rounded-full object-cover border-4 border-primary-500"
              />
              <button className="absolute bottom-0 right-0 w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center text-white hover:bg-primary-700 transition-colors">
                <Camera className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start space-x-2 mb-2">
                <h1 className="text-3xl font-bold text-white">{user.name}</h1>
                {user.isVerified && (
                  <Shield className="w-6 h-6 text-green-400" />
                )}
              </div>
              
              <div className="flex items-center justify-center md:justify-start space-x-4 text-slate-300 mb-4">
                <div className="flex items-center space-x-1">
                  <MapPin className="w-4 h-4" />
                  <span>Toronto, Canada</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Globe className="w-4 h-4" />
                  <span>{user.culturalBackground.tribe}</span>
                </div>
              </div>
              
              <p className="text-slate-300 mb-6">
                Passionate about preserving our rich cultural heritage while building meaningful connections. 
                Looking for someone who shares similar values and appreciates the beauty of African traditions.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="flex items-center justify-center px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit Profile
                </button>
                <button className="flex items-center justify-center px-6 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-500 transition-colors">
                  <Star className="w-4 h-4 mr-2" />
                  Get Endorsement
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Profile Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* About Me */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700"
            >
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                <Book className="w-5 h-5 text-blue-400 mr-2" />
                About Me
              </h2>
              <p className="text-slate-300 leading-relaxed">
                Born and raised in Lagos, Nigeria, I've been living in Toronto for the past 5 years. 
                I'm deeply connected to my Igbo roots and believe that our traditions and values should 
                guide us in finding meaningful relationships. I enjoy cooking traditional dishes, 
                speaking my native language, and participating in cultural events in the diaspora community.
              </p>
            </motion.div>

            {/* Profile Sections */}
            {profileSections.map((section, index) => (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700"
              >
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                  <section.icon className="w-5 h-5 text-primary-400 mr-2" />
                  {section.title}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {section.content.map((item) => (
                    <div key={item.label} className="flex justify-between items-center py-2">
                      <span className="text-slate-400">{item.label}:</span>
                      <span className="text-white font-medium">{item.value}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}

            {/* Interests */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700"
            >
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                <Heart className="w-5 h-5 text-red-400 mr-2" />
                Interests & Hobbies
              </h2>
              <div className="flex flex-wrap gap-2">
                {interests.map((interest) => (
                  <span
                    key={interest}
                    className="px-3 py-1 bg-primary-600/20 text-primary-300 rounded-full text-sm border border-primary-600/30"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Verification Status */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700"
            >
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Shield className="w-5 h-5 text-green-400 mr-2" />
                Verification Status
              </h2>
              <div className="space-y-3">
                {verificationStatus.map((item) => (
                  <div key={item.type} className="flex items-center justify-between">
                    <span className="text-slate-300 text-sm">{item.type}</span>
                    <div className={`w-3 h-3 rounded-full ${
                      item.verified ? 'bg-green-500' : 'bg-slate-500'
                    }`}></div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-slate-600">
                <div className="flex items-center justify-between">
                  <span className="text-white font-medium">Verification Score</span>
                  <span className="text-green-400 font-bold">85%</span>
                </div>
              </div>
            </motion.div>

            {/* Profile Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700"
            >
              <h2 className="text-lg font-semibold text-white mb-4">Profile Stats</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">Profile Views</span>
                  <span className="text-white font-semibold">247</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">Likes Received</span>
                  <span className="text-white font-semibold">89</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">Matches</span>
                  <span className="text-white font-semibold">12</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">Endorsements</span>
                  <span className="text-white font-semibold">15</span>
                </div>
              </div>
            </motion.div>

            {/* Cultural Compatibility */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700"
            >
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Languages className="w-5 h-5 text-purple-400 mr-2" />
                Cultural Strengths
              </h2>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-300">Traditional Values</span>
                    <span className="text-white">95%</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div className="bg-primary-500 h-2 rounded-full" style={{ width: '95%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-300">Language Fluency</span>
                    <span className="text-white">88%</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '88%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-300">Community Engagement</span>
                    <span className="text-white">82%</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '82%' }}></div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </Layout>
  );
}