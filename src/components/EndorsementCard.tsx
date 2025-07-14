import React from 'react';
import { motion } from 'framer-motion';
import { Star, CheckCircle, Calendar, User } from 'lucide-react';
import { format } from 'date-fns';

interface EndorsementCardProps {
  endorsement: {
    id: string;
    endorser: {
      id: string;
      name: string;
      avatar: string;
    };
    endorsed: {
      id: string;
      name: string;
      avatar: string;
    };
    type: string;
    message: string;
    date: Date;
    verified: boolean;
  };
  showActions?: boolean;
  onVerify?: (id: string) => void;
}

const endorsementTypes = {
  cultural_knowledge: { 
    label: 'Cultural Knowledge', 
    color: 'text-blue-400', 
    bg: 'bg-blue-600/20',
    icon: '🧠'
  },
  character: { 
    label: 'Character', 
    color: 'text-green-400', 
    bg: 'bg-green-600/20',
    icon: '💎'
  },
  family_values: { 
    label: 'Family Values', 
    color: 'text-purple-400', 
    bg: 'bg-purple-600/20',
    icon: '👨‍👩‍👧‍👦'
  },
  community_service: { 
    label: 'Community Service', 
    color: 'text-yellow-400', 
    bg: 'bg-yellow-600/20',
    icon: '🤝'
  },
};

export default function EndorsementCard({ 
  endorsement, 
  showActions = false, 
  onVerify 
}: EndorsementCardProps) {
  const typeInfo = endorsementTypes[endorsement.type as keyof typeof endorsementTypes] || endorsementTypes.character;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-700/50 rounded-lg p-6 hover:bg-slate-700/70 transition-colors"
    >
      <div className="flex items-start space-x-4">
        <img
          src={endorsement.endorser.avatar}
          alt={endorsement.endorser.name}
          className="w-12 h-12 rounded-full object-cover"
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
            <span className={`px-3 py-1 rounded-full text-xs ${typeInfo.bg} ${typeInfo.color} border border-current/30`}>
              {typeInfo.icon} {typeInfo.label}
            </span>
            <div className="flex items-center space-x-1 text-xs text-slate-400">
              <Calendar className="w-3 h-3" />
              <span>{format(endorsement.date, 'MMM d, yyyy')}</span>
            </div>
          </div>
          
          <p className="text-slate-300 leading-relaxed mb-4">{endorsement.message}</p>
          
          {showActions && !endorsement.verified && onVerify && (
            <div className="flex space-x-2">
              <button
                onClick={() => onVerify(endorsement.id)}
                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
              >
                <CheckCircle className="w-3 h-3 inline mr-1" />
                Verify
              </button>
              <button className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors">
                Reject
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}