import React from 'react';
import { ArrowRight, Satellite } from 'lucide-react';
import { motion } from 'motion/react';

const LandingPage = ({ onEnter }) => {
  return (
    <div 
      className="h-screen w-screen overflow-hidden bg-black font-sans relative flex flex-col"
      style={{
        backgroundImage: 'url("/landing.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent pointer-events-none" />

      {/* Main Content Area */}
      <main 
        className="flex-1 w-full flex items-center relative z-10"
        style={{ paddingLeft: '8vw', paddingRight: '8vw' }}
      >
        <div className="flex flex-col items-start max-w-lg" style={{ marginBottom: '5rem' }}>
          
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight"
            style={{ marginBottom: '2.5rem', lineHeight: '1.1' }}
          >
            See the storm <br />
            <span className="text-blue-500">
              before it hits.
            </span>
          </motion.h1>
          
          <motion.button 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
            onClick={onEnter}
            className="group flex items-center bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white transition-all shadow-sm"
            style={{ padding: '14px 28px', borderRadius: '8px', gap: '8px', fontSize: '16px', fontWeight: '500' }}
          >
            Access Dashboard
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform opacity-80" />
          </motion.button>
          
        </div>
      </main>

    </div>
  );
};

export default LandingPage;
