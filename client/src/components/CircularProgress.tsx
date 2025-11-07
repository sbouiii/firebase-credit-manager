import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface CircularProgressProps {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  icon?: LucideIcon;
  gradient?: string;
  label?: string;
  delay?: number;
}

export function CircularProgress({
  value,
  max,
  size = 120,
  strokeWidth = 8,
  icon: Icon,
  gradient = "from-blue-500 to-purple-500",
  label,
  delay = 0,
}: CircularProgressProps) {
  const percentage = Math.min((value / max) * 100, 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <motion.div
      className="relative flex flex-col items-center justify-center"
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, type: "spring", bounce: 0.4 }}
    >
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted opacity-20"
        />
        {/* Gradient definition */}
        <defs>
          <linearGradient id={`gradient-${gradient.replace(/\s/g, "-")}`} x1="0%" y1="0%" x2="100%" y2="100%">
            {gradient.includes("blue") && (
              <>
                <stop offset="0%" stopColor="rgb(59, 130, 246)" />
                <stop offset="100%" stopColor="rgb(147, 51, 234)" />
              </>
            )}
            {gradient.includes("green") && (
              <>
                <stop offset="0%" stopColor="rgb(34, 197, 94)" />
                <stop offset="100%" stopColor="rgb(16, 185, 129)" />
              </>
            )}
            {gradient.includes("orange") && (
              <>
                <stop offset="0%" stopColor="rgb(249, 115, 22)" />
                <stop offset="100%" stopColor="rgb(239, 68, 68)" />
              </>
            )}
            {gradient.includes("purple") && (
              <>
                <stop offset="0%" stopColor="rgb(168, 85, 247)" />
                <stop offset="100%" stopColor="rgb(236, 72, 153)" />
              </>
            )}
          </linearGradient>
        </defs>
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          style={{
            stroke: `url(#gradient-${gradient.replace(/\s/g, "-")})`,
          }}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut", delay: delay + 0.2 }}
          strokeDasharray={circumference}
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {Icon && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: delay + 0.4, type: "spring", bounce: 0.5 }}
          >
            <Icon className="h-6 w-6 text-muted-foreground mb-1" />
          </motion.div>
        )}
        <motion.span
          className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: delay + 0.5 }}
        >
          {percentage.toFixed(0)}%
        </motion.span>
        {label && (
          <motion.span
            className="text-xs text-muted-foreground mt-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: delay + 0.6 }}
          >
            {label}
          </motion.span>
        )}
      </div>
    </motion.div>
  );
}

