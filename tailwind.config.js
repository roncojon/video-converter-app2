// tailwind.config.js
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // Include your React components
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require('daisyui'), // Add DaisyUI as a plugin
  ],
  daisyui: {
    themes: [
      {
        light: {
          ...require("daisyui/src/theming/themes")["light"],
          accent: "#1bbb59", // Set the accent color to red
          // "accent-focus": "#e9f2ed", // Set the accent color focus state to red
          "accent-content": "#e9f2ed", // Set the accent content color to white
        },
      }, "dark"], // Enable both light and dark themes
  },
}
