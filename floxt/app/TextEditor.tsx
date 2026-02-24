"use client";

import React, { useRef } from "react";

interface TextEditorProps {
    text: string;
    setText: React.Dispatch<React.SetStateAction<string>>;
    viewMode: 'code' | 'read';
    fontSize: number;
    showLineNumbers: boolean;
}

export default function TextEditor({ text, setText, viewMode, fontSize, showLineNumbers }: TextEditorProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const preRef = useRef<HTMLDivElement>(null);
    const lineNumbersRef = useRef<HTMLDivElement>(null);

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

    const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
        if (preRef.current) {
            preRef.current.scrollTop = e.currentTarget.scrollTop;
            preRef.current.scrollLeft = e.currentTarget.scrollLeft;
        }
        if (lineNumbersRef.current) {
            lineNumbersRef.current.scrollTop = e.currentTarget.scrollTop;
        }
    };

    const highlightFloxt = (rawText: string) => {
        const parts = rawText.split(/(\/(?:h[1-6]|b|i|u|s|-|0|O|code|link|\[\]|\[x\]);|;\/)/gi);
        
        return parts.map((part, i) => {
            if (part.match(/(\/(?:h[1-6]|b|i|u|s|-|0|O|code|link|\[\]|\[x\]);|;\/)/i)) {
                return <span key={i} className="text-yellow-500 font-bold">{part}</span>;
            }
            return <span key={i}>{part}</span>;
        });
    };

    const parseFloxt = (rawText: string) => {
        let parsed = rawText;
        let previous;

        do {
            previous = parsed;
            
            parsed = parsed.replace(/\/(h1|h2|h3|h4|h5|h6|b|i|u|s|-|0|O|code);([\s\S]*?);\//g, (match, tag, content) => {
                switch(tag) {
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
                        const safeCode = content.replace(/</g, '&lt;').replace(/>/g, '&gt;');
                        return `<code class="bg-neutral-950 border border-neutral-800 text-emerald-400 font-mono px-2 py-1 rounded text-sm">${safeCode}</code>`;
                    }

                    default: return content;
                }
            });

            parsed = parsed.replace(/\/link;([^;]+);([\s\S]*?);\//g, (match, url, placeholder) => {
                return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:text-blue-300 underline underline-offset-4 decoration-blue-400/50 transition-colors cursor-pointer">${placeholder}</a>`;
            });

        } while (parsed !== previous);

        parsed = parsed.replace(/\/\[\];/g, '<input type="checkbox" disabled class="mr-2 w-4 h-4 inline-block align-middle accent-neutral-500" />');
        parsed = parsed.replace(/\/\[x\];/gi, '<input type="checkbox" checked disabled class="mr-2 w-4 h-4 inline-block align-middle accent-neutral-500" />');

        return parsed;
    };

    const linesCount = text.split('\n').length;

    return (
        <div className="w-full flex-1 min-h-[600px] bg-neutral-900 rounded-lg border border-neutral-700 shadow-lg flex flex-col overflow-hidden">
            {viewMode === 'code' ? (
                <div className="flex flex-1 overflow-hidden">
                    {showLineNumbers && (
                        <div 
                            ref={lineNumbersRef}
                            style={{ fontSize: `${fontSize}px`, lineHeight: 1.5 }}
                            className="w-12 flex-none bg-neutral-900/50 border-r border-neutral-800 text-neutral-500 font-mono text-right pr-3 py-4 overflow-hidden select-none"
                        >
                            {Array.from({ length: linesCount }).map((_, i) => (
                                <div key={i}>{i + 1}</div>
                            ))}
                        </div>
                    )}
                    <div className="relative flex-1 overflow-hidden bg-transparent">
                        <div 
                            ref={preRef}
                            style={{ fontSize: `${fontSize}px`, lineHeight: 1.5 }}
                            className="absolute inset-0 px-4 py-4 font-mono text-gray-200 whitespace-pre pointer-events-none overflow-hidden"
                            aria-hidden="true"
                        >
                            {highlightFloxt(text)}
                            {text.endsWith('\n') ? <br /> : null}
                        </div>

                        <textarea
                            ref={textareaRef}
                            value={text}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setText(e.target.value)}
                            onScroll={handleScroll}
                            onKeyDown={handleKeyDown}
                            style={{ fontSize: `${fontSize}px`, lineHeight: 1.5 }}
                            className="absolute inset-0 px-4 py-4 font-mono bg-transparent text-transparent caret-white resize-none outline-none z-10 placeholder:text-neutral-500 whitespace-pre overflow-auto"
                            placeholder="Start typing your note here in Floxt format..."
                            spellCheck="false" 
                        />
                    </div>
                </div>
            ) : (
                <div 
                    style={{ fontSize: `${fontSize}px`, lineHeight: 1.6 }}
                    className="w-full h-full p-4 text-gray-200 font-sans overflow-y-auto whitespace-pre-wrap outline-none pr-2"
                    dangerouslySetInnerHTML={{ __html: parseFloxt(text) }}
                />
            )}
        </div>
    );
}