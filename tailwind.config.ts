import { type Config } from "tailwindcss";

export default {
  content: [
    "{routes,islands,components}/**/*.{ts,tsx}",
    "static/**/*.{html,js}",
    "utils/**/*.{ts,tsx}",
    "src/**/*.{ts,tsx}",
  ],
  safelist: [
    // 确保这些动画类不被purge
    'animate-fadeIn',
    'animate-scaleIn', 
    'animate-slideUp',
    'animate-pulse',
    'animate-spin',
    'animate-bounce',
    // 确保gradient类不被purge
    'bg-gradient-to-r',
    'bg-gradient-to-br',
    'bg-gradient-to-tr',
    'from-blue-500',
    'to-purple-600',
    'from-green-400',
    'to-emerald-500',
    'from-purple-500',
    'to-pink-600',
    'from-orange-500',
    'to-red-600',
    'from-yellow-400',
    'to-orange-500',
    // 确保特殊工具类不被purge
    'backdrop-blur-xl',
    'backdrop-filter',
    'backdrop-blur-sm',
    'border-white/20',
    'bg-white/10',
    'bg-white/20',
    'text-white/80',
    // Profile页面特殊类
    'glass-card',
    'stat-card-hover',
    // PWA相关类
    'pwa-installed',
    'pwa-installable',
  ],
  theme: {
    extend: {
      animation: {
        'fadeIn': 'fadeIn 0.2s ease-out',
        'scaleIn': 'scaleIn 0.3s ease-out',
        'slideUp': 'slideUp 0.5s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
