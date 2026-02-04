"use client";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "full" | "icon" | "text";
  theme?: "light" | "dark";
}

/**
 * Happily Eated - Professional Logo Component
 * 
 * A premium, elegant logo design featuring:
 * - Stylized fork and spoon icon forming a heart
 * - Sophisticated typography
 * - Struck-through "Married" with elegant red line
 * - Gradient accent on "Eated"
 */
export default function Logo({ 
  className = "", 
  size = "md",
  variant = "full",
  theme = "light"
}: LogoProps) {
  // Size configurations
  const sizes = {
    sm: { icon: 24, text: "text-lg", gap: "gap-1.5" },
    md: { icon: 32, text: "text-xl", gap: "gap-2" },
    lg: { icon: 40, text: "text-2xl", gap: "gap-2.5" },
    xl: { icon: 56, text: "text-4xl", gap: "gap-3" },
  };

  const config = sizes[size];
  const textColor = theme === "light" ? "text-gray-900" : "text-white";
  const mutedColor = theme === "light" ? "text-gray-400" : "text-gray-500";

  // Icon: Fork & Spoon forming a heart shape
  const IconLogo = ({ size: iconSize }: { size: number }) => (
    <svg
      width={iconSize}
      height={iconSize}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="flex-shrink-0"
    >
      {/* Background Circle with Gradient */}
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#9333ea" />
          <stop offset="50%" stopColor="#c026d3" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
        <linearGradient id="heartGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#ef4444" />
        </linearGradient>
      </defs>
      
      {/* Outer Circle */}
      <circle cx="32" cy="32" r="30" fill="url(#logoGradient)" />
      
      {/* Inner subtle ring */}
      <circle cx="32" cy="32" r="26" fill="none" stroke="white" strokeWidth="0.5" opacity="0.3" />
      
      {/* Heart in center */}
      <path
        d="M32 48C32 48 18 38 18 28C18 22 22 18 28 18C30 18 32 20 32 22C32 20 34 18 36 18C42 18 46 22 46 28C46 38 32 48 32 48Z"
        fill="url(#heartGradient)"
      />
      
      {/* Fork (left) */}
      <g transform="translate(20, 14)">
        <rect x="1" y="8" width="2" height="20" rx="1" fill="white" />
        <rect x="0" y="0" width="1.5" height="6" rx="0.75" fill="white" />
        <rect x="2" y="0" width="1.5" height="6" rx="0.75" fill="white" />
        <rect x="4" y="0" width="1.5" height="6" rx="0.75" fill="white" />
        <rect x="-0.5" y="6" width="6.5" height="2" rx="1" fill="white" />
      </g>
      
      {/* Spoon (right) */}
      <g transform="translate(38, 14)">
        <ellipse cx="3" cy="4" rx="4" ry="5" fill="white" />
        <rect x="2" y="8" width="2" height="20" rx="1" fill="white" />
      </g>
      
      {/* Sparkle accent */}
      <g>
        <circle cx="48" cy="16" r="1.5" fill="white" opacity="0.8" />
        <circle cx="52" cy="20" r="1" fill="white" opacity="0.6" />
        <circle cx="50" cy="14" r="0.8" fill="white" opacity="0.4" />
      </g>
    </svg>
  );

  // Text Logo with strikethrough
  const TextLogo = () => (
    <div className={`font-bold ${config.text} leading-none tracking-tight`}>
      <span className={textColor}>Happily </span>
      <span className="relative inline-block">
        <span className={`${mutedColor}`}>
          Married
        </span>
        <span 
          className="absolute left-0 right-0 top-1/2 h-[2px] bg-gradient-to-r from-red-500 via-red-600 to-red-500"
          style={{ transform: "rotate(-6deg)" }}
        />
      </span>
      <span className="bg-gradient-to-r from-purple-600 via-fuchsia-500 to-pink-500 bg-clip-text text-transparent">
        {" "}Eated
      </span>
    </div>
  );

  if (variant === "icon") {
    return (
      <div className={className}>
        <IconLogo size={config.icon} />
      </div>
    );
  }

  if (variant === "text") {
    return (
      <div className={className}>
        <TextLogo />
      </div>
    );
  }

  // Full logo with icon and text
  return (
    <div className={`flex items-center ${config.gap} ${className}`}>
      <IconLogo size={config.icon} />
      <TextLogo />
    </div>
  );
}

/**
 * Compact Logo for Mobile Header
 */
export function LogoCompact({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      {/* Mini Icon */}
      <svg
        width="28"
        height="28"
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        <defs>
          <linearGradient id="logoGradientCompact" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#9333ea" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
        </defs>
        <circle cx="32" cy="32" r="30" fill="url(#logoGradientCompact)" />
        <path
          d="M32 48C32 48 18 38 18 28C18 22 22 18 28 18C30 18 32 20 32 22C32 20 34 18 36 18C42 18 46 22 46 28C46 38 32 48 32 48Z"
          fill="white"
        />
      </svg>
      
      {/* Short Text */}
      <div className="font-bold text-base leading-none">
        <span className="text-gray-900">H</span>
        <span className="text-gray-400 line-through">M</span>
        <span className="text-purple-600">E</span>
      </div>
    </div>
  );
}

/**
 * Simple inline logo for footer/headers
 */
export function LogoSimple({ className = "", theme = "light" }: { className?: string; theme?: "light" | "dark" }) {
  const textColor = theme === "light" ? "text-gray-900" : "text-white";
  const mutedColor = theme === "light" ? "text-gray-400" : "text-gray-500";
  
  return (
    <span className={`font-bold ${className}`}>
      <span className={textColor}>Happily </span>
      <span className={`${mutedColor} line-through decoration-red-500 decoration-2`}>Married</span>
      <span className="bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent"> Eated</span>
    </span>
  );
}
