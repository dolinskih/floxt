"use client";

import { useState, useEffect } from "react";
import PanelLayout from "./PanelLayout";
import TextEditor from "./TextEditor";
import NoteTitle from "./NoteTitle";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import ConfirmModal from "./ConfirmModal";

export default function Home() {
    const [text, setText] = useState<string>("");
    const [title, setTitle] = useState<string>("");
    const [filePath, setFilePath] = useState<string | null>(null);
    const [savedText, setSavedText] = useState<string>("");
    const [savedTitle, setSavedTitle] = useState<string>("");

    const [projectName, setProjectName] = useState<string | null>(null);
    const [projectPath, setProjectPath] = useState<string | null>(null);
    const [projectFiles, setProjectFiles] = useState<{ name: string, path: string }[]>([]);
    const [activeFiles, setActiveFiles] = useState<{ name: string, path: string }[]>([]);
    const [unsavedFilesTracker, setUnsavedFilesTracker] = useState<Record<string, boolean>>({});
    const [fileBuffers, setFileBuffers] = useState<Record<string, { text: string, title: string, savedText: string, savedTitle: string }>>({});

    const [isFileTracked, setIsFileTracked] = useState<boolean>(false);
    const [fileToDelete, setFileToDelete] = useState<string | null>(null);
    const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState<boolean>(false);
    const [viewMode, setViewMode] = useState<'code' | 'read' | 'split'>('code');

    const [fontSize, setFontSize] = useState<number>(14);
    const [showLineNumbers, setShowLineNumbers] = useState<boolean>(true);
    const [autoSave, setAutoSave] = useState<boolean>(false);
    const [showShortcuts, setShowShortcuts] = useState<boolean>(true);

    const [panelPosition, setPanelPosition] = useState<'left' | 'right'>('left');

    const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
    const [isLoaded, setIsLoaded] = useState<boolean>(false);

    const handleOpenFileFromProject = async (targetPath: string) => {
        try {
            if (filePath && filePath !== targetPath) {
                setFileBuffers(prev => ({
                    ...prev,
                    [filePath]: { text, title, savedText, savedTitle }
                }));
            }

            if (fileBuffers[targetPath]) {
                const buffer = fileBuffers[targetPath];
                setText(buffer.text);
                setTitle(buffer.title);
                setSavedText(buffer.savedText);
                setSavedTitle(buffer.savedTitle);
                setFilePath(targetPath);
                setIsFileTracked(true);
                return;
            }

            const fileContent = await invoke<string>('read_document', { path: targetPath });
            const fileName = targetPath.split(/[\\/]/).pop()?.replace(/\.floxt$/i, '') || 'Unknown';

            setText(fileContent);
            setTitle(fileName);
            setSavedText(fileContent);
            setSavedTitle(fileName);
            setFilePath(targetPath);
            setIsFileTracked(true);

            setFileBuffers(prev => ({
                ...prev,
                [targetPath]: { text: fileContent, title: fileName, savedText: fileContent, savedTitle: fileName }
            }));

            if (!activeFiles.find(f => f.path === targetPath)) {
                setActiveFiles(prev => [...prev, { name: fileName, path: targetPath }]);
            }
        } catch (error) {
            console.error("Failed to read file:", error);
        }
    };

    const handleCloseTab = (targetPath: string) => {
        setActiveFiles(prev => prev.filter(f => f.path !== targetPath));

        setFileBuffers(prev => {
            const newBuffers = { ...prev };
            delete newBuffers[targetPath];
            return newBuffers;
        });
        setUnsavedFilesTracker(prev => {
            const newTracker = { ...prev };
            delete newTracker[targetPath];
            return newTracker;
        });

        if (filePath === targetPath) {
            setText("");
            setTitle("");
            setSavedText("");
            setSavedTitle("");
            setFilePath(null);
            setIsFileTracked(false);
        }
    };

    const handleOpenProject = async () => {
        try {
            const selectedDir = await open({
                directory: true,
                multiple: false,
                title: 'Open Floxt Project Folder'
            });

            if (selectedDir) {
                const folderName = (selectedDir as string).split(/[\\/]/).pop() || 'Project';
                setProjectName(folderName);
                setProjectPath(selectedDir as string);

                const files = await invoke<{ name: string, path: string }[]>('read_project_dir', { dirPath: selectedDir });
                setProjectFiles(files);

                setActiveFiles([]);
                setFileBuffers({});
                setUnsavedFilesTracker({});

                setText("");
                setTitle("");
                setSavedText("");
                setSavedTitle("");
                setFilePath(null);
                setIsFileTracked(false);
            }
        } catch (error) {
            console.error("Failed to open project:", error);
        }
    };

    const handleSaveFileFromProject = async (targetPath: string) => {
        try {
            let contentToSave = "";
            let titleToSave = "";

            if (targetPath === filePath) {
                contentToSave = text;
                titleToSave = title;
            } else if (fileBuffers[targetPath]) {
                contentToSave = fileBuffers[targetPath].text;
                titleToSave = fileBuffers[targetPath].title;
            } else {
                return;
            }

            const returnedPath = await invoke<string>('save_document', {
                path: targetPath,
                newName: titleToSave,
                new_name: titleToSave,
                content: contentToSave
            });

            if (returnedPath !== targetPath) {
                if (targetPath === filePath) setFilePath(returnedPath);

                setActiveFiles(prev => prev.map(f =>
                    f.path === targetPath ? { ...f, name: titleToSave, path: returnedPath } : f
                ));

                setFileBuffers(prev => {
                    const newBuffers = { ...prev };
                    if (newBuffers[targetPath]) {
                        newBuffers[returnedPath] = {
                            ...newBuffers[targetPath],
                            title: titleToSave,
                            savedText: contentToSave,
                            savedTitle: titleToSave
                        };
                        delete newBuffers[targetPath];
                    }
                    return newBuffers;
                });

                setProjectFiles(prev => {
                    let updated = prev.map(f => f.path === targetPath ? { name: titleToSave, path: returnedPath } : f);
                    updated.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
                    return updated;
                });

                setUnsavedFilesTracker(prev => {
                    const newTracker = { ...prev };
                    newTracker[returnedPath] = false;
                    delete newTracker[targetPath];
                    return newTracker;
                });

            } else {
                if (targetPath === filePath) {
                    setSavedText(contentToSave);
                    setSavedTitle(titleToSave);
                } else {
                    setFileBuffers(prev => ({
                        ...prev,
                        [targetPath]: {
                            ...prev[targetPath],
                            savedText: contentToSave,
                            savedTitle: titleToSave
                        }
                    }));
                }

                setUnsavedFilesTracker(prev => ({ ...prev, [targetPath]: false }));
            }
        } catch (err) {
            console.error("Sidebar save failed:", err);
        }
    };

    const handleNewFileSaved = (newPath: string, newName: string) => {
        setActiveFiles(prev => {
            if (!prev.find(f => f.path === newPath)) return [...prev, { name: newName, path: newPath }];
            return prev;
        });

        if (projectPath && newPath.startsWith(projectPath)) {
            setProjectFiles(prev => {
                if (!prev.find(f => f.path === newPath)) {
                    const updated = [...prev, { name: newName, path: newPath }];
                    updated.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
                    return updated;
                }
                return prev;
            });
        }
    };

    const handleDeleteFileFromProject = (targetPath: string) => {
        setFileToDelete(targetPath);
        setIsConfirmDeleteOpen(true);
    };

    const executeDelete = async () => {
        if (!fileToDelete) return;

        const targetPath = fileToDelete;

        try {
            await invoke('delete_document', { path: targetPath });

            setProjectFiles(prev => prev.filter(f => f.path !== targetPath));
            setActiveFiles(prev => prev.filter(f => f.path !== targetPath));

            setFileBuffers(prev => {
                const newBuffers = { ...prev };
                delete newBuffers[targetPath];
                return newBuffers;
            });
            setUnsavedFilesTracker(prev => {
                const newTracker = { ...prev };
                delete newTracker[targetPath];
                return newTracker;
            });

            if (filePath === targetPath) {
                setText("");
                setTitle("");
                setSavedText("");
                setSavedTitle("");
                setFilePath(null);
                setIsFileTracked(false);
            }
        } catch (error) {
            console.error("Failed to delete file:", error);
        } finally {
            setFileToDelete(null);
        }
    };

    useEffect(() => {
        if (filePath) {
            const isDirty = text !== savedText || title !== savedTitle;
            setUnsavedFilesTracker(prev => ({
                ...prev,
                [filePath]: isDirty
            }));
        }
    }, [text, title, savedText, savedTitle, filePath]);

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

    useEffect(() => {
        const checkInitialFile = async () => {
            if (typeof window !== 'undefined' && !('__TAURI_INTERNALS__' in window)) {
                return;
            }

            try {
                const fileData = await invoke<{ name: string, content: string, path: string } | null>('get_initial_file');

                if (fileData) {
                    setText(fileData.content);
                    setTitle(fileData.name);
                    setSavedText(fileData.content);
                    setSavedTitle(fileData.name);
                    setIsFileTracked(true);
                    setFilePath(fileData.path);
                }
            } catch (error) {
                const errMsg = String(error);
                if (!errMsg.includes("window") && !errMsg.includes("not a function")) {
                    setText(`--- RUST ERROR ---\n\n${errMsg}`);
                }
            }
        };

        checkInitialFile();
    }, []);

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
                filePath={filePath}
                setFilePath={setFilePath}

                projectName={projectName}
                projectFiles={projectFiles.map(f => ({
                    ...f,
                    hasUnsavedChanges: unsavedFilesTracker[f.path] || false
                }))}
                onOpenProject={handleOpenProject}
                onOpenFileFromProject={handleOpenFileFromProject}
                onSaveFileFromProject={handleSaveFileFromProject}
                onNewFileSaved={handleNewFileSaved}
                onDeleteFileFromProject={handleDeleteFileFromProject}
            />
            <div className="flex-1 flex flex-col min-w-0">
                {/* File Tabs (Only show if a project is open) */}
                {projectName && activeFiles.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto pb-2 mb-4 no-scrollbar">
                        {activeFiles.map((file: { name: string, path: string }, idx: number) => (
                            <div
                                key={idx}
                                className={`flex items-center gap-2 px-3 py-1.5 border rounded-md cursor-pointer transition-colors ${filePath === file.path
                                    ? 'border-neutral-400 dark:border-neutral-500 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm'
                                    : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-900'
                                    }`}
                                onClick={() => handleOpenFileFromProject(file.path)}
                            >
                                <span className="text-sm font-medium truncate max-w-[120px]">{file.name}</span>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleCloseTab(file.path);
                                    }}
                                    className="p-0.5 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-full"
                                >
                                    <span className="text-xs font-bold leading-none select-none">✕</span>
                                </button>
                            </div>
                        ))}
                    </div>
                )}
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
            <ConfirmModal 
                isOpen={isConfirmDeleteOpen}
                onClose={() => setIsConfirmDeleteOpen(false)}
                onConfirm={executeDelete}
                title="Delete Note"
                message={`Are you sure you want to permanently delete "${fileToDelete?.split(/[\\/]/).pop()}"? This action cannot be undone.`}
            />
        </main>
    );
}