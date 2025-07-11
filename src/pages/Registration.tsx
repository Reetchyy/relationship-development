import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Phone, 
  Camera, 
  Upload, 
  ArrowRight, 
  ArrowLeft,
  Check,
  MapPin,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { uploadService } from '../services/uploadService';

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  location: string;
  tribe: string;
  languages: string[];
  religion: string;
  education: string;
  occupation: string;
  bio: string;
  profilePhoto: File | null;
  idDocument: File | null;
  videoSelfie: File | null;
}

const steps = [
  { id: 1, title: 'Basic Information', description: 'Tell us about yourself' },
  { id: 2, title: 'Cultural Background', description: 'Share your heritage' },
  { id: 3, title: 'Verification', description: 'Verify your identity' },
  { id: 4, title: 'Complete Profile', description: 'Final touches' },
];

const tribes = [
  'Yoruba', 'Igbo', 'Hausa', 'Akan', 'Kikuyu', 'Amhara', 'Oromo', 'Zulu', 
  'Xhosa', 'Shona', 'Wolof', 'Mandinka', 'Berber', 'Tigray', 'Other'
];

const languages = [
  'English', 'French', 'Portuguese', 'Arabic', 'Swahili', 'Yoruba', 'Igbo', 
  'Hausa', 'Akan', 'Amharic', 'Oromo', 'Zulu', 'Xhosa', 'Wolof', 'Other'
];

