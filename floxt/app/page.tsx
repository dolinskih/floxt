import styles from './page.module.css';
import PanelLayout from './panel/layout';
import TextEditorLayout from './texteditor/layout';

export default function Home() {
  return (
    <main className="flex w-full min-h-screen p-4 gap-6 bg-neutral-950">
      <PanelLayout />
      <div
        className="flex-1"
      >
        <TextEditorLayout />
      </div>
    </main>
  );
}
