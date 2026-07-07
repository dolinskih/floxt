"use client";

import { useRef, useState } from 'react';
import Modal from './Modal';
import { FileUp } from 'lucide-react';

interface ImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (title: string, content: string) => void;
}

export default function ImportModal({ isOpen, onClose, onImport }: ImportModalProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const convertMarkdownToFloxt = (md: string): string => {
        let floxt = md;

        // 1. Multi-line blocks (Code)
        floxt = floxt.replace(/```([\s\S]*?)```/g, (match, p1) => {
            return `/code;\n${p1.trim()}\n;/`;
        });

        // 2. Inline styling
        floxt = floxt.replace(/\*\*(.*?)\*\*/g, '/b;$1;/');
        floxt = floxt.replace(/__(.*?)__/g, '/b;$1;/');

        // Italic: *text* or _text_
        floxt = floxt.replace(/\*(.*?)\*/g, '/i;$1;/');
        floxt = floxt.replace(/_(.*?)_/g, '/i;$1;/');

        // Strikethrough: ~~text~~
        floxt = floxt.replace(/~~(.*?)~~/g, '/s;$1;/');

        // 3. Media and Links
        // Images: ![alt](url) -> /img;url;alt;/
        floxt = floxt.replace(/!\[(.*?)\]\((.*?)\)/g, '/img;$2;$1;/');

        // Links: [text](url) -> /link;url;text;/
        floxt = floxt.replace(/\[(.*?)\]\((.*?)\)/g, '/link;$2;$1;/');

        // 4. Line-by-line block elements (Headings, Lists, Checkboxes)
        const lines = floxt.split('\n');
        const processedLines = lines.map(line => {
            // Headings (# through ######)
            const hMatch = line.match(/^(#{1,6})\s+(.*)$/);
            if (hMatch) {
                const level = hMatch[1].length;
                return `/h${level};${hMatch[2]};/`;
            }

            // Checkboxes (Unchecked: - [ ] text)
            const uncheckedMatch = line.match(/^[\*\-]\s+\[\s\]\s+(.*)$/);
            if (uncheckedMatch) return `/[];${uncheckedMatch[1]}`;

            // Checkboxes (Checked: - [x] text)
            const checkedMatch = line.match(/^[\*\-]\s+\[[xX]\]\s+(.*)$/);
            if (checkedMatch) return `/[x];${checkedMatch[1]}`;

            // Unordered Lists (- text or * text)
            const ulMatch = line.match(/^[\*\-]\s+(.*)$/);
            if (ulMatch) return `/-;${ulMatch[1]};/`;

            // Ordered Lists (1. text)
            const olMatch = line.match(/^\d+\.\s+(.*)$/);
            if (olMatch) return `/0;${olMatch[1]};/`;

            return line;
        });

        return processedLines.join('\n');
    };

    const processFile = (file: File) => {
        const validExtensions = ['.md', '.txt', '.floxt'];
        const isValid = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));

        if (!isValid) {
            alert("Please select a valid .md, .txt, or .floxt file.");
            return;
        }

        const fileNameWithoutExt = file.name.replace(/\.(md|txt|floxt)$/i, "");
        const isMarkdown = file.name.toLowerCase().endsWith('.md');

        const reader = new FileReader();
        reader.onload = (event: ProgressEvent<FileReader>) => {
            if (event.target?.result) {
                let content = event.target.result as string;

                if (isMarkdown) {
                    content = convertMarkdownToFloxt(content);
                }

                onImport(fileNameWithoutExt, content);
            }
        };
        reader.readAsText(file);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) processFile(file);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) processFile(file);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Import Note">
            <div className="flex flex-col gap-4 p-2">
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Select a file to import into a new note. Markdown files (.md) will be automatically converted to Floxt formatting.
                </p>

                <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${isDragging
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20'
                        : 'border-neutral-300 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                        }`}
                >
                    <FileUp size={48} className={`mb-4 ${isDragging ? 'text-emerald-500' : 'text-neutral-400 dark:text-neutral-500'}`} />
                    <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        {isDragging ? 'Drop file here' : 'Click or drag & drop a file'}
                    </span>
                    <span className="text-xs text-neutral-500 mt-1">.md, .txt, .floxt</span>
                </div>

                <input
                    type="file"
                    accept=".md,.txt,.floxt"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                />
            </div>
        </Modal>
    );
}