"use client";

import React, { useRef } from "react";

interface TextEditorProps {
    text: string;
    setText: React.Dispatch<React.SetStateAction<string>>;
    viewMode: 'code' | 'read';
    setViewMode: React.Dispatch<React.SetStateAction<'code' | 'read'>>;
    fontSize: number;
    showLineNumbers: boolean;
}

export default function TextEditor({ text, setText, viewMode, setViewMode, fontSize, showLineNumbers }: TextEditorProps) {
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
        const parts = rawText.split(/(\/(?:h[1-6]|b|i|u|s|-|0|O|code|link|table|\[\]|\[x\]);|;\/)/gi);
        
        return parts.map((part, i) => {
            if (part.match(/(\/(?:h[1-6]|b|i|u|s|-|0|O|code|link|table|\[\]|\[x\]);|;\/)/i)) {
                return <span key={i} className="text-yellow-500 font-bold">{part}</span>;
            }
            return <span key={i}>{part}</span>;
        });
    };

    const handleReadViewClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const target = e.target as HTMLElement;
        
        if (target.tagName === 'INPUT' && target.classList.contains('floxt-checkbox')) {
            const targetIndex = parseInt(target.getAttribute('data-cb-index') || "-1", 10);
            if (targetIndex > -1) {
                let currentIdx = 0;
                const newText = text.replace(/\/\[(x)?\];/gi, (match, checkedState) => {
                    if (currentIdx === targetIndex) {
                        currentIdx++;
                        return checkedState ? '/[];' : '/[x];';
                    }
                    currentIdx++;
                    return match;
                });
                setText(newText);
            }
            return;
        }

        if ((e.ctrlKey || e.metaKey) && viewMode === 'read') {
            e.preventDefault();
            if (target === e.currentTarget) return;

            const searchText = target.textContent?.trim() || "";
            if (!searchText) return;

            let rawIndex = text.indexOf(searchText);
            if (rawIndex === -1 && searchText.length > 15) {
                rawIndex = text.indexOf(searchText.substring(0, 15));
            }

            setViewMode('code');

            setTimeout(() => {
                if (textareaRef.current) {
                    textareaRef.current.focus();
                    if (rawIndex !== -1) {
                        textareaRef.current.setSelectionRange(rawIndex, rawIndex + searchText.length);
                        const linesBefore = text.substring(0, rawIndex).split('\n').length;
                        const scrollY = Math.max(0, (linesBefore - 4) * (fontSize * 1.5));
                        textareaRef.current.scrollTop = scrollY;
                        if (preRef.current) preRef.current.scrollTop = scrollY;
                        if (lineNumbersRef.current) lineNumbersRef.current.scrollTop = scrollY;
                    }
                }
            }, 50);
        }
    };

    const parseFloxt = (rawText: string) => {
        let parsed = rawText;
        let previous;

        do {
            previous = parsed;
            
            parsed = parsed.replace(/\/(h1|h2|h3|h4|h5|h6|b|i|u|s|-|0|O|code|table);([\s\S]*?);\//g, (match, tag, content) => {
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

                    case 'table': {
                        const lines = content.trim().split(/\r?\n/);
                        if (lines.length === 0) return '';
                        
                        const headers = lines[0].split('|').map((cell: string) => `<th class="border border-neutral-700 px-4 py-2 bg-neutral-800 text-left font-bold">${cell.trim()}</th>`).join('');
                        const thead = `<thead><tr>${headers}</tr></thead>`;
                        
                        let tbody = '';
                        if (lines.length > 1) {
                            const rows = lines.slice(1).map((line: string) => {
                                const cells = line.split('|').map((cell: string) => `<td class="border border-neutral-700 px-4 py-2">${cell.trim()}</td>`).join('');
                                return `<tr class="border-b border-neutral-800 hover:bg-neutral-800/30 transition-colors">${cells}</tr>`;
                            }).join('');
                            tbody = `<tbody>${rows}</tbody>`;
                        }
                        
                        return `<div class="overflow-x-auto my-4 rounded border border-neutral-700"><table class="w-full border-collapse text-sm text-gray-200">${thead}${tbody}</table></div>`;
                    }

                    default: return content;
                }
            });

            parsed = parsed.replace(/\/link;([^;]+);([\s\S]*?);\//g, (match, url, placeholder) => {
                return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:text-blue-300 underline underline-offset-4 decoration-blue-400/50 transition-colors cursor-pointer">${placeholder}</a>`;
            });

        } while (parsed !== previous);

        let cbIndex = 0;
        parsed = parsed.replace(/\/\[(x)?\];/gi, (match, checkedState) => {
            const isChecked = !!checkedState;
            const html = `<input type="checkbox" ${isChecked ? 'checked' : ''} data-cb-index="${cbIndex}" class="floxt-checkbox mr-2 w-4 h-4 inline-block align-middle accent-neutral-500 cursor-pointer" />`;
            cbIndex++;
            return html;
        });

        return parsed;
    };

    const safeText = text || "";
    const linesCount = safeText.split('\n').length;
    const charsCount = safeText.length;
    const wordsCount = safeText.trim() === "" ? 0 : safeText.trim().split(/\s+/).length;

    return (
        <div className="w-full flex-1 min-h-[600px] bg-neutral-900 rounded-lg border border-neutral-700 shadow-lg flex flex-col overflow-hidden relative">
            {viewMode === 'code' ? (
                <div className="flex flex-1 overflow-hidden">
                    {showLineNumbers && (
                        <div 
                            ref={lineNumbersRef}
                            style={{ fontSize: `${fontSize}px`, lineHeight: 1.5 }}
                            className="w-12 flex-none bg-neutral-900/50 border-r border-neutral-800 text-neutral-500 font-mono text-right pr-3 py-4 overflow-hidden select-none pb-12"
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
                            className="absolute inset-0 px-4 py-4 pb-12 font-mono text-gray-200 whitespace-pre pointer-events-none overflow-hidden"
                            aria-hidden="true"
                        >
                            {highlightFloxt(text)}
                            {safeText.endsWith('\n') ? <br /> : null}
                        </div>

                        <textarea
                            ref={textareaRef}
                            value={text}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setText(e.target.value)}
                            onScroll={handleScroll}
                            onKeyDown={handleKeyDown}
                            style={{ fontSize: `${fontSize}px`, lineHeight: 1.5 }}
                            className="absolute inset-0 px-4 py-4 pb-12 font-mono bg-transparent text-transparent caret-white resize-none outline-none z-10 placeholder:text-neutral-500 whitespace-pre overflow-auto"
                            placeholder="Start typing your note here in Floxt format..."
                            spellCheck="false" 
                        />
                    </div>
                </div>
            ) : (
                <div 
                    onClick={handleReadViewClick} 
                    style={{ fontSize: `${fontSize}px`, lineHeight: 1.6 }}
                    className="flex-1 w-full p-4 pb-12 text-gray-200 font-sans overflow-y-auto whitespace-pre-wrap outline-none pr-2"
                    dangerouslySetInnerHTML={{ __html: parseFloxt(text) }}
                />
            )}

            <div className="flex-none absolute bottom-0 left-0 right-0 bg-neutral-900/95 backdrop-blur-sm border-t border-neutral-700/50 px-4 py-1.5 flex justify-end items-center text-xs text-neutral-400 font-mono select-none z-20">
                <span>{wordsCount} words</span>
                <span className="mx-2 text-neutral-600">•</span>
                <span>{charsCount} characters</span>
            </div>
        </div>
    );
}