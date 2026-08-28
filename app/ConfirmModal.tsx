"use client";

import { X } from 'lucide-react';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
}

export default function ConfirmModal({ isOpen, onClose, onConfirm, title, message }: ConfirmModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity">
            <div className="bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl shadow-xl w-[90%] max-w-sm overflow-hidden flex flex-col">
                
                <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-800">
                    <h2 className="font-bold text-neutral-800 dark:text-white">{title}</h2>
                    <button onClick={onClose} className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md text-neutral-500 transition-colors">
                        <X size={18} />
                    </button>
                </div>
                
                <div className="p-4 text-sm text-neutral-600 dark:text-neutral-400">
                    {message}
                </div>
                
                <div className="flex justify-end gap-2 p-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/50">
                    <button 
                        onClick={onClose} 
                        className="px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={() => { 
                            onConfirm(); 
                            onClose(); 
                        }} 
                        className="px-4 py-2 text-sm font-medium text-white bg-red-500 border border-red-600 hover:bg-red-600 rounded-lg transition-colors shadow-sm cursor-pointer"
                    >
                        Delete
                    </button>
                </div>
                
            </div>
        </div>
    );
}