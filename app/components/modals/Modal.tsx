"use client";

import React from "react";
import { X } from "lucide-react";
import AnimatedDialog from "./AnimatedDialog";

// Props definition for the generic Modal component
interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
    return (
        // Wrap content inside the animated dialog container for backdrop and fade/scale transitions
        <AnimatedDialog isOpen={isOpen} onClose={onClose} className="max-w-xl">
            {/* Modal card container with theme-aware styling, rounded corners, and shadow */}
            <div className="bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col transition-colors duration-200">
                {/* Header: displays the dialog title and a close button */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
                    <h2 className="text-lg font-bold font-sans text-neutral-900 dark:text-white">
                        {title}
                    </h2>
                    {/* Close button that triggers the onClose callback */}
                    <button
                        onClick={onClose}
                        className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>
                {/* Body container for modal content */}
                <div className="p-6">{children}</div>
            </div>
        </AnimatedDialog>
    );
}