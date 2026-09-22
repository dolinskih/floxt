// --- 1. DOM UTILS ---

import { invoke } from "@tauri-apps/api/core";

// Creates a blob from text content and triggers an automatic browser download.
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
// Generates syntax-highlighted JSX spans for the raw text editor based on Floxt syntax.
export const highlightFloxt = (rawText: string) => {
    if (!rawText) return null;

    // Fast tokenizer pattern without expensive regex lookbehinds
    const parts = rawText.split(/(\/(?:h[1-6]|h|b|i|u|s|-|0|O|code|link|table|img|\[\]|\[x\]);|;\/)/gi);

    return parts.map((part, i) => {
        // Plain text is returned directly as a raw string to avoid allocating DOM nodes
        if (i % 2 === 0) {
            return part;
        }

        // Handles closing tags
        if (part === ';/') {
            return (
                <span key={i} className="text-neutral-400 dark:text-neutral-500 font-bold">
                    ;/
                </span>
            );
        }

        // Handles opening and self-closing tags
        const tagMatch = part.match(/^\/(.*);$/i);
        if (tagMatch) {
            const tagName = tagMatch[1];
            const lowerTag = tagName.toLowerCase();

            let colorClass = "text-emerald-600 dark:text-emerald-400";

            if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'b', 'i', 'u', 's', 'h'].includes(lowerTag)) {
                colorClass = "text-yellow-600 dark:text-yellow-500";
            } else if (['-', '0', 'o'].includes(lowerTag)) {
                colorClass = "text-blue-600 dark:text-blue-400";
            } else if (lowerTag === '[]' || lowerTag === '[x]') {
                colorClass = "text-red-600 dark:text-red-500";
            }

            return (
                <span key={i} className={`font-bold ${colorClass}`}>
                    {part}
                </span>
            );
        }

        return part;
    });
};

// Converts raw Floxt text into formatted HTML for the reader view.
export const parseFloxt = (rawText: string) => {
    // Sanitizes basic HTML entities to prevent unescaped rendering.
    let parsed = rawText
        .replace(/&/g, '__FLXT_AMP__')
        .replace(/</g, '__FLXT_LT__')
        .replace(/>/g, '__FLXT_GT__');
    let previous;

    do {
        previous = parsed;
        // Replaces standard Floxt markup with Tailwind-styled HTML elements.
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

        // Processes complex tags (links and images) separately due to attribute requirements.
        parsed = parsed.replace(/\/link;([^;]+);((?:(?!\/(?:h1|h2|h3|h4|h5|h6|b|i|u|s|-|0|O|code|table|link|img|h);)[\s\S])*?);\//g, (match, url, placeholder) => {
            return `<a href="${url}" class="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 underline underline-offset-4 decoration-blue-600/50 dark:decoration-blue-400/50 transition-colors cursor-pointer">${placeholder}</a>`;
        });

        parsed = parsed.replace(/\/img;([^;]+);((?:(?!\/(?:h1|h2|h3|h4|h5|h6|b|i|u|s|-|0|O|code|table|link|img|h);)[\s\S])*?);\//g, (match, url, altText) => {
            return `<div class="resize-x overflow-hidden inline-block my-4 rounded-lg border border-neutral-300 dark:border-neutral-700 shadow-sm dark:shadow-md bg-neutral-100 dark:bg-neutral-800" style="max-width: 75%; max-height: 50vh; min-width: 150px; width: 50%; line-height: 0; font-size: 0;"><img src="${url}" alt="${altText}" class="w-full h-auto pointer-events-none" style="max-height: 50vh; object-fit: contain;" loading="lazy" /></div>`;
        });

    } while (parsed !== previous);

    // Converts interactive checklists.
    let cbIndex = 0;
    parsed = parsed.replace(/\/\[(x)?\];/gi, (match, checkedState) => {
        const isChecked = !!checkedState;
        const html = `<input type="checkbox" ${isChecked ? 'checked' : ''} data-cb-index="${cbIndex}" class="floxt-checkbox mr-2 w-4 h-4 inline-block align-middle accent-neutral-500 cursor-pointer" />`;
        cbIndex++;
        return html;
    });

    // Restores safely escaped standard characters.
    parsed = parsed
        .replace(/__FLXT_AMP__/g, '&amp;')
        .replace(/__FLXT_LT__/g, '&lt;')
        .replace(/__FLXT_GT__/g, '&gt;');

    return parsed;
};

// --- 3. IMPORT / EXPORT PARSERS ---
// Replaces standard Markdown formatting with custom Floxt tags during imports.
export const convertMarkdownToFloxt = async (md: string): Promise<string> => {
    const converted = await invoke<string>("convert_markdown_to_floxt", { md: md });
    return converted;
};

// Iteratively strips custom Floxt markup tags to generate standard Markdown outputs.
export const convertFloxtToMarkdown = async (text: string): Promise<string> => {
    const converted = await invoke<string>("convert_floxt_to_markdown", { text: text });
    return converted;
};

// Generates a fully contained HTML document string suitable for file export or PDF printing.
export const generateHTML = async (text: string, fileName: string): Promise<string> => {
    const generated = await invoke<string>("generate_html", { text: text, fileName: fileName });
    return generated;
};