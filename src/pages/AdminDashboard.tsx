import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Shield, 
  AlertTriangle, 
  TrendingUp, 
  MessageSquare,
  Heart,
  Eye,
  Ban,
  CheckCircle,
  X,
  Search,
  Filter,
  MoreVertical
} from 'lucide-react';
import Layout from '../components/Layout';
import InitialsAvatar from '../components/InitialsAvatar';

interface UserReport {
  id: string;
  reportedUser: {
    id: string;
    name: string;
    avatar: string;
    email: string;
  };
  reporter: {
    id: string;
    name: string;
    avatar: string;
  };
  reason: string;
  description: string;
  date: Date;
  status: 'pending' | 'reviewed' | 'resolved';
  severity: 'low' | 'medium' | 'high';
}

interface PlatformStats {
  totalUsers: number;
  activeUsers: number;
  totalMatches: number;
  totalMessages: number;
  verificationsPending: number;
  reportsOpen: number;
}

const mockStats: PlatformStats = {
  totalUsers: 2847,
  activeUsers: 1234,
  totalMatches: 892,
  totalMessages: 15678,
  verificationsPending: 23,
  reportsOpen: 7,
};

const mockReports: UserReport[] = [
  {
    id: '1',
    reportedUser: {
      id: '1',
      name: 'John Doe',
      avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=400',
      email: 'john.doe@email.com',
    },
    reporter: {
      id: '2',
      name: 'Jane Smith',
      avatar: 'https://images.pexels.com/photos/3763188/pexels-photo-3763188.jpeg?auto=compress&cs=tinysrgb&w=400',
    },
    reason: 'Inappropriate behavior',
    description: 'User sent inappropriate messages and made uncomfortable advances despite being told to stop.',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    status: 'pending',
    severity: 'high',
  },
  {
    id: '2',
    reportedUser: {
      id: '3',
      name: 'Mike Johnson',
      avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=400',
      email: 'mike.j@email.com',
    },
    reporter: {
      id: '4',
      name: 'Sarah Wilson',
      avatar: 'https://images.pexels.com/photos/3762800/pexels-photo-3762800.jpeg?auto=compress&cs=tinysrgb&w=400',
    },
    reason: 'Fake profile',
    description: 'Profile photos appear to be stock images and information seems fabricated.',
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    status: 'reviewed',
    severity: 'medium',
  },
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'reports' | 'verification'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'reports', label: 'Reports', icon: AlertTriangle },
    { id: 'verification', label: 'Verification', icon: Shield },
  ];

  const statCards = [
    { label: 'Total Users', value: mockStats.totalUsers.toLocaleString(), icon: Users, color: 'text-blue-400' },
    { label: 'Active Users', value: mockStats.activeUsers.toLocaleString(), icon: Eye, color: 'text-green-400' },
    { label: 'Total Matches', value: mockStats.totalMatches.toLocaleString(), icon: Heart, color: 'text-red-400' },
    { label: 'Messages Sent', value: mockStats.totalMessages.toLocaleString(), icon: MessageSquare, color: 'text-purple-400' },
    { label: 'Pending Verifications', value: mockStats.verificationsPending.toString(), icon: Shield, color: 'text-yellow-400' },
    { label: 'Open Reports', value: mockStats.reportsOpen.toString(), icon: AlertTriangle, color: 'text-orange-400' },
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-600/20 text-red-300 border-red-600/30';
      case 'medium':
        return 'bg-yellow-600/20 text-yellow-300 border-yellow-600/30';
      case 'low':
        return 'bg-green-600/20 text-green-300 border-green-600/30';
      default:
        return 'bg-slate-600/20 text-slate-300 border-slate-600/30';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-600/20 text-yellow-300 border-yellow-600/30';
      case 'reviewed':
        return 'bg-blue-600/20 text-blue-300 border-blue-600/30';
      case 'resolved':
        return 'bg-green-600/20 text-green-300 border-green-600/30';
      default:
        return 'bg-slate-600/20 text-slate-300 border-slate-600/30';
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Admin Dashboard</h1>
          <p className="text-slate-400">Manage users, monitor activity, and maintain platform safety</p>
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

        {/* Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {statCards.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700"
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

            {/* Recent Activity */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
              <h2 className="text-xl font-semibold text-white mb-4">Recent Activity</h2>
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-3 bg-slate-700/50 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-slate-300">New user registration: Amara Okafor</span>
                  <span className="text-slate-500 text-sm ml-auto">2 minutes ago</span>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-slate-700/50 rounded-lg">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-slate-300">Verification pending: Kwame Asante</span>
                  <span className="text-slate-500 text-sm ml-auto">15 minutes ago</span>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-slate-700/50 rounded-lg">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-slate-300">New report filed against user</span>
                  <span className="text-slate-500 text-sm ml-auto">1 hour ago</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="space-y-6">
            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search reports..."
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
                  <option value="all">All Reports</option>
                  <option value="pending">Pending</option>
                  <option value="high">High Priority</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
            </div>

            {/* Reports List */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-white mb-4">User Reports</h2>
                <div className="space-y-4">
                  {mockReports.map((report) => (
                    <motion.div
                      key={report.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-slate-700/50 rounded-lg p-6"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <InitialsAvatar
                            firstName={report.reportedUser.name.split(' ')[0]}
                            lastName={report.reportedUser.name.split(' ')[1] || ''}
                            size="md"
                          />
                          <div>
                            <h3 className="font-semibold text-white">{report.reportedUser.name}</h3>
                            <p className="text-sm text-slate-400">{report.reportedUser.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs border ${getSeverityColor(report.severity)}`}>
                            {report.severity.toUpperCase()}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs border ${getStatusColor(report.status)}`}>
                            {report.status.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      <div className="mb-4">
                        <h4 className="text-white font-medium mb-2">Reason: {report.reason}</h4>
                        <p className="text-slate-300 text-sm">{report.description}</p>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 text-sm text-slate-400">
                          <span>Reported by {report.reporter.name}</span>
                          <span>•</span>
                          <span>{report.date.toLocaleDateString()}</span>
                        </div>
                        <div className="flex space-x-2">
                          <button className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors">
                            <CheckCircle className="w-3 h-3 inline mr-1" />
                            Resolve
                          </button>
                          <button className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors">
                            <Ban className="w-3 h-3 inline mr-1" />
                            Suspend
                          </button>
                          <button className="px-3 py-1 bg-slate-600 text-white rounded text-sm hover:bg-slate-500 transition-colors">
                            <MoreVertical className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
            <h2 className="text-xl font-semibold text-white mb-4">User Management</h2>
            <p className="text-slate-400">User management features will be implemented here.</p>
          </div>
        )}

        {activeTab === 'verification' && (
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
            <h2 className="text-xl font-semibold text-white mb-4">Identity Verification</h2>
            <p className="text-slate-400">Verification queue and approval system will be implemented here.</p>
          </div>
        )}
      </div>
    </Layout>
  );
}