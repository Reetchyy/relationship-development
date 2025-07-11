import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Star, 
  MessageSquare, 
  Calendar, 
  MapPin, 
  Heart,
  Award,
  CheckCircle,
  Plus,
  Filter,
  Search,
  Globe,
  Clock
} from 'lucide-react';
import Layout from '../components/Layout';
import InitialsAvatar from '../components/InitialsAvatar';

interface CommunityMember {
  id: string;
  name: string;
  avatar: string;
  tribe: string;
  location: string;
  role: 'member' | 'elder' | 'moderator';
  endorsements: number;
  joinedDate: Date;
  isOnline: boolean;
}

interface Endorsement {
  id: string;
  endorser: CommunityMember;
  endorsed: CommunityMember;
  type: 'cultural_knowledge' | 'character' | 'family_values' | 'community_service';
  message: string;
  date: Date;
  verified: boolean;
}

interface CommunityEvent {
  id: string;
  title: string;
  description: string;
  date: Date;
  location: string;
  organizer: CommunityMember;
  attendees: number;
  maxAttendees: number;
  type: 'cultural' | 'social' | 'educational' | 'religious';
  image: string;
}

const mockMembers: CommunityMember[] = [
  {
    id: '1',
    name: 'Elder Adunni Okafor',
    avatar: 'https://images.pexels.com/photos/3763188/pexels-photo-3763188.jpeg?auto=compress&cs=tinysrgb&w=400',
    tribe: 'Yoruba',
    location: 'Toronto, Canada',
    role: 'elder',
    endorsements: 47,
    joinedDate: new Date('2023-01-15'),
    isOnline: true,
  },
  {
    id: '2',
    name: 'Dr. Kwame Mensah',
    avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=400',
    tribe: 'Akan',
    location: 'London, UK',
    role: 'moderator',
    endorsements: 32,
    joinedDate: new Date('2023-03-20'),
    isOnline: false,
  },
  {
    id: '3',
    name: 'Sister Amara Nkomo',
    avatar: 'https://images.pexels.com/photos/3762800/pexels-photo-3762800.jpeg?auto=compress&cs=tinysrgb&w=400',
    tribe: 'Igbo',
    location: 'Berlin, Germany',
    role: 'member',
    endorsements: 18,
    joinedDate: new Date('2023-06-10'),
    isOnline: true,
  },
];

const mockEndorsements: Endorsement[] = [
  {
    id: '1',
    endorser: mockMembers[0],
    endorsed: mockMembers[2],
    type: 'cultural_knowledge',
    message: 'Amara has shown exceptional understanding of Igbo traditions and customs. She would be a wonderful cultural partner.',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    verified: true,
  },
  {
    id: '2',
    endorser: mockMembers[1],
    endorsed: mockMembers[0],
    type: 'character',
    message: 'Elder Adunni has been a pillar of our community. Her wisdom and kindness make her an excellent match for anyone seeking traditional values.',
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    verified: true,
  },
];

