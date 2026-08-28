import React from 'react';

// --- 1. DOM UTILS ---
export const triggerDownload = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

// --- 2. TEXT EDITOR PARSERS ---
export const highlightFloxt = (rawText: string) => {
    const parts = rawText.split(/(\/(?:h[1-6]|h|b|i|u|s|-|0|O|code|link|table|img|\[\]|\[x\]);|;\/|(?<=\/(?:link|img);[^;]*);)/gi);

    let openTagsCount = 0;
    let complexTagState = 0;

    return parts.map((part, i) => {
        if (i % 2 !== 0) {
            if (part === ';/') {
                complexTagState = 0;
                if (openTagsCount > 0) {
                    openTagsCount--;
                    return <span key={i} className="text-neutral-400 dark:text-neutral-500 font-bold">;/</span>;
                } else {
                    return <span key={i}>{part}</span>;
                }
            }

            if (part === ';') {
                if (complexTagState === 1) complexTagState = 2;
                return <span key={i} className="text-neutral-400 dark:text-neutral-500 font-bold">;</span>;
            }

            const tagMatch = part.match(/^\/(.*);$/i);
            if (tagMatch) {
                const tagName = tagMatch[1];
                const lowerTag = tagName.toLowerCase();

                let colorClass = "text-emerald-600 dark:text-emerald-400";
                let isSelfClosing = false;

                if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'b', 'i', 'u', 's', 'h'].includes(lowerTag)) {
                    colorClass = "text-yellow-600 dark:text-yellow-500";
                } else if (['-', '0', 'o'].includes(lowerTag)) {
                    colorClass = "text-blue-600 dark:text-blue-400";
                } else if (lowerTag === '[]' || lowerTag === '[x]') {
                    colorClass = "text-red-600 dark:text-red-500";
                    isSelfClosing = true;
                }

                if (!isSelfClosing) openTagsCount++;

                if (lowerTag === 'link' || lowerTag === 'img') {
                    complexTagState = 1;
                } else {
                    complexTagState = 0;
                }

                return (
                    <span key={i} className="font-bold">
                        <span className="text-neutral-400 dark:text-neutral-500">/</span>
                        <span className={colorClass}>{tagName}</span>
                        <span className="text-neutral-400 dark:text-neutral-500">;</span>
                    </span>
                );
            }
        } else {
            if (complexTagState === 1 && part === 'url') {
                return <span key={i} className="text-neutral-500 dark:text-neutral-600 italic select-all">{part}</span>;
            }
            if (complexTagState === 2 && part === 'description') {
                return <span key={i} className="text-neutral-500 dark:text-neutral-600 italic select-all">{part}</span>;
            }

            return <span key={i}>{part}</span>;
        }
    });
};

export const parseFloxt = (rawText: string) => {
    let parsed = rawText
        .replace(/&/g, '__FLXT_AMP__')
        .replace(/</g, '__FLXT_LT__')
        .replace(/>/g, '__FLXT_GT__');
    let previous;

    do {
        previous = parsed;
        parsed = parsed.replace(/\/(h1|h2|h3|h4|h5|h6|b|i|u|s|-|0|O|code|table|h);((?:(?!\/(?:h1|h2|h3|h4|h5|h6|b|i|u|s|-|0|O|code|table|link|img|h);)[\s\S])*?);\//g, (match, tag, content) => {
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
                case 'h': return `<mark class="bg-yellow-200 dark:bg-yellow-500/40 text-neutral-900 dark:text-neutral-100 px-1 rounded-sm">${content}</mark>`;

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
                    let cleanContent = content.replace(/^\s*\n/, '').replace(/\n\s*$/, '');

                    const rawCode = cleanContent
                        .replace(/__FLXT_LT__/g, '<')
                        .replace(/__FLXT_GT__/g, '>')
                        .replace(/__FLXT_AMP__/g, '&');

                    const dataCode = encodeURIComponent(rawCode);

                    return `<div class="relative group my-4 rounded-lg overflow-hidden border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-950"><button class="floxt-copy-btn absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 px-2 py-1 text-xs font-medium rounded-md bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 shadow-sm cursor-pointer whitespace-nowrap" data-code="${dataCode}">Copy</button><pre class="p-4 overflow-x-auto text-sm m-0"><code class="text-emerald-600 dark:text-emerald-400 font-mono bg-transparent border-none p-0">${cleanContent}</code></pre></div>`;
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

        parsed = parsed.replace(/\/link;([^;]+);((?:(?!\/(?:h1|h2|h3|h4|h5|h6|b|i|u|s|-|0|O|code|table|link|img|h);)[\s\S])*?);\//g, (match, url, placeholder) => {
            return `<a href="${url}" class="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 underline underline-offset-4 decoration-blue-600/50 dark:decoration-blue-400/50 transition-colors cursor-pointer">${placeholder}</a>`;
        });

        parsed = parsed.replace(/\/img;([^;]+);((?:(?!\/(?:h1|h2|h3|h4|h5|h6|b|i|u|s|-|0|O|code|table|link|img|h);)[\s\S])*?);\//g, (match, url, altText) => {
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

    parsed = parsed
        .replace(/__FLXT_AMP__/g, '&amp;')
        .replace(/__FLXT_LT__/g, '&lt;')
        .replace(/__FLXT_GT__/g, '&gt;');

    return parsed;
};

// --- 3. IMPORT / EXPORT PARSERS ---
export const convertMarkdownToFloxt = (md: string): string => {
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

    // Highlight
    floxt = floxt.replace(/==(.*?)==/g, '/h;$1;/');
    floxt = floxt.replace(/<mark>(.*?)<\/mark>/gi, '/h;$1;/');

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

export const convertFloxtToMarkdown = (text: string): string => {
    let md = text;
    let previous;

    do {
        previous = md;
        md = md.replace(/\/(h1|h2|h3|h4|h5|h6|b|i|u|s|-|0|O|code|table|h);((?:(?!\/(?:h1|h2|h3|h4|h5|h6|b|i|u|s|-|0|O|code|table|link|img|h);)[\s\S])*?);\//g, (match, tag, content) => {
            switch (tag) {
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
                case 'h': return `==${content}==`;
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

        md = md.replace(/\/link;([^;]+);((?:(?!\/(?:h1|h2|h3|h4|h5|h6|b|i|u|s|-|0|O|code|table|link|img);)[\s\S])*?);\//g, (match, url, placeholder) => `[${placeholder}](${url})`);
        md = md.replace(/\/img;([^;]+);((?:(?!\/(?:h1|h2|h3|h4|h5|h6|b|i|u|s|-|0|O|code|table|link|img);)[\s\S])*?);\//g, (match, url, altText) => `![${altText}](${url})`);

    } while (md !== previous);

    md = md.replace(/\/\[\];/g, '- [ ]');
    md = md.replace(/\/\[x\];/gi, '- [x]');

    return md;
};

export const generateHTML = (text: string, fileName: string): string => {
    let html = text
            .replace(/&/g, '__FLXT_AMP__')
            .replace(/</g, '__FLXT_LT__')
            .replace(/>/g, '__FLXT_GT__');
        let previous;

        do {
            previous = html;
            html = html.replace(/\/(h1|h2|h3|h4|h5|h6|b|i|u|s|-|0|O|code|table|h);((?:(?!\/(?:h1|h2|h3|h4|h5|h6|b|i|u|s|-|0|O|code|table|link|img|h);)[\s\S])*?);\//g, (match, tag, content) => {
                switch (tag) {
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
                    case 'h': return `<mark>${content}</mark>`;
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
                        const cleanContent = content.replace(/^\s*\n/, '').replace(/\n\s*$/, '');
                        return `<pre><code>${cleanContent}</code></pre>`;
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

            html = html.replace(/\/link;([^;]+);((?:(?!\/(?:h1|h2|h3|h4|h5|h6|b|i|u|s|-|0|O|code|table|link|img);)[\s\S])*?);\//g, (match, url, placeholder) => `<a href="${url}">${placeholder}</a>`);
            html = html.replace(/\/img;([^;]+);((?:(?!\/(?:h1|h2|h3|h4|h5|h6|b|i|u|s|-|0|O|code|table|link|img);)[\s\S])*?);\//g, (match, url, altText) => `<img src="${url}" alt="${altText}" style="max-width: 100%; height: auto; border-radius: 8px; margin: 16px 0;" loading="lazy" />`);

        } while (html !== previous);

        html = html.replace(/\/\[\];/g, '<input type="checkbox" disabled />');
        html = html.replace(/\/\[x\];/gi, '<input type="checkbox" checked disabled />');

        html = html
            .replace(/__FLXT_AMP__/g, '&amp;')
            .replace(/__FLXT_LT__/g, '&lt;')
            .replace(/__FLXT_GT__/g, '&gt;');

        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${fileName}</title>
    <style>
        body { font-family: sans-serif; line-height: 1.6; max-width: 800px; margin: 40px auto; padding: 0 20px; color: #171717; background-color: #fdfdfd; white-space: pre-wrap; transition: background-color 0.2s, color 0.2s; }
        pre { background: #f4f4f4; padding: 15px; border-radius: 5px; overflow-x: auto; white-space: pre; border: 1px solid #e5e5e5; }
        code { font-family: monospace; }
        a { color: #2563eb; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #e5e5e5; padding: 10px; text-align: left; }
        th { background-color: #f4f4f4; }
        
        @media (prefers-color-scheme: dark) {
            body { color: #e5e5e5; background-color: #0a0a0a; }
            pre { background: #171717; border-color: #262626; }
            a { color: #60a5fa; }
            th, td { border-color: #262626; }
            th { background-color: #171717; }
        }

        @media print {
            @page { margin: 0; } 
            body { background-color: white !important; color: black !important; margin: 0; padding: 0.5in; }
            pre { background: #f4f4f4 !important; border-color: #ccc !important; }
            a { color: #2563eb !important; text-decoration: none; }
            table { page-break-inside: auto; }
            tr { page-break-inside: avoid; page-break-after: auto; }
        }
    </style>
</head>
<body>
${html}
</body>
</html>`.trim();
};