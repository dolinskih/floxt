"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

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
    lineWrap: boolean;
    setLineWrap: React.Dispatch<React.SetStateAction<boolean>>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const [viewMode, setViewMode] = useState<'code' | 'read' | 'split'>('code');
    const [fontSize, setFontSize] = useState<number>(14);
    const [showLineNumbers, setShowLineNumbers] = useState<boolean>(true);
    const [autoSave, setAutoSave] = useState<boolean>(false);
    const [showShortcuts, setShowShortcuts] = useState<boolean>(false);
    const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
    const [panelPosition, setPanelPosition] = useState<'left' | 'right'>('left');
    const [lineWrap, setLineWrap] = useState<boolean>(true);
    const [isLoaded, setIsLoaded] = useState<boolean>(false);

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

        const savedLineWrap = localStorage.getItem('floxt_lineWrap');
        if (savedLineWrap !== null) setLineWrap(savedLineWrap === 'true');

        setIsLoaded(true);
    }, []);

    useEffect(() => {
        if (!isLoaded) return;
        localStorage.setItem('floxt_fontSize', fontSize.toString());
        localStorage.setItem('floxt_showLineNumbers', showLineNumbers.toString());
        localStorage.setItem('floxt_autoSave', autoSave.toString());
        localStorage.setItem('floxt_showShortcuts', showShortcuts.toString());
        localStorage.setItem('floxt_theme', theme);
        localStorage.setItem('floxt_panelPosition', panelPosition);
        localStorage.setItem('floxt_lineWrap', lineWrap.toString());
    }, [fontSize, showLineNumbers, autoSave, showShortcuts, theme, panelPosition, lineWrap, isLoaded]);

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
            panelPosition, setPanelPosition,
            lineWrap, setLineWrap
        }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    const context = useContext(SettingsContext);
    if (!context) throw new Error("useSettings must be used within a SettingsProvider");
    return context;
}