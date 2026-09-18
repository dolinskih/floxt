"use client";

import PanelLayout from "./PanelLayout";
import TextEditor from "./TextEditor";
import NoteTitle from "./NoteTitle";
import ConfirmModal from "./ConfirmModal";
import { useSettings } from "./contexts/SettingsContext";
import { useProjectManager } from "./hooks/useProjectManager";

// Acts as the primary layout orchestrator. All business logic is abstracted into Contexts 
// and Custom Hooks to keep the React rendering tree clean and performant.
export default function Home() {
    const { panelPosition, viewMode, setViewMode, fontSize, showLineNumbers } = useSettings();

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
                // Maps the global unsaved tracker dictionary into the file objects for the UI renderer.
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
                {/* Horizontal Tab Bar: Only renders if a workspace folder is mounted. */}
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