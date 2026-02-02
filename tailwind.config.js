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
                'spin-slow': 'spin 3s linear infinite',
                'bounce-soft': 'bounce-soft 0.6s ease-out',
                'shake': 'shake 0.5s ease-in-out',
                'grain': 'grain 8s steps(10) infinite',
                'scanlines': 'scanlines 0.5s linear infinite'
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
                'bounce-soft': {
                    '0%, 100%': { transform: 'scale(1)' },
                    '50%': { transform: 'scale(1.05)' }
                },
                'shake': {
                    '0%, 100%': { transform: 'translateX(0)' },
                    '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-5px)' },
                    '20%, 40%, 60%, 80%': { transform: 'translateX(5px)' }
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
