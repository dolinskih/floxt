"use client";

import "./panel.css";
import { Plus, FolderOpen, Terminal, Cog, ChevronUp, ChevronDown } from 'lucide-react';
import { useState } from "react";

export default function PanelLayout() {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <section className={`p-3 h-fit hover:shadow-lg dark:shadow-white/15 transition-all duration-150 ease-in-out w-fit ${isOpen ? 'pr-5' : ''} border border-neutral-700`}>
            {isOpen && (
                <div
                    className={`overflow-hidden transition-all duration-150 ease-in-out flex flex-col ${isOpen ? 'max-h-[500px] max-w-[300px] opacity-100' : 'max-h-0 max-w-0 opacity-0'
                        }`}
                >
                    <button className={"flex items-center active:scale-95 active:opacity-75 hover:opacity-75 transition-opacity delay-100 ease-in-out cursor-pointer"}>
                        <Plus color="white" size={28} className="mt-2 mb-2" />
                        <p className="m-2 mr-5 whitespace-nowrap">New note</p>
                    </button>
                    <button className={"flex items-center active:scale-95 active:opacity-75 hover:opacity-75 transition-opacity delay-100 ease-in-out cursor-pointer"}>
                        <FolderOpen color="white" size={28} className="mt-2 mb-2" />
                        <p className="m-2 mr-5 whitespace-nowrap">Open file</p>
                    </button>
                    <button className={"flex items-center active:scale-95 active:opacity-75 hover:opacity-75 transition-opacity delay-100 ease-in-out cursor-pointer"}>
                        <Terminal color="white" size={28} className="mt-2 mb-2" />
                        <p className="m-2 mr-5 whitespace-nowrap">Commands</p>
                    </button>
                    <button className={"flex items-center active:scale-95 active:opacity-75 hover:opacity-75 transition-opacity delay-100 ease-in-out cursor-pointer"}>
                        <Cog color="white" size={28} className="mt-2 mb-2" />
                        <p className="m-2 mr-5 whitespace-nowrap">Settings</p>
                    </button>
                </div>
            )}

            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center active:scale-95 active:opacity-75 hover:opacity-75 transition-all duration-150 ease-in-out cursor-pointer ${isOpen ? 'mt-5' : ''}`}>
                {isOpen ? (
                    <ChevronUp color="white" size={28} className="mt-2 mb-2" />
                ) : (
                    <ChevronDown color="white" size={28} className="mt-2 mb-2" />
                )}
            </button>
        </section>
    )
}