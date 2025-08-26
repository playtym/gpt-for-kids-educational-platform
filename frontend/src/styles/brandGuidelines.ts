// Central Brand Guidelines for Plural Educational Platform
// Duolingo-inspired flat design system

export const brandColors = {
  // Primary Brand Colors
  primary: {
    green: '#58A700',      // Duolingo green for primary actions
    greenHover: '#4A8F00', // Darker green for hover states
    greenLight: '#E8F5E8', // Light green backgrounds
  },
  
  // Background Colors
  background: {
    primary: '#F7F7F7',    // Main app background (light grey)
    card: '#FFFFFF',       // Card backgrounds (white)
    cardHover: '#F9F9F9',  // Card hover state
  },
  
  // Text Colors
  text: {
    primary: '#3C3C43',    // Primary text (dark grey)
    secondary: '#8E8E93',  // Secondary text (medium grey)
    muted: '#C7C7CC',      // Muted text (light grey)
    placeholder: '#8E8E93', // Input placeholder text
    white: '#FFFFFF',      // White text for dark backgrounds
  },
  
  // Border Colors
  border: {
    primary: '#E5E5EA',    // Default borders
    focus: '#58A700',      // Focus state borders
    hover: '#D1D1D6',      // Hover state borders
  },
  
  // Status Colors
  status: {
    success: '#34C759',    // Success states
    warning: '#FF9500',    // Warning states (orange instead of yellow)
    error: '#FF3B30',      // Error states
    info: '#007AFF',       // Info states
  },
  
  // Interactive States
  interactive: {
    // Button states
    buttonHover: '#F9F9F9', // Light grey hover for buttons
    buttonActive: '#E5E5EA', // Active button state
    
    // Input states
    inputFocus: '#58A700',  // Green focus for inputs
    inputBorder: '#E5E5EA', // Default input borders
    
    // Link states
    link: '#007AFF',        // Link color
    linkHover: '#0056CC',   // Link hover
  },
  
  // Component-specific colors
  components: {
    // Sidebar
    sidebarBg: '#FFFFFF',
    sidebarText: '#3C3C43',
    sidebarActive: '#58A700',
    
    // Progress indicators
    progressBar: '#58A700',
    progressBg: '#E5E5EA',
    
    // Avatars and icons
    avatarBg: '#58A700',
    iconPrimary: '#58A700',
    iconSecondary: '#8E8E93',
  }
};

// Typography scale
export const typography = {
  fontFamily: {
    primary: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  }
};

// Spacing scale (consistent with Tailwind)
export const spacing = {
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '0.75rem',   // 12px
  lg: '1rem',      // 16px
  xl: '1.25rem',   // 20px
  '2xl': '1.5rem', // 24px
  '3xl': '1.875rem', // 30px
  '4xl': '2.25rem',  // 36px
};

// Border radius scale
export const borderRadius = {
  sm: '0.25rem',   // 4px
  md: '0.375rem',  // 6px
  lg: '0.5rem',    // 8px
  xl: '0.75rem',   // 12px
  '2xl': '1rem',   // 16px
  full: '9999px',  // Fully rounded
};

// Shadow scale
export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  none: 'none',
};

// Animation durations
export const transitions = {
  fast: '150ms',
  normal: '200ms',
  slow: '300ms',
};

// Utility functions for consistent styling
export const getButtonStyles = (variant: 'primary' | 'secondary' | 'ghost' = 'primary') => {
  const baseStyles = `
    transition-all duration-${transitions.normal} 
    font-medium rounded-${borderRadius.lg} 
    border focus:outline-none focus:ring-2 focus:ring-offset-2
  `;
  
  switch (variant) {
    case 'primary':
      return `${baseStyles} 
        bg-[${brandColors.primary.green}] text-white border-transparent 
        hover:bg-[${brandColors.primary.greenHover}] 
        focus:ring-[${brandColors.primary.green}]`;
    case 'secondary':
      return `${baseStyles} 
        bg-[${brandColors.background.card}] text-[${brandColors.text.primary}] 
        border-[${brandColors.border.primary}] 
        hover:bg-[${brandColors.interactive.buttonHover}] 
        focus:ring-[${brandColors.primary.green}]`;
    case 'ghost':
      return `${baseStyles} 
        bg-transparent text-[${brandColors.text.primary}] border-transparent 
        hover:bg-[${brandColors.interactive.buttonHover}] 
        focus:ring-[${brandColors.primary.green}]`;
    default:
      return baseStyles;
  }
};

