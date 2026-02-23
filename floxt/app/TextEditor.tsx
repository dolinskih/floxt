"use client";

import React, { useRef } from "react";

interface TextEditorProps {
    text: string;
    setText: React.Dispatch<React.SetStateAction<string>>;
}

export default function TextEditor({ text, setText }: TextEditorProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Tab') {
            e.preventDefault();

            const target = e.target as HTMLTextAreaElement;
            const start = target.selectionStart;
            const end = target.selectionEnd;

            const newText = text.substring(0, start) + "    " + text.substring(end);
            setText(newText);

            setTimeout(() => {
                if (textareaRef.current) {
                    textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 4;
                }
            }, 0);
        }
    };

    return (
        <div className="w-full flex-1 min-h-[600px] bg-neutral-900 rounded-lg border border-neutral-700 p-4 shadow-lg flex">
            <textarea
                ref={textareaRef}
                value={text}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full h-full bg-transparent text-gray-200 font-mono text-sm resize-none focus:outline-none placeholder:text-neutral-500"
                placeholder="Start typing your note here..."
                spellCheck="false"
            />
        </div>
    );
}