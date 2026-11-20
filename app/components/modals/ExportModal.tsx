"use client"; // Flags the component to run exclusively on the client.

import { useState } from "react";
import Modal from "./Modal";
import { Download } from "lucide-react";
import { generateHTML, convertFloxtToMarkdown, triggerDownload } from "../../utils/floxtParser";
import { fileService } from "../../services/fileService";
import { useToast } from "../../contexts/ToastContext";

// Sets up the properties needed to access the raw text and proposed file title.
interface ExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    text: string;
    title: string;
}

export default function ExportModal({ isOpen, onClose, text, title }: ExportModalProps) {
    const { showToast } = useToast();
    const [isExporting, setIsExporting] = useState(false);

    // Ensures a valid fallback filename is used if the title is empty.
    const fileName = title.trim() === "" ? "Exported_Note" : title;

    const saveExportedFile = async (
        content: string,
        extension: string,
        filterName: string,
        mimeType: string
    ) => {
        const defaultFileName = `${fileName}.${extension}`;
        const isTauri = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

        if (isTauri) {
            const selectedPath = await fileService.exportFileDialog(
                defaultFileName,
                extension,
                filterName
            );

            // User cancelled the native save dialog
            if (!selectedPath) return;

            await fileService.writeExportedFile(selectedPath, content);
            const savedName = selectedPath.split(/[\\/]/).pop() || defaultFileName;
            onClose();
            showToast({
                type: "success",
                title: `Exported to ${filterName}`,
                message: savedName,
                detail: selectedPath,
            });
        } else {
            triggerDownload(content, defaultFileName, mimeType);
            onClose();
            showToast({
                type: "success",
                title: `Exported to ${filterName}`,
                message: defaultFileName,
            });
        }
    };

    // Handles generating a web document and saving/downloading it.
    const exportToHtml = async () => {
        if (isExporting) return;
        setIsExporting(true);
        try {
            const htmlContent = await generateHTML(text, fileName);
            await saveExportedFile(htmlContent, "html", "HTML", "text/html");
        } catch (error) {
            console.error("Failed to export HTML:", error);
            showToast({
                type: "error",
                title: "Failed to export HTML",
                message: error instanceof Error ? error.message : String(error),
            });
        } finally {
            setIsExporting(false);
        }
    };

    // Creates an invisible iframe to render the HTML document and triggers the browser's print-to-PDF dialog.
    const exportToPdf = async () => {
        if (isExporting) return;
        setIsExporting(true);
        try {
            const htmlContent = await generateHTML(text, fileName);
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            document.body.appendChild(iframe);

            const iframeDoc = iframe.contentWindow?.document || iframe.contentDocument;
            if (iframeDoc) {
                iframeDoc.open();
                iframeDoc.write(htmlContent);
                iframeDoc.close();
            }

            setTimeout(() => {
                iframe.contentWindow?.focus();
                iframe.contentWindow?.print();

                setTimeout(() => {
                    document.body.removeChild(iframe);
                    setIsExporting(false);
                    onClose();
                }, 100);
            }, 250);
        } catch (error) {
            console.error("Failed to export PDF:", error);
            setIsExporting(false);
            showToast({
                type: "error",
                title: "Failed to export PDF",
                message: error instanceof Error ? error.message : String(error),
            });
        }
    };

    // Handles parsing the note into standard markdown and saving/downloading it.
    const exportToMarkdown = async () => {
        if (isExporting) return;
        setIsExporting(true);
        try {
            const md = await convertFloxtToMarkdown(text);
            await saveExportedFile(md, "md", "Markdown", "text/markdown");
        } catch (error) {
            console.error("Failed to export Markdown:", error);
            showToast({
                type: "error",
                title: "Failed to export Markdown",
                message: error instanceof Error ? error.message : String(error),
            });
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Export Note">
            <div className="flex flex-col gap-4">
                <p className="text-neutral-600 dark:text-neutral-400 mb-2">Choose a format to export your file:</p>

                {/* Markdown Export Option */}
                <button
                    onClick={exportToMarkdown}
                    disabled={isExporting}
                    className="flex items-center gap-3 w-full p-3 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors group cursor-pointer"
                >
                    <div className="bg-white dark:bg-neutral-900 p-2 rounded text-neutral-500 dark:text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white border border-neutral-200 dark:border-transparent transition-colors">
                        <Download size={20} />
                    </div>
                    <div className="flex flex-col items-start">
                        <span className="text-neutral-900 dark:text-gray-200 font-bold text-base">Markdown (.md)</span>
                        <span className="text-neutral-500 dark:text-neutral-400 text-xs">Standard formatting for GitHub, Obsidian, etc.</span>
                    </div>
                </button>

                {/* HTML Export Option */}
                <button
                    onClick={exportToHtml}
                    disabled={isExporting}
                    className="flex items-center gap-3 w-full p-3 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors group cursor-pointer"
                >
                    <div className="bg-white dark:bg-neutral-900 p-2 rounded text-neutral-500 dark:text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white border border-neutral-200 dark:border-transparent transition-colors">
                        <Download size={20} />
                    </div>
                    <div className="flex flex-col items-start">
                        <span className="text-neutral-900 dark:text-gray-200 font-bold text-base">Web Page (.html)</span>
                        <span className="text-neutral-500 dark:text-neutral-400 text-xs">A styled, readable web document.</span>
                    </div>
                </button>

                {/* PDF Print Option */}
                <button
                    onClick={exportToPdf}
                    disabled={isExporting}
                    className="flex items-center gap-3 w-full p-3 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors group cursor-pointer"
                >
                    <div className="bg-white dark:bg-neutral-900 p-2 rounded text-neutral-500 dark:text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white border border-neutral-200 dark:border-transparent transition-colors">
                        <Download size={20} />
                    </div>
                    <div className="flex flex-col items-start">
                        <span className="text-neutral-900 dark:text-gray-200 font-bold text-base">PDF Document (.pdf)</span>
                        <span className="text-neutral-500 dark:text-neutral-400 text-xs">Print or save as a standard PDF file.</span>
                    </div>
                </button>
            </div>
        </Modal>
    );
}