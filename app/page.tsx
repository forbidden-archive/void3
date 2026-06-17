"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../lib/supabase";

type ViewMode = "timeline" | "gallery";
type BlockType = "text" | "image" | "drawing";

type Block = {
  id: string;
  type: BlockType;
  content: string;
};

type Entry = {
  id: string;
  date: string;
  title: string;
  tag: string;
  thumbnail?: string;
  blocks: Block[];
};

export default function Home() {
  const galleryRef = useRef<HTMLElement>(null);
  const currentX = useRef(0);
  const targetX = useRef(0);
  const rafRef = useRef<number | null>(null);

  const [entries, setEntries] = useState<Entry[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [view, setView] = useState<ViewMode>("timeline");

  const [form, setForm] = useState<Entry>({
    id: "",
    date: "",
    title: "",
    tag: "",
    thumbnail: "",
    blocks: []
  });

  const selected = entries.find((entry) => entry.id === selectedId);

  const sortedEntries = useMemo(() => {
    return [...entries].sort((a, b) => a.date.localeCompare(b.date));
  }, [entries]);

  useEffect(() => {
    loadEntries();
  }, []);

  useEffect(() => {
    if (selectedId || view !== "timeline") return;

    const animate = () => {
      targetX.current = window.scrollY;
      currentX.current += (targetX.current - currentX.current) * 0.08;

      if (galleryRef.current) {
        galleryRef.current.style.transform = `translateX(${-currentX.current}px)`;
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [selectedId, view]);

  const loadEntries = async () => {
    const { data, error } = await supabase
      .from("entries")
      .select("*")
      .order("date", { ascending: true });

    if (error) {
      console.error(error);
      alert("読み込みできませんでした");
      return;
    }

    setEntries((data || []) as Entry[]);
  };

  const uploadImageToSupabase = async (file: File) => {
    const ext = file.name.split(".").pop();
    const fileName = `${crypto.randomUUID()}.${ext}`;
    const filePath = `images/${fileName}`;

    const { error } = await supabase.storage
      .from("archive-images")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false
      });

    if (error) {
      console.error(error);
      alert("画像アップロードに失敗しました");
      return "";
    }

    const { data } = supabase.storage
      .from("archive-images")
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const uploadThumbnail = async (file?: File) => {
    if (!file) return;

    const imageUrl = await uploadImageToSupabase(file);
    if (!imageUrl) return;

    setForm((prev) => ({
      ...prev,
      thumbnail: imageUrl
    }));
  };

  const uploadBlockImage = async (file: File, blockId: string) => {
    const imageUrl = await uploadImageToSupabase(file);
    if (!imageUrl) return;

    setForm((prev) => ({
      ...prev,
      blocks: prev.blocks.map((block) =>
        block.id === blockId ? { ...block, content: imageUrl } : block
      )
    }));
  };

  const saveEntryToSupabase = async (entry: Entry) => {
    const { error } = await supabase.from("entries").upsert({
      id: entry.id,
      date: entry.date,
      title: entry.title,
      tag: entry.tag,
      thumbnail: entry.thumbnail,
      blocks: entry.blocks
    });

    if (error) {
      console.error(error);
      alert("保存できませんでした");
      return;
    }

    await loadEntries();
  };

  const addBlock = (type: BlockType) => {
    setForm((prev) => ({
      ...prev,
      blocks: [
        ...prev.blocks,
        {
          id: crypto.randomUUID(),
          type,
          content: ""
        }
      ]
    }));
  };

  const updateBlockText = (blockId: string, content: string) => {
    setForm((prev) => ({
      ...prev,
      blocks: prev.blocks.map((block) =>
        block.id === blockId ? { ...block, content } : block
      )
    }));
  };

  const removeBlock = (blockId: string) => {
    setForm((prev) => ({
      ...prev,
      blocks: prev.blocks.filter((block) => block.id !== blockId)
    }));
  };

  const moveBlock = (blockId: string, direction: "up" | "down") => {
    setForm((prev) => {
      const blocks = [...prev.blocks];
      const index = blocks.findIndex((block) => block.id === blockId);
      if (index === -1) return prev;

      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= blocks.length) return prev;

      const current = blocks[index];
      blocks[index] = blocks[targetIndex];
      blocks[targetIndex] = current;

      return {
        ...prev,
        blocks
      };
    });
  };

  const saveEntry = async () => {
    if (!form.title.trim()) return;

    const id = form.id || crypto.randomUUID();

    const entry: Entry = {
      ...form,
      id,
      date: form.date || new Date().toISOString().slice(0, 10)
    };

    await saveEntryToSupabase(entry);

    setSelectedId(id);
    setEditorOpen(false);
  };

  const deleteEntry = async () => {
    if (!selected) return;

    const { error } = await supabase
      .from("entries")
      .delete()
      .eq("id", selected.id);

    if (error) {
      console.error(error);
      alert("削除できませんでした");
      return;
    }

    await loadEntries();
    setSelectedId("");
    setEditorOpen(false);
  };

  const createNew = () => {
    setForm({
      id: "",
      date: new Date().toISOString().slice(0, 10),
      title: "",
      tag: "",
      thumbnail: "",
      blocks: []
    });

    setEditorOpen(true);
  };

  const editCurrent = () => {
    if (!selected) return;

    setForm({
      ...selected,
      blocks: [...selected.blocks]
    });

    setEditorOpen(true);
  };

  return (
    <main className={selected ? "page detailMode" : "page"}>
      <header className="top">
        {!selected ? (
          <div className="viewSwitch">
            <button
              className={view === "timeline" ? "active" : ""}
              onClick={() => setView("timeline")}
            >
              timeline
            </button>
            <button
              className={view === "gallery" ? "active" : ""}
              onClick={() => setView("gallery")}
            >
              gallery
            </button>
          </div>
        ) : (
          <button className="backTop" onClick={() => setSelectedId("")}>
            back
          </button>
        )}

        <div className="logo">void</div>

        {selected ? (
          <button onClick={editCurrent}>edit</button>
        ) : (
          <button onClick={createNew}>add</button>
        )}
      </header>

      {!selected && view === "timeline" && (
        <>
          <section className="gallery" ref={galleryRef}>
            {sortedEntries.map((entry) => (
              <article
                key={entry.id}
                className="timelineItem"
                onClick={() => setSelectedId(entry.id)}
              >
                <div className="card">
                  {entry.thumbnail ? (
                    <img src={entry.thumbnail} alt="" />
                  ) : (
                    <div className="placeholder" />
                  )}
                </div>
              </article>
            ))}
          </section>

          <div
            className="scrollSpace"
            style={{
              height: `${Math.max(sortedEntries.length * 900, 2200)}px`
            }}
          />
        </>
      )}

      {!selected && view === "gallery" && (
        <section className="gridGallery">
          {sortedEntries.map((entry) => (
            <article
              key={entry.id}
              className="gridCard"
              onClick={() => setSelectedId(entry.id)}
            >
              <div className="gridImage">
                {entry.thumbnail ? (
                  <img src={entry.thumbnail} alt="" />
                ) : (
                  <div className="placeholder" />
                )}
              </div>

              <div className="gridMeta">
                <p>{entry.title}</p>
                <span>{entry.date}</span>
              </div>
            </article>
          ))}
        </section>
      )}

      {selected && (
        <section className="detail">
          <div className="detailHero">
            {selected.thumbnail ? (
              <img src={selected.thumbnail} alt="" />
            ) : (
              <div className="placeholder" />
            )}
          </div>

          <div className="detailMeta">
            <p className="date">{selected.date}</p>
            <h1>{selected.title}</h1>
            <p className="tag">#{selected.tag}</p>
          </div>

          {selected.blocks.map((block) => {
            if (block.type === "text") {
              return (
                <p key={block.id} className="bodyText">
                  {block.content}
                </p>
              );
            }

            return (
              <img
                key={block.id}
                src={block.content}
                alt=""
                className={
                  block.type === "drawing"
                    ? "contentImage drawingImage"
                    : "contentImage"
                }
              />
            );
          })}
        </section>
      )}

      {editorOpen && (
        <section className="editor">
          <button onClick={() => setEditorOpen(false)}>close</button>

          <input
            type="date"
            value={form.date}
            onChange={(event) =>
              setForm({
                ...form,
                date: event.target.value
              })
            }
          />

          <input
            placeholder="title"
            value={form.title}
            onChange={(event) =>
              setForm({
                ...form,
                title: event.target.value
              })
            }
          />

          <input
            placeholder="tag"
            value={form.tag}
            onChange={(event) =>
              setForm({
                ...form,
                tag: event.target.value
              })
            }
          />

          <label>
            thumbnail
            <input
              type="file"
              accept="image/*"
              onChange={(event) => uploadThumbnail(event.target.files?.[0])}
            />
          </label>

          {form.thumbnail && (
            <img className="editorPreview" src={form.thumbnail} alt="" />
          )}

          <div className="blockButtons">
            <button onClick={() => addBlock("text")}>+ text</button>
            <button onClick={() => addBlock("image")}>+ image</button>
            <button onClick={() => addBlock("drawing")}>+ drawing</button>
          </div>

          {form.blocks.map((block, index) => (
            <div className="editorBlock" key={block.id}>
              <div className="blockHeader">
                <span>
                  {index + 1}. {block.type}
                </span>

                <div>
                  <button onClick={() => moveBlock(block.id, "up")}>↑</button>
                  <button onClick={() => moveBlock(block.id, "down")}>↓</button>
                </div>
              </div>

              {block.type === "text" ? (
                <textarea
                  value={block.content}
                  onChange={(event) =>
                    updateBlockText(block.id, event.target.value)
                  }
                />
              ) : (
                <>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) =>
                      event.target.files?.[0] &&
                      uploadBlockImage(event.target.files[0], block.id)
                    }
                  />

                  {block.content && (
                    <img className="editorPreview" src={block.content} alt="" />
                  )}
                </>
              )}

              <button
                className="removeBlock"
                onClick={() => removeBlock(block.id)}
              >
                remove
              </button>
            </div>
          ))}

          <button className="save" onClick={saveEntry}>
            save
          </button>

          {selected && (
            <button className="delete" onClick={deleteEntry}>
              delete
            </button>
          )}
        </section>
      )}
    </main>
  );
}
