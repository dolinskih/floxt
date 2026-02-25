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

        setIsLoaded(true);
    }, []);

    useEffect(() => {
        if (!isLoaded) return;

        localStorage.setItem('floxt_fontSize', fontSize.toString());
        localStorage.setItem('floxt_showLineNumbers', showLineNumbers.toString());
        localStorage.setItem('floxt_autoSave', autoSave.toString());
        localStorage.setItem('floxt_showShortcuts', showShortcuts.toString());
    }, [fontSize, showLineNumbers, autoSave, showShortcuts, isLoaded]);

    const hasUnsavedChanges = text !== savedText || title !== savedTitle;

    return (
        <main className="flex w-full min-h-screen p-4 gap-6 bg-neutral-950">
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
            />
            <div className="flex-1 flex flex-col">
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