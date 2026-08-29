"use client"; // Marks the input component as an interactive client block.

import React from "react";

// Accepts the current title string and the state setter function to update it.
interface NoteTitleProps {
    title: string;
    setTitle: React.Dispatch<React.SetStateAction<string>>;
}

// Renders a simplified, borderless text input explicitly for managing the active note's filename.
export default function NoteTitleLayout({ title, setTitle }: NoteTitleProps) {
    return (
        <div className="w-full bg-white dark:bg-neutral-900 rounded-lg border border-neutral-300 dark:border-neutral-700 p-4 shadow-lg flex mb-4">
            <input
                type="text"
                value={title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)} // Connects the input directly to the application state.
                className="w-full bg-transparent text-neutral-900 dark:text-gray-200 font-mono text-lg font-bold focus:outline-none placeholder:text-neutral-500"
                placeholder="Note Title..."
                spellCheck="false"
            />
        </div>
    );
}