export const getInputStyles = () => `
  w-full px-3 py-2 
  bg-[${brandColors.background.card}] 
  border border-[${brandColors.border.primary}] 
  rounded-${borderRadius.lg} 
  text-[${brandColors.text.primary}] 
  placeholder:text-[${brandColors.text.placeholder}] 
  focus:outline-none focus:ring-2 focus:ring-[${brandColors.primary.green}] focus:border-[${brandColors.primary.green}]
  transition-colors duration-${transitions.normal}
`;

export const getCardStyles = () => `
  bg-[${brandColors.background.card}] 
  border border-[${brandColors.border.primary}] 
  rounded-${borderRadius['2xl']} 
  shadow-${shadows.sm}
`;

// Specific Tailwind classes for consistent usage
export const tailwindClasses = {
  // Buttons
  primaryButton: "bg-green-600 hover:bg-green-700 text-white border-transparent focus:ring-green-500",
  secondaryButton: "bg-white text-gray-700 border-gray-300 hover:bg-gray-50 focus:ring-green-500",
  ghostButton: "bg-transparent text-gray-700 border-transparent hover:bg-gray-50 focus:ring-green-500",
  dangerButton: "bg-red-600 hover:bg-red-700 text-white border-transparent focus:ring-red-500",
  
  // Input fields
  input: "bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-green-500 focus:ring-green-500",
  searchInput: "bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-green-500 focus:ring-green-500",
  
  // Text colors
  primaryText: "text-gray-900",
  secondaryText: "text-gray-600",
  mutedText: "text-gray-500",
  placeholderText: "text-gray-500",
  successText: "text-green-600",
  warningText: "text-orange-600",
  errorText: "text-red-600",
  
  // Background colors
  primaryBg: "bg-gray-50",
  cardBg: "bg-white",
  hoverBg: "hover:bg-gray-50",
  
  // Status indicators
  successBg: "bg-green-50 text-green-800 border-green-200",
  warningBg: "bg-orange-50 text-orange-800 border-orange-200",
  errorBg: "bg-red-50 text-red-800 border-red-200",
  infoBg: "bg-blue-50 text-blue-800 border-blue-200",
};

// Color mapping to convert existing hardcoded colors to brand-consistent alternatives
export const colorMapping = {
  // Purple -> Green (convert purple to our primary green)
  'text-purple-500': 'text-green-500',
  'text-purple-600': 'text-green-600',
  'text-purple-700': 'text-green-700',
  'text-purple-800': 'text-green-800',
  'bg-purple-50': 'bg-green-50',
  'bg-purple-100': 'bg-green-100',
  'bg-purple-500': 'bg-green-500',
  'bg-purple-600': 'bg-green-600',
  'bg-purple-700': 'bg-green-700',
  'border-purple-100': 'border-green-100',
  'border-purple-200': 'border-green-200',
  'border-purple-300': 'border-green-300',
  'hover:bg-purple-50': 'hover:bg-green-50',
  'hover:bg-purple-600': 'hover:bg-green-600',
  'hover:bg-purple-700': 'hover:bg-green-700',
  'hover:border-purple-300': 'hover:border-green-300',
  
  // Blue colors (keep for info/secondary actions)
  'text-blue-600': 'text-blue-600',
  'text-blue-700': 'text-blue-700',
  'text-blue-800': 'text-blue-800',
  'bg-blue-50': 'bg-blue-50',
  'bg-blue-100': 'bg-blue-100',
  'bg-blue-600': 'bg-blue-600',
  'bg-blue-700': 'bg-blue-700',
  'border-blue-100': 'border-blue-100',
  'border-blue-200': 'border-blue-200',
  'border-blue-300': 'border-blue-300',
  'hover:bg-blue-50': 'hover:bg-blue-50',
  'hover:bg-blue-700': 'hover:bg-blue-700',
  
  // Orange colors (keep for warnings)
  'text-orange-600': 'text-orange-600',
  'border-orange-200': 'border-orange-200',
  
  // Red colors (keep for errors/danger)
  'text-red-500': 'text-red-500',
  'text-red-600': 'text-red-600',
  'text-red-700': 'text-red-700',
  'text-red-800': 'text-red-800',
  'bg-red-50': 'bg-red-50',
  'bg-red-100': 'bg-red-100',
  'bg-red-500': 'bg-red-500',
  'bg-red-600': 'bg-red-600',
  'bg-red-700': 'bg-red-700',
  'border-red-200': 'border-red-200',
  'border-red-300': 'border-red-300',
  'border-red-500': 'border-red-500',
  'hover:bg-red-700': 'hover:bg-red-700',
};

// Utility to get brand-consistent color class
export const getBrandColor = (originalClass: string): string => {
  return colorMapping[originalClass as keyof typeof colorMapping] || originalClass;
};
