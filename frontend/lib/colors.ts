/**
 * ============================================================
 * PALETTE DE COULEURS - PV MONITOR
 * ============================================================
 */

export const C = {
  // Couleurs principales
  green: '#1a7f4f',
  greenL: '#e4f3ea',
  greenM: '#4caf7c',
  red: '#c0392b',
  redL: '#fdecea',
  amber: '#c47d0e',
  amberL: '#fef3dc',
  blue: '#1565c0',
  blueL: '#e3f0ff',
  
  // Couleurs additionnelles
  purple: '#8b5cf6',
  purpleL: '#ede9fe',
  orange: '#f39c12',
  orangeL: '#fef5e8',
  
  // Texte
  text: '#0c1e13',
  text2: '#375e45',
  text3: '#7aaa88',
  
  // Surfaces
  surface: '#ffffff',
  surface2: '#edf4ed',
  border: '#d8e8d8',
} as const;

export type ColorPalette = typeof C;