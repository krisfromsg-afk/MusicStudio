/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AudioPlayerProvider } from './contexts/AudioPlayerContext';
import { Navbar } from './components/Navbar';
import { Home } from './pages/Home';
import { Dashboard } from './pages/Dashboard';
import { Studio } from './pages/Studio';
import { Pricing } from './pages/Pricing';
import { PaymentSuccess } from './pages/PaymentSuccess';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Toaster } from 'react-hot-toast';

export default function App() {
  return (
    <AuthProvider>
      <AudioPlayerProvider>
        <Router>
          <div className="min-h-screen flex flex-col relative bg-zinc-50">
            <Toaster position="top-right" />
            <div className="relative z-10 flex flex-col min-h-screen">
              <Navbar />
              <main className="flex-1 flex flex-col">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/pricing" element={<Pricing />} />
                  <Route path="/payment/success" element={<PaymentSuccess />} />
                  <Route element={<ProtectedRoute />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/studio" element={<Studio />} />
                  </Route>
                </Routes>
              </main>
            </div>
          </div>
        </Router>
      </AudioPlayerProvider>
    </AuthProvider>
  );
}
