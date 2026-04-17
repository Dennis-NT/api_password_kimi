import { useState, useEffect } from "react";

interface TotpCountdownProps {
  remaining: number;
}

export function TotpCountdown({ remaining }: TotpCountdownProps) {
  const [progress, setProgress] = useState(remaining);

  useEffect(() => {
    setProgress(remaining);
  }, [remaining]);

  const percentage = (progress / 30) * 100;
  const isLow = progress <= 5;

  return (
    <div className="flex items-center gap-2">
      <div className="relative w-6 h-6">
        <svg className="w-6 h-6 -rotate-90" viewBox="0 0 24 24">
          <circle
            cx="12"
            cy="12"
            r="10"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-border"
          />
          <circle
            cx="12"
            cy="12"
            r="10"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray={`${percentage * 0.628} 100`}
            className={`transition-all duration-1000 ${isLow ? "text-danger" : "text-success"}`}
          />
        </svg>
      </div>
      <span className={`text-xs ${isLow ? "text-danger" : "text-text-secondary"}`}>
        {progress}s
      </span>
    </div>
  );
}
