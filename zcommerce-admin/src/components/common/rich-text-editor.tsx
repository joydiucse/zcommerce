import { useEffect } from "react";
import type { IconType } from "react-icons";
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  TbArrowBackUp,
  TbArrowForwardUp,
  TbBlockquote,
  TbBold,
  TbCode,
  TbH2,
  TbH3,
  TbItalic,
  TbLink,
  TbList,
  TbListNumbers,
  TbSeparatorHorizontal,
  TbStrikethrough,
  TbUnderline,
} from "react-icons/tb";
import { cn } from "@/lib/utils";

interface Props {
  value: string | null | undefined;
  onChange: (html: string) => void;
  className?: string;
  minHeight?: number;
}

function ToolbarButton({
  icon: Icon,
  label,
  active,
  disabled,
  onClick,
}: {
  icon: IconType;
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "text-muted-foreground hover:bg-accent hover:text-foreground inline-flex size-8 items-center justify-center rounded-md transition-colors disabled:opacity-40",
        active && "bg-accent text-foreground",
      )}
    >
      <Icon className="size-4" />
    </button>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  const s = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      underline: e.isActive("underline"),
      strike: e.isActive("strike"),
      h2: e.isActive("heading", { level: 2 }),
      h3: e.isActive("heading", { level: 3 }),
      bullet: e.isActive("bulletList"),
      ordered: e.isActive("orderedList"),
      quote: e.isActive("blockquote"),
      code: e.isActive("codeBlock"),
      link: e.isActive("link"),
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
    }),
  });

  const setLink = () => {
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL", prev ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const c = () => editor.chain().focus();

  return (
    <div className="bg-muted/40 flex flex-wrap items-center gap-0.5 border-b p-1">
      <ToolbarButton icon={TbBold} label="Bold" active={s.bold} onClick={() => c().toggleBold().run()} />
      <ToolbarButton icon={TbItalic} label="Italic" active={s.italic} onClick={() => c().toggleItalic().run()} />
      <ToolbarButton icon={TbUnderline} label="Underline" active={s.underline} onClick={() => c().toggleUnderline().run()} />
      <ToolbarButton icon={TbStrikethrough} label="Strikethrough" active={s.strike} onClick={() => c().toggleStrike().run()} />
      <span className="bg-border mx-1 h-5 w-px" />
      <ToolbarButton icon={TbH2} label="Heading 2" active={s.h2} onClick={() => c().toggleHeading({ level: 2 }).run()} />
      <ToolbarButton icon={TbH3} label="Heading 3" active={s.h3} onClick={() => c().toggleHeading({ level: 3 }).run()} />
      <ToolbarButton icon={TbList} label="Bullet list" active={s.bullet} onClick={() => c().toggleBulletList().run()} />
      <ToolbarButton icon={TbListNumbers} label="Numbered list" active={s.ordered} onClick={() => c().toggleOrderedList().run()} />
      <ToolbarButton icon={TbBlockquote} label="Quote" active={s.quote} onClick={() => c().toggleBlockquote().run()} />
      <ToolbarButton icon={TbCode} label="Code block" active={s.code} onClick={() => c().toggleCodeBlock().run()} />
      <ToolbarButton icon={TbSeparatorHorizontal} label="Divider" onClick={() => c().setHorizontalRule().run()} />
      <ToolbarButton icon={TbLink} label="Link" active={s.link} onClick={setLink} />
      <span className="bg-border mx-1 h-5 w-px" />
      <ToolbarButton icon={TbArrowBackUp} label="Undo" disabled={!s.canUndo} onClick={() => c().undo().run()} />
      <ToolbarButton icon={TbArrowForwardUp} label="Redo" disabled={!s.canRedo} onClick={() => c().redo().run()} />
    </div>
  );
}

export function RichTextEditor({ value, onChange, className, minHeight = 220 }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        link: { openOnClick: false, autolink: true },
      }),
    ],
    content: value || "",
    onUpdate: ({ editor: e }) => {
      const html = e.getHTML();
      onChange(html === "<p></p>" ? "" : html);
    },
  });

  // Sync external value changes (e.g. form reset after data load).
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    const current = editor.getHTML();
    const next = value || "";
    if (next !== current && !(next === "" && current === "<p></p>")) {
      editor.commands.setContent(next, { emitUpdate: false });
    }
  }, [value, editor]);

  return (
    <div
      className={cn(
        "prose-editor border-input focus-within:border-ring focus-within:ring-ring/50 dark:bg-input/30 overflow-hidden rounded-md border text-sm shadow-xs focus-within:ring-[3px]",
        className,
      )}
    >
      {editor && <Toolbar editor={editor} />}
      <div style={{ minHeight }}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