const mockEvents: CommunityEvent[] = [
  {
    id: '1',
    title: 'Traditional Yoruba Wedding Ceremony Workshop',
    description: 'Learn about the beautiful traditions and customs of Yoruba weddings. Perfect for couples planning their special day.',
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    location: 'Toronto Community Center',
    organizer: mockMembers[0],
    attendees: 23,
    maxAttendees: 50,
    type: 'cultural',
    image: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
  {
    id: '2',
    title: 'African Diaspora Singles Mixer',
    description: 'Meet other singles in the community in a relaxed, culturally-aware environment.',
    date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    location: 'London Cultural Center',
    organizer: mockMembers[1],
    attendees: 18,
    maxAttendees: 30,
    type: 'social',
    image: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
];

export default function Community() {
  const [activeTab, setActiveTab] = useState<'members' | 'endorsements' | 'events'>('members');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  const tabs = [
    { id: 'members', label: 'Community Members', icon: Users },
    { id: 'endorsements', label: 'Endorsements', icon: Star },
    { id: 'events', label: 'Events', icon: Calendar },
  ];

  const endorsementTypes = {
    cultural_knowledge: { label: 'Cultural Knowledge', color: 'text-blue-400', bg: 'bg-blue-600/20' },
    character: { label: 'Character', color: 'text-green-400', bg: 'bg-green-600/20' },
    family_values: { label: 'Family Values', color: 'text-purple-400', bg: 'bg-purple-600/20' },
    community_service: { label: 'Community Service', color: 'text-yellow-400', bg: 'bg-yellow-600/20' },
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'elder':
        return <Award className="w-4 h-4 text-yellow-400" />;
      case 'moderator':
        return <CheckCircle className="w-4 h-4 text-blue-400" />;
      default:
        return <Users className="w-4 h-4 text-slate-400" />;
    }
  };

  const getRoleBadge = (role: string) => {
    const colors = {
      elder: 'bg-yellow-600/20 text-yellow-300 border-yellow-600/30',
      moderator: 'bg-blue-600/20 text-blue-300 border-blue-600/30',
      member: 'bg-slate-600/20 text-slate-300 border-slate-600/30',
    };
    return colors[role as keyof typeof colors] || colors.member;
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Community</h1>
            <p className="text-slate-400">Connect with your cultural community and get endorsed</p>
          </div>
          <button className="mt-4 md:mt-0 flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
            <Plus className="w-4 h-4 mr-2" />
            Request Endorsement
          </button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-slate-800/50 rounded-lg p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors flex-1 justify-center ${
                activeTab === tab.id
                  ? 'bg-primary-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            >
              <option value="all">All</option>
              <option value="online">Online</option>
              <option value="verified">Verified</option>
            </select>
          </div>
        </div>

        {/* Content */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700">
          {activeTab === 'members' && (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mockMembers.map((member) => (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-slate-700/50 rounded-lg p-4 hover:bg-slate-700/70 transition-colors"
                  >
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="relative">
                        <InitialsAvatar
                          firstName={member.name.split(' ')[0]}
                          lastName={member.name.split(' ')[1] || ''}
                          size="md"
                        />
                        {member.isOnline && (
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-slate-700"></div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold text-white">{member.name}</h3>
                          {getRoleIcon(member.role)}
                        </div>
                        <p className="text-sm text-slate-400">{member.tribe}</p>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center space-x-2 text-sm text-slate-400">
                        <MapPin className="w-3 h-3" />
                        <span>{member.location}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-slate-400">
                        <Star className="w-3 h-3" />
                        <span>{member.endorsements} endorsements</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-slate-400">
                        <Clock className="w-3 h-3" />
                        <span>Joined {member.joinedDate.toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-1 rounded-full text-xs border ${getRoleBadge(member.role)}`}>
                        {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                      </span>
                      <div className="flex space-x-2">
                        <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-600 rounded-lg transition-colors">
                          <MessageSquare className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-600 rounded-lg transition-colors">
                          <Heart className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'endorsements' && (
            <div className="p-6 space-y-6">
              {mockEndorsements.map((endorsement) => (
                <motion.div
                  key={endorsement.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-slate-700/50 rounded-lg p-6"
                >
                  <div className="flex items-start space-x-4">
                    <InitialsAvatar
                      firstName={endorsement.endorser.name.split(' ')[0]}
                      lastName={endorsement.endorser.name.split(' ')[1] || ''}
                      size="md"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-semibold text-white">{endorsement.endorser.name}</h4>
                        <span className="text-slate-400">endorsed</span>
                        <h4 className="font-semibold text-white">{endorsement.endorsed.name}</h4>
                        {endorsement.verified && (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2 mb-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${endorsementTypes[endorsement.type].bg} ${endorsementTypes[endorsement.type].color}`}>
                          {endorsementTypes[endorsement.type].label}
                        </span>
                        <span className="text-xs text-slate-400">
                          {endorsement.date.toLocaleDateString()}
                        </span>
                      </div>
                      
                      <p className="text-slate-300 leading-relaxed">{endorsement.message}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {activeTab === 'events' && (
            <div className="p-6 space-y-6">
              {mockEvents.map((event) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-slate-700/50 rounded-lg overflow-hidden hover:bg-slate-700/70 transition-colors"
                >
                  <div className="md:flex">
                    <div className="md:w-48">
                      <img
                        src={event.image}
                        alt={event.title}
                        className="w-full h-48 md:h-full object-cover"
                      />
                    </div>
                    <div className="p-6 flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-semibold text-white mb-2">{event.title}</h3>
                          <p className="text-slate-300 mb-4">{event.description}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          event.type === 'cultural' ? 'bg-purple-600/20 text-purple-300' :
                          event.type === 'social' ? 'bg-blue-600/20 text-blue-300' :
                          event.type === 'educational' ? 'bg-green-600/20 text-green-300' :
                          'bg-yellow-600/20 text-yellow-300'
                        }`}>
                          {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="flex items-center space-x-2 text-sm text-slate-400">
                          <Calendar className="w-4 h-4" />
                          <span>{event.date.toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-slate-400">
                          <MapPin className="w-4 h-4" />
                          <span>{event.location}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-slate-400">
                          <Users className="w-4 h-4" />
                          <span>{event.attendees}/{event.maxAttendees} attending</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <InitialsAvatar
                            firstName={event.organizer.name.split(' ')[0]}
                            lastName={event.organizer.name.split(' ')[1] || ''}
                            size="sm"
                          />
                          <span className="text-sm text-slate-400">
                            Organized by {event.organizer.name}
                          </span>
                        </div>
                        <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                          Join Event
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}