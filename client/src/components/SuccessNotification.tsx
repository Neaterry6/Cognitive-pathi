import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Trophy, X } from 'lucide-react';

interface SuccessNotificationProps {
  show: boolean;
  message: string;
  score?: number;
  onClose: () => void;
}

export default function SuccessNotification({ show, message, score, onClose }: SuccessNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      // Auto close after 4 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300);
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  const getScoreColor = (score?: number) => {
    if (!score) return 'text-green-400';
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-blue-400';
    if (score >= 40) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.9 }}
          className="fixed top-4 right-4 z-50 max-w-md"
        >
          <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-4 rounded-lg shadow-2xl border border-green-400/30">
            <div className="flex items-start space-x-3">
              <motion.div
                initial={{ rotate: -180, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.5, type: "spring" }}
              >
                {score && score >= 70 ? (
                  <Trophy className={`h-6 w-6 ${getScoreColor(score)} flex-shrink-0`} />
                ) : (
                  <CheckCircle className={`h-6 w-6 ${getScoreColor(score)} flex-shrink-0`} />
                )}
              </motion.div>
              
              <div className="flex-1">
                <h3 className="font-bold text-lg">Success!</h3>
                <p className="text-green-100 mt-1">{message}</p>
                {score !== undefined && (
                  <div className="mt-2">
                    <span className={`text-2xl font-bold ${getScoreColor(score)}`}>{score}%</span>
                    <span className="text-green-200 ml-2">Score</span>
                  </div>
                )}
              </div>
              
              <button
                onClick={() => {
                  setIsVisible(false);
                  setTimeout(onClose, 300);
                }}
                className="text-green-200 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Progress bar animation */}
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: 4, ease: 'linear' }}
              className="mt-3 h-1 bg-green-400/30 rounded-full overflow-hidden"
            >
              <motion.div
                initial={{ width: '100%' }}
                animate={{ width: 0 }}
                transition={{ duration: 4, ease: 'linear' }}
                className="h-full bg-green-400"
              />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}