"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        if (isOpen) {
            window.addEventListener("keydown", handleKeyDown);
        }
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-neutral-900 border border-neutral-700 rounded-lg shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
                <div className="flex items-center justify-between p-4 border-b border-neutral-700">
                    <h2 className="text-gray-200 font-mono font-bold text-lg">{title}</h2>
                    <button
                        onClick={onClose}
                        className="text-neutral-400 hover:text-white transition-colors cursor-pointer"
                    >
                        <X size={24} />
                    </button>
                </div>
                <div className="p-4 text-gray-300 font-mono text-sm">
                    {children}
                </div>
            </div>
        </div>
    );
}