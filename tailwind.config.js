// tailwind.config.js
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // Include your React components
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Roboto', 'system-ui', 'sans-serif'],
      },
      spacing: {
        1: '4px',
        2: '8px',
        3: '12px',
        4: '16px',
        6: '24px',
        8: '32px',
        10: '40px',
      },
      borderRadius: {
        DEFAULT: '8px',
      },
      boxShadow: {
        sm: '0 1px 2px rgba(0,0,0,0.05)',
        DEFAULT: '0 2px 4px rgba(0,0,0,0.1)',
        md: '0 4px 8px rgba(0,0,0,0.1)',
      },
    },
  },
  plugins: [
    require('daisyui'),
  ],
  daisyui: {
    themes: [
      {
        light: {
          // Based on our design tokens:
          "primary": "#0FBFCF",           // Primary action color for buttons & accents
          "primary-focus": "#0aa0b9",       // Slightly darker for focus state
          "primary-content": "#FFFFFF",     // White text on primary buttons
          "secondary": "#F4F7FA",           // Light neutral for secondary surfaces
          "base-100": "#FFFFFF",            // Main content background (cards, panels)
          "base-200": "#F7F7F7",            // Subtle surfaces
          "base-300": "#E5E5E5",            // Even lighter, for borders or dividers
          "neutral": "#333333",             // Primary text color
          "info": "#1E88E5",                // Info messages or accents
          "success": "#43A047",             // Success messages
          "warning": "#FB8C00",             // Warning alerts
          "error": "#E53935",               // Error messages
          "accent": "#0FBFCF",              // Accent can mirror primary
        },
      },
      {
        dark: {
          // For dark mode, we adjust the base colors:
          "primary": "#0FBFCF",
          "primary-focus": "#0aa0b9",
          "primary-content": "#FFFFFF",
          "secondary": "#1F2937",           // Darker secondary background
          "base-100": "#1F2937",            // Main dark background
          "base-200": "#2D3748",
          "base-300": "#4A5568",
          "neutral": "#F4F7FA",             // Light text on dark backgrounds
          "info": "#1E88E5",
          "success": "#43A047",
          "warning": "#FB8C00",
          "error": "#E53935",
          "accent": "#0FBFCF",
        },
      },
    ],
  },
};
