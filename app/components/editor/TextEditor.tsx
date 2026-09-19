"use client";

import React, { useRef, useState, useLayoutEffect, useEffect } from "react";
import { open } from '@tauri-apps/plugin-shell';
import { highlightFloxt, parseFloxt } from "../../utils/floxtParser";

// Props interface for the core editor component
interface TextEditorProps {
    text: string;
    setText: React.Dispatch<React.SetStateAction<string>>;
    viewMode: 'code' | 'read' | 'split';
    setViewMode: React.Dispatch<React.SetStateAction<'code' | 'read' | 'split'>>;
    fontSize: number;
    showLineNumbers: boolean;
    lineWrap: boolean;
}

export default function TextEditor({ text, setText, viewMode, setViewMode, fontSize, showLineNumbers, lineWrap }: TextEditorProps) {
    // DOM element references for synchronization, scrolling, and measurement
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const preRef = useRef<HTMLDivElement>(null);
    const lineNumbersRef = useRef<HTMLDivElement>(null);
    const measureContainerRef = useRef<HTMLDivElement>(null);

    // Dynamic line heights for wrapped line number alignment
    const [lineHeights, setLineHeights] = useState<number[]>([]);
    const [editorWidth, setEditorWidth] = useState<number>(0);

    const rawLines = (text || "").split('\n');
    const lineHeightPx = fontSize * 1.5;

    // Track editor width so the offscreen measurement clone exactly matches textarea wrapping width
    useEffect(() => {
        if (!textareaRef.current) return;
        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                setEditorWidth(entry.contentRect.width);
            }
        });
        observer.observe(textareaRef.current);
        return () => observer.disconnect();
    }, [viewMode]);

    // Measure the exact rendered height of every wrapped line when content, font size, or width changes
    useLayoutEffect(() => {
        if (!lineWrap) {
            setLineHeights([]);
            return;
        }

        if (measureContainerRef.current) {
            const children = Array.from(measureContainerRef.current.children) as HTMLElement[];
            const heights = children.map((el) => el.getBoundingClientRect().height || lineHeightPx);
            setLineHeights(heights);
        }
    }, [text, fontSize, lineWrap, editorWidth, lineHeightPx]);

    // Handle keydown events: indentation, automatic tag completion, list generation, and caret navigation
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        const target = e.target as HTMLTextAreaElement;
        const start = target.selectionStart;
        const end = target.selectionEnd;

        // Insert 4 spaces on Tab key press instead of blurring the textarea
        if (e.key === 'Tab') {
            e.preventDefault();
            const newText = text.substring(0, start) + "    " + text.substring(end);
            setText(newText);
            setTimeout(() => {
                if (textareaRef.current) {
                    textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 4;
                }
            }, 0);
            return;
        }

        // Auto-close Floxt markup tags upon typing ';' delimiter
        if (e.key === ';') {
            const textBefore = text.substring(0, start);
            const match = textBefore.match(/\/([a-zA-Z0-9-]+)$/);

            if (match) {
                const tag = match[1].toLowerCase();
                const standardTags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'b', 'i', 'u', 's', 'h', '-', '0', 'o', 'code', 'table'];
                const complexTags = ['link', 'img'];

                // Standard closing tag insertion
                if (standardTags.includes(tag)) {
                    e.preventDefault();
                    const newText = text.substring(0, start) + ";;/" + text.substring(end);
                    setText(newText);
                    setTimeout(() => {
                        if (textareaRef.current) textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 1;
                    }, 0);
                    return;
                    // Complex tag scaffold generation for links and images
                } else if (complexTags.includes(tag)) {
                    e.preventDefault();
                    const newText = text.substring(0, start) + ";url;description;/" + text.substring(end);
                    setText(newText);
                    setTimeout(() => {
                        if (textareaRef.current) {
                            textareaRef.current.selectionStart = start + 1;
                            textareaRef.current.selectionEnd = start + 4;
                        }
                    }, 0);
                    return;
                }
            }
        }

        // Automatically continue list prefixes when pressing Enter inside a list container
        if (e.key === 'Enter') {
            const textBefore = text.substring(0, start);
            const matches = [...textBefore.matchAll(/(\/([a-z0-9-]+);|;\/)/gi)];
            const stack: string[] = [];

            // Parse opening/closing tag stack to determine enclosing markup context
            for (const m of matches) {
                if (m[0] === ';/') {
                    stack.pop();
                } else if (m[2]) {
                    stack.push(m[2].toLowerCase());
                }
            }

            const activeTag = stack.length > 0 ? stack[stack.length - 1] : null;

            if (activeTag === '-' || activeTag === '0' || activeTag === 'o') {
                e.preventDefault();
                const newText = text.substring(0, start) + "\n- " + text.substring(end);
                setText(newText);
                setTimeout(() => {
                    if (textareaRef.current) textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 3;
                }, 0);
                return;
            }
        }

        // Quick skip and parameter selection using arrow keys
        if (e.key === 'ArrowRight') {
            if (start === end) {
                if (text.substring(start, start + 2) === ';/') {
                    e.preventDefault();
                    target.selectionStart = target.selectionEnd = start + 2;
                    return;
                }
                if (text.substring(start, start + 5) === ';url;') {
                    e.preventDefault();
                    target.selectionStart = start + 1;
                    target.selectionEnd = start + 4;
                    return;
                }
                if (text.substring(start, start + 14) === ';description;/') {
                    e.preventDefault();
                    target.selectionStart = start + 1;
                    target.selectionEnd = start + 12;
                    return;
                }
            }
        }

        if (e.key === 'ArrowLeft') {
            if (start === end) {
                if (text.substring(start - 5, start) === ';url;') {
                    e.preventDefault();
                    target.selectionStart = start - 4;
                    target.selectionEnd = start - 1;
                    return;
                }
                if (text.substring(start - 13, start) === ';description;' && text.substring(start, start + 1) === '/') {
                    e.preventDefault();
                    target.selectionStart = start - 12;
                    target.selectionEnd = start - 1;
                    return;
                }
            }
        }

        // Smart Backspace to remove matched closing delimiters when deleting tag markers
        if (e.key === 'Backspace' && start === end) {
            const textBefore = text.substring(0, start);
            const textAfter = text.substring(end);

            const match = textBefore.match(/\/([a-zA-Z0-9-]+);$/);

            if (match) {
                const tag = match[1].toLowerCase();
                const standardTags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'b', 'i', 'u', 's', 'h', '-', '0', 'o', 'code', 'table'];
                const complexTags = ['link', 'img'];

                if (standardTags.includes(tag) && textAfter.startsWith(';/')) {
                    e.preventDefault();
                    const newText = textBefore.slice(0, -1) + textAfter.substring(2);
                    setText(newText);
                    setTimeout(() => {
                        if (textareaRef.current) textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start - 1;
                    }, 0);
                    return;
                } else if (complexTags.includes(tag) && textAfter.startsWith('url;description;/')) {
                    e.preventDefault();
                    const newText = textBefore.slice(0, -1) + textAfter.substring(17);
                    setText(newText);
                    setTimeout(() => {
                        if (textareaRef.current) textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start - 1;
                    }, 0);
                    return;
                }
            }
        }
    };

    // Synchronize scrolling between invisible textarea, syntax overlay pre, and line numbers column
    const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
        if (preRef.current) {
            preRef.current.scrollTop = e.currentTarget.scrollTop;
            preRef.current.scrollLeft = e.currentTarget.scrollLeft;
        }
        if (lineNumbersRef.current) {
            lineNumbersRef.current.scrollTop = e.currentTarget.scrollTop;
        }
    };

    // Interactive event delegator for rendered HTML inside read/split view
    const handleReadViewClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const target = e.target as HTMLElement;

        // Code block copy buttons
        const copyBtn = target.closest('.floxt-copy-btn') as HTMLButtonElement;
        if (copyBtn) {
            e.preventDefault();
            e.stopPropagation();

            const codeToCopy = copyBtn.getAttribute('data-code');
            if (codeToCopy) {
                navigator.clipboard.writeText(decodeURIComponent(codeToCopy)).then(() => {
                    const originalText = copyBtn.innerText;
                    copyBtn.innerText = "Copied!";
                    copyBtn.classList.add("text-emerald-400");

                    setTimeout(() => {
                        copyBtn.innerText = originalText;
                        copyBtn.classList.remove("text-emerald-400");
                    }, 2000);
                });
            }
            return;
        }

        // External link handling via Tauri shell plugin or browser window
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

        // Toggle interactive checkboxes directly within rendered HTML
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

        // Ctrl/Cmd + Click: Jump directly from rendered element to raw source in editor
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

    // Calculate document statistics
    const safeText = text || "";
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

            {/* Offscreen Measurement Clone: Measures exact wrapped heights using identical container width & styles */}
            {lineWrap && editorWidth > 0 && (
                <div
                    ref={measureContainerRef}
                    aria-hidden="true"
                    style={{
                        width: `${editorWidth}px`,
                        fontSize: `${fontSize}px`,
                        lineHeight: 1.5,
                    }}
                    className="absolute -left-[99999px] top-0 px-4 py-4 font-mono pointer-events-none opacity-0 select-none z-[-1]"
                >
                    {rawLines.map((line, idx) => (
                        <div key={idx} className="whitespace-pre-wrap break-words">
                            {line.length > 0 ? line : '\u00A0'}
                        </div>
                    ))}
                </div>
            )}

            <div className="flex flex-1 w-full overflow-hidden">
                {(viewMode === 'code' || viewMode === 'split') && (
                    <div className={`flex flex-1 overflow-hidden relative ${viewMode === 'split' ? 'border-r border-neutral-300 dark:border-neutral-700' : ''}`}>

                        {/* Line Numbers Column */}
                        {showLineNumbers && (
                            <div
                                ref={lineNumbersRef}
                                style={{ fontSize: `${fontSize}px`, lineHeight: 1.5 }}
                                className="w-12 flex-none bg-neutral-50 dark:bg-neutral-900/50 border-r border-neutral-300 dark:border-neutral-800 text-neutral-400 dark:text-neutral-500 font-mono text-right pr-3 py-4 overflow-hidden select-none pb-4 transition-colors duration-200"
                            >
                                {rawLines.map((_, i) => (
                                    <div
                                        key={i}
                                        style={{
                                            height: lineWrap && lineHeights[i] ? `${lineHeights[i]}px` : `${lineHeightPx}px`,
                                            lineHeight: `${lineHeightPx}px`,
                                        }}
                                        className="flex items-start justify-end"
                                    >
                                        {i + 1}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Editor Container with Syntax Overlay */}
                        <div className="relative flex-1 overflow-hidden bg-transparent">
                            {/* Syntax-highlighted text preview layer */}
                            <div
                                ref={preRef}
                                style={{ fontSize: `${fontSize}px`, lineHeight: 1.5 }}
                                className={`absolute inset-0 px-4 py-4 pb-4 font-mono text-neutral-900 dark:text-gray-200 pointer-events-none overflow-hidden ${lineWrap ? 'whitespace-pre-wrap break-words' : 'whitespace-pre'
                                    }`}
                                aria-hidden="true"
                            >
                                {highlightFloxt(text)}
                                {safeText.endsWith('\n') ? <br /> : null}
                            </div>

                            {/* Transparent editable textarea capturing keystrokes directly above highlighting */}
                            <textarea
                                ref={textareaRef}
                                value={text}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setText(e.target.value)}
                                onScroll={handleScroll}
                                onKeyDown={handleKeyDown}
                                style={{ fontSize: `${fontSize}px`, lineHeight: 1.5 }}
                                className={`absolute inset-0 px-4 py-4 pb-4 font-mono bg-transparent text-transparent caret-black dark:caret-white resize-none outline-none z-10 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 ${lineWrap ? 'whitespace-pre-wrap break-words overflow-y-auto overflow-x-hidden' : 'whitespace-pre overflow-auto'
                                    }`}
                                placeholder="Start typing your note here in Floxt format..."
                                spellCheck="false"
                            />
                        </div>
                    </div>
                )}

                {/* Rendered HTML preview pane */}
                {(viewMode === 'read' || viewMode === 'split') && (
                    <div
                        onClick={handleReadViewClick}
                        style={{ fontSize: `${fontSize}px`, lineHeight: 1.6 }}
                        className={`flex-1 p-4 pb-4 text-neutral-900 dark:text-gray-200 font-sans overflow-auto whitespace-pre-wrap outline-none pr-2 transition-colors duration-200 ${viewMode === 'split' ? 'bg-neutral-50/30 dark:bg-neutral-900/30' : ''}`}
                        dangerouslySetInnerHTML={{ __html: parseFloxt(text) }}
                    />
                )}
            </div>

            {/* Document Statistics Footer Bar */}
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