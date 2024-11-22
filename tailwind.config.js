// tailwind.config.js
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // Include your React components
  ],
  theme: {
    extend: {
      // fontSize: {
      //   sm: '0.8rem', // Customize the size as needed
      // },
    },
  },
  plugins: [
    require('daisyui'), // Add DaisyUI as a plugin
  ],
  daisyui: {
    themes: [
      {
        light: {
          ...require("daisyui/src/theming/themes")["light"],
          "accent": "#92efb6", // Customize accent color
          // "accent-content": "#e9f2ed", // Accent content color

          "primary": "#e2e8f0", // slate-200 for primary buttons (light theme)
          "primary-content": "#1e293b", // slate-700 for text on primary buttons
        },
      },
      {
        dark: {
          ...require("daisyui/src/theming/themes")["dark"],
          "accent-content": "#e9f2ed", // Accent content color
          "accent": "#169647", // Customize accent color

          "primary": "#334155", // slate-700 for primary buttons (dark theme)
          "primary-content": "#f1f5f9", // slate-200 for text on primary buttons
        },
      },
    ],
  },
}
