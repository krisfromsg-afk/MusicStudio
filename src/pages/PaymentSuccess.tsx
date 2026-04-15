import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { CheckCircle, ArrowRight } from 'lucide-react';

export const PaymentSuccess: React.FC = () => {
  useEffect(() => {
    // Trigger particle fireworks
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti(Object.assign({}, defaults, { 
        particleCount, 
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ['#18181b', '#52525b', '#e4e4e7']
      }));
      confetti(Object.assign({}, defaults, { 
        particleCount, 
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ['#18181b', '#52525b', '#e4e4e7']
      }));
    }, 250);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-10 relative z-10 bg-zinc-50">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', bounce: 0.4 }}
        className="bg-white border border-zinc-200 rounded-2xl p-10 lg:p-12 flex flex-col items-center text-center max-w-lg shadow-sm"
      >
        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        
        <h1 className="text-3xl font-bold text-zinc-900 tracking-tight mb-4">Payment Successful</h1>
        <p className="text-zinc-500 text-base mb-8 leading-relaxed">
          Your credits have been successfully added to your account. You're ready to start generating music.
        </p>

        <Link 
          to="/studio"
          className="bg-zinc-900 text-white px-8 py-3 rounded-lg font-medium text-sm hover:bg-zinc-800 transition-colors flex items-center gap-2"
        >
          Return to Studio
          <ArrowRight className="w-4 h-4" />
        </Link>
      </motion.div>
    </div>
  );
};
