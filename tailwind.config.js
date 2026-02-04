/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                casino: {
                    bg: '#050505',
                    card: '#111111',
                    border: '#1a1a1a',
                    cyan: '#00f2ff',
                    purple: '#bc13fe',
                    gold: '#ffd700',
                    green: '#00ff88',
                    red: '#ff3366',
                    orange: '#ff6b35'
                }
            },
            fontFamily: {
                mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
                display: ['Orbitron', 'sans-serif']
            },
            animation: {
                'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
                'neon-flicker': 'neon-flicker 0.5s ease-in-out infinite',
                'slide-up': 'slide-up 0.3s ease-out',
                'slide-down': 'slide-down 0.3s ease-out',
                'slide-in-left': 'slide-in-left 0.4s ease-out',
                'slide-in-right': 'slide-in-right 0.4s ease-out',
                'fade-in': 'fade-in 0.3s ease-in',
                'fade-in-up': 'fade-in-up 0.5s ease-out',
                'fade-in-down': 'fade-in-down 0.5s ease-out',
                'scale-in': 'scale-in 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                'scale-out': 'scale-out 0.2s ease-in',
                'spin-slow': 'spin 3s linear infinite',
                'spin-slower': 'spin 8s linear infinite',
                'bounce-soft': 'bounce-soft 0.6s ease-out',
                'bounce-gentle': 'bounce-gentle 2s ease-in-out infinite',
                'float': 'float 3s ease-in-out infinite',
                'float-delayed': 'float 3s ease-in-out 0.5s infinite',
                'shake': 'shake 0.5s ease-in-out',
                'wiggle': 'wiggle 0.8s ease-in-out',
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'gradient-shift': 'gradient-shift 3s ease infinite',
                'glow-border': 'glow-border 2s ease-in-out infinite',
                'shimmer': 'shimmer 2s linear infinite',
                'grain': 'grain 8s steps(10) infinite',
                'scanlines': 'scanlines 0.5s linear infinite',
                'flip-horizontal': 'flip-horizontal 0.6s ease-in-out',
                'flip-vertical': 'flip-vertical 0.6s ease-in-out',
                'rotate-y': 'rotate-y 0.6s ease-in-out',
                'bounce-in': 'bounce-in 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                'zoom-in': 'zoom-in 0.3s ease-out',
                'slide-up-fade': 'slide-up-fade 0.4s ease-out',
                'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite'
            },
            keyframes: {
                'glow-pulse': {
                    '0%, 100%': {
                        boxShadow: '0 0 5px currentColor, 0 0 10px currentColor, 0 0 20px currentColor'
                    },
                    '50%': {
                        boxShadow: '0 0 10px currentColor, 0 0 20px currentColor, 0 0 40px currentColor'
                    }
                },
                'neon-flicker': {
                    '0%, 100%': { opacity: '1' },
                    '50%': { opacity: '0.8' }
                },
                'slide-up': {
                    '0%': { transform: 'translateY(20px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' }
                },
                'slide-down': {
                    '0%': { transform: 'translateY(-20px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' }
                },
                'slide-in-left': {
                    '0%': { transform: 'translateX(-30px)', opacity: '0' },
                    '100%': { transform: 'translateX(0)', opacity: '1' }
                },
                'slide-in-right': {
                    '0%': { transform: 'translateX(30px)', opacity: '0' },
                    '100%': { transform: 'translateX(0)', opacity: '1' }
                },
                'fade-in': {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' }
                },
                'fade-in-up': {
                    '0%': { transform: 'translateY(10px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' }
                },
                'fade-in-down': {
                    '0%': { transform: 'translateY(-10px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' }
                },
                'scale-in': {
                    '0%': { transform: 'scale(0.9)', opacity: '0' },
                    '100%': { transform: 'scale(1)', opacity: '1' }
                },
                'scale-out': {
                    '0%': { transform: 'scale(1)', opacity: '1' },
                    '100%': { transform: 'scale(0.9)', opacity: '0' }
                },
                'bounce-soft': {
                    '0%, 100%': { transform: 'scale(1)' },
                    '50%': { transform: 'scale(1.05)' }
                },
                'bounce-gentle': {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-5px)' }
                },
                'float': {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-10px)' }
                },
                'wiggle': {
                    '0%, 100%': { transform: 'rotate(-2deg)' },
                    '50%': { transform: 'rotate(2deg)' }
                },
                'shake': {
                    '0%, 100%': { transform: 'translateX(0)' },
                    '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-5px)' },
                    '20%, 40%, 60%, 80%': { transform: 'translateX(5px)' }
                },
                'gradient-shift': {
                    '0%, 100%': { backgroundPosition: '0% 50%' },
                    '50%': { backgroundPosition: '100% 50%' }
                },
                'glow-border': {
                    '0%, 100%': {
                        boxShadow: '0 0 5px currentColor, 0 0 10px currentColor, inset 0 0 5px currentColor'
                    },
                    '50%': {
                        boxShadow: '0 0 15px currentColor, 0 0 30px currentColor, inset 0 0 15px currentColor'
                    }
                },
                'shimmer': {
                    '0%': { backgroundPosition: '-100% 0' },
                    '100%': { backgroundPosition: '200% 0' }
                },
                'flip-horizontal': {
                    '0%': { transform: 'rotateY(0deg)' },
                    '100%': { transform: 'rotateY(360deg)' }
                },
                'flip-vertical': {
                    '0%': { transform: 'rotateX(0deg)' },
                    '100%': { transform: 'rotateX(360deg)' }
                },
                'rotate-y': {
                    '0%': { transform: 'rotateY(0deg)' },
                    '50%': { transform: 'rotateY(90deg)' },
                    '100%': { transform: 'rotateY(0deg)' }
                },
                'bounce-in': {
                    '0%': { transform: 'scale(0)', opacity: '0' },
                    '60%': { transform: 'scale(1.1)' },
                    '100%': { transform: 'scale(1)', opacity: '1' }
                },
                'zoom-in': {
                    '0%': { transform: 'scale(0.8)', opacity: '0' },
                    '100%': { transform: 'scale(1)', opacity: '1' }
                },
                'slide-up-fade': {
                    '0%': { transform: 'translateY(20px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' }
                },
                'grain': {
                    '0%, 100%': { transform: 'translate(0, 0)' },
                    '10%': { transform: 'translate(-5%, -10%)' },
                    '20%': { transform: 'translate(-15%, 5%)' },
                    '30%': { transform: 'translate(7%, -25%)' },
                    '40%': { transform: 'translate(-5%, 25%)' },
                    '50%': { transform: 'translate(-15%, 10%)' },
                    '60%': { transform: 'translate(15%, 0%)' },
                    '70%': { transform: 'translate(0%, 15%)' },
                    '80%': { transform: 'translate(3%, 35%)' },
                    '90%': { transform: 'translate(-10%, 10%)' }
                },
                'scanlines': {
                    '0%': { backgroundPosition: '0 0' },
                    '100%': { backgroundPosition: '0 4px' }
                }
            },
            backdropBlur: {
                xs: '2px',
            },
            boxShadow: {
                'neon-cyan': '0 0 5px #00f2ff, 0 0 10px #00f2ff, 0 0 20px #00f2ff',
                'neon-purple': '0 0 5px #bc13fe, 0 0 10px #bc13fe, 0 0 20px #bc13fe',
                'neon-gold': '0 0 5px #ffd700, 0 0 10px #ffd700, 0 0 20px #ffd700',
                'neon-green': '0 0 5px #00ff88, 0 0 10px #00ff88, 0 0 20px #00ff88',
                'neon-red': '0 0 5px #ff3366, 0 0 10px #ff3366, 0 0 20px #ff3366',
            }
        },
    },
    plugins: [],
}
