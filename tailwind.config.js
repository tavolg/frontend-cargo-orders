/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0F0F10', // Fondo oscuro
        card: '#18181B',       // Tarjetas
        cardBorder: '#27272A', // Bordes
        accent: '#FFE600',     // Amarillo primario
        accentHover: '#E6CF00',
        textMuted: '#A1A1AA',  // Gris secundario
      },
      fontFamily: {
        sans: ['"Open Sans"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}