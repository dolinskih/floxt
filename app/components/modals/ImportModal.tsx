"use client"; // Flags the component to run entirely in the browser.

import { useCallback, useEffect, useRef, useState } from 'react';
import Modal from './Modal';
import { FileUp } from 'lucide-react';
import { convertMarkdownToFloxt } from '../../utils/floxtParser';
import { fileService } from '../../services/fileService';
import { useToast } from '../../contexts/ToastContext';

// Describes the structure for state control and the callback firing upon import completion.
interface ImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (title: string, content: string) => void;
}

const VALID_EXTENSIONS = ['.md', '.txt', '.floxt'];

export default function ImportModal({ isOpen, onClose, onImport }: ImportModalProps) {
    const fileInputRef = useRef<HTMLInputElement>(null); // References the hidden file input element.
    const [isDragging, setIsDragging] = useState(false);
    const { showToast } = useToast();

    // Reads a native file path dropped onto the Tauri window, validates its extension, and imports it.
    const processFilePath = useCallback(async (filePath: string) => {
        const fileName = filePath.split(/[\\/]/).pop() || "";
        const lowerName = fileName.toLowerCase();
        const isValid = VALID_EXTENSIONS.some(ext => lowerName.endsWith(ext));

        if (!isValid) {
            showToast({
                type: "error",
                title: "Unsupported file format",
                message: "Please select a valid .md, .txt, or .floxt file.",
            });
            return;
        }

        const fileNameWithoutExt = fileName.replace(/\.(md|txt|floxt)$/i, "");
        const isMarkdown = lowerName.endsWith('.md');

        try {
            let content = await fileService.readDocument(filePath);
            if (isMarkdown) {
                content = await convertMarkdownToFloxt(content);
            }
            onImport(fileNameWithoutExt, content);
        } catch (error) {
            console.error("Failed to import dropped file:", error);
            showToast({
                type: "error",
                title: "Failed to import file",
                message: error instanceof Error ? error.message : String(error),
            });
        }
    }, [onImport, showToast]);

    // Listen for native Tauri drag-and-drop events while the modal is open.
    // On Windows WebView2, Tauri intercepts OS file drops instead of firing HTML5 DOM drop events.
    useEffect(() => {
        if (!isOpen) {
            setIsDragging(false);
            return;
        }

        if (typeof window === "undefined" || !("__TAURI_INTERNALS__" in window)) {
            return;
        }

        let isMounted = true;
        let unlistenFn: (() => void) | undefined;

        const setupDragDropListener = async () => {
            try {
                const { getCurrentWebview } = await import("@tauri-apps/api/webview");
                const unlisten = await getCurrentWebview().onDragDropEvent((event) => {
                    const payload = event.payload;
                    if (payload.type === "enter" || payload.type === "over") {
                        setIsDragging(true);
                    } else if (payload.type === "leave") {
                        setIsDragging(false);
                    } else if (payload.type === "drop") {
                        setIsDragging(false);
                        const droppedPath = payload.paths?.[0];
                        if (droppedPath) {
                            processFilePath(droppedPath);
                        }
                    }
                });

                if (!isMounted) {
                    unlisten();
                } else {
                    unlistenFn = unlisten;
                }
            } catch (err) {
                console.error("Failed to register Tauri drag-and-drop listener:", err);
            }
        };

        setupDragDropListener();

        return () => {
            isMounted = false;
            setIsDragging(false);
            if (unlistenFn) unlistenFn();
        };
    }, [isOpen, processFilePath]);

    // Reads the provided file, validates its extension, and converts it if necessary before importing.
    const processFile = (file: File) => {
        const isValid = VALID_EXTENSIONS.some(ext => file.name.toLowerCase().endsWith(ext));

        if (!isValid) {
            showToast({
                type: "error",
                title: "Unsupported file format",
                message: "Please select a valid .md, .txt, or .floxt file.",
            });
            return;
        }

        const fileNameWithoutExt = file.name.replace(/\.(md|txt|floxt)$/i, "");
        const isMarkdown = file.name.toLowerCase().endsWith('.md');

        const reader = new FileReader();
        reader.onload = async (event: ProgressEvent<FileReader>) => {
            if (event.target?.result) {
                try {
                    let content = event.target.result as string;

                    if (isMarkdown) {
                        content = await convertMarkdownToFloxt(content);
                    }

                    onImport(fileNameWithoutExt, content);
                } catch (error) {
                    console.error("Failed to import file:", error);
                    showToast({
                        type: "error",
                        title: "Failed to import file",
                        message: error instanceof Error ? error.message : String(error),
                    });
                }
            }
        };
        reader.readAsText(file);
    };

    // Responds to manual file selection via the traditional file browser.
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) processFile(file);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    // Drag-and-drop state handlers.
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
    };

    // Initiates the file processing sequence when a file is physically dropped onto the dropzone.
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) processFile(file);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Import Note">
            <div className="flex flex-col gap-4 p-2">
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Select a file to import into a new note. Markdown files (.md) will be automatically converted to Floxt formatting.
                </p>

                {/* The drag-and-drop interaction zone. */}
                <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${isDragging
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20'
                        : 'border-neutral-300 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                        }`}
                >
                    <FileUp size={48} className={`mb-4 ${isDragging ? 'text-emerald-500' : 'text-neutral-400 dark:text-neutral-500'}`} />
                    <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        {isDragging ? 'Drop file here' : 'Click or drag & drop a file'}
                    </span>
                    <span className="text-xs text-neutral-500 mt-1">.md, .txt, .floxt</span>
                </div>

                {/* The hidden input triggered by clicking the dropzone. */}
                <input
                    type="file"
                    accept=".md,.txt,.floxt"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                />
            </div>
        </Modal>
    );
}