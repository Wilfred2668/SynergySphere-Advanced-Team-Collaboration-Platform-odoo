import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  RocketLaunchIcon, 
  ChatBubbleLeftRightIcon, 
  ChartBarIcon, 
  ShieldCheckIcon,
  ArrowRightIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';

const features = [
  {
    icon: RocketLaunchIcon,
    title: 'Project Management',
    description: 'Organize projects with role-based access control and team collaboration.',
    color: 'from-blue-500 to-cyan-500'
  },
  {
    icon: ChatBubbleLeftRightIcon,
    title: 'Real-time Discussions',
    description: 'Collaborate with your team through instant messaging and threaded discussions.',
    color: 'from-purple-500 to-pink-500'
  },
  {
    icon: ChartBarIcon,
    title: 'Task Tracking',
    description: 'Track progress with advanced filtering, due dates, and status management.',
    color: 'from-green-500 to-emerald-500'
  },
  {
    icon: ShieldCheckIcon,
    title: 'Secure & Reliable',
    description: 'Enterprise-grade security with JWT authentication and data protection.',
    color: 'from-orange-500 to-red-500'
  }
];

const stats = [
  { label: 'Projects Managed', value: '10K+' },
  { label: 'Active Users', value: '50K+' },
  { label: 'Tasks Completed', value: '1M+' },
  { label: 'Uptime', value: '99.9%' }
];

export const Landing: React.FC = () => {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/app" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Navigation */}
      <nav className="relative z-10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-2"
          >
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">S</span>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              SynergySphere
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-4"
          >
            <Link
              to="/login"
              className="px-4 py-2 text-gray-700 hover:text-blue-600 transition-colors duration-200 font-medium"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200 font-medium"
            >
              Get Started
            </Link>
          </motion.div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent mb-6"
            >
              Team Collaboration
              <br />
              <span className="text-gray-800">Reimagined</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed"
            >
              Streamline your workflow with powerful project management, real-time collaboration, 
              and intelligent task tracking. Built for modern teams.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6"
            >
              <Link
                to="/register"
                className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold text-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center space-x-2"
              >
                <span>Start Free Trial</span>
                <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
              </Link>
              <Link
                to="/login"
                className="px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold text-lg hover:border-blue-400 hover:text-blue-600 transition-all duration-200"
              >
                Watch Demo
              </Link>
            </motion.div>
          </div>

          {/* Hero Image/Animation */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-20 relative"
          >
            <div className="glass-effect rounded-2xl p-8 max-w-4xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <div className="h-4 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full w-3/4"></div>
                  <div className="h-4 bg-gradient-to-r from-green-400 to-green-600 rounded-full w-1/2"></div>
                  <div className="h-4 bg-gradient-to-r from-purple-400 to-purple-600 rounded-full w-2/3"></div>
                </div>
                <div className="space-y-4">
                  <div className="h-4 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full w-2/3"></div>
                  <div className="h-4 bg-gradient-to-r from-pink-400 to-pink-600 rounded-full w-3/4"></div>
                  <div className="h-4 bg-gradient-to-r from-cyan-400 to-cyan-600 rounded-full w-1/2"></div>
                </div>
                <div className="space-y-4">
                  <div className="h-4 bg-gradient-to-r from-indigo-400 to-indigo-600 rounded-full w-1/2"></div>
                  <div className="h-4 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full w-2/3"></div>
                  <div className="h-4 bg-gradient-to-r from-rose-400 to-rose-600 rounded-full w-3/4"></div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-6 py-20 bg-white/50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
              Everything you need to succeed
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Powerful features designed to boost productivity and streamline collaboration
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group"
              >
                <div className="glass-effect rounded-2xl p-8 h-full hover:shadow-xl transition-all duration-300 group-hover:-translate-y-2">
                  <div className={`w-12 h-12 bg-gradient-to-r ${feature.color} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-3">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-20 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold text-white mb-6"
          >
            Ready to transform your workflow?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-xl text-blue-100 mb-8"
          >
            Join thousands of teams already using SynergySphere to boost productivity
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <Link
              to="/register"
              className="inline-flex items-center space-x-2 px-8 py-4 bg-white text-blue-600 rounded-xl font-semibold text-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              <span>Get Started Today</span>
              <CheckIcon className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-12 bg-gray-900">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">S</span>
            </div>
            <span className="text-xl font-bold text-white">SynergySphere</span>
          </div>
          <p className="text-gray-400">
            © 2025 SynergySphere. All rights reserved. Built with ❤️ for modern teams.
          </p>
        </div>
      </footer>
    </div>
  );
};
