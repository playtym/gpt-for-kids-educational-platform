import React from 'react';
import { Star, Heart, Sparkles, Zap, Trophy, Sun, Moon, Cloud, Rainbow, Rocket, Crown, Gift } from 'lucide-react';

interface KidsFunElementsProps {
  type: 'floating-icons' | 'background-pattern' | 'celebration' | 'weather';
  className?: string;
}

export const KidsFunElements: React.FC<KidsFunElementsProps> = ({ type, className = '' }) => {
  const renderFloatingIcons = () => (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}>
      <Star className="absolute top-10 left-10 text-yellow-400 animate-bounce-gentle opacity-30" size={20} style={{ animationDelay: '0s' }} />
      <Heart className="absolute top-20 right-20 text-pink-400 animate-pulse-subtle opacity-25" size={18} style={{ animationDelay: '0.5s' }} />
      <Sparkles className="absolute bottom-32 left-16 text-purple-400 animate-wiggle opacity-30" size={16} style={{ animationDelay: '1s' }} />
      <Zap className="absolute bottom-40 right-32 text-blue-400 animate-bounce-gentle opacity-25" size={22} style={{ animationDelay: '1.5s' }} />
      <Trophy className="absolute top-1/2 left-1/4 text-orange-400 animate-pulse-subtle opacity-30" size={19} style={{ animationDelay: '2s' }} />
      <Rainbow className="absolute top-1/3 right-1/3 text-indigo-400 animate-float opacity-25" size={24} style={{ animationDelay: '2.5s' }} />
      <Rocket className="absolute top-1/4 left-1/2 text-green-400 animate-bounce-gentle opacity-30" size={20} style={{ animationDelay: '3s' }} />
      <Crown className="absolute bottom-1/4 right-1/4 text-yellow-500 animate-wiggle opacity-25" size={18} style={{ animationDelay: '3.5s' }} />
      <Gift className="absolute top-3/4 left-1/5 text-red-400 animate-pulse-subtle opacity-30" size={17} style={{ animationDelay: '4s' }} />
    </div>
  );

  const renderBackgroundPattern = () => (
    <div className={`absolute inset-0 pointer-events-none ${className}`}>
      <div className="absolute inset-0 kids-gradient-bg opacity-5"></div>
      <div className="absolute inset-0" style={{
        backgroundImage: `
          radial-gradient(circle at 20% 20%, rgba(102, 126, 234, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 80% 80%, rgba(253, 121, 168, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 40% 70%, rgba(85, 239, 196, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 70% 30%, rgba(253, 203, 110, 0.1) 0%, transparent 50%)
        `
      }}></div>
      <div className="absolute inset-0 opacity-20">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-sparkle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          ></div>
        ))}
      </div>
    </div>
  );

  const renderCelebration = () => (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}>
      {[...Array(12)].map((_, i) => (
        <div
          key={i}
          className="absolute animate-bounce-gentle"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 2}s`,
            animationDuration: `${2 + Math.random() * 2}s`
          }}
        >
          <span className="text-3xl filter drop-shadow-lg">
            {['🎉', '🌟', '✨', '🎊', '🌈', '💫'][Math.floor(Math.random() * 6)]}
          </span>
        </div>
      ))}
    </div>
  );

  const renderWeather = () => (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}>
      <Sun className="absolute top-6 right-6 text-yellow-400 animate-pulse-subtle opacity-40" size={28} />
      <Cloud className="absolute top-12 left-1/4 text-blue-200 animate-float opacity-50" size={32} />
      <Moon className="absolute bottom-20 right-1/5 text-indigo-300 animate-wiggle opacity-35" size={24} />
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="absolute text-blue-300 animate-float opacity-30"
          style={{
            left: `${20 + Math.random() * 60}%`,
            top: `${10 + Math.random() * 40}%`,
            animationDelay: `${Math.random() * 4}s`,
            animationDuration: `${4 + Math.random() * 2}s`
          }}
        >
          ☁️
        </div>
      ))}
    </div>
  );

  switch (type) {
    case 'floating-icons':
      return renderFloatingIcons();
    case 'background-pattern':
      return renderBackgroundPattern();
    case 'celebration':
      return renderCelebration();
    case 'weather':
      return renderWeather();
    default:
      return null;
  }
};

interface KidsButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'fun' | 'magic';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  emoji?: string;
  onClick?: (e?: React.MouseEvent) => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

export const KidsButton: React.FC<KidsButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  emoji,
  onClick,
  disabled = false,
  type = 'button'
}) => {
  const baseClasses = 'btn-magical rounded-2xl font-medium transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-purple-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2';
  
  const variantClasses = {
    primary: 'kids-purple-gradient text-white shadow-lg hover:shadow-xl kids-shadow',
    secondary: 'bg-white/90 text-purple-700 border-2 border-purple-200 hover:border-purple-300 shadow-md hover:shadow-lg',
    fun: 'kids-pink-gradient text-white shadow-lg hover:shadow-xl kids-shadow animate-pulse-subtle',
    magic: 'kids-gradient-bg text-white shadow-xl hover:shadow-2xl kids-shadow-lg animate-shimmer'
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  return (
    <button
      type={type}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {emoji && <span className="text-lg animate-bounce-gentle">{emoji}</span>}
      {children}
    </button>
  );
};interface KidsCardProps {
  children: React.ReactNode;
  variant?: 'default' | 'fun' | 'magical' | 'success' | 'rainbow';
  className?: string;
  emoji?: string;
  title?: string;
  onClick?: () => void;
}

export const KidsCard: React.FC<KidsCardProps> = ({ 
  children, 
  variant = 'default', 
  className = '',
  emoji,
  title,
  onClick
}) => {
  const baseClasses = 'card-magical rounded-3xl p-6 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer';
  
  const variants = {
    default: 'bg-white/95 shadow-lg hover:shadow-xl border border-purple-100',
    fun: 'kids-pink-gradient text-white shadow-lg hover:shadow-xl kids-shadow animate-pulse-subtle',
    magical: 'kids-gradient-bg text-white shadow-xl hover:shadow-2xl kids-shadow-lg animate-gradient-shift',
    success: 'kids-green-gradient text-white shadow-lg hover:shadow-xl kids-shadow',
    rainbow: 'kids-rainbow-gradient text-white shadow-xl hover:shadow-2xl kids-shadow-lg animate-shimmer'
  };

  return (
    <div 
      className={`${baseClasses} ${variants[variant]} ${className}`}
      onClick={onClick}
    >
      {(emoji || title) && (
        <div className="flex items-center gap-3 mb-4">
          {emoji && <span className="text-2xl animate-bounce-gentle">{emoji}</span>}
          {title && <h3 className="text-xl font-bold">{title}</h3>}
        </div>
      )}
      {children}
    </div>
  );
};

export default { KidsFunElements, KidsButton, KidsCard };
