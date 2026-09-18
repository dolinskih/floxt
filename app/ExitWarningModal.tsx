"use client";

import { AlertTriangle } from "lucide-react";
import AnimatedDialog from "./AnimatedDialog";

interface ExitWarningModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirmExit: () => void;
    hasProjectUnsaved?: boolean;
}

export default function ExitWarningModal({
    isOpen,
    onClose,
    onConfirmExit,
    hasProjectUnsaved = false,
}: ExitWarningModalProps) {
    return (
        <AnimatedDialog isOpen={isOpen} onClose={onClose} className="max-w-md">
            <div className="bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-2xl shadow-2xl p-6 flex flex-col items-center text-center">
                {/* Header */}
                <div className="flex items-center gap-2 mb-4 text-neutral-900 dark:text-white">
                    <AlertTriangle size={24} className="text-amber-500 flex-shrink-0" />
                    <h2 className="text-xl font-bold font-sans">Warning</h2>
                </div>

                {/* Message */}
                <p className="text-sm text-neutral-600 dark:text-neutral-300 mb-8 leading-relaxed max-w-xs">
                    {hasProjectUnsaved
                        ? "You have unsaved changes in your project documents."
                        : "You have unsaved changes in the currently opened document."}
                </p>

                {/* Buttons */}
                <div className="flex items-center justify-center gap-4 w-full">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2 px-4 rounded-xl border border-neutral-300 dark:border-neutral-700 text-sm font-medium text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirmExit}
                        className="flex-1 py-2 px-4 rounded-xl border border-red-500/80 bg-red-50 dark:bg-red-950/30 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors cursor-pointer"
                    >
                        Exit anyway
                    </button>
                </div>
            </div>
        </AnimatedDialog>
    );
}