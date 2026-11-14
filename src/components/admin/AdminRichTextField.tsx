"use client";

import { Color } from "@tiptap/extension-color";
import Link from "@tiptap/extension-link";
import { TextStyle } from "@tiptap/extension-text-style";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useRef } from "react";
import { adminInput } from "@/components/admin/AdminFormStyles";

type Props = {
  name: string;
  label: string;
  defaultValue?: string;
  required?: boolean;
  minHeightClass?: string;
};

function ToolbarButton({
  active,
  onClick,
  children,
  title,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  title: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`rounded px-2 py-1 text-xs font-semibold transition ${
        active ? "bg-parish-700 text-white" : "bg-white text-parish-800 hover:bg-parish-100"
      }`}
    >
      {children}
    </button>
  );
}

const TEXT_COLOR_PRESETS: { label: string; value: string }[] = [
  { label: "Padrão", value: "" },
  { label: "Azul paróquia", value: "#35669f" },
  { label: "Azul escuro", value: "#264568" },
  { label: "Dourado", value: "#a8863f" },
  { label: "Vermelho", value: "#b91c1c" },
  { label: "Verde", value: "#15803d" },
];

export function AdminRichTextField({
  name,
  label,
  defaultValue = "",
  required,
  minHeightClass = "min-h-[140px]",
}: Props) {
  const hiddenRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      Color.configure({ types: ["textStyle"] }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-parish-700 underline" },
      }),
    ],
    content: defaultValue || "<p></p>",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: `prose-parish max-w-none px-3 py-2 text-sm text-parish-900 focus:outline-none ${minHeightClass}`,
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    const sync = () => {
      if (hiddenRef.current) hiddenRef.current.value = editor.getHTML();
    };
    sync();
    editor.on("update", sync);
    return () => {
      editor.off("update", sync);
    };
  }, [editor]);

  useEffect(() => {
    if (!editor) return;
    const html = defaultValue?.trim();
    if (!html) return;
    if (editor.getHTML() === html) return;
    editor.commands.setContent(html, { emitUpdate: false });
  }, [defaultValue, editor]);

  const setLink = () => {
    if (!editor) return;
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("URL do link", prev ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      <input
        ref={hiddenRef}
        type="hidden"
        name={name}
        required={required}
        defaultValue={defaultValue}
      />
      <p className="mb-2 text-xs text-parish-500">
        Formatação visual — negrito, listas, links e cor do texto. O site guarda o HTML formatado
        automaticamente.
      </p>
      {editor ? (
        <div className="overflow-hidden rounded-lg border border-parish-200 bg-white shadow-sm">
          <div className="flex flex-wrap gap-1 border-b border-parish-100 bg-parish-50 px-2 py-2">
            <ToolbarButton
              title="Negrito"
              active={editor.isActive("bold")}
              onClick={() => editor.chain().focus().toggleBold().run()}
            >
              B
            </ToolbarButton>
            <ToolbarButton
              title="Itálico"
              active={editor.isActive("italic")}
              onClick={() => editor.chain().focus().toggleItalic().run()}
            >
              I
            </ToolbarButton>
            <ToolbarButton
              title="Título"
              active={editor.isActive("heading", { level: 2 })}
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            >
              H2
            </ToolbarButton>
            <ToolbarButton
              title="Título menor"
              active={editor.isActive("heading", { level: 3 })}
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            >
              H3
            </ToolbarButton>
            <ToolbarButton
              title="Lista"
              active={editor.isActive("bulletList")}
              onClick={() => editor.chain().focus().toggleBulletList().run()}
            >
              • Lista
            </ToolbarButton>
            <ToolbarButton
              title="Lista numerada"
              active={editor.isActive("orderedList")}
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
            >
              1. Lista
            </ToolbarButton>
            <ToolbarButton title="Link" active={editor.isActive("link")} onClick={setLink}>
              Link
            </ToolbarButton>
            <span className="mx-1 hidden h-6 w-px bg-parish-200 sm:inline-block" aria-hidden />
            <label className="flex items-center gap-1.5 rounded bg-white px-2 py-1 text-xs font-semibold text-parish-800">
              <span className="sr-only">Cor do texto</span>
              <span title="Cor personalizada">A</span>
              <input
                type="color"
                className="h-6 w-8 cursor-pointer rounded border border-parish-200 bg-white p-0"
                defaultValue="#35669f"
                onChange={(e) => {
                  editor.chain().focus().setColor(e.target.value).run();
                }}
              />
            </label>
            <select
              className="max-w-[9.5rem] rounded border border-parish-200 bg-white px-2 py-1 text-xs font-semibold text-parish-800"
              title="Cores rápidas"
              defaultValue=""
              onChange={(e) => {
                const v = e.target.value;
                if (!v) editor.chain().focus().unsetColor().run();
                else editor.chain().focus().setColor(v).run();
                e.target.value = "";
              }}
            >
              <option value="">Cores rápidas…</option>
              {TEXT_COLOR_PRESETS.filter((p) => p.value).map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
            <ToolbarButton
              title="Remover cor"
              onClick={() => editor.chain().focus().unsetColor().run()}
            >
              Sem cor
            </ToolbarButton>
          </div>
          <EditorContent editor={editor} />
        </div>
      ) : (
        <textarea
          name={name}
          defaultValue={defaultValue}
          className={`${adminInput} ${minHeightClass}`}
          rows={6}
        />
      )}
    </div>
  );
}