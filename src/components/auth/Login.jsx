// src/components/auth/Login.jsx
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ROLES } from '../../utils/constants';
import Alert from '../common/Alert';
import { Building2, Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, currentUser, userProfile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser && userProfile) {
      const role = userProfile.role;
      if (role === ROLES.TENANT) navigate('/tenant');
      else if (role === ROLES.LANDLORD) navigate('/landlord');
      else if (role === ROLES.ADMIN) navigate('/admin');
    }
  }, [currentUser, userProfile, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setError('');
      setLoading(true);
      await login(email, password);
    } catch (error) {
      console.error('Login failed:', error);
      if (error.code === 'auth/user-not-found') {
        setError('No account found with this email');
      } else if (error.code === 'auth/wrong-password') {
        setError('Incorrect password');
      } else if (error.code === 'auth/invalid-credential') {
        setError('Invalid email or password');
      } else {
        setError('Failed to login. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex overflow-x-hidden">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 to-primary-800 p-8 xl:p-12 flex-col justify-between relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/2 translate-y-1/2"></div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center space-x-3 mb-8">
            <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl flex-shrink-0">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl xl:text-2xl font-bold text-white truncate">SocietyHub</h1>
              <p className="text-blue-100 text-sm truncate">Smart Living Platform</p>
            </div>
          </div>

          <div className="space-y-6 xl:space-y-8 mt-12 xl:mt-16">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <h2 className="text-2xl xl:text-3xl font-bold text-white mb-4">
                Welcome Back!
              </h2>
              <p className="text-blue-100 text-base xl:text-lg leading-relaxed">
                Manage your residential community with intelligent automation, 
                transparent billing, and seamless communication.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="text-2xl xl:text-3xl font-bold text-white mb-1">10K+</div>
                <div className="text-blue-100 text-xs xl:text-sm">Happy Residents</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="text-2xl xl:text-3xl font-bold text-white mb-1">98%</div>
                <div className="text-blue-100 text-xs xl:text-sm">Satisfaction Rate</div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-blue-100 text-xs xl:text-sm">
            © 2026 SocietyHub. Powered by Google AI
          </p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 overflow-y-auto">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center mb-6 sm:mb-8">
            <div className="bg-primary-100 p-3 rounded-xl flex-shrink-0">
              <Building2 className="w-8 h-8 text-primary-600" />
            </div>
            <div className="ml-3 min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">SocietyHub</h1>
            </div>
          </div>

          <div className="animate-slide-up">
            <div className="mb-6 sm:mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                Sign in to your account
              </h2>
              <p className="text-sm sm:text-base text-gray-600">
                Enter your credentials to access your dashboard
              </p>
            </div>

            {error && (
              <div className="animate-scale-in mb-4">
                <Alert type="error" message={error} onClose={() => setError('')} />
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field pl-10 text-sm sm:text-base"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <button
                    type="button"
                    className="text-xs sm:text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field pl-10 pr-10 text-sm sm:text-base"
                    placeholder="Enter your password"
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
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full py-2.5 sm:py-3 text-sm sm:text-base font-semibold flex items-center justify-center group"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-5 sm:mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-xs sm:text-sm">
                  <span className="px-4 bg-white text-gray-500">
                    New to SocietyHub?
                  </span>
                </div>
              </div>

              <Link
                to="/signup"
                className="mt-4 btn btn-outline w-full py-2.5 sm:py-3 text-sm sm:text-base font-semibold"
              >
                Create an account
              </Link>
            </div>

            {/* Demo Credentials */}
            <div className="mt-6 sm:mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 sm:p-5 border border-blue-100">
              <p className="text-xs sm:text-sm font-semibold text-gray-700 mb-3 flex items-center flex-wrap">
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mr-2">
                  Demo
                </span>
                Try these test accounts
              </p>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2 bg-white rounded-lg gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 truncate">Tenant</p>
                    <p className="text-gray-500 truncate">tenant@test.com</p>
                  </div>
                  <code className="bg-gray-100 px-2 py-1 rounded text-gray-700 whitespace-nowrap text-xs">
                    Test@123
                  </code>
                </div>
                <div className="flex items-center justify-between p-2 bg-white rounded-lg gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 truncate">Admin</p>
                    <p className="text-gray-500 truncate">admin@test.com</p>
                  </div>
                  <code className="bg-gray-100 px-2 py-1 rounded text-gray-700 whitespace-nowrap text-xs">
                    Test@123
                  </code>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;