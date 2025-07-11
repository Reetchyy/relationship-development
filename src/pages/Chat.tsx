import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Search, 
  Phone, 
  Video, 
  MoreVertical, 
  Smile, 
  Paperclip,
  Globe,
  Camera,
  Mic,
  Heart,
  CheckCheck,
  Check,
  MessageSquare
} from 'lucide-react';
import Layout from '../components/Layout';
import { format } from 'date-fns';

interface ChatUser {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  lastMessageTime: Date;
  isOnline: boolean;
  unreadCount: number;
  tribe: string;
  isMatched: boolean;
}

interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'image' | 'voice' | 'translation';
  status: 'sent' | 'delivered' | 'read';
  originalLanguage?: string;
  translatedContent?: string;
}

const mockUsers: ChatUser[] = [
  {
    id: '1',
    name: 'Kemi Adebayo',
    avatar: 'https://images.pexels.com/photos/3763188/pexels-photo-3763188.jpeg?auto=compress&cs=tinysrgb&w=400',
    lastMessage: 'That sounds amazing! I would love to try your grandmother\'s jollof recipe.',
    lastMessageTime: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
    isOnline: true,
    unreadCount: 2,
    tribe: 'Yoruba',
    isMatched: true,
  },
  {
    id: '2',
    name: 'Kwame Asante',
    avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=400',
    lastMessage: 'Ɛte sɛn? How are you doing today?',
    lastMessageTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    isOnline: false,
    unreadCount: 0,
    tribe: 'Akan',
    isMatched: true,
  },
  {
    id: '3',
    name: 'Zara Okonkwo',
    avatar: 'https://images.pexels.com/photos/3762800/pexels-photo-3762800.jpeg?auto=compress&cs=tinysrgb&w=400',
    lastMessage: 'The cultural festival was beautiful! Thanks for recommending it.',
    lastMessageTime: new Date(Date.now()- 24 * 60 * 60 * 1000), // 1 day ago
    isOnline: false,
    unreadCount: 1,
    tribe: 'Igbo',
    isMatched: true,
  },
];

const mockMessages: Message[] = [
  {
    id: '1',
    senderId: '1',
    content: 'Hi! I saw we matched. I love your profile, especially your passion for traditional music!',
    timestamp: new Date(Date.now() - 60 * 60 * 1000),
    type: 'text',
    status: 'read',
  },
  {
    id: '2',
    senderId: 'me',
    content: 'Thank you! I noticed you\'re also from Lagos originally. Do you still cook traditional dishes?',
    timestamp: new Date(Date.now() - 50 * 60 * 1000),
    type: 'text',
    status: 'read',
  },
  {
    id: '3',
    senderId: '1',
    content: 'Yes! I make the best jollof rice in Toronto, according to my friends 😊',
    timestamp: new Date(Date.now() - 40 * 60 * 1000),
    type: 'text',
    status: 'read',
  },
  {
    id: '4',
    senderId: 'me',
    content: 'That\'s a bold claim! I\'d love to be the judge of that someday.',
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    type: 'text',
    status: 'read',
  },
  {
    id: '5',
    senderId: '1',
    content: 'Mo dupe! I learned from my grandmother. She always said food is how we share our culture.',
    timestamp: new Date(Date.now() - 20 * 60 * 1000),
    type: 'text',
    status: 'read',
    originalLanguage: 'Yoruba',
    translatedContent: 'Thank you! I learned from my grandmother. She always said food is how we share our culture.',
  },
  {
    id: '6',
    senderId: '1',
    content: 'That sounds amazing! I would love to try your grandmother\'s jollof recipe.',
    timestamp: new Date(Date.now() - 10 * 60 * 1000),
    type: 'text',
    status: 'delivered',
  },
];

export default function Chat() {
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(mockUsers[0]);
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [newMessage, setNewMessage] = useState('');
  const [showTranslation, setShowTranslation] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedUser) return;

    const message: Message = {
      id: Date.now().toString(),
      senderId: 'me',
      content: newMessage,
      timestamp: new Date(),
      type: 'text',
      status: 'sent',
    };

    setMessages([...messages, message]);
    setNewMessage('');

    // Simulate message delivery
    setTimeout(() => {
      setMessages(prev => prev.map(msg => 
        msg.id === message.id ? { ...msg, status: 'delivered' } : msg
      ));
    }, 1000);
  };

  const filteredUsers = mockUsers.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getMessageStatus = (status: string) => {
    switch (status) {
      case 'sent':
        return <Check className="w-3 h-3 text-slate-400" />;
      case 'delivered':
        return <CheckCheck className="w-3 h-3 text-slate-400" />;
      case 'read':
        return <CheckCheck className="w-3 h-3 text-blue-400" />;
      default:
        return null;
    }
  };

  return (
    <Layout>
      <div className="flex h-[calc(100vh-8rem)] bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 overflow-hidden">
        {/* Chat List */}
        <div className="w-full md:w-80 border-r border-slate-700 flex flex-col">
          {/* Search Header */}
          <div className="p-4 border-b border-slate-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto">
            {filteredUsers.map((user) => (
              <motion.div
                key={user.id}
                whileHover={{ backgroundColor: 'rgba(51, 65, 85, 0.5)' }}
                onClick={() => setSelectedUser(user)}
                className={`p-4 cursor-pointer border-b border-slate-700/50 ${
                  selectedUser?.id === user.id ? 'bg-slate-700/50' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    {user.isOnline && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-slate-800"></div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-white truncate">{user.name}</h3>
                      <span className="text-xs text-slate-400">
                        {format(user.lastMessageTime, 'HH:mm')}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-slate-400 truncate">{user.lastMessage}</p>
                      {user.unreadCount > 0 && (
                        <span className="ml-2 w-5 h-5 bg-primary-600 text-white text-xs rounded-full flex items-center justify-center">
                          {user.unreadCount}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs text-slate-500">{user.tribe}</span>
                      {user.isMatched && (
                        <Heart className="w-3 h-3 text-red-400 fill-current" />
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Chat Window */}
        {selectedUser ? (
          <div className="flex-1 flex flex-col">
            {/* Chat Header */}
            <div className="p-4 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <img
                    src={selectedUser.avatar}
                    alt={selectedUser.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  {selectedUser.isOnline && (
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-800"></div>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-white">{selectedUser.name}</h3>
                  <p className="text-sm text-slate-400">
                    {selectedUser.isOnline ? 'Online now' : `${selectedUser.tribe} • Last seen recently`}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
                  <Phone className="w-5 h-5" />
                </button>
                <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
                  <Video className="w-5 h-5" />
                </button>
                <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <AnimatePresence>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${message.senderId === 'me' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-xs lg:max-w-md ${
                      message.senderId === 'me' 
                        ? 'bg-primary-600 text-white' 
                        : 'bg-slate-700 text-white'
                    } rounded-2xl px-4 py-2`}>
                      <p className="text-sm">{message.content}</p>
                      
                      {message.originalLanguage && (
                        <div className="mt-2 pt-2 border-t border-white/20">
                          <button
                            onClick={() => setShowTranslation(
                              showTranslation === message.id ? null : message.id
                            )}
                            className="flex items-center space-x-1 text-xs opacity-75 hover:opacity-100"
                          >
                            <Globe className="w-3 h-3" />
                            <span>Translate from {message.originalLanguage}</span>
                          </button>
                          
                          {showTranslation === message.id && message.translatedContent && (
                            <p className="text-xs mt-1 opacity-75 italic">
                              "{message.translatedContent}"
                            </p>
                          )}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs opacity-75">
                          {format(message.timestamp, 'HH:mm')}
                        </span>
                        {message.senderId === 'me' && (
                          <div className="ml-2">
                            {getMessageStatus(message.status)}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-slate-700">
              <div className="flex items-center space-x-2">
                <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
                  <Paperclip className="w-5 h-5" />
                </button>
                <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
                  <Camera className="w-5 h-5" />
                </button>
                
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Type a message..."
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-full text-white placeholder-slate-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  />
                  <button className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-slate-400 hover:text-white">
                    <Smile className="w-4 h-4" />
                  </button>
                </div>
                
                <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
                  <Mic className="w-5 h-5" />
                </button>
                
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Select a conversation</h3>
              <p className="text-slate-400">Choose from your existing conversations or start a new one</p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}