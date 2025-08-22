import React, { useState, useEffect } from 'react';

interface PluralLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'white' | 'compact';
  showTagline?: boolean;
  className?: string;
}

const PluralLogo: React.FC<PluralLogoProps> = ({ 
  size = 'md', 
  variant = 'default',
  showTagline = false,
  className = '' 
}) => {
  const [currentChar, setCurrentChar] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  
  const brandName = "Plural";
  const tagline = "Safe Learning for Curious Kids!";
  
  const sizeClasses = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl',
    xl: 'text-4xl'
  };

  const taglineSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg'
  };

  const variantClasses = {
    default: 'text-blue-600 font-semibold',
    white: 'text-white font-semibold',
    compact: 'text-blue-700 font-semibold'
  };

  const baseClasses = 'font-bold tracking-tight select-none';

  // Typewriter animation effect
  useEffect(() => {
    if (variant !== 'compact') return;
    
    const interval = setInterval(() => {
      setIsAnimating(true);
      setCurrentChar(prev => {
        if (prev >= brandName.length - 1) {
          setTimeout(() => setIsAnimating(false), 1000);
          return 0;
        }
        return prev + 1;
      });
    }, 150);

    return () => clearInterval(interval);
  }, [variant, brandName.length]);

  const renderAnimatedBrand = () => {
    return (
      <span className="text-blue-600 font-semibold">
        {brandName}
      </span>
    );
  };

  return (
    <div className={`${className}`}>
      <div className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]}`}>
        {renderAnimatedBrand()}
      </div>
      
      {showTagline && (
        <div className={`${taglineSizeClasses[size]} text-gray-600 mt-1 font-medium tracking-normal`}>
          {tagline}
        </div>
      )}
    </div>
  );
};

export default PluralLogo;