export default function Registration() {
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    location: '',
    tribe: '',
    languages: [],
    religion: '',
    education: '',
    occupation: '',
    bio: '',
    profilePhoto: null,
    idDocument: null,
    videoSelfie: null,
  });
  const navigate = useNavigate();
  const { completeRegistration } = useAuth();

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLanguageToggle = (language: string) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.includes(language)
        ? prev.languages.filter(l => l !== language)
        : [...prev.languages, language]
    }));
  };

  const handleFileUpload = (field: keyof FormData, file: File) => {
    setFormData(prev => ({ ...prev, [field]: file }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!formData.firstName.trim()) {
          toast.error('First name is required');
          return false;
        }
        if (!formData.lastName.trim()) {
          toast.error('Last name is required');
          return false;
        }
        if (!formData.email.trim()) {
          toast.error('Email is required');
          return false;
        }
        if (!formData.password) {
          toast.error('Password is required');
          return false;
        }
        if (formData.password.length < 6) {
          toast.error('Password must be at least 6 characters long');
          return false;
        }
        if (formData.password !== formData.confirmPassword) {
          toast.error('Passwords do not match');
          return false;
        }
        if (!formData.dateOfBirth) {
          toast.error('Date of birth is required');
          return false;
        }
        if (!formData.gender) {
          toast.error('Gender is required');
          return false;
        }
        if (!formData.location.trim()) {
          toast.error('Location is required');
          return false;
        }
        return true;
      case 2:
        if (!formData.tribe) {
          toast.error('Please select your tribe');
          return false;
        }
        if (formData.languages.length === 0) {
          toast.error('Please select at least one language');
          return false;
        }
        return true;
      case 3:
        if (!formData.profilePhoto) {
          toast.error('Please upload a profile photo');
          return false;
        }
        return true;
      case 4:
        if (!formData.bio.trim()) {
          toast.error('Bio is required');
          return false;
        }
        if (formData.bio.trim().length < 50) {
          toast.error('Please write a bio of at least 50 characters');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      if (currentStep < steps.length) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) {
      return;
    }

    try {
      setUploadingFiles(true);
      
      console.log('🚀 Starting registration process...');
      
      // Complete registration with the form data including password
      await completeRegistration(formData);
      
      console.log('✅ Registration completed, starting file uploads...');
      
      // Small delay to ensure session is properly established
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Upload files after successful registration
      if (formData.profilePhoto) {
        try {
          console.log('📸 Uploading profile photo...');
          await uploadService.uploadProfilePhoto(formData.profilePhoto);
          toast.success('Profile photo uploaded successfully');
        } catch (error: any) {
          console.error('Profile photo upload failed:', error);
          // Don't show auth errors to user, they're likely temporary
          if (error.message?.includes('authentication') || error.message?.includes('token')) {
            toast.error('Profile photo upload failed. You can upload it later from your profile.');
          } else {
            toast.error(`Profile photo upload failed: ${error.message}`);
          }
        }
      }
      
      if (formData.idDocument) {
        try {
          console.log('📄 Uploading ID document...');
          await uploadService.uploadDocument(formData.idDocument, 'government_id');
          toast.success('Identity document uploaded successfully');
        } catch (error: any) {
          console.error('Document upload failed:', error);
          toast.error(`Document upload failed: ${error.message}`);
        }
      }
      
      if (formData.videoSelfie) {
        try {
          console.log('🎥 Uploading video selfie...');
          await uploadService.uploadVideo(formData.videoSelfie, 'video_selfie');
          toast.success('Video selfie uploaded successfully');
        } catch (error: any) {
          console.error('Video upload failed:', error);
          toast.error(`Video upload failed: ${error.message}`);
        }
      }
      
      toast.success('Registration completed successfully! Please take the cultural quiz to verify your profile.');
      navigate('/cultural-quiz');
    } catch (error: any) {
      console.error('Registration error:', error);
      
      // Handle specific error messages
      let errorMessage = 'Registration failed. Please try again.';
      
      if (error?.message) {
        if (error.message.includes('already been registered') || error.message.includes('already exists')) {
          errorMessage = 'This email address is already registered. Please try logging in instead.';
        } else if (error.message.includes('validation') || error.message.includes('Validation failed')) {
          errorMessage = 'Please check all required fields and try again.';
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else {
          errorMessage = error.message;
        }
      }
      
      toast.error(errorMessage);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  placeholder="Enter your first name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  placeholder="Enter your last name"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="w-full pl-10 pr-12 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                    placeholder="Create a password"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-xs text-slate-400 mt-1">Minimum 6 characters</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Confirm Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className="w-full pl-10 pr-12 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                    placeholder="Confirm your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  placeholder="Enter your phone number"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Date of Birth *
                </label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Gender *
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => handleInputChange('gender', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  required
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="non-binary">Non-binary</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Current Location *
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  placeholder="City, Country"
                  required
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Tribe/Ethnic Group *
              </label>
              <select
                value={formData.tribe}
                onChange={(e) => handleInputChange('tribe', e.target.value)}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                required
              >
                <option value="">Select your tribe</option>
                {tribes.map(tribe => (
                  <option key={tribe} value={tribe}>{tribe}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Languages Spoken * (Select at least one)
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-48 overflow-y-auto border border-slate-600 rounded-lg p-4 bg-slate-700/50">
                {languages.map(language => (
                  <label key={language} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.languages.includes(language)}
                      onChange={() => handleLanguageToggle(language)}
                      className="w-4 h-4 text-primary-600 bg-slate-700 border-slate-600 rounded focus:ring-primary-500"
                    />
                    <span className="text-slate-300 text-sm">{language}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Selected: {formData.languages.length} language{formData.languages.length !== 1 ? 's' : ''}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Religion
              </label>
              <select
                value={formData.religion}
                onChange={(e) => handleInputChange('religion', e.target.value)}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              >
                <option value="">Select religion</option>
                <option value="Christian">Christian</option>
                <option value="Muslim">Muslim</option>
                <option value="Traditional">Traditional African Religion</option>
                <option value="Other">Other</option>
                <option value="Non-religious">Non-religious</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Education Level
                </label>
                <select
                  value={formData.education}
                  onChange={(e) => handleInputChange('education', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                >
                  <option value="">Select education level</option>
                  <option value="High School">High School</option>
                  <option value="Bachelor's">Bachelor's Degree</option>
                  <option value="Master's">Master's Degree</option>
                  <option value="PhD">PhD</option>
                  <option value="Professional">Professional Degree</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Occupation
                </label>
                <input
                  type="text"
                  value={formData.occupation}
                  onChange={(e) => handleInputChange('occupation', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  placeholder="Your profession"
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h3 className="text-xl font-semibold text-white mb-2">Identity Verification</h3>
              <p className="text-slate-400">Help us verify your identity to ensure a safe community</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Profile Photo *
                </label>
                <div className="border-2 border-dashed border-slate-600 rounded-lg p-6 text-center hover:border-primary-500 transition-colors">
                  <div className="text-center">
                    <div className="mb-4">
                      <InitialsAvatar
                        firstName={formData.firstName || 'Y'}
                        lastName={formData.lastName || 'N'}
                        size="xl"
                        className="mx-auto"
                      />
                    </div>
                    <p className="text-slate-300 mb-2">Your profile picture will use your initials</p>
                    <p className="text-slate-400 text-sm">We'll add photo upload functionality soon!</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  ID Document (Optional)
                </label>
                <div className="border-2 border-dashed border-slate-600 rounded-lg p-6 text-center hover:border-primary-500 transition-colors">
                  <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-400 mb-2">Upload a government-issued ID for faster verification</p>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload('idDocument', e.target.files[0])}
                    className="hidden"
                    id="id-document"
                  />
                  <label
                    htmlFor="id-document"
                    className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg cursor-pointer hover:bg-primary-700"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload ID
                  </label>
                  {formData.idDocument && (
                    <p className="text-green-400 mt-2 flex items-center justify-center">
                      <Check className="w-4 h-4 mr-1" />
                      Document uploaded: {formData.idDocument.name}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Tell us about yourself * (Minimum 50 characters)
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                rows={6}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 resize-none"
                placeholder="Share your story, values, and what you're looking for in a partner..."
                required
                minLength={50}
              />
              <p className="text-xs text-slate-400 mt-1">
                {formData.bio.length}/50 characters minimum
              </p>
            </div>

            <div className="bg-slate-700/50 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-white mb-4">Next Steps</h4>
              <ul className="space-y-2 text-slate-300">
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-400 mr-2" />
                  Complete cultural knowledge quiz
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-400 mr-2" />
                  Identity verification review
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-400 mr-2" />
                  Profile activation
                </li>
              </ul>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-primary-900 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2 text-primary-400 hover:text-primary-300 mb-6">
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Home</span>
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">Join Diaspora Connect</h1>
          <p className="text-slate-400">Create your culturally-aware profile</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  step.id === currentStep
                    ? 'bg-primary-600 text-white'
                    : step.id < currentStep
                    ? 'bg-green-500 text-white'
                    : 'bg-slate-700 text-slate-400'
                }`}
              >
                {step.id < currentStep ? <Check className="w-5 h-5" /> : step.id}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`w-12 md:w-20 h-1 mx-2 ${
                    step.id < currentStep ? 'bg-green-500' : 'bg-slate-700'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Info */}
        <div className="text-center mb-8">
          <h2 className="text-xl font-semibold text-white mb-1">
            {steps[currentStep - 1].title}
          </h2>
          <p className="text-slate-400">{steps[currentStep - 1].description}</p>
        </div>

        {/* Form Content */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-8 border border-slate-700"
        >
          {renderStepContent()}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t border-slate-700">
            <button
              onClick={prevStep}
              disabled={currentStep === 1}
              className="flex items-center px-6 py-3 text-slate-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Previous
            </button>

            {currentStep < steps.length ? (
              <button
                onClick={nextStep}
                className="flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Next
                <ArrowRight className="w-5 h-5 ml-2" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={uploadingFiles}
                className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                {uploadingFiles ? 'Uploading Files...' : 'Complete Registration'}
                <Check className="w-5 h-5 ml-2" />
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}