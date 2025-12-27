import { createContext, useContext, useState, useEffect } from 'react';
import { themes } from '../themes';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
    const [currentTheme, setCurrentTheme] = useState(() => {
        const saved = localStorage.getItem('theme');
        return saved && themes[saved] ? saved : 'dark';
    });

    useEffect(() => {
        const theme = themes[currentTheme];
        if (!theme) return;

        // Apply theme variables to root
        const root = document.documentElement;
        Object.entries(theme.colors).forEach(([key, value]) => {
            root.style.setProperty(key, value);
        });

        // Save preference
        localStorage.setItem('theme', currentTheme);
    }, [currentTheme]);

    return (
        <ThemeContext.Provider value={{
            theme: currentTheme,
            setTheme: setCurrentTheme,
            availableThemes: themes,
            themeData: themes[currentTheme]
        }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => useContext(ThemeContext);
