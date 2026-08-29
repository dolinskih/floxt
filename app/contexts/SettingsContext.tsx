"use client"; // Marks this module as a Client Component in Next.js.

import React, { createContext, useContext, useState, useEffect } from "react";

// Defines the shape of the settings state accessible throughout the application.
interface SettingsContextType {
    viewMode: 'code' | 'read' | 'split';
    setViewMode: React.Dispatch<React.SetStateAction<'code' | 'read' | 'split'>>;
    fontSize: number;
    setFontSize: React.Dispatch<React.SetStateAction<number>>;
    showLineNumbers: boolean;
    setShowLineNumbers: React.Dispatch<React.SetStateAction<boolean>>;
    autoSave: boolean;
    setAutoSave: React.Dispatch<React.SetStateAction<boolean>>;
    showShortcuts: boolean;
    setShowShortcuts: React.Dispatch<React.SetStateAction<boolean>>;
    theme: 'light' | 'dark' | 'system';
    setTheme: React.Dispatch<React.SetStateAction<'light' | 'dark' | 'system'>>;
    panelPosition: 'left' | 'right';
    setPanelPosition: React.Dispatch<React.SetStateAction<'left' | 'right'>>;
}

// Initializes the context to hold settings data.
const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// Provider component that wraps the application to supply settings state.
export function SettingsProvider({ children }: { children: React.ReactNode }) {
    // State definitions for editor and UI preferences.
    const [viewMode, setViewMode] = useState<'code' | 'read' | 'split'>('code');
    const [fontSize, setFontSize] = useState<number>(14);
    const [showLineNumbers, setShowLineNumbers] = useState<boolean>(true);
    const [autoSave, setAutoSave] = useState<boolean>(false);
    const [showShortcuts, setShowShortcuts] = useState<boolean>(true);
    const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
    const [panelPosition, setPanelPosition] = useState<'left' | 'right'>('left');
    const [isLoaded, setIsLoaded] = useState<boolean>(false);

    // Load saved settings from LocalStorage when the component mounts.
    useEffect(() => {
        const savedFontSize = localStorage.getItem('floxt_fontSize');
        if (savedFontSize) setFontSize(parseInt(savedFontSize, 10));

        const savedLineNumbers = localStorage.getItem('floxt_showLineNumbers');
        if (savedLineNumbers !== null) setShowLineNumbers(savedLineNumbers === 'true');

        const savedAutoSave = localStorage.getItem('floxt_autoSave');
        if (savedAutoSave !== null) setAutoSave(savedAutoSave === 'true');

        const savedShortcuts = localStorage.getItem('floxt_showShortcuts');
        if (savedShortcuts !== null) setShowShortcuts(savedShortcuts === 'true');

        const savedTheme = localStorage.getItem('floxt_theme') as 'light' | 'dark' | 'system';
        if (savedTheme) setTheme(savedTheme);

        const savedPanelPosition = localStorage.getItem('floxt_panelPosition') as 'left' | 'right';
        if (savedPanelPosition) setPanelPosition(savedPanelPosition);

        setIsLoaded(true); // Flags that initial loading is complete to safely allow updates.
    }, []);

    // Save updated settings to LocalStorage whenever they change.
    useEffect(() => {
        if (!isLoaded) return;
        localStorage.setItem('floxt_fontSize', fontSize.toString());
        localStorage.setItem('floxt_showLineNumbers', showLineNumbers.toString());
        localStorage.setItem('floxt_autoSave', autoSave.toString());
        localStorage.setItem('floxt_showShortcuts', showShortcuts.toString());
        localStorage.setItem('floxt_theme', theme);
        localStorage.setItem('floxt_panelPosition', panelPosition);
    }, [fontSize, showLineNumbers, autoSave, showShortcuts, theme, panelPosition, isLoaded]);

    // Apply the selected theme to the root HTML document.
    useEffect(() => {
        const root = window.document.documentElement;
        const applyTheme = () => {
            if (theme === 'system') {
                const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (systemPrefersDark) root.classList.add('dark');
                else root.classList.remove('dark');
            } else if (theme === 'dark') {
                root.classList.add('dark');
            } else {
                root.classList.remove('dark');
            }
        };

        applyTheme();
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = () => { if (theme === 'system') applyTheme(); };
        
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [theme]);

    return (
        <SettingsContext.Provider value={{
            viewMode, setViewMode,
            fontSize, setFontSize,
            showLineNumbers, setShowLineNumbers,
            autoSave, setAutoSave,
            showShortcuts, setShowShortcuts,
            theme, setTheme,
            panelPosition, setPanelPosition
        }}>
            {children}
        </SettingsContext.Provider>
    );
}

// Custom hook providing an easy way for components to access settings.
export function useSettings() {
    const context = useContext(SettingsContext);
    if (!context) throw new Error("useSettings must be used within a SettingsProvider");
    return context;
}