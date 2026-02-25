"use client";

import { useState, useEffect } from "react";
import PanelLayout from "./PanelLayout";
import TextEditor from "./TextEditor";
import NoteTitle from "./NoteTitle";

export default function Home() {
    const [text, setText] = useState<string>("");
    const [title, setTitle] = useState<string>("");
    const [savedText, setSavedText] = useState<string>("");
    const [savedTitle, setSavedTitle] = useState<string>("");
    
    const [isFileTracked, setIsFileTracked] = useState<boolean>(false);
    const [viewMode, setViewMode] = useState<'code' | 'read'>('code');

    const [fontSize, setFontSize] = useState<number>(14);
    const [showLineNumbers, setShowLineNumbers] = useState<boolean>(true);
    const [autoSave, setAutoSave] = useState<boolean>(false);
    const [showShortcuts, setShowShortcuts] = useState<boolean>(true);
    
    const [panelPosition, setPanelPosition] = useState<'left' | 'right'>('left');

    const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
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
    }, [fontSize, showLineNumbers, autoSave, showShortcuts, theme, panelPosition, isLoaded]);

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
        const handleChange = () => {
            if (theme === 'system') applyTheme();
        };
        
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [theme]);

    const hasUnsavedChanges = text !== savedText || title !== savedTitle;

    return (
        <main className={`flex w-full min-h-screen p-4 gap-6 bg-neutral-50 dark:bg-neutral-950 transition-colors duration-200 ${panelPosition === 'right' ? 'flex-row-reverse' : 'flex-row'}`}>
            <PanelLayout 
                text={text} 
                setText={setText} 
                title={title} 
                setTitle={setTitle}
                setSavedText={setSavedText}
                setSavedTitle={setSavedTitle}
                hasUnsavedChanges={hasUnsavedChanges}
                isFileTracked={isFileTracked}
                setIsFileTracked={setIsFileTracked}
                viewMode={viewMode}
                setViewMode={setViewMode}
                fontSize={fontSize}
                setFontSize={setFontSize}
                showLineNumbers={showLineNumbers}
                setShowLineNumbers={setShowLineNumbers}
                autoSave={autoSave}
                setAutoSave={setAutoSave}
                showShortcuts={showShortcuts}
                setShowShortcuts={setShowShortcuts}
                theme={theme}
                setTheme={setTheme}
                panelPosition={panelPosition}
                setPanelPosition={setPanelPosition}
            />
            <div className="flex-1 flex flex-col min-w-0">
                <NoteTitle title={title} setTitle={setTitle} />
                <TextEditor 
                    text={text} 
                    setText={setText} 
                    viewMode={viewMode}
                    setViewMode={setViewMode}
                    fontSize={fontSize}
                    showLineNumbers={showLineNumbers}
                />
            </div>
        </main>
    );
}