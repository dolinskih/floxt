"use client";

import { useEffect, useState, useRef } from "react";
import PanelLayout from "./PanelLayout";
import TextEditor from "./TextEditor";
import NoteTitle from "./NoteTitle";
import ConfirmModal from "./ConfirmModal";
import WelcomeGuideModal from "./WelcomeGuideModal";
import { useSettings } from "./contexts/SettingsContext";
import { useProjectManager } from "./hooks/useProjectManager";
import ExitWarningModal from "./ExitWarningModal";

export default function Home() {
    const { panelPosition, viewMode, setViewMode, fontSize, showLineNumbers, lineWrap } = useSettings();
    const [isWelcomeGuideOpen, setIsWelcomeGuideOpen] = useState(false);
    const [isExitWarningOpen, setIsExitWarningOpen] = useState(false);

    const {
        text, setText, title, setTitle,
        filePath, setFilePath,
        savedText, setSavedText, savedTitle, setSavedTitle,
        projectName, projectFiles, activeFiles,
        unsavedFilesTracker,
        isFileTracked, setIsFileTracked,
        fileToDelete, setFileToDelete,
        isConfirmDeleteOpen, setIsConfirmDeleteOpen,
        hasUnsavedChanges,
        handleOpenFileFromProject, handleCloseTab, handleOpenProject,
        handleSaveFileFromProject, handleNewFileSaved,
        handleDeleteFileFromProject, executeDelete
    } = useProjectManager();

    const hasAnyUnsavedChanges = hasUnsavedChanges || Object.values(unsavedFilesTracker).some(Boolean);
    const hasUnsavedRef = useRef(hasAnyUnsavedChanges);
    hasUnsavedRef.current = hasAnyUnsavedChanges;

    useEffect(() => {
        const loader = document.getElementById("initial-loader");
        if (loader) {
            loader.classList.add("loader-hidden");
            const timer = setTimeout(() => loader.remove(), 260);
            return () => clearTimeout(timer);
        }
    }, []);

    useEffect(() => {
        let isMounted = true;
        let unlistenFn: (() => void) | undefined;

        const setupCloseListener = async () => {
            if (typeof window === "undefined" || !("__TAURI_INTERNALS__" in window)) {
                return;
            }

            try {
                const { getCurrentWebviewWindow } = await import("@tauri-apps/api/webviewWindow");
                const appWindow = getCurrentWebviewWindow();

                const unlisten = await appWindow.onCloseRequested(async (event) => {
                    if (hasUnsavedRef.current) {
                        event.preventDefault();
                        setIsExitWarningOpen(true);
                    }
                });

                if (!isMounted) {
                    unlisten();
                } else {
                    unlistenFn = unlisten;
                }
            } catch (err) {
                console.error("Failed to register close listener:", err);
            }
        };

        setupCloseListener();

        return () => {
            isMounted = false;
            if (unlistenFn) unlistenFn();
        };
    }, []);

    const handleForceExit = async () => {
        if (typeof window !== "undefined" && "__TAURI_INTERNALS__" in window) {
            const { getCurrentWebviewWindow } = await import("@tauri-apps/api/webviewWindow");
            const appWindow = getCurrentWebviewWindow();
            await appWindow.destroy();
        } else {
            window.close();
        }
    };

    useEffect(() => {
        const hasSeenGuide = localStorage.getItem("floxt_has_seen_guide");
        if (!hasSeenGuide) {
            setIsWelcomeGuideOpen(true);
        }
    }, []);

    const handleCloseGuide = () => {
        setIsWelcomeGuideOpen(false);
        localStorage.setItem("floxt_has_seen_guide", "true");
    };

    return (
        <main className={`flex w-full h-[calc(100vh-30px)] mt-[30px] p-4 gap-6 overflow-y-auto bg-neutral-50 dark:bg-neutral-950 transition-colors duration-200 ${panelPosition === 'right' ? 'flex-row-reverse' : 'flex-row'}`}>
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
                onOpenGuide={() => setIsWelcomeGuideOpen(true)}
            />

            <div className="flex-1 flex flex-col min-w-0">
                {projectName && activeFiles.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto pb-2 mb-4 no-scrollbar">
                        {activeFiles.map((file, idx) => (
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
                                    onClick={(e) => { e.stopPropagation(); handleCloseTab(file.path); }}
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
                    lineWrap={lineWrap}
                />
            </div>

            <ConfirmModal
                isOpen={isConfirmDeleteOpen}
                onClose={() => setIsConfirmDeleteOpen(false)}
                onConfirm={executeDelete}
                title="Delete Note"
                message={`Are you sure you want to permanently delete "${fileToDelete?.split(/[\\/]/).pop()}"? This action cannot be undone.`}
            />

            <WelcomeGuideModal
                isOpen={isWelcomeGuideOpen}
                onClose={handleCloseGuide}
            />

            <ExitWarningModal
                isOpen={isExitWarningOpen}
                onClose={() => setIsExitWarningOpen(false)}
                onConfirmExit={handleForceExit}
                hasProjectUnsaved={Object.values(unsavedFilesTracker).some(Boolean)}
            />
        </main>
    );
}