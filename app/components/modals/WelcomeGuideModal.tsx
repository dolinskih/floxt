"use client";

import { useState, useEffect } from "react";
import {
    Plus,
    Save,
    SquareArrowOutUpRight,
    Library,
    Upload,
    Download,
    Terminal,
    Cog,
    ChevronUp,
    X,
} from "lucide-react";

// Props definition for the WelcomeGuideModal walkthrough
interface WelcomeGuideModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function WelcomeGuideModal({
    isOpen,
    onClose,
}: WelcomeGuideModalProps) {
    // Current step index in the onboarding wizard
    const [step, setStep] = useState<number>(0);

    // Reset walkthrough back to the welcome screen whenever the modal is opened
    useEffect(() => {
        if (isOpen) {
            setStep(0);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    // Total steps in the flow (Step 0: Welcome screen + 5 feature highlights)
    const totalSteps = 6;

    // Advance to the next walkthrough step or complete and close the modal
    const handleNext = () => {
        if (step < totalSteps - 1) {
            setStep((prev) => prev + 1);
        } else {
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
            {/* Modal card container */}
            <div className="relative w-full max-w-3xl min-h-[480px] bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col justify-between">
                {step === 0 ? (
                    /* Step 0: Initial Welcome & Branding Screen */
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                        <div className="w-24 h-24 mb-6 flex items-center justify-center">
                            <img
                                src="/floxt_icon_1024x1024.png"
                                alt="Floxt Logo"
                                className="w-full h-full object-contain select-none pointer-events-none drop-shadow-md"
                            />
                        </div>

                        <h1 className="text-3xl font-bold font-sans text-neutral-900 dark:text-white tracking-tight mb-2">
                            Welcome to Floxt
                        </h1>
                        <p className="text-neutral-500 dark:text-neutral-400 font-sans text-base max-w-sm mb-8">
                            Fast and capable note-taking app
                        </p>

                        <div className="flex flex-col items-center gap-3 w-full max-w-xs">
                            <button
                                onClick={handleNext}
                                className="w-full py-2.5 px-6 rounded-xl font-medium text-white bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 transition-colors shadow-sm cursor-pointer"
                            >
                                Let&apos;s start
                            </button>
                            <button
                                onClick={onClose}
                                className="text-xs text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors cursor-pointer py-1"
                            >
                                Skip guide
                            </button>
                        </div>
                    </div>
                ) : (
                    /* Steps 1 - 5: Interactive Split-View Feature Guide */
                    <div className="flex-1 flex flex-col md:flex-row h-full">
                        {/* Left Content Column: Feature title, description, and navigation */}
                        <div className="flex-1 p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-neutral-200 dark:border-neutral-800">
                            <div>
                                {/* Step indicator badge */}
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 font-medium">
                                        Step {step} of {totalSteps - 1}
                                    </span>
                                </div>

                                {/* Step 1 description: Side panel overview */}
                                {step === 1 && (
                                    <div>
                                        <h2 className="text-2xl font-bold font-sans text-neutral-900 dark:text-white mb-3">
                                            Side panel
                                        </h2>
                                        <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed">
                                            All main options in one place. Here you can create a new
                                            note, open existing notes, open a project, and more.
                                        </p>
                                    </div>
                                )}

                                {/* Step 2 description: Syntax formatting commands */}
                                {step === 2 && (
                                    <div>
                                        <h2 className="text-2xl font-bold font-sans text-neutral-900 dark:text-white mb-3">
                                            Commands
                                        </h2>
                                        <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed">
                                            Floxt uses an original way of formatting text that is
                                            straightforward and simple. You can view all available
                                            commands in the Commands tab in the side panel.
                                        </p>
                                    </div>
                                )}

                                {/* Step 3 description: Multi-document project workflows and tabs */}
                                {step === 3 && (
                                    <div>
                                        <h2 className="text-2xl font-bold font-sans text-neutral-900 dark:text-white mb-3">
                                            Projects and tabs
                                        </h2>
                                        <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed">
                                            You can edit multiple notes at a time using the Projects
                                            tab inside the side panel. Choose a folder from which you
                                            can choose and edit any note. Use tabs to switch between
                                            opened documents.
                                        </p>
                                    </div>
                                )}

                                {/* Step 4 description: File conversion and export support */}
                                {step === 4 && (
                                    <div>
                                        <h2 className="text-2xl font-bold font-sans text-neutral-900 dark:text-white mb-3">
                                            Import and export
                                        </h2>
                                        <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed">
                                            Seamlessly work with notes in Markdown, HTML, and PDF
                                            formats.
                                        </p>
                                    </div>
                                )}

                                {/* Step 5 description: Preferences, themes, and customization */}
                                {step === 5 && (
                                    <div>
                                        <h2 className="text-2xl font-bold font-sans text-neutral-900 dark:text-white mb-3">
                                            Personalization
                                        </h2>
                                        <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed">
                                            You can pick a desired font size, choose whether to use
                                            line numbering, line wrapping, auto-saving, and much more
                                            in the Settings tab in the side panel.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Wizard navigation controls */}
                            <div className="flex items-center gap-4 mt-8 pt-4">
                                <button
                                    onClick={handleNext}
                                    className="py-2 px-5 rounded-lg font-medium text-sm text-white bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 transition-colors shadow-sm cursor-pointer"
                                >
                                    {step === totalSteps - 1 ? "Finish" : "Next"}
                                </button>
                                {step < totalSteps - 1 && (
                                    <button
                                        onClick={onClose}
                                        className="text-xs text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors cursor-pointer"
                                    >
                                        Skip guide
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Right Interactive Mockup Column: Visual representation for each respective step */}
                        <div className="flex-1 bg-neutral-50 dark:bg-neutral-950 p-6 flex items-center justify-center select-none pointer-events-none">
                            {/* Step 1 Visual: Side panel navigation mockup */}
                            {step === 1 && (
                                <div className="w-[210px] p-3 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl shadow-md flex flex-col gap-2">
                                    <div className="flex items-center gap-3 px-2 py-1 text-xs font-medium text-neutral-800 dark:text-neutral-200">
                                        <Plus size={18} /> New note
                                    </div>
                                    <div className="flex items-center gap-3 px-2 py-1 text-xs font-medium text-neutral-800 dark:text-neutral-200">
                                        <Save size={18} /> Save note
                                    </div>
                                    <div className="flex items-center gap-3 px-2 py-1 text-xs font-medium text-neutral-800 dark:text-neutral-200">
                                        <SquareArrowOutUpRight size={18} /> Open note
                                    </div>
                                    <div className="flex items-center gap-3 px-2 py-1 text-xs font-medium text-neutral-800 dark:text-neutral-200">
                                        <Library size={18} /> Open project
                                    </div>
                                    <div className="flex items-center gap-3 px-2 py-1 text-xs font-medium text-neutral-800 dark:text-neutral-200">
                                        <Upload size={18} /> Import
                                    </div>
                                    <div className="flex items-center gap-3 px-2 py-1 text-xs font-medium text-neutral-800 dark:text-neutral-200">
                                        <Download size={18} /> Export
                                    </div>
                                    <div className="flex items-center gap-3 px-2 py-1 text-xs font-medium text-neutral-800 dark:text-neutral-200">
                                        <Terminal size={18} /> Commands
                                    </div>
                                    <div className="flex items-center gap-3 px-2 py-1 text-xs font-medium text-neutral-800 dark:text-neutral-200">
                                        <Cog size={18} /> Settings
                                    </div>
                                    <div className="flex justify-center pt-1 border-t border-neutral-200 dark:border-neutral-800 text-neutral-400">
                                        <ChevronUp size={18} />
                                    </div>
                                </div>
                            )}

                            {/* Step 2 Visual: Markup command list preview mockup */}
                            {step === 2 && (
                                <div className="w-[290px] bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl shadow-md overflow-hidden flex flex-col">
                                    <div className="flex items-center justify-between p-3 border-b border-neutral-200 dark:border-neutral-800">
                                        <span className="font-bold text-xs text-neutral-900 dark:text-white font-mono">
                                            Commands
                                        </span>
                                        <X size={14} className="text-neutral-400" />
                                    </div>
                                    <div className="p-3 flex flex-col gap-2 font-mono text-[11px]">
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-neutral-800 dark:text-neutral-200">
                                                H1
                                            </span>
                                            <code className="px-1 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-yellow-600 dark:text-yellow-500">
                                                /h1;
                                            </code>
                                            <code className="px-1 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-yellow-600 dark:text-yellow-500">
                                                ;/
                                            </code>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-neutral-800 dark:text-neutral-200">
                                                Bold
                                            </span>
                                            <code className="px-1 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-yellow-600 dark:text-yellow-500">
                                                /b;
                                            </code>
                                            <code className="px-1 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-yellow-600 dark:text-yellow-500">
                                                ;/
                                            </code>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-neutral-800 dark:text-neutral-200">
                                                Code
                                            </span>
                                            <code className="px-1 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-emerald-600 dark:text-emerald-400">
                                                /code;
                                            </code>
                                            <code className="px-1 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-400">
                                                ;/
                                            </code>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Step 3 Visual: Active tabs & project file explorer mockup */}
                            {step === 3 && (
                                <div className="w-[300px] flex flex-col gap-3">
                                    {/* Document tabs */}
                                    <div className="flex gap-1.5 pb-1">
                                        <div className="flex items-center gap-1.5 px-2.5 py-1 border border-neutral-400 dark:border-neutral-500 bg-white dark:bg-neutral-900 rounded-md text-[11px] font-medium shadow-sm text-neutral-900 dark:text-white">
                                            <span>Design plan</span>
                                            <span className="text-[9px] text-neutral-400">✕</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 px-2.5 py-1 border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 rounded-md text-[11px] text-neutral-500">
                                            <span>First draft</span>
                                            <span className="text-[9px] text-neutral-400">✕</span>
                                        </div>
                                    </div>

                                    {/* Folder directory listing */}
                                    <div className="p-3 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl shadow-md flex flex-col gap-2">
                                        <span className="font-bold text-xs text-neutral-800 dark:text-white border-b border-neutral-200 dark:border-neutral-800 pb-1.5 truncate">
                                            My Project
                                        </span>
                                        <div className="flex items-center justify-between text-xs py-1">
                                            <span className="truncate text-neutral-700 dark:text-neutral-300 font-medium">
                                                Design plan
                                            </span>
                                            <div className="flex gap-1">
                                                <span className="px-1.5 py-0.5 border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 rounded text-[9px] font-bold text-neutral-600 dark:text-neutral-300">
                                                    Open
                                                </span>
                                                <span className="px-1.5 py-0.5 border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 rounded text-[9px] font-bold text-neutral-600 dark:text-neutral-300">
                                                    Save
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between text-xs py-1">
                                            <span className="truncate text-neutral-700 dark:text-neutral-300 font-medium">
                                                First draft
                                            </span>
                                            <div className="flex gap-1">
                                                <span className="px-1.5 py-0.5 border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 rounded text-[9px] font-bold text-neutral-600 dark:text-neutral-300">
                                                    Open
                                                </span>
                                                <span className="px-1.5 py-0.5 border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 rounded text-[9px] font-bold text-neutral-600 dark:text-neutral-300">
                                                    Save
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Step 4 Visual: Export formats dialog preview */}
                            {step === 4 && (
                                <div className="w-[280px] bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl shadow-md p-4 flex flex-col gap-2.5">
                                    <div className="flex items-center justify-between pb-2 border-b border-neutral-200 dark:border-neutral-800">
                                        <span className="font-bold text-xs text-neutral-800 dark:text-white">
                                            Export Note
                                        </span>
                                        <X size={14} className="text-neutral-400" />
                                    </div>
                                    <div className="flex items-center gap-2.5 p-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800">
                                        <Download size={16} className="text-neutral-500" />
                                        <span className="text-xs font-medium text-neutral-800 dark:text-neutral-200">
                                            Markdown (.md)
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2.5 p-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800">
                                        <Download size={16} className="text-neutral-500" />
                                        <span className="text-xs font-medium text-neutral-800 dark:text-neutral-200">
                                            Web Page (.html)
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2.5 p-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800">
                                        <Download size={16} className="text-neutral-500" />
                                        <span className="text-xs font-medium text-neutral-800 dark:text-neutral-200">
                                            PDF Document (.pdf)
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Step 5 Visual: Configuration toggles preview */}
                            {step === 5 && (
                                <div className="w-[280px] bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl shadow-md p-4 flex flex-col gap-3">
                                    <div className="flex items-center justify-between pb-1 border-b border-neutral-200 dark:border-neutral-800">
                                        <span className="font-bold text-xs text-neutral-800 dark:text-white">
                                            Settings
                                        </span>
                                        <X size={14} className="text-neutral-400" />
                                    </div>
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-neutral-700 dark:text-neutral-300">
                                            Editor Font Size
                                        </span>
                                        <span className="px-2 py-0.5 rounded border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 font-mono text-yellow-600 dark:text-yellow-500">
                                            14
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-neutral-700 dark:text-neutral-300">
                                            Show Line Numbers
                                        </span>
                                        <div className="w-8 h-4 rounded-full bg-emerald-500 flex items-center justify-end px-0.5">
                                            <div className="w-3 h-3 rounded-full bg-white" />
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-neutral-700 dark:text-neutral-300">
                                            Wrap Lines
                                        </span>
                                        <div className="w-8 h-4 rounded-full bg-emerald-500 flex items-center justify-end px-0.5">
                                            <div className="w-3 h-3 rounded-full bg-white" />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}