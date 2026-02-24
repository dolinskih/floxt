"use client";

import { useState } from "react";
import PanelLayout from "./PanelLayout";
import TextEditor from "./TextEditor";
import NoteTitle from "./NoteTitle";

export default function Home() {
  const [text, setText] = useState<string>("");
  const [title, setTitle] = useState<string>("");

  const [savedText, setSavedText] = useState<string>("");
  const [savedTitle, setSavedTitle] = useState<string>("");

  const [isFileTracked, setIsFileTracked] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'code' | 'read'>('code');

  const [fontSize, setFontSize] = useState<number>(14);
  const [showLineNumbers, setShowLineNumbers] = useState<boolean>(true);

  const hasUnsavedChanges = text !== savedText || title !== savedTitle;

  return (
    <main className="flex w-full min-h-screen p-4 gap-6 bg-neutral-950">
      <PanelLayout
        text={text}
        setText={setText}
        title={title}
        setTitle={setTitle}
        setSavedText={setSavedText}
        setSavedTitle={setSavedTitle}
        hasUnsavedChanges={hasUnsavedChanges}
        isFileTracked={isFileTracked}
        setIsFileTracked={setIsFileTracked}
        viewMode={viewMode}
        setViewMode={setViewMode}
        fontSize={fontSize}
        setFontSize={setFontSize}
        showLineNumbers={showLineNumbers}
        setShowLineNumbers={setShowLineNumbers}
      />
      <div className="flex-1 flex flex-col">
        <NoteTitle title={title} setTitle={setTitle} />
        <TextEditor
          text={text}
          setText={setText}
          viewMode={viewMode}
          fontSize={fontSize}
          showLineNumbers={showLineNumbers}
        />
      </div>
    </main>
  );
}