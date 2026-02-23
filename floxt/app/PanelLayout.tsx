"use client";

import "./panel.css";
import { Plus, FolderOpen, Terminal, Cog, ChevronUp, ChevronDown, Save } from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from "react";

interface PanelLayoutProps {
    text: string;
    setText: React.Dispatch<React.SetStateAction<string>>;
    title: string;
    setTitle: React.Dispatch<React.SetStateAction<string>>;
    setSavedText: React.Dispatch<React.SetStateAction<string>>;
    setSavedTitle: React.Dispatch<React.SetStateAction<string>>;
    hasUnsavedChanges: boolean;
    isFileTracked: boolean;
    setIsFileTracked: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function PanelLayout({
    text, setText, title, setTitle, setSavedText, setSavedTitle, hasUnsavedChanges, isFileTracked, setIsFileTracked
}: PanelLayoutProps) {
    const [isOpen, setIsOpen] = useState<boolean>(true);
    const [fileHandle, setFileHandle] = useState<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleNew = useCallback(() => {
        setText("");
        setTitle("");
        setSavedText("");
        setSavedTitle("");
        setIsFileTracked(false);
        setFileHandle(null);
    }, [setText, setTitle, setSavedText, setSavedTitle, setIsFileTracked]);

    const handleSave = useCallback(async () => {
        const fileName = title.trim() === "" ? "Untitled" : title;

        try {
            if ('showSaveFilePicker' in window) {
                let handle = fileHandle;

                if (!handle) {
                    handle = await (window as any).showSaveFilePicker({
                        suggestedName: `${fileName}.floxt`,
                        types: [{
                            description: 'Floxt File',
                            accept: { 'text/plain': ['.floxt'] },
                        }],
                    });
                    setFileHandle(handle);
                }

                const writable = await handle.createWritable();
                await writable.write(text);
                await writable.close();

                const actualFileName = handle.name.replace(/\.floxt$/i, "");
                setSavedText(text);
                setSavedTitle(actualFileName);
                setTitle(actualFileName);
                setIsFileTracked(true);
                return;
            }
        } catch (err: any) {
            if (err.name === 'AbortError') return;
        }

        const blob = new Blob([text], { type: "text/plain" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = `${fileName}.floxt`;
        document.body.appendChild(a);
        a.click();

        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        setSavedText(text);
        setSavedTitle(fileName);
        setIsFileTracked(true);
    }, [text, title, fileHandle, setSavedText, setSavedTitle, setIsFileTracked, setTitle]);

    const handleOpenClick = useCallback(async () => {
        try {
            if ('showOpenFilePicker' in window) {
                const [handle] = await (window as any).showOpenFilePicker({
                    types: [{
                        description: 'Floxt File',
                        accept: { 'text/plain': ['.floxt'] },
                    }],
                });
                const file = await handle.getFile();
                const fileContent = await file.text();

                const fileNameWithoutExt = file.name.replace(/\.floxt$/i, "");

                setText(fileContent);
                setTitle(fileNameWithoutExt);
                setSavedText(fileContent);
                setSavedTitle(fileNameWithoutExt);
                setIsFileTracked(true);
                setFileHandle(handle);
                return;
            }
        } catch (err: any) {
            if (err.name === 'AbortError') return;
        }

        fileInputRef.current?.click();
    }, [setText, setTitle, setSavedText, setSavedTitle, setIsFileTracked]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey || e.metaKey) {
                if (e.key.toLowerCase() === 's') {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSave();
                } else if (e.key.toLowerCase() === 'o') {
                    e.preventDefault();
                    e.stopPropagation();
                    handleOpenClick();
                }
            }

            if (e.altKey && e.key.toLowerCase() === 'n') {
                e.preventDefault();
                e.stopPropagation();
                handleNew();
            }
        };

        window.addEventListener('keydown', handleKeyDown, { capture: true });

        return () => {
            window.removeEventListener('keydown', handleKeyDown, { capture: true });
        };
    }, [handleNew, handleSave, handleOpenClick]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const fileNameWithoutExt = file.name.replace(/\.floxt$/i, "");

        const reader = new FileReader();
        reader.onload = (event: ProgressEvent<FileReader>) => {
            if (event.target?.result) {
                const fileContent = event.target.result as string;
                setText(fileContent);
                setTitle(fileNameWithoutExt);
                setSavedText(fileContent);
                setSavedTitle(fileNameWithoutExt);
                setIsFileTracked(true);
                setFileHandle(null);
            }
        };
        reader.readAsText(file);

        e.target.value = "";
    };

    return (
        <div className="flex flex-col gap-2 w-fit h-fit">
            <section className={`p-3 h-fit hover:shadow-lg dark:shadow-white/15 transition-all duration-150 ease-in-out w-full ${isOpen ? 'pr-5' : ''} border border-neutral-700 rounded-lg`}>

                <input
                    type="file"
                    accept=".floxt"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    style={{ display: "none" }}
                />

                {isOpen && (
                    <div className={`overflow-hidden transition-all duration-150 ease-in-out flex flex-col ${isOpen ? 'max-h-[500px] max-w-[300px] opacity-100' : 'max-h-0 max-w-0 opacity-0'}`}>

                        <button onClick={handleNew} className={"flex items-center active:scale-95 active:opacity-75 hover:opacity-75 transition-opacity delay-100 ease-in-out cursor-pointer"}>
                            <Plus color="white" size={28} className="mt-2 mb-2" />
                            <div className="flex flex-col items-start m-2 mr-5">
                                <p className="whitespace-nowrap text-white">New</p>
                                <span className="text-[10px] text-neutral-400 font-mono">Alt+N</span>
                            </div>
                        </button>

                        <button onClick={handleSave} className={"flex items-center active:scale-95 active:opacity-75 hover:opacity-75 transition-opacity delay-100 ease-in-out cursor-pointer"}>
                            <Save color="white" size={28} className="mt-2 mb-2" />
                            <div className="flex flex-col items-start m-2 mr-5">
                                <p className="whitespace-nowrap text-white">Save</p>
                                <span className="text-[10px] text-neutral-400 font-mono">Ctrl+S</span>
                            </div>
                        </button>

                        <button onClick={handleOpenClick} className={"flex items-center active:scale-95 active:opacity-75 hover:opacity-75 transition-opacity delay-100 ease-in-out cursor-pointer"}>
                            <FolderOpen color="white" size={28} className="mt-2 mb-2" />
                            <div className="flex flex-col items-start m-2 mr-5">
                                <p className="whitespace-nowrap text-white">Open</p>
                                <span className="text-[10px] text-neutral-400 font-mono">Ctrl+O</span>
                            </div>
                        </button>

                        <button className={"flex items-center active:scale-95 active:opacity-75 hover:opacity-75 transition-opacity delay-100 ease-in-out cursor-pointer"}>
                            <Terminal color="white" size={28} className="mt-2 mb-2" />
                            <p className="m-2 mr-5 whitespace-nowrap text-white">Commands</p>
                        </button>

                        <button className={"flex items-center active:scale-95 active:opacity-75 hover:opacity-75 transition-opacity delay-100 ease-in-out cursor-pointer"}>
                            <Cog color="white" size={28} className="mt-2 mb-2" />
                            <p className="m-2 mr-5 whitespace-nowrap text-white">Settings</p>
                        </button>
                    </div>
                )}

                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`flex items-center active:scale-95 active:opacity-75 hover:opacity-75 transition-all duration-150 ease-in-out cursor-pointer ${isOpen ? 'mt-5' : ''}`}>
                    {isOpen ? (
                        <ChevronUp color="white" size={28} className="mt-2 mb-2" />
                    ) : (
                        <ChevronDown color="white" size={28} className="mt-2 mb-2" />
                    )}
                </button>
            </section>

            {(hasUnsavedChanges || isFileTracked) && (
                <div className={`text-xs font-mono px-2 transition-colors duration-150 ${hasUnsavedChanges ? 'text-yellow-500' : 'text-neutral-500'}`}>
                    {hasUnsavedChanges ? "Unsaved changes" : "Saved changes"}
                </div>
            )}
        </div>
    )
}