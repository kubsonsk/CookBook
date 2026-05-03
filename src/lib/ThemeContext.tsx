import { createContext, useContext } from 'react';
import { AccentColor } from './colors';

export const ThemeContext = createContext<{ 
  theme: 'light' | 'dark', 
  toggleTheme: () => void,
  accentColor: AccentColor,
  setAccentColor: (color: AccentColor) => void
}>({ 
  theme: 'light', 
  toggleTheme: () => {},
  accentColor: 'orange',
  setAccentColor: () => {}
});

export function useTheme() {
  return useContext(ThemeContext);
}
