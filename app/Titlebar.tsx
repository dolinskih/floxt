"use client";

import { useEffect, useState } from 'react';
import { Minus, Square, X } from 'lucide-react';

export default function Titlebar() {
    const [appWindow, setAppWindow] = useState<any>(null);
    const [isTauri, setIsTauri] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
            setIsTauri(true);
            import('@tauri-apps/api/window').then((module) => {
                setAppWindow(module.getCurrentWindow());
            });
        }
    }, []);

    if (!isTauri) return null;

    return (
        <div className="fixed top-0 left-0 right-0 h-[30px] bg-transparent flex select-none z-[9999] border-b border-neutral-200/40 dark:border-neutral-800/50">
            
            {/* Left side: Logo and App Name */}
            <div className="flex items-center pl-3 gap-2 pointer-events-none text-neutral-700 dark:text-neutral-300">
                <img src="/floxt_icon_1024x1024.png" alt="Floxt Logo" className="w-4 h-4 object-contain" />
                <span className="text-[12px] font-sans font-bold tracking-wide mt-[2px]">Floxt</span>
            </div>

            {/* The drag region */}
            <div data-tauri-drag-region className="flex-1 cursor-default" />
            
            {/* Window Controls */}
            <div className="flex">
                <button
                    onClick={() => appWindow?.minimize()}
                    className="inline-flex justify-center items-center w-[40px] h-full hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 transition-colors"
                    title="Minimize"
                >
                    <Minus size={16} />
                </button>
                <button
                    onClick={() => appWindow?.toggleMaximize()}
                    className="inline-flex justify-center items-center w-[40px] h-full hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 transition-colors"
                    title="Maximize"
                >
                    <Square size={14} />
                </button>
                <button
                    onClick={() => appWindow?.close()}
                    className="inline-flex justify-center items-center w-[40px] h-full hover:bg-red-500 hover:text-white text-neutral-600 dark:text-neutral-400 transition-colors"
                    title="Close"
                >
                    <X size={18} /> 
                </button>
            </div>
        </div>
    );
}