import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { Zap, Check, Loader2 } from 'lucide-react';

const PRICING_PLANS = [
  {
    id: 'price_1_test_basic', // Replace with real Stripe Price ID
    name: 'Basic',
    credits: 100,
    price: '$5',
    features: ['100 Generation Credits', 'Standard Processing', 'Basic Support']
  },
  {
    id: 'price_1_test_pro', // Replace with real Stripe Price ID
    name: 'Pro',
    credits: 500,
    price: '$20',
    features: ['500 Generation Credits', 'Priority Processing', 'Premium Support', 'High-Quality Stems'],
    popular: true
  },
  {
    id: 'price_1_test_ultra', // Replace with real Stripe Price ID
    name: 'Ultra',
    credits: 2000,
    price: '$50',
    features: ['2000 Generation Credits', 'Instant Processing', '24/7 Support', 'All Exclusive Stems', 'Custom AI Models']
  }
];

export const Pricing: React.FC = () => {
  const { user } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handlePurchase = async (priceId: string, credits: number) => {
    if (!user) {
      alert("Please sign in first.");
      return;
    }

    setLoadingPlan(priceId);
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          userId: user.uid,
          credits
        }),
      });

      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Failed to create checkout session');
      }
    } catch (error: any) {
      console.error("Purchase error:", error);
      alert(`Error: ${error.message}. Make sure STRIPE_SECRET_KEY is set in secrets.`);
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="flex-1 p-6 lg:p-10 flex flex-col items-center justify-center relative z-10 w-full max-w-7xl mx-auto bg-zinc-50">
      <div className="text-center mb-16">
        <h1 className="text-4xl lg:text-5xl font-bold text-zinc-900 tracking-tight mb-4">Simple, transparent pricing</h1>
        <p className="text-zinc-500 text-lg max-w-xl mx-auto">Choose the right plan for your music production needs. No hidden fees.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl">
        {PRICING_PLANS.map((plan) => (
          <motion.div 
            key={plan.name}
            whileHover={{ y: -4 }}
            className={`bg-white rounded-2xl p-8 flex flex-col relative shadow-sm transition-all ${
              plan.popular ? 'border-2 border-zinc-900 shadow-md' : 'border border-zinc-200'
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-zinc-900 text-white px-3 py-1 rounded-full text-xs font-medium tracking-wide">
                Most Popular
              </div>
            )}
            
            <h3 className="text-xl font-semibold text-zinc-900 mb-2">{plan.name}</h3>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-4xl font-bold text-zinc-900">{plan.price}</span>
              <span className="text-zinc-500 font-medium">/one-time</span>
            </div>
            
            <ul className="flex-1 flex flex-col gap-4 mb-8">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-zinc-600">
                  <Check className="w-5 h-5 text-zinc-900 shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>

            <button
              onClick={() => handlePurchase(plan.id, plan.credits)}
              disabled={loadingPlan !== null}
              className={`w-full py-3 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2 ${
                plan.popular 
                  ? 'bg-zinc-900 text-white hover:bg-zinc-800' 
                  : 'bg-white text-zinc-900 border border-zinc-200 hover:bg-zinc-50'
              } disabled:opacity-70 disabled:cursor-not-allowed`}
            >
              {loadingPlan === plan.id ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Zap className="w-4 h-4" />
              )}
              {loadingPlan === plan.id ? 'Processing...' : 'Get Started'}
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
