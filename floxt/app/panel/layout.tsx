import { Cascadia_Code } from "next/font/google";
import "./panel.css";
import styles from './panel.module.css';
import { Plus, FolderOpen, Terminal, Cog, ChevronUp } from 'lucide-react';

const cascadiaCode = Cascadia_Code({
    variable: "--font-cascadia-code",
    subsets: ["latin-ext"],
});

export default function PanelLayout() {
    return (
        <section className="p-3 pr-5 hover:shadow-lg dark:shadow-white/15">
            <button className={"flex items-center active:scale-95 active:opacity-75 hover:opacity-75 transition-opacity delay-100 ease-in-out cursor-pointer"}>
                <Plus color="white" size={28} className="mt-2 mb-2" />
                <p className="m-2 mr-5">New note</p>
            </button>
            <button className={"flex items-center active:scale-95 active:opacity-75 hover:opacity-75 transition-opacity delay-100 ease-in-out cursor-pointer"}>
                <FolderOpen color="white" size={28} className="mt-2 mb-2" />
                <p className="m-2 mr-5">Open file</p>
            </button>
            <button className={"flex items-center active:scale-95 active:opacity-75 hover:opacity-75 transition-opacity delay-100 ease-in-out cursor-pointer"}>
                <Terminal color="white" size={28} className="mt-2 mb-2" />
                <p className="m-2 mr-5">Commands</p>
            </button>
            <button className={"flex items-center active:scale-95 active:opacity-75 hover:opacity-75 transition-opacity delay-100 ease-in-out cursor-pointer"}>
                <Cog color="white" size={28} className="mt-2 mb-2" />
                <p className="m-2 mr-5">Settings</p>
            </button>
            <button className={"flex items-center active:scale-95 active:opacity-75 hover:opacity-75 mt-5 transition-opacity delay-100 ease-in-out cursor-pointer"}>
                <ChevronUp color="white" size={28} className="mt-2 mb-2" />
            </button>
        </section>
    )
}