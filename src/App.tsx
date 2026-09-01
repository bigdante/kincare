import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Dashboard } from './pages/Dashboard';
import { Login } from './pages/Login';
import { HealthProvider } from './store';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <HealthProvider>
      <div className="min-h-screen bg-gray-100 flex justify-center font-sans text-gray-900">
        <div className="w-full max-w-md bg-white h-screen overflow-hidden relative shadow-2xl flex flex-col">
          <AnimatePresence mode="wait">
            {!isLoggedIn && (
              <motion.div key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                <Login onLogin={() => setIsLoggedIn(true)} />
              </motion.div>
            )}
            {isLoggedIn && (
              <motion.div key="dashboard" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="h-full flex flex-col">
                <Dashboard onLogout={() => setIsLoggedIn(false)} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </HealthProvider>
  );
}
