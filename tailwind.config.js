/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#fafafa',
        foreground: '#111827',
        card: '#ffffff',
        'card-foreground': '#111827',
        primary: {
          DEFAULT: '#3730a3',
          foreground: '#ffffff',
        },
        secondary: {
          DEFAULT: '#eef0f6',
          foreground: '#3730a3',
        },
        muted: {
          DEFAULT: '#f3f4f6',
          foreground: '#6b7280',
        },
        accent: {
          DEFAULT: '#eef2ff',
          foreground: '#312e81',
        },
        destructive: {
          DEFAULT: '#b91c1c',
          foreground: '#ffffff',
        },
        border: 'rgba(55, 48, 163, 0.10)',
        input: {
          DEFAULT: 'transparent',
          background: '#f5f5f8',
        },
        ring: '#3730a3',
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
      },
      borderRadius: {
        DEFAULT: '0.5rem',
      },
    },
  },
  plugins: [],
}
