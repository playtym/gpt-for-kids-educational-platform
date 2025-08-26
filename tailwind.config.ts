
import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				// Apple system colors
				apple: {
					blue: "rgb(0, 122, 255)",
					green: "rgb(52, 199, 89)",
					indigo: "rgb(88, 86, 214)",
					orange: "rgb(255, 149, 0)",
					pink: "rgb(255, 45, 85)",
					purple: "rgb(175, 82, 222)",
					red: "rgb(255, 59, 48)",
					teal: "rgb(90, 200, 250)",
					yellow: "rgb(255, 204, 0)",
					gray: {
						50: "rgb(248, 248, 248)",
						100: "rgb(242, 242, 247)",
						200: "rgb(234, 234, 234)",
						300: "rgb(209, 209, 214)",
						400: "rgb(174, 174, 178)",
						500: "rgb(142, 142, 147)",
						600: "rgb(99, 99, 102)",
						700: "rgb(72, 72, 74)",
						800: "rgb(58, 58, 60)",
						900: "rgb(28, 28, 30)"
					}
				},
				// Convenient aliases for Apple colors
				"ios-blue": "rgb(0, 122, 255)",
				"ios-background": "rgb(245, 245, 250)",
				plural: {
					blue: "#0EA5E9",
					purple: "#8B5CF6",
					pink: "#D946EF",
					orange: "#F97316",
				}
			},
			fontFamily: {
				'sf': ['SF Pro Display', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
				'sf-mono': ['SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', 'Dank Mono', 'Consolas', 'DejaVu Sans Mono', 'monospace']
			},
			fontSize: {
				'xs': ['11px', { lineHeight: '16px' }],
				'sm': ['13px', { lineHeight: '18px' }],
				'base': ['15px', { lineHeight: '22px' }],
				'lg': ['17px', { lineHeight: '24px' }],
				'xl': ['20px', { lineHeight: '28px' }],
				'2xl': ['24px', { lineHeight: '32px' }],
				'3xl': ['28px', { lineHeight: '36px' }],
				'4xl': ['32px', { lineHeight: '40px' }],
				'5xl': ['36px', { lineHeight: '44px' }],
			},
			borderRadius: {
				'lg': '12px',
				'md': '8px',
				'sm': '6px',
				'xl': '16px',
				'2xl': '20px',
				'3xl': '24px'
			},
			backdropBlur: {
				'xs': '2px',
				'sm': '4px',
				'md': '8px',
				'lg': '12px',
				'xl': '16px',
				'2xl': '20px',
				'3xl': '24px'
			},
			boxShadow: {
				'native': '0 4px 16px 0 rgba(0, 0, 0, 0.08)',
				'native-hover': '0 8px 24px 0 rgba(0, 0, 0, 0.12)',
				'native-active': '0 2px 8px 0 rgba(0, 0, 0, 0.16)',
				'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
				'focus': '0 0 0 3px rgba(0, 122, 255, 0.3)'
			},
			keyframes: {
				'accordion-down': {
					from: { height: '0' },
					to: { height: 'var(--radix-accordion-content-height)' }
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: '0' }
				},
				'fade-in-native': {
					"0%": {
						opacity: "0",
						transform: "translateY(8px) scale(0.98)"
					},
					"100%": {
						opacity: "1",
						transform: "translateY(0) scale(1)"
					}
				},
				'slide-in-native': {
					"0%": { 
						opacity: "0",
						transform: "translateX(-16px)" 
					},
					"100%": { 
						opacity: "1",
						transform: "translateX(0)" 
					}
				},
				'bounce-native': {
					'0%, 20%, 53%, 80%, 100%': {
						transform: 'translate3d(0,0,0)'
					},
					'40%, 43%': {
						transform: 'translate3d(0, -8px, 0)'
					},
					'70%': {
						transform: 'translate3d(0, -4px, 0)'
					},
					'90%': {
						transform: 'translate3d(0, -2px, 0)'
					}
				},
				'pulse-native': {
					'0%, 100%': { 
						opacity: '0.8',
						transform: 'scale(1)'
					},
					'50%': { 
						opacity: '1',
						transform: 'scale(1.02)'
					}
				},
				'float': {
					'0%, 100%': { transform: 'translateY(0)' },
					'50%': { transform: 'translateY(-10px)' },
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in-native': 'fade-in-native 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)',
				'slide-in-native': 'slide-in-native 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)',
				'bounce-native': 'bounce-native 1s ease-in-out',
				'pulse-native': 'pulse-native 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
				'float': 'float 6s ease-in-out infinite',
			},
			spacing: {
				'18': '4.5rem',
				'88': '22rem',
				'128': '32rem',
				'144': '36rem'
			},
			transitionTimingFunction: {
				'apple': 'cubic-bezier(0.25, 0.8, 0.25, 1)',
				'apple-smooth': 'cubic-bezier(0.25, 0.1, 0.25, 1)'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
