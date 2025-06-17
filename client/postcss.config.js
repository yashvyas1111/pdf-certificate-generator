// postcss.config.js - CORRECT
export default {
  plugins: {
    '@tailwindcss/postcss': {}, // <--- This is the fix
    autoprefixer: {},
  },
};