// src/components/auth/Signup.jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ROLES } from '../../utils/constants';
import Alert from '../common/Alert';
import { Building2, Mail, Lock, User, Phone, Home, ArrowRight, Eye, EyeOff, CheckCircle2 } from 'lucide-react';

function Signup() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    role: ROLES.TENANT,
    flatNumber: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  
  const { signup } = useAuth();
  const navigate = useNavigate();

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }

  function validateStep1() {
    if (!formData.name || !formData.email || !formData.phone) {
      setError('Please fill in all required fields');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    if (formData.phone.length < 10) {
      setError('Please enter a valid phone number');
      return false;
    }
    setError('');
    return true;
  }

  function handleNext() {
    if (validateStep1()) {
      setCurrentStep(2);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }
    
    if (formData.password.length < 6) {
      return setError('Password must be at least 6 characters');
    }

    try {
      setError('');
      setLoading(true);
      
      await signup(formData.email, formData.password, {
        name: formData.name,
        role: formData.role,
        phone: formData.phone,
        flatNumber: formData.flatNumber,
        societyId: 'sunshine_apartments'
      });
      
      navigate('/login');
      
    } catch (error) {
      console.error('Signup failed:', error);
      if (error.code === 'auth/email-already-in-use') {
        setError('Email already registered');
      } else if (error.code === 'auth/invalid-email') {
        setError('Invalid email address');
      } else if (error.code === 'auth/weak-password') {
        setError('Password is too weak');
      } else {
        setError('Failed to create account. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <div className="flex items-center justify-center mb-8 animate-slide-up">
          <div className="bg-primary-100 p-3 rounded-xl">
            <Building2 className="w-8 h-8 text-primary-600" />
          </div>
          <div className="ml-3">
            <h1 className="text-xl font-bold text-gray-900">SocietyHub</h1>
            <p className="text-sm text-gray-600">Smart Living Platform</p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            <div className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                currentStep >= 1 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {currentStep > 1 ? <CheckCircle2 className="w-6 h-6" /> : '1'}
              </div>
              <span className="ml-2 text-sm font-medium hidden sm:inline">Basic Info</span>
            </div>
            <div className={`w-16 h-1 rounded-full transition-all ${
              currentStep >= 2 ? 'bg-primary-600' : 'bg-gray-200'
            }`}></div>
            <div className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                currentStep >= 2 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-gray-200 text-gray-600'
              }`}>
                2
              </div>
              <span className="ml-2 text-sm font-medium hidden sm:inline">Account Setup</span>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 animate-scale-in">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {currentStep === 1 ? 'Create your account' : 'Set up your password'}
            </h2>
            <p className="text-gray-600">
              {currentStep === 1 
                ? 'Enter your details to get started' 
                : 'Create a secure password for your account'}
            </p>
          </div>

          {error && (
            <div className="animate-scale-in mb-6">
              <Alert type="error" message={error} onClose={() => setError('')} />
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {currentStep === 1 ? (
              <>
                {/* Step 1: Basic Information */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="input-field pl-10"
                        placeholder="John Doe"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="input-field pl-10"
                        placeholder="you@example.com"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="input-field pl-10"
                        placeholder="9876543210"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      I am a <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      className="input-field"
                    >
                      <option value={ROLES.TENANT}>Tenant (Renting a flat)</option>
                      <option value={ROLES.LANDLORD}>Landlord (Own property)</option>
                      <option value={ROLES.ADMIN}>Admin (Society Manager)</option>
                    </select>
                  </div>

                  {formData.role === ROLES.TENANT && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Flat Number
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Home className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          name="flatNumber"
                          value={formData.flatNumber}
                          onChange={handleChange}
                          className="input-field pl-10"
                          placeholder="302"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleNext}
                  className="btn btn-primary w-full py-3 text-base font-semibold flex items-center justify-center group"
                >
                  Continue
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </>
            ) : (
              <>
                {/* Step 2: Password Setup */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className="input-field pl-10 pr-10"
                        placeholder="Create a strong password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                        )}
                      </button>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Must be at least 6 characters
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className="input-field pl-10"
                        placeholder="Re-enter your password"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="btn btn-secondary flex-1 py-3 text-base font-semibold"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary flex-1 py-3 text-base font-semibold flex items-center justify-center"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Creating...
                      </>
                    ) : (
                      'Create Account'
                    )}
                  </button>
                </div>
              </>
            )}
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link 
                to="/login" 
                className="text-primary-600 hover:text-primary-700 font-semibold"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          By signing up, you agree to our{' '}
          <button className="text-primary-600 hover:underline">Terms of Service</button>
          {' '}and{' '}
          <button className="text-primary-600 hover:underline">Privacy Policy</button>
        </p>
      </div>
    </div>
  );
}

export default Signup;