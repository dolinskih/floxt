"use client";

import React, { useRef } from "react";

interface TextEditorProps {
    text: string;
    setText: React.Dispatch<React.SetStateAction<string>>;
    viewMode: 'code' | 'read';
}

export default function TextEditor({ text, setText, viewMode }: TextEditorProps) {
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

    // --- FLOXT CONVERTER ---
    const parseFloxt = (rawText: string) => {
        let parsed = rawText;
        let previous;

        do {
            previous = parsed;

            // 1. Parse standard 1-parameter tags (added 'code' to the list)
            parsed = parsed.replace(/\/(h1|h2|h3|h4|h5|h6|b|i|u|s|-|0|O|code);([\s\S]*?);\//g, (match, tag, content) => {
                switch (tag) {
                    case 'h1': return `<h1 class="text-4xl font-bold mt-4 mb-2">${content}</h1>`;
                    case 'h2': return `<h2 class="text-3xl font-bold mt-3 mb-2">${content}</h2>`;
                    case 'h3': return `<h3 class="text-2xl font-bold mt-3 mb-2">${content}</h3>`;
                    case 'h4': return `<h4 class="text-xl font-bold mt-2 mb-1">${content}</h4>`;
                    case 'h5': return `<h5 class="text-lg font-bold mt-2 mb-1">${content}</h5>`;
                    case 'h6': return `<h6 class="text-base font-bold mt-2 mb-1">${content}</h6>`;
                    case 'b': return `<strong>${content}</strong>`;
                    case 'i': return `<em>${content}</em>`;
                    case 'u': return `<u class="underline underline-offset-4 decoration-2">${content}</u>`;
                    case 's': return `<del class="decoration-2">${content}</del>`;

                    case '-': {
                        const cleanContent = content.trim();
                        const listItems = cleanContent.replace(/^\s*-\s*(.*)(?:\r?\n|$)/gm, '<li class="ml-6 my-1">$1</li>');
                        return `<ul class="list-disc mb-2 mt-2">${listItems}</ul>`;
                    }
                    case '0':
                    case 'O': {
                        const cleanContent = content.trim();
                        const listItems = cleanContent.replace(/^\s*-\s*(.*)(?:\r?\n|$)/gm, '<li class="ml-6 my-1">$1</li>');
                        return `<ol class="list-decimal mb-2 mt-2">${listItems}</ol>`;
                    }

                    case 'code': {
                        // We escape < and > so the browser doesn't accidentally try to render your raw code!
                        const safeCode = content.replace(/</g, '&lt;').replace(/>/g, '&gt;');
                        return `<code class="bg-neutral-950 border border-neutral-800 text-emerald-400 font-mono px-2 py-1 rounded text-sm">${safeCode}</code>`;
                    }

                    default: return content;
                }
            });

            // 2. Parse 2-parameter tags (Links)
            // Looks for /link; then anything except a semicolon (the URL); then the placeholder; then closing ;/
            parsed = parsed.replace(/\/link;([^;]+);([\s\S]*?);\//g, (match, url, placeholder) => {
                return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:text-blue-300 underline underline-offset-4 decoration-blue-400/50 transition-colors cursor-pointer">${placeholder}</a>`;
            });

        } while (parsed !== previous);

        // Replace checkboxes
        parsed = parsed.replace(/\/\[\];/g, '<input type="checkbox" disabled class="mr-2 w-4 h-4 inline-block align-middle accent-neutral-500" />');
        parsed = parsed.replace(/\/\[x\];/gi, '<input type="checkbox" checked disabled class="mr-2 w-4 h-4 inline-block align-middle accent-neutral-500" />');

        return parsed;
    };

    return (
        <div className="w-full flex-1 min-h-[600px] bg-neutral-900 rounded-lg border border-neutral-700 p-4 shadow-lg flex flex-col">
            {viewMode === 'code' ? (
                <textarea
                    ref={textareaRef}
                    value={text}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full h-full bg-transparent text-gray-200 font-mono text-sm resize-none focus:outline-none placeholder:text-neutral-500"
                    placeholder="Start typing your note here in Floxt format..."
                    spellCheck="false"
                />
            ) : (
                <div
                    className="w-full h-full text-gray-200 font-sans overflow-y-auto whitespace-pre-wrap outline-none pr-2"
                    dangerouslySetInnerHTML={{ __html: parseFloxt(text) }}
                />
            )}
        </div>
    );
}