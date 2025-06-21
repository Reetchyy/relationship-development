import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Heart, 
  Shield, 
  Users, 
  Globe, 
  Star, 
  CheckCircle,
  ArrowRight,
  Play
} from 'lucide-react';
import LoginModal from '../components/LoginModal';

export default function LandingPage() {
  const [showLogin, setShowLogin] = useState(false);

  const features = [
    {
      icon: Heart,
      title: 'Cultural Compatibility',
      description: 'Advanced AI matching based on cultural values, traditions, and family expectations.',
      color: 'text-red-400'
    },
    {
      icon: Shield,
      title: 'Verified Profiles',
      description: 'Multi-layer verification including cultural knowledge and community endorsement.',
      color: 'text-green-400'
    },
    {
      icon: Users,
      title: 'Community Support',
      description: 'Family and friends can endorse matches, ensuring community approval.',
      color: 'text-blue-400'
    },
    {
      icon: Globe,
      title: 'Global Diaspora',
      description: 'Connect with Africans worldwide while maintaining cultural authenticity.',
      color: 'text-purple-400'
    }
  ];

  const testimonials = [
    {
      name: 'Adaora & Chike',
      location: 'London & Toronto',
      image: 'https://images.pexels.com/photos/3763188/pexels-photo-3763188.jpeg?auto=compress&cs=tinysrgb&w=400',
      quote: 'DiasporaConnect helped us find each other despite being on different continents. Our families approved before we even met!'
    },
    {
      name: 'Kofi & Ama',
      location: 'New York & Berlin',
      image: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=400',
      quote: 'The cultural matching was perfect. We share the same values and our families felt comfortable from day one.'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-primary-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-900/50 to-transparent"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="flex items-center space-x-2 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-xl">DC</span>
                </div>
                <span className="text-white font-bold text-2xl">Diaspora Connect</span>
              </div>
              
              <h1 className="text-5xl lg:text-6xl font-bold text-white mb-6">
                Find Your
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-cultural-gold">
                  Cultural Match
                </span>
              </h1>
              
              <p className="text-xl text-slate-300 mb-8 leading-relaxed">
                Connect with culturally compatible partners in the African diaspora. 
                Our AI-powered platform respects traditional values while embracing modern connections.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/register"
                  className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold rounded-lg hover:from-primary-600 hover:to-primary-700 transition-all duration-200 shadow-lg hover:shadow-xl group"
                >
                  Start Your Journey
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                
                <button
                  onClick={() => setShowLogin(true)}
                  className="inline-flex items-center px-8 py-4 border-2 border-primary-400 text-primary-400 font-semibold rounded-lg hover:bg-primary-400 hover:text-white transition-all duration-200"
                >
                  Sign In
                </button>
              </div>
              
              <div className="flex items-center space-x-6 mt-8 text-slate-400">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span>Verified Profiles</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span>Cultural Matching</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span>Community Endorsed</span>
                </div>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="relative">
                <img
                  src="https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=800"
                  alt="African couple celebrating"
                  className="w-full h-96 object-cover rounded-2xl shadow-2xl"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent rounded-2xl"></div>
              </div>
              
              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-cultural-gold to-primary-500 rounded-full opacity-20 animate-pulse-slow"></div>
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-br from-accent-500 to-secondary-500 rounded-full opacity-20 animate-pulse-slow"></div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-white mb-4">
              Built for the African Diaspora
            </h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              Our platform understands the unique challenges of finding love while preserving cultural identity.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                className="bg-slate-700/50 backdrop-blur-sm rounded-xl p-6 hover:bg-slate-700/70 transition-all duration-300 border border-slate-600/50"
              >
                <feature.icon className={`w-12 h-12 ${feature.color} mb-4`} />
                <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                <p className="text-slate-300">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-white mb-4">Success Stories</h2>
            <p className="text-xl text-slate-300">Real couples who found love through cultural connection</p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                className="bg-gradient-to-br from-slate-700/50 to-slate-800/50 backdrop-blur-sm rounded-xl p-8 border border-slate-600/50"
              >
                <div className="flex items-center space-x-4 mb-6">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <div>
                    <h4 className="text-lg font-semibold text-white">{testimonial.name}</h4>
                    <p className="text-slate-400">{testimonial.location}</p>
                  </div>
                </div>
                <p className="text-slate-300 italic">"{testimonial.quote}"</p>
                <div className="flex text-cultural-gold mt-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-current" />
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary-900 to-primary-800">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready to Find Your Cultural Match?
            </h2>
            <p className="text-xl text-primary-100 mb-8">
              Join thousands of Africans in the diaspora who have found meaningful connections.
            </p>
            <Link
              to="/register"
              className="inline-flex items-center px-8 py-4 bg-white text-primary-900 font-semibold rounded-lg hover:bg-primary-50 transition-all duration-200 shadow-lg hover:shadow-xl group"
            >
              Get Started Today
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </section>

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </div>
  );
}