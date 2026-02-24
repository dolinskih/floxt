"use client";

import "./panel.css";
import { Plus, FolderOpen, Terminal, Cog, ChevronUp, ChevronDown, Save, BookOpen, Download, DownloadCloud } from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from "react";
import Modal from "./Modal";
import ExportModal from "./ExportModal"; 

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
    viewMode: 'code' | 'read';
    setViewMode: React.Dispatch<React.SetStateAction<'code' | 'read'>>;
    fontSize: number;
    setFontSize: React.Dispatch<React.SetStateAction<number>>;
    showLineNumbers: boolean;
    setShowLineNumbers: React.Dispatch<React.SetStateAction<boolean>>;
    autoSave: boolean;
    setAutoSave: React.Dispatch<React.SetStateAction<boolean>>;
}

const commandsData = [
    { icon: "H1", name: "Heading 1", open: "/h1;", close: ";/" },
    { icon: "H2", name: "Heading 2", open: "/h2;", close: ";/" },
    { icon: "H3", name: "Heading 3", open: "/h3;", close: ";/" },
    { icon: "H4", name: "Heading 4", open: "/h4;", close: ";/" },
    { icon: "H5", name: "Heading 5", open: "/h5;", close: ";/" },
    { icon: "H6", name: "Heading 6", open: "/h6;", close: ";/" },
    { icon: "B", name: "Bold", open: "/b;", close: ";/" },
    { icon: "I", name: "Italic", open: "/i;", close: ";/" },
    { icon: "U", name: "Underline", open: "/u;", close: ";/" },
    { icon: "S", name: "Strike-through", open: "/s;", close: ";/" },
    { icon: "•", name: "Unordered list block", open: "/-;", close: ";/" },
    { icon: "1²3", name: "Ordered list block", open: "/0;", close: ";/" },
    { icon: "☐", name: "Unchecked checkbox", open: "/[];", close: "None" },
    { icon: "☑", name: "Checked checkbox", open: "/[x];", close: "None" },
    { icon: "🔗", name: "Hyperlink", open: "/link;url;", close: ";/" },
    { icon: "</>", name: "Code block", open: "/code;", close: ";/" },
    { icon: "⊞", name: "Table", open: "/table;", close: ";/" },
];

export default function PanelLayout({
    text, setText, title, setTitle, setSavedText, setSavedTitle, hasUnsavedChanges, isFileTracked, setIsFileTracked, viewMode, setViewMode, fontSize, setFontSize, showLineNumbers, setShowLineNumbers, autoSave, setAutoSave
}: PanelLayoutProps) {
    const [isOpen, setIsOpen] = useState<boolean>(true);
    const [fileHandle, setFileHandle] = useState<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [isCommandsOpen, setIsCommandsOpen] = useState<boolean>(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
    const [isExportOpen, setIsExportOpen] = useState<boolean>(false); 
    const [copiedCommand, setCopiedCommand] = useState<string | null>(null);
    const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);

    useEffect(() => {
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;
        const promptEvent = deferredPrompt as any;
        promptEvent.prompt();
        
        const { outcome } = await promptEvent.userChoice;
        if (outcome === 'accepted') {
            setDeferredPrompt(null);
        }
    };

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

    useEffect(() => {
        if (autoSave && isFileTracked && fileHandle && hasUnsavedChanges) {
            const timeoutId = setTimeout(() => {
                handleSave();
            }, 1500);
            return () => clearTimeout(timeoutId);
        }
    }, [text, autoSave, isFileTracked, fileHandle, hasUnsavedChanges, handleSave]);

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

    const handleCopy = (textToCopy: string, id: string) => {
        if (textToCopy === 'None') return;
        navigator.clipboard.writeText(textToCopy);
        setCopiedCommand(id);

        setTimeout(() => {
            setCopiedCommand(null);
        }, 2000);
    };

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

            if (e.altKey) {
                if (e.key.toLowerCase() === 'n') {
                    e.preventDefault();
                    e.stopPropagation();
                    handleNew();
                } else if (e.key.toLowerCase() === 'c') {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsCommandsOpen(prev => !prev);
                } else if (e.key.toLowerCase() === 's') {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsSettingsOpen(prev => !prev);
                } else if (e.key.toLowerCase() === 'e') {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsExportOpen(prev => !prev);
                }
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
        <div className="flex flex-col gap-2 w-fit h-fit items-center z-50">
            <section className={`p-3 h-fit bg-neutral-900 transition-all duration-150 ease-in-out w-full ${isOpen ? 'pr-5' : ''} border border-neutral-700 rounded-lg`}>

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

                        <button onClick={() => setIsExportOpen(true)} className={"flex items-center active:scale-95 active:opacity-75 hover:opacity-75 transition-opacity delay-100 ease-in-out cursor-pointer"}>
                            <Download color="white" size={28} className="mt-2 mb-2" />
                            <div className="flex flex-col items-start m-2 mr-5">
                                <p className="whitespace-nowrap text-white">Export</p>
                                <span className="text-[10px] text-neutral-400 font-mono">Alt+E</span>
                            </div>
                        </button>

                        <button onClick={() => setIsCommandsOpen(true)} className={"flex items-center active:scale-95 active:opacity-75 hover:opacity-75 transition-opacity delay-100 ease-in-out cursor-pointer"}>
                            <Terminal color="white" size={28} className="mt-2 mb-2" />
                            <div className="flex flex-col items-start m-2 mr-5">
                                <p className="whitespace-nowrap text-white">Commands</p>
                                <span className="text-[10px] text-neutral-400 font-mono">Alt+C</span>
                            </div>
                        </button>

                        <button onClick={() => setIsSettingsOpen(true)} className={"flex items-center active:scale-95 active:opacity-75 hover:opacity-75 transition-opacity delay-100 ease-in-out cursor-pointer"}>
                            <Cog color="white" size={28} className="mt-2 mb-2" />
                            <div className="flex flex-col items-start m-2 mr-5">
                                <p className="whitespace-nowrap text-white">Settings</p>
                                <span className="text-[10px] text-neutral-400 font-mono">Alt+S</span>
                            </div>
                        </button>

                        {deferredPrompt && (
                            <button 
                                onClick={handleInstallClick} 
                                className={"flex items-center active:scale-95 active:opacity-75 hover:opacity-75 transition-opacity delay-100 ease-in-out cursor-pointer mt-2 pt-2 border-t border-neutral-800"}
                            >
                                <DownloadCloud color="white" size={28} className="mt-2 mb-2" />
                                <div className="flex flex-col items-start m-2 mr-5">
                                    <p className="whitespace-nowrap text-white">Install</p>
                                    <span className="text-[10px] text-neutral-400 font-mono whitespace-nowrap">Work offline with faster speed</span>
                                </div>
                            </button>
                        )}
                        
                    </div>
                )}

                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`flex items-center active:scale-95 active:opacity-75 hover:opacity-75 transition-all duration-150 ease-in-out cursor-pointer ${isOpen ? 'mt-5' : 'w-full justify-center'}`}>
                    {isOpen ? (
                        <ChevronUp color="white" size={28} className="mt-2 mb-2" />
                    ) : (
                        <ChevronDown color="white" size={28} className="mt-2 mb-2" />
                    )}
                </button>
            </section>

            <div className={`flex items-center justify-center gap-2 p-1.5 transition-all duration-150 bg-neutral-900 border border-neutral-700 rounded-xl ${isOpen ? 'w-full' : 'w-fit'}`}>
                <button
                    onClick={() => setViewMode('code')}
                    className={`flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-150 cursor-pointer flex-1 ${viewMode === 'code' ? 'border border-neutral-500 bg-neutral-800 text-white' : 'hover:bg-neutral-800/50 text-neutral-400 border border-transparent'}`}
                >
                    <Terminal size={isOpen ? 18 : 22} />
                    {isOpen && <span className="text-sm font-mono whitespace-nowrap">Code view</span>}
                </button>
                <button
                    onClick={() => setViewMode('read')}
                    className={`flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-150 cursor-pointer flex-1 ${viewMode === 'read' ? 'border border-neutral-500 bg-neutral-800 text-white' : 'hover:bg-neutral-800/50 text-neutral-400 border border-transparent'}`}
                >
                    <BookOpen size={isOpen ? 18 : 22} />
                    {isOpen && <span className="text-sm font-mono whitespace-nowrap">Read view</span>}
                </button>
            </div>

            {(hasUnsavedChanges || isFileTracked) && (
                <div className={`text-xs font-mono px-2 transition-colors duration-150 w-full text-center ${hasUnsavedChanges ? 'text-yellow-500' : 'text-neutral-500'}`}>
                    {hasUnsavedChanges ? "Unsaved changes" : "Saved changes"}
                </div>
            )}

            <ExportModal
                isOpen={isExportOpen}
                onClose={() => setIsExportOpen(false)}
                text={text}
                title={title}
            />

            <Modal isOpen={isCommandsOpen} onClose={() => setIsCommandsOpen(false)} title="Commands">
                <div className="max-h-[60vh] overflow-y-auto pr-2">
                    <div className="flex flex-col gap-1 w-full">
                        <div className="grid grid-cols-[40px_1fr_100px_60px] gap-4 pb-2 border-b border-neutral-700 text-neutral-500 font-bold mb-2 sticky top-0 bg-neutral-900 pt-1">
                            <span className="text-center"></span>
                            <span>Name</span>
                            <span className="text-center">Open</span>
                            <span className="text-center">Close</span>
                        </div>
                        {commandsData.map((cmd, idx) => (
                            <div key={idx} className="grid grid-cols-[40px_1fr_100px_60px] gap-4 items-center py-2 border-b border-neutral-800/50 last:border-0 hover:bg-neutral-800/30 px-1 rounded transition-colors group">
                                <span className="text-gray-200 font-bold flex justify-center text-base">
                                    {cmd.icon === 'S' ? <s className="decoration-2">{cmd.icon}</s> : cmd.icon === 'U' ? <u className="underline-offset-2 decoration-2">{cmd.icon}</u> : cmd.icon === 'I' ? <i className="font-serif">{cmd.icon}</i> : cmd.icon}
                                </span>
                                <span className="text-gray-300 truncate">{cmd.name}</span>
                                <code
                                    onClick={() => handleCopy(cmd.open, `${idx}-open`)}
                                    className={`px-1 py-0.5 rounded text-center border text-xs cursor-pointer transition-colors ${copiedCommand === `${idx}-open` ? 'text-emerald-400 bg-emerald-950/50 border-emerald-500' : 'text-yellow-500 bg-neutral-950 border-neutral-800 hover:border-yellow-600/50 hover:bg-neutral-900'}`}
                                >
                                    {cmd.open}
                                </code>
                                <code
                                    onClick={() => handleCopy(cmd.close, `${idx}-close`)}
                                    className={`px-1 py-0.5 rounded text-center border text-xs ${cmd.close === 'None' ? 'text-neutral-500 bg-transparent border-transparent' : `cursor-pointer transition-colors ${copiedCommand === `${idx}-close` ? 'text-emerald-400 bg-emerald-950/50 border-emerald-500' : 'text-yellow-500 bg-neutral-950 border-neutral-800 hover:border-yellow-600/50 hover:bg-neutral-900'}`}`}
                                >
                                    {cmd.close}
                                </code>
                            </div>
                        ))}
                    </div>
                </div>
            </Modal>

            <Modal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} title="Settings">
                <div className="flex flex-col gap-6 p-2">
                    <div className="flex items-center justify-between">
                        <span className="text-gray-200">Editor Font Size</span>
                        <div className="flex items-center gap-4 bg-neutral-950 px-3 py-1.5 rounded border border-neutral-800">
                            <button
                                onClick={() => setFontSize(f => Math.max(10, f - 1))}
                                className="text-neutral-400 hover:text-white cursor-pointer active:scale-95"
                            >
                                -
                            </button>
                            <span className="text-yellow-500 font-mono w-6 text-center">{fontSize}</span>
                            <button
                                onClick={() => setFontSize(f => Math.min(24, f + 1))}
                                className="text-neutral-400 hover:text-white cursor-pointer active:scale-95"
                            >
                                +
                            </button>
                        </div>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-gray-200">Show Line Numbers</span>
                        <button
                            onClick={() => setShowLineNumbers(!showLineNumbers)}
                            className={`w-11 h-6 rounded-full transition-colors flex items-center px-1 cursor-pointer ${showLineNumbers ? 'bg-emerald-500' : 'bg-neutral-700'}`}
                        >
                            <div className={`w-4 h-4 rounded-full bg-white transition-transform ${showLineNumbers ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                            <span className="text-gray-200">Auto Save</span>
                            <span className="text-[10px] text-neutral-500">Only works for opened files</span>
                        </div>
                        <button
                            onClick={() => setAutoSave(!autoSave)}
                            className={`w-11 h-6 rounded-full transition-colors flex items-center px-1 cursor-pointer ${autoSave ? 'bg-emerald-500' : 'bg-neutral-700'}`}
                        >
                            <div className={`w-4 h-4 rounded-full bg-white transition-transform ${autoSave ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}