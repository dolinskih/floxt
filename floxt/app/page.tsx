"use client";

import { useState } from "react";
import PanelLayout from "./PanelLayout";
import NoteTitleLayout from "./NoteTitle";
import TextEditor from "./TextEditor";

export default function Home() {
  const [text, setText] = useState<string>("");
  const [title, setTitle] = useState<string>("");

  const [savedText, setSavedText] = useState<string>("");
  const [savedTitle, setSavedTitle] = useState<string>("");

  const [isFileTracked, setIsFileTracked] = useState<boolean>(false);

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
      />
      <div className="flex-1 flex flex-col">
        <NoteTitleLayout title={title} setTitle={setTitle} />
        <TextEditor text={text} setText={setText} />
      </div>
    </main>
  );
}