import { AnimatePresence, motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import { useEffect } from 'react';

const WinOverlay = ({ show, amount, multiplier, onClose }) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose?.();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black"
          />

          {/* Win content */}
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="relative z-10 text-center"
          >
            {/* Glow effect */}
            <div className="absolute inset-0 blur-3xl bg-casino-green/30 rounded-full" />

            {/* Trophy icon */}
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.5, repeat: 3 }}
              className="relative"
            >
              <Trophy className="w-24 h-24 mx-auto text-casino-gold mb-4" />
            </motion.div>

            {/* WIN text */}
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 0.3, repeat: Infinity }}
              className="text-6xl font-black text-casino-green drop-shadow-lg mb-2"
            >
              WIN!
            </motion.div>

            {/* Amount */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-4xl font-black text-white"
            >
              +${amount?.toFixed(2)}
            </motion.div>

            {/* Multiplier */}
            {multiplier && multiplier > 1 && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-xl text-casino-gold mt-2"
              >
                {multiplier.toFixed(2)}x
              </motion.div>
            )}
          </motion.div>

          {/* Particles */}
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              initial={{
                x: 0,
                y: 0,
                scale: 0,
                opacity: 1
              }}
              animate={{
                x: Math.cos(i * 30 * Math.PI / 180) * 200,
                y: Math.sin(i * 30 * Math.PI / 180) * 200,
                scale: [0, 1, 0],
                opacity: [1, 1, 0]
              }}
              transition={{
                duration: 1,
                delay: 0.3,
                ease: 'easeOut'
              }}
              className="absolute left-1/2 top-1/2 w-4 h-4 rounded-full bg-casino-gold"
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WinOverlay;
