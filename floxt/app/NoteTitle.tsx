"use client";

import React from "react";

interface NoteTitleProps {
    title: string;
    setTitle: React.Dispatch<React.SetStateAction<string>>;
}

export default function NoteTitleLayout({ title, setTitle }: NoteTitleProps) {
    return (
        <div className="w-full bg-white dark:bg-neutral-900 rounded-lg border border-neutral-300 dark:border-neutral-700 p-4 shadow-lg flex mb-4">
            <input
                type="text"
                value={title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
                className="w-full bg-transparent text-neutral-900 dark:text-gray-200 font-mono text-lg font-bold focus:outline-none placeholder:text-neutral-500"
                placeholder="Note Title..."
                spellCheck="false"
            />
        </div>
    );
}