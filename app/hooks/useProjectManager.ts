import { useState, useEffect } from 'react';
import { fileService } from '../services/fileService';

export function useProjectManager() {
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

    const handleOpenFileFromProject = async (targetPath: string) => {
        try {
            if (filePath && filePath !== targetPath) {
                setFileBuffers(prev => ({ ...prev, [filePath]: { text, title, savedText, savedTitle } }));
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

            const fileContent = await fileService.readDocument(targetPath);
            const fileName = targetPath.split(/[\\/]/).pop()?.replace(/\.floxt$/i, '') || '';

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
            const selectedDir = await fileService.openProjectDialog();
            if (selectedDir) {
                const folderName = selectedDir.split(/[\\/]/).pop() || 'Project';
                setProjectName(folderName);
                setProjectPath(selectedDir);

                const files = await fileService.readProjectDir(selectedDir);
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

            const returnedPath = await fileService.saveDocument(targetPath, titleToSave, contentToSave);

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

        try {
            await fileService.deleteDocument(fileToDelete);

            setProjectFiles(prev => prev.filter(f => f.path !== fileToDelete));
            setActiveFiles(prev => prev.filter(f => f.path !== fileToDelete));

            setFileBuffers(prev => {
                const newBuffers = { ...prev };
                delete newBuffers[fileToDelete];
                return newBuffers;
            });
            setUnsavedFilesTracker(prev => {
                const newTracker = { ...prev };
                delete newTracker[fileToDelete];
                return newTracker;
            });

            if (filePath === fileToDelete) {
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
            setUnsavedFilesTracker(prev => ({ ...prev, [filePath]: isDirty }));
        }
    }, [text, title, savedText, savedTitle, filePath]);

    useEffect(() => {
        const checkInitialFile = async () => {
            if (typeof window !== 'undefined' && !('__TAURI_INTERNALS__' in window)) return;
            try {
                const fileData = await fileService.getInitialFile();
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

    return {
        text, setText,
        title, setTitle,
        filePath, setFilePath,
        savedText, setSavedText,
        savedTitle, setSavedTitle,
        projectName,
        projectFiles,
        activeFiles,
        unsavedFilesTracker,
        isFileTracked, setIsFileTracked,
        fileToDelete, setFileToDelete,
        isConfirmDeleteOpen, setIsConfirmDeleteOpen,
        hasUnsavedChanges,
        handleOpenFileFromProject,
        handleCloseTab,
        handleOpenProject,
        handleSaveFileFromProject,
        handleNewFileSaved,
        handleDeleteFileFromProject,
        executeDelete
    };
}