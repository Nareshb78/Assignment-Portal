// src/assets/theme.js

export const theme = {
  colors: {
    // Backgrounds and Surfaces
    primaryBg: '#121212', // Deep Dark Gray (Main background)
    surface: '#1E1E1E',   // Slightly lighter for cards/surfaces
    surfaceHover: '#2A2A2A', // Hover effect
    
    // Text and Contrast
    textLight: '#E0E0E0', // Primary text
    textMuted: '#A0A0A0', // Secondary/placeholder text
    
    // Accents (Vibrant but professional)
    accentPrimary: '#BB86FC', // Violet/Purple for buttons/links (Teacher/Admin actions)
    accentSecondary: '#03DAC6', // Teal for student status/success
    
    // Status
    success: '#03DAC6',
    warning: '#FFC107',
    error: '#CF6679',
  },
  typography: {
    fontFamily: 'Inter, sans-serif',
  },
  // Shadow definitions for depth on surfaces/cards
  shadows: {
    base: '0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -2px rgba(0, 0, 0, 0.2)',
  }
};