"use client";

import React from "react";

interface TextEditorProps {
    text: string;
    setText: React.Dispatch<React.SetStateAction<string>>;
}

export default function TextEditor({ text, setText }: TextEditorProps) {
    return (
        <div className="w-full flex-1 h-full min-h-[600px] bg-neutral-900 rounded-lg border border-neutral-700 p-4 shadow-lg flex">
            <textarea
                value={text}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setText(e.target.value)}
                className="w-full h-full bg-transparent text-gray-200 font-mono text-sm resize-none focus:outline-none placeholder:text-neutral-500"
                placeholder="Start typing your note here..."
                spellCheck="false"
            />
        </div>
    );
}