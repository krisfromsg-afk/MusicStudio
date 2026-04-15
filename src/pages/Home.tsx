import React from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { loginWithGoogle } from '../lib/firebase';
import { ArrowRight, Zap, Shield, Database } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Home: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 relative bg-zinc-50">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center max-w-3xl mx-auto mt-20"
      >
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-zinc-900 mb-6">
          Wormhole Studio
        </h1>
        <p className="text-lg md:text-xl text-zinc-500 mb-10 max-w-2xl mx-auto leading-relaxed">
          The next generation AI music production platform. 
          Generate, extend, and manipulate audio with state-of-the-art models.
        </p>

        {user ? (
          <Link 
            to="/studio"
            className="inline-flex items-center gap-2 px-8 py-4 bg-zinc-900 text-white rounded-lg font-medium hover:bg-zinc-800 transition-colors shadow-sm"
          >
            Open Studio Engine
            <ArrowRight className="w-5 h-5" />
          </Link>
        ) : (
          <button 
            onClick={loginWithGoogle}
            className="inline-flex items-center gap-2 px-8 py-4 bg-zinc-900 text-white rounded-lg font-medium hover:bg-zinc-800 transition-colors shadow-sm"
          >
            Get Started
            <Zap className="w-5 h-5" />
          </button>
        )}
      </motion.div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 1 }}
        className="mt-24 mb-20 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto w-full"
      >
        <FeatureCard 
          icon={<Zap className="w-6 h-6 text-zinc-900" />}
          title="AI Generation"
          description="Create full tracks from text prompts using advanced AI models."
        />
        <FeatureCard 
          icon={<Database className="w-6 h-6 text-zinc-900" />}
          title="Cloud Storage"
          description="All your generated audio and stems are securely stored in the cloud."
        />
        <FeatureCard 
          icon={<Shield className="w-6 h-6 text-zinc-900" />}
          title="Secure Platform"
          description="Enterprise-grade security and reliable credit management."
        />
      </motion.div>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
  <div className="p-6 rounded-2xl border border-zinc-200 bg-white shadow-sm hover:shadow-md transition-shadow">
    <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center mb-4">
      {icon}
    </div>
    <h3 className="text-lg font-semibold text-zinc-900 mb-2">{title}</h3>
    <p className="text-sm text-zinc-500 leading-relaxed">{description}</p>
  </div>
);
