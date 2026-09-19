import { invoke } from '@tauri-apps/api/core';
import { open, save } from '@tauri-apps/plugin-dialog';

// Abstracts all Tauri IPC (Inter-Process Communication) calls into a single service.
// This decouples the React frontend from the Rust backend, making it easier to maintain,
// mock for testing, or swap out for a web-based backend in the future.
export const fileService = {
    // --- FILE OPERATIONS ---
    readDocument: async (path: string): Promise<string> => {
        return await invoke<string>('read_document', { path });
    },

    saveDocument: async (path: string, newName: string, content: string): Promise<string> => {
        return await invoke<string>('save_document', {
            path,
            newName,
            new_name: newName, // Maintains backward compatibility with snake_case Rust struct definitions
            content
        });
    },

    deleteDocument: async (path: string): Promise<void> => {
        await invoke('delete_document', { path });
    },

    getInitialFile: async (): Promise<{ name: string, content: string, path: string } | null> => {
        return await invoke<{ name: string, content: string, path: string } | null>('get_initial_file');
    },

    // --- PROJECT OPERATIONS ---
    readProjectDir: async (dirPath: string): Promise<{ name: string, path: string }[]> => {
        return await invoke<{ name: string, path: string }[]>('read_project_dir', { dirPath });
    },

    // --- DIALOG OPERATIONS ---
    // Wraps Tauri's native OS folder selection dialog
    openProjectDialog: async (): Promise<string | null> => {
        const selectedDir = await open({
            directory: true,
            multiple: false,
            title: 'Open Floxt Project Folder'
        });
        return selectedDir as string | null;
    },

    // Wraps Tauri's native OS file save dialog, handling empty title fallbacks automatically
    saveNewNoteDialog: async (defaultTitle: string): Promise<string | null> => {
        const defaultPath = defaultTitle.trim() === "" ? "" : `${defaultTitle}.floxt`;

        return await save({
            title: 'Save New Note',
            defaultPath,
            filters: [{ name: 'Floxt File', extensions: ['floxt'] }]
        });
    }
};