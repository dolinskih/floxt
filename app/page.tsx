"use client";

import { useEffect, useState, useRef } from "react";
import PanelLayout from "./components/layout/PanelLayout";
import TextEditor from "./components/editor/TextEditor";
import NoteTitle from "./components/editor/NoteTitle";
import ConfirmModal from "./components/modals/ConfirmModal";
import WelcomeGuideModal from "./components/modals/WelcomeGuideModal";
import { useSettings } from "./contexts/SettingsContext";
import { useProjectManager } from "./hooks/useProjectManager";
import ExitWarningModal from "./components/modals/ExitWarningModal";

export default function Home() {
    // Global editor and UI layout preferences retrieved from context
    const { panelPosition, viewMode, setViewMode, fontSize, showLineNumbers, lineWrap } = useSettings();

    // Modal visibility states for the welcome guide and exit interception dialog
    const [isWelcomeGuideOpen, setIsWelcomeGuideOpen] = useState(false);
    const [isExitWarningOpen, setIsExitWarningOpen] = useState(false);

    // Main project and document management state/handlers
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

    // Check if the current note or any opened project document has unsaved modifications
    const hasAnyUnsavedChanges = hasUnsavedChanges || Object.values(unsavedFilesTracker).some(Boolean);
    // Keep a mutable ref synchronized with the unsaved state for the native Tauri close callback
    const hasUnsavedRef = useRef(hasAnyUnsavedChanges);
    hasUnsavedRef.current = hasAnyUnsavedChanges;

    // 1. Remove initial pre-hydration splash overlay once the React tree mounts
    useEffect(() => {
        const loader = document.getElementById("initial-loader");
        if (loader) {
            loader.classList.add("loader-hidden");
            const timer = setTimeout(() => loader.remove(), 260);
            return () => clearTimeout(timer);
        }
    }, []);

    // 2. Intercept native window close events via Tauri when unsaved changes exist
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

                // Listen for native close requests (e.g. titlebar close button, Alt+F4)
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

        // Clean up close listener when unmounting
        return () => {
            isMounted = false;
            if (unlistenFn) unlistenFn();
        };
    }, []);

    // Force close/destroy the native Tauri window or fallback to standard window.close()
    const handleForceExit = async () => {
        if (typeof window !== "undefined" && "__TAURI_INTERNALS__" in window) {
            const { getCurrentWebviewWindow } = await import("@tauri-apps/api/webviewWindow");
            const appWindow = getCurrentWebviewWindow();
            await appWindow.destroy();
        } else {
            window.close();
        }
    };

    // 3. Show the welcome guide modal automatically on the very first launch
    useEffect(() => {
        const hasSeenGuide = localStorage.getItem("floxt_has_seen_guide");
        if (!hasSeenGuide) {
            setIsWelcomeGuideOpen(true);
        }
    }, []);

    // Dismiss welcome guide and mark it as seen in localStorage
    const handleCloseGuide = () => {
        setIsWelcomeGuideOpen(false);
        localStorage.setItem("floxt_has_seen_guide", "true");
    };

    return (
        <main className={`flex w-full h-[calc(100vh-30px)] mt-[30px] p-4 gap-6 overflow-y-auto bg-transparent transition-colors duration-200 ${panelPosition === 'right' ? 'flex-row-reverse' : 'flex-row'}`}>
            {/* Sidebar navigation and file management panel */}
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

            {/* Central editing workspace */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Project tab bar for opened documents */}
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

                {/* Editable note title component */}
                <NoteTitle title={title} setTitle={setTitle} />

                {/* Core markdown and text editor component */}
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

            {/* Modal dialog confirming file deletion */}
            <ConfirmModal
                isOpen={isConfirmDeleteOpen}
                onClose={() => setIsConfirmDeleteOpen(false)}
                onConfirm={executeDelete}
                title="Delete Note"
                message={`Are you sure you want to permanently delete "${fileToDelete?.split(/[\\/]/).pop()}"? This action cannot be undone.`}
            />

            {/* Introductory guide modal for first-time users */}
            <WelcomeGuideModal
                isOpen={isWelcomeGuideOpen}
                onClose={handleCloseGuide}
            />

            {/* Exit confirmation modal intercepting close events with unsaved work */}
            <ExitWarningModal
                isOpen={isExitWarningOpen}
                onClose={() => setIsExitWarningOpen(false)}
                onConfirmExit={handleForceExit}
                hasProjectUnsaved={Object.values(unsavedFilesTracker).some(Boolean)}
            />
        </main>
    );
}