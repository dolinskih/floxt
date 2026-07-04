"use client";

import React, { useRef } from "react";
import { open } from '@tauri-apps/plugin-shell';

interface TextEditorProps {
    text: string;
    setText: React.Dispatch<React.SetStateAction<string>>;
    viewMode: 'code' | 'read' | 'split';
    setViewMode: React.Dispatch<React.SetStateAction<'code' | 'read' | 'split'>>;
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
        const parts = rawText.split(/(\/(?:h[1-6]|b|i|u|s|-|0|O|code|link|table|img|\[\]|\[x\]);|;\/|(?<=\/(?:link|img);[^;]*);)/gi);

        let openTagsCount = 0;

        return parts.map((part, i) => {
            if (i % 2 !== 0) {
                if (part === ';/') {
                    if (openTagsCount > 0) {
                        openTagsCount--;
                        return <span key={i} className="text-neutral-400 dark:text-neutral-500 font-bold">;/</span>;
                    } else {
                        return <span key={i}>{part}</span>;
                    }
                } 
                
                if (part === ';') {
                    return <span key={i} className="text-neutral-400 dark:text-neutral-500 font-bold">;</span>;
                }

                const tagMatch = part.match(/^\/(.*);$/i);
                if (tagMatch) {
                    const tagName = tagMatch[1];
                    const lowerTag = tagName.toLowerCase();
                    
                    let colorClass = "text-emerald-600 dark:text-emerald-400"; 
                    let isSelfClosing = false;

                    if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'b', 'i', 'u', 's'].includes(lowerTag)) {
                        colorClass = "text-yellow-600 dark:text-yellow-500";
                    } 
                    else if (['-', '0', 'o'].includes(lowerTag)) {
                        colorClass = "text-blue-600 dark:text-blue-400";
                    } 
                    else if (lowerTag === '[]' || lowerTag === '[x]') {
                        colorClass = "text-red-600 dark:text-red-500";
                        isSelfClosing = true;
                    }

                    if (!isSelfClosing) {
                        openTagsCount++; 
                    }

                    return (
                        <span key={i} className="font-bold">
                            <span className="text-neutral-400 dark:text-neutral-500">/</span>
                            <span className={colorClass}>{tagName}</span>
                            <span className="text-neutral-400 dark:text-neutral-500">;</span>
                        </span>
                    );
                }
            }
            return <span key={i}>{part}</span>;
        });
    };

    const handleReadViewClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const target = e.target as HTMLElement;

        const anchor = target.closest('a');
        if (anchor && anchor.href) {
            e.preventDefault();
            
            if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
                open(anchor.href).catch(err => console.error("Failed to open link in Tauri:", err));
            } else {
                window.open(anchor.href, '_blank');
            }
            return; 
        }

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

        if ((e.ctrlKey || e.metaKey) && (viewMode === 'read' || viewMode === 'split')) {
            e.preventDefault();
            if (target === e.currentTarget) return;

            const searchText = target.tagName === 'IMG' ? (target as HTMLImageElement).alt : target.textContent?.trim() || "";
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
            parsed = parsed.replace(/\/(h1|h2|h3|h4|h5|h6|b|i|u|s|-|0|O|code|table);((?:(?!\/(?:h1|h2|h3|h4|h5|h6|b|i|u|s|-|0|O|code|table|link|img);)[\s\S])*?);\//g, (match, tag, content) => {
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
                        const safeCode = content.replace(/</g, '&lt;').replace(/>/g, '&gt;');
                        return `<code class="bg-neutral-100 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-800 text-emerald-600 dark:text-emerald-400 font-mono px-2 py-1 rounded text-sm">${safeCode}</code>`;
                    }

                    case 'table': {
                        const lines = content.trim().split(/\r?\n/);
                        if (lines.length === 0) return '';

                        const headers = lines[0].split('|').map((cell: string) => `<th class="border border-neutral-300 dark:border-neutral-700 px-4 py-2 bg-neutral-100 dark:bg-neutral-800 text-left font-bold text-neutral-900 dark:text-white">${cell.trim()}</th>`).join('');
                        const thead = `<thead><tr>${headers}</tr></thead>`;

                        let tbody = '';
                        if (lines.length > 1) {
                            const rows = lines.slice(1).map((line: string) => {
                                const cells = line.split('|').map((cell: string) => `<td class="border border-neutral-300 dark:border-neutral-700 px-4 py-2">${cell.trim()}</td>`).join('');
                                return `<tr class="border-b border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors">${cells}</tr>`;
                            }).join('');
                            tbody = `<tbody>${rows}</tbody>`;
                        }

                        return `<div class="overflow-x-auto my-4 rounded border border-neutral-300 dark:border-neutral-700"><table class="w-full border-collapse text-sm text-neutral-900 dark:text-gray-200">${thead}${tbody}</table></div>`;
                    }

                    default: return content;
                }
            });

            parsed = parsed.replace(/\/link;([^;]+);((?:(?!\/(?:h1|h2|h3|h4|h5|h6|b|i|u|s|-|0|O|code|table|link|img);)[\s\S])*?);\//g, (match, url, placeholder) => {
                return `<a href="${url}" class="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 underline underline-offset-4 decoration-blue-600/50 dark:decoration-blue-400/50 transition-colors cursor-pointer">${placeholder}</a>`;
            });

            parsed = parsed.replace(/\/img;([^;]+);((?:(?!\/(?:h1|h2|h3|h4|h5|h6|b|i|u|s|-|0|O|code|table|link|img);)[\s\S])*?);\//g, (match, url, altText) => {
                return `<div class="resize-x overflow-hidden inline-block my-4 rounded-lg border border-neutral-300 dark:border-neutral-700 shadow-sm dark:shadow-md bg-neutral-100 dark:bg-neutral-800" style="max-width: 75%; max-height: 50vh; min-width: 150px; width: 50%; line-height: 0; font-size: 0;"><img src="${url}" alt="${altText}" class="w-full h-auto pointer-events-none" style="max-height: 50vh; object-fit: contain;" loading="lazy" /></div>`;
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

    let readTimeText = "0 min read";
    if (wordsCount > 0 && wordsCount < 200) {
        readTimeText = "< 1 min read";
    } else if (wordsCount >= 200) {
        readTimeText = `${Math.ceil(wordsCount / 200)} min read`;
    }

    return (
        <div className="w-full flex-1 min-h-[600px] bg-white dark:bg-neutral-900 rounded-lg border border-neutral-300 dark:border-neutral-700 shadow-sm dark:shadow-lg flex flex-col overflow-hidden relative transition-colors duration-200">
            <div className="flex flex-1 w-full overflow-hidden">
                {(viewMode === 'code' || viewMode === 'split') && (
                    <div className={`flex flex-1 overflow-hidden ${viewMode === 'split' ? 'border-r border-neutral-300 dark:border-neutral-700' : ''}`}>
                        {showLineNumbers && (
                            <div
                                ref={lineNumbersRef}
                                style={{ fontSize: `${fontSize}px`, lineHeight: 1.5 }}
                                className="w-12 flex-none bg-neutral-50 dark:bg-neutral-900/50 border-r border-neutral-300 dark:border-neutral-800 text-neutral-400 dark:text-neutral-500 font-mono text-right pr-3 py-4 overflow-hidden select-none pb-4 transition-colors duration-200"
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
                                className="absolute inset-0 px-4 py-4 pb-4 font-mono text-neutral-900 dark:text-gray-200 whitespace-pre pointer-events-none overflow-hidden"
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
                                className="absolute inset-0 px-4 py-4 pb-4 font-mono bg-transparent text-transparent caret-black dark:caret-white resize-none outline-none z-10 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 whitespace-pre overflow-auto"
                                placeholder="Start typing your note here in Floxt format..."
                                spellCheck="false"
                            />
                        </div>
                    </div>
                )}

                {(viewMode === 'read' || viewMode === 'split') && (
                    <div
                        onClick={handleReadViewClick}
                        style={{ fontSize: `${fontSize}px`, lineHeight: 1.6 }}
                        className={`flex-1 p-4 pb-4 text-neutral-900 dark:text-gray-200 font-sans overflow-auto whitespace-pre-wrap outline-none pr-2 transition-colors duration-200 ${viewMode === 'split' ? 'bg-neutral-50/30 dark:bg-neutral-900/30' : ''}`}
                        dangerouslySetInnerHTML={{ __html: parseFloxt(text) }}
                    />
                )}
            </div>

            <div className="flex-none bg-white/95 dark:bg-neutral-900/95 backdrop-blur-sm border-t border-neutral-300/50 dark:border-neutral-700/50 px-4 py-1.5 flex justify-end items-center text-xs text-neutral-500 dark:text-neutral-400 font-mono select-none z-20 transition-colors duration-200">
                <span>{wordsCount} words</span>
                <span className="mx-2 text-neutral-300 dark:text-neutral-600">•</span>
                <span>{charsCount} characters</span>
                <span className="mx-2 text-neutral-300 dark:text-neutral-600">•</span>
                <span>{readTimeText}</span>
            </div>
        </div>
    );
}