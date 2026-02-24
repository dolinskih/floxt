"use client";

import React from "react";
import Modal from "./Modal";
import { Download } from "lucide-react";

interface ExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    text: string;
    title: string;
}

export default function ExportModal({ isOpen, onClose, text, title }: ExportModalProps) {
    const fileName = title.trim() === "" ? "Exported_Note" : title;

    // --- FLOXT TO MARKDOWN PARSER ---
    const exportToMarkdown = () => {
        let md = text;
        let previous;

        do {
            previous = md;
            md = md.replace(/\/(h1|h2|h3|h4|h5|h6|b|i|u|s|-|0|O|code|table);([\s\S]*?);\//g, (match, tag, content) => {
                switch(tag) {
                    case 'h1': return `# ${content}`;
                    case 'h2': return `## ${content}`;
                    case 'h3': return `### ${content}`;
                    case 'h4': return `#### ${content}`;
                    case 'h5': return `##### ${content}`;
                    case 'h6': return `###### ${content}`;
                    case 'b': return `**${content}**`;
                    case 'i': return `*${content}*`;
                    case 'u': return `<u>${content}</u>`; 
                    case 's': return `~~${content}~~`;
                    case '-': {
                        const cleanContent = content.trim();
                        return cleanContent.replace(/^\s*-\s*(.*)(?:\r?\n|$)/gm, '- $1\n') + '\n';
                    }
                    case '0': 
                    case 'O': {
                        let i = 1;
                        const cleanContent = content.trim();
                        return cleanContent.replace(/^\s*-\s*(.*)(?:\r?\n|$)/gm, () => `${i++}. $1\n`) + '\n';
                    }
                    case 'code': return `\`\`\`\n${content}\n\`\`\``;
                    
                    case 'table': {
                        const lines = content.trim().split(/\r?\n/);
                        if (lines.length === 0) return '';
                        
                        const headers = lines[0].split('|').map((c: string) => c.trim());
                        const headerRow = `| ${headers.join(' | ')} |`;
                        const separatorRow = `| ${headers.map(() => '---').join(' | ')} |`;
                        
                        let bodyRows = '';
                        if (lines.length > 1) {
                            bodyRows = '\n' + lines.slice(1).map((line: string) => {
                                return `| ${line.split('|').map((c: string) => c.trim()).join(' | ')} |`;
                            }).join('\n');
                        }
                        
                        return `\n${headerRow}\n${separatorRow}${bodyRows}\n`;
                    }

                    default: return content;
                }
            });

            md = md.replace(/\/link;([^;]+);([\s\S]*?);\//g, (match, url, placeholder) => `[${placeholder}](${url})`);
            md = md.replace(/\/img;([^;]+);([\s\S]*?);\//g, (match, url, altText) => `![${altText}](${url})`);
            
        } while (md !== previous);

        md = md.replace(/\/\[\];/g, '- [ ]');
        md = md.replace(/\/\[x\];/gi, '- [x]');

        triggerDownload(md, `${fileName}.md`, "text/markdown");
    };

    // --- FLOXT TO HTML PARSER ---
    const exportToHtml = () => {
        let html = text;
        let previous;

        do {
            previous = html;
            html = html.replace(/\/(h1|h2|h3|h4|h5|h6|b|i|u|s|-|0|O|code|table);([\s\S]*?);\//g, (match, tag, content) => {
                switch(tag) {
                    case 'h1': return `<h1>${content}</h1>`;
                    case 'h2': return `<h2>${content}</h2>`;
                    case 'h3': return `<h3>${content}</h3>`;
                    case 'h4': return `<h4>${content}</h4>`;
                    case 'h5': return `<h5>${content}</h5>`;
                    case 'h6': return `<h6>${content}</h6>`;
                    case 'b': return `<strong>${content}</strong>`;
                    case 'i': return `<em>${content}</em>`;
                    case 'u': return `<u>${content}</u>`;
                    case 's': return `<del>${content}</del>`;
                    case '-': {
                        const listItems = content.trim().replace(/^\s*-\s*(.*)(?:\r?\n|$)/gm, '<li>$1</li>');
                        return `<ul>\n${listItems}\n</ul>`;
                    }
                    case '0': 
                    case 'O': {
                        const listItems = content.trim().replace(/^\s*-\s*(.*)(?:\r?\n|$)/gm, '<li>$1</li>');
                        return `<ol>\n${listItems}\n</ol>`;
                    }
                    case 'code': {
                        const safeCode = content.replace(/</g, '&lt;').replace(/>/g, '&gt;');
                        return `<pre><code>${safeCode}</code></pre>`;
                    }
                    
                    case 'table': {
                        const lines = content.trim().split(/\r?\n/);
                        if (lines.length === 0) return '';
                        
                        const headers = lines[0].split('|').map((cell: string) => `<th>${cell.trim()}</th>`).join('');
                        const thead = `<thead><tr>${headers}</tr></thead>`;
                        
                        let tbody = '';
                        if (lines.length > 1) {
                            const rows = lines.slice(1).map((line: string) => {
                                const cells = line.split('|').map((cell: string) => `<td>${cell.trim()}</td>`).join('');
                                return `<tr>${cells}</tr>`;
                            }).join('');
                            tbody = `<tbody>${rows}</tbody>`;
                        }
                        return `<table>${thead}${tbody}</table>`;
                    }

                    default: return content;
                }
            });

            html = html.replace(/\/link;([^;]+);([\s\S]*?);\//g, (match, url, placeholder) => `<a href="${url}">${placeholder}</a>`);
            html = html.replace(/\/img;([^;]+);([\s\S]*?);\//g, (match, url, altText) => `<img src="${url}" alt="${altText}" style="max-width: 100%; height: auto; border-radius: 8px; margin: 16px 0;" loading="lazy" />`);
            
        } while (html !== previous);

        html = html.replace(/\/\[\];/g, '<input type="checkbox" disabled />');
        html = html.replace(/\/\[x\];/gi, '<input type="checkbox" checked disabled />');

        const fullHtmlDocument = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${fileName}</title>
    <style>
        body { font-family: sans-serif; line-height: 1.6; max-width: 800px; margin: 40px auto; padding: 0 20px; color: #333; white-space: pre-wrap; }
        pre { background: #f4f4f4; padding: 15px; border-radius: 5px; overflow-x: auto; white-space: pre; }
        code { font-family: monospace; }
        a { color: #0066cc; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
        th { background-color: #f4f4f4; }
    </style>
</head>
<body>
${html}
</body>
</html>`;

        triggerDownload(fullHtmlDocument.trim(), `${fileName}.html`, "text/html");
    };

    const triggerDownload = (content: string, filename: string, mimeType: string) => {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        onClose(); 
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Export Note">
            <div className="flex flex-col gap-4">
                <p className="text-neutral-400 mb-2">Choose a format to export your file:</p>
                <button 
                    onClick={exportToMarkdown}
                    className="flex items-center gap-3 w-full p-3 rounded-lg border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 transition-colors group cursor-pointer"
                >
                    <div className="bg-neutral-900 p-2 rounded group-hover:text-white transition-colors">
                        <Download size={20} />
                    </div>
                    <div className="flex flex-col items-start">
                        <span className="text-gray-200 font-bold text-base">Markdown (.md)</span>
                        <span className="text-neutral-400 text-xs">Standard formatting for GitHub, Obsidian, etc.</span>
                    </div>
                </button>
                <button 
                    onClick={exportToHtml}
                    className="flex items-center gap-3 w-full p-3 rounded-lg border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 transition-colors group cursor-pointer"
                >
                    <div className="bg-neutral-900 p-2 rounded group-hover:text-white transition-colors">
                        <Download size={20} />
                    </div>
                    <div className="flex flex-col items-start">
                        <span className="text-gray-200 font-bold text-base">Web Page (.html)</span>
                        <span className="text-neutral-400 text-xs">A styled, readable web document.</span>
                    </div>
                </button>
            </div>
        </Modal>
    );
}