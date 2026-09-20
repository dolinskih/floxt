"use client";

import React, { useRef, useState, useLayoutEffect, useEffect } from "react";
import { open } from '@tauri-apps/plugin-shell';
import { highlightFloxt, parseFloxt } from "../../utils/floxtParser";

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
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const preRef = useRef<HTMLDivElement>(null);
    const lineNumbersRef = useRef<HTMLDivElement>(null);
    const measureContainerRef = useRef<HTMLDivElement>(null);

    const [lineHeights, setLineHeights] = useState<number[]>([]);
    const [editorWidth, setEditorWidth] = useState<number>(0);

    const rawLines = (text || "").split('\n');
    // Using integer pixel values prevents Chromium subpixel rounding desync across scroll
    const exactLineHeight = Math.round(fontSize * 1.5);

    // Compute exact text area width by subtracting padding and scrollbar width
    useEffect(() => {
        if (!textareaRef.current) return;

        const updateWidth = () => {
            if (!textareaRef.current) return;
            const computed = window.getComputedStyle(textareaRef.current);
            const pl = parseFloat(computed.paddingLeft) || 0;
            const pr = parseFloat(computed.paddingRight) || 0;
            // clientWidth inherently excludes the vertical scrollbar width
            const textContentWidth = textareaRef.current.clientWidth - pl - pr;
            setEditorWidth(textContentWidth);
        };

        const observer = new ResizeObserver(updateWidth);
        observer.observe(textareaRef.current);
        updateWidth();

        return () => observer.disconnect();
    }, [viewMode, lineWrap]);

    // Measure the rendered height of each logical line when wrapping is enabled
    useLayoutEffect(() => {
        if (!lineWrap) {
            setLineHeights([]);
            return;
        }

        if (measureContainerRef.current) {
            const children = Array.from(measureContainerRef.current.children) as HTMLElement[];
            const heights = children.map((el) => {
                const h = el.getBoundingClientRect().height;
                return h > 0 ? h : exactLineHeight;
            });
            setLineHeights(heights);
        }
    }, [text, fontSize, lineWrap, editorWidth, exactLineHeight]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        const target = e.target as HTMLTextAreaElement;
        const start = target.selectionStart;
        const end = target.selectionEnd;

        // Insert 4 spaces on Tab key press instead of blurring the field
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

        // Automatically complete Floxt tags upon typing ';' delimiter
        if (e.key === ';') {
            const textBefore = text.substring(0, start);
            const match = textBefore.match(/\/([a-zA-Z0-9-]+)$/);

            if (match) {
                const tag = match[1].toLowerCase();
                const standardTags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'b', 'i', 'u', 's', 'h', '-', '0', 'o', 'code', 'table'];
                const complexTags = ['link', 'img'];

                if (standardTags.includes(tag)) {
                    e.preventDefault();
                    const newText = text.substring(0, start) + ";;/" + text.substring(end);
                    setText(newText);
                    setTimeout(() => {
                        if (textareaRef.current) textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 1;
                    }, 0);
                    return;
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

        // Automatically continue list items on Enter key press
        if (e.key === 'Enter') {
            const textBefore = text.substring(0, start);
            const matches = [...textBefore.matchAll(/(\/([a-z0-9-]+);|;\/)/gi)];
            const stack: string[] = [];

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

        // Caret navigation across autocomplete tag boundaries
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

        // Smart Backspace to remove matched closing delimiters
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

    // Synchronize scrolling between the transparent textarea, highlighting layer, and line numbers
    const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
        if (preRef.current) {
            preRef.current.scrollTop = e.currentTarget.scrollTop;
            preRef.current.scrollLeft = e.currentTarget.scrollLeft;
        }
        if (lineNumbersRef.current) {
            lineNumbersRef.current.scrollTop = e.currentTarget.scrollTop;
        }
    };

    const handleReadViewClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const target = e.target as HTMLElement;

        // Copy button in code snippets
        const copyBtn = target.closest('.floxt-copy-btn') as HTMLButtonElement;
        if (copyBtn) {
            e.preventDefault();
            e.stopPropagation();

            const codeToCopy = copyBtn.getAttribute('data-code');
            if (codeToCopy) {
                navigator.clipboard.writeText(decodeURIComponent(codeToCopy)).then(() => {
                    const originalText = copyBtn.innerText;
                    copyBtn.innerText = "Copied!";
                    copyBtn.classList.add("text-emerald-600", "dark:text-emerald-400");

                    setTimeout(() => {
                        copyBtn.innerText = originalText;
                        copyBtn.classList.remove("text-emerald-600", "dark:text-emerald-400");
                    }, 2000);
                });
            }
            return;
        }

        // External link handling via Tauri shell plugin or fallback browser tab
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

        // Toggle interactive checkboxes directly in rendered view
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

        // Ctrl/Cmd + click: navigate from rendered preview to exact source position in code view
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
                        const scrollY = Math.max(0, (linesBefore - 4) * exactLineHeight);
                        textareaRef.current.scrollTop = scrollY;
                        if (preRef.current) preRef.current.scrollTop = scrollY;
                        if (lineNumbersRef.current) lineNumbersRef.current.scrollTop = scrollY;
                    }
                }
            }, 50);
        }
    };

    const safeText = text || "";
    const linesCount = rawLines.length;
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

            {/* Offscreen measurement clone for wrapped line height calculations */}
            {lineWrap && editorWidth > 0 && (
                <div
                    ref={measureContainerRef}
                    aria-hidden="true"
                    style={{
                        width: `${editorWidth}px`,
                        fontSize: `${fontSize}px`,
                        lineHeight: `${exactLineHeight}px`,
                        fontFamily: "var(--font-cascadia-code), monospace",
                        fontVariantLigatures: "none",
                        WebkitTextSizeAdjust: "none",
                        tabSize: 4,
                        boxSizing: "content-box"
                    }}
                    className="absolute -left-[99999px] top-0 p-0 font-mono pointer-events-none opacity-0 select-none z-[-1]"
                >
                    {rawLines.map((line, idx) => (
                        <div key={idx} className="whitespace-pre-wrap break-words m-0 p-0">
                            {line.length > 0 ? line : '\u00A0'}
                        </div>
                    ))}
                </div>
            )}

            <div className="flex flex-1 w-full overflow-hidden">
                {(viewMode === 'code' || viewMode === 'split') && (
                    <div className={`flex flex-1 overflow-hidden ${viewMode === 'split' ? 'border-r border-neutral-300 dark:border-neutral-700' : ''}`}>

                        {/* Line numbers column */}
                        {showLineNumbers && (
                            <div
                                ref={lineNumbersRef}
                                style={{ fontSize: `${fontSize}px`, lineHeight: `${exactLineHeight}px` }}
                                className="w-12 flex-none bg-neutral-50 dark:bg-neutral-900/50 border-r border-neutral-300 dark:border-neutral-800 text-neutral-400 dark:text-neutral-500 font-mono text-right pr-3 pt-4 pb-12 overflow-hidden select-none transition-colors duration-200"
                            >
                                {lineWrap ? (
                                    rawLines.map((_, i) => (
                                        <div
                                            key={i}
                                            style={{
                                                height: lineHeights[i] ? `${lineHeights[i]}px` : `${exactLineHeight}px`,
                                                lineHeight: `${exactLineHeight}px`,
                                            }}
                                            className="flex items-start justify-end"
                                        >
                                            {i + 1}
                                        </div>
                                    ))
                                ) : (
                                    Array.from({ length: linesCount }).map((_, i) => (
                                        <div key={i} style={{ height: `${exactLineHeight}px`, lineHeight: `${exactLineHeight}px` }}>
                                            {i + 1}
                                        </div>
                                    ))
                                )}
                                {/* Spacer ensures the line numbers container scroll bounds match the editor text */}
                                <div className="h-6 w-full pointer-events-none select-none" aria-hidden="true" />
                            </div>
                        )}

                        {/* Text editor surface */}
                        <div className="relative flex-1 overflow-hidden bg-transparent">
                            {/* Syntax highlighting layer */}
                            <div
                                ref={preRef}
                                style={{
                                    fontSize: `${fontSize}px`,
                                    lineHeight: `${exactLineHeight}px`,
                                    fontFamily: "var(--font-cascadia-code), monospace",
                                    fontVariantLigatures: "none",
                                    WebkitTextSizeAdjust: "none",
                                    tabSize: 4
                                }}
                                className={`absolute inset-0 px-4 pt-4 pb-12 font-mono text-neutral-900 dark:text-gray-200 pointer-events-none overflow-hidden ${lineWrap ? 'whitespace-pre-wrap break-words' : 'whitespace-pre'
                                    }`}
                                aria-hidden="true"
                            >
                                {highlightFloxt(text)}
                                {safeText.endsWith('\n') ? <br /> : null}
                                {/* Buffer element matching the textarea horizontal scrollbar clearance */}
                                <div className="h-6 w-full pointer-events-none select-none" aria-hidden="true" />
                            </div>

                            {/* Transparent interactive textarea */}
                            <textarea
                                key={lineWrap ? "wrap-on" : "wrap-off"}
                                ref={textareaRef}
                                value={text}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setText(e.target.value)}
                                onScroll={handleScroll}
                                onKeyDown={handleKeyDown}
                                wrap={lineWrap ? "soft" : "off"}
                                style={{
                                    fontSize: `${fontSize}px`,
                                    lineHeight: `${exactLineHeight}px`,
                                    fontFamily: "var(--font-cascadia-code), monospace",
                                    fontVariantLigatures: "none",
                                    WebkitTextSizeAdjust: "none",
                                    tabSize: 4
                                }}
                                className={`absolute inset-0 px-4 pt-4 pb-12 font-mono bg-transparent text-transparent caret-black dark:caret-white resize-none outline-none z-10 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 ${lineWrap
                                        ? 'whitespace-pre-wrap break-words overflow-y-auto overflow-x-hidden'
                                        : 'whitespace-pre overflow-auto'
                                    }`}
                                placeholder="Start typing your note here in Floxt format..."
                                spellCheck="false"
                            />
                        </div>
                    </div>
                )}

                {/* Rendered HTML preview */}
                {(viewMode === 'read' || viewMode === 'split') && (
                    <div
                        onClick={handleReadViewClick}
                        style={{ fontSize: `${fontSize}px`, lineHeight: 1.6 }}
                        className={`flex-1 p-4 pb-4 text-neutral-900 dark:text-gray-200 font-sans overflow-auto whitespace-pre-wrap outline-none pr-2 transition-colors duration-200 ${viewMode === 'split' ? 'bg-neutral-50/30 dark:bg-neutral-900/30' : ''}`}
                        dangerouslySetInnerHTML={{ __html: parseFloxt(text) }}
                    />
                )}
            </div>

            {/* Document stats footer */}
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