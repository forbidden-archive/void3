"use client";

import { useEffect, useMemo, useRef, useState } from "react";

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

const STORAGE_KEY = "void-archive-v7";

const starterData: Entry[] = [
  {
    id: "1",
    date: "2026-06-05",
    title: "VOID",
    tag: "concept",
    thumbnail: "",
    blocks: [
      {
        id: "b1",
        type: "text",
        content: "社会に価値を与えたことで社会から切り離された存在。"
      }
    ]
  }
];

const getWeekKey = (dateString: string) => {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";

  const start = new Date(date.getFullYear(), 0, 1);
  const diff = date.getTime() - start.getTime();
  const oneWeek = 1000 * 60 * 60 * 24 * 7;
  const week = Math.ceil((diff + start.getDay() * 86400000) / oneWeek);

  return `${date.getFullYear()} / W${String(week).padStart(2, "0")}`;
};

export default function Home() {
  const galleryRef = useRef<HTMLElement>(null);
  const currentX = useRef(0);
  const targetX = useRef(0);
  const rafRef = useRef<number | null>(null);

  const [entries, setEntries] = useState<Entry[]>(starterData);
  const [selectedId, setSelectedId] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);

  const [form, setForm] = useState<Entry>({
    id: "",
    date: "",
    title: "",
    tag: "",
    thumbnail: "",
    blocks: []
  });

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setEntries(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    if (selectedId) return;

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
  }, [selectedId]);

  const sortedEntries = useMemo(() => {
    return [...entries].sort((a, b) => a.date.localeCompare(b.date));
  }, [entries]);

  const selected = entries.find((entry) => entry.id === selectedId);

  const saveEntries = (next: Entry[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setEntries(next);
  };

  const resizeImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();

      reader.onload = () => {
        const img = new Image();

        img.onload = () => {
          const canvas = document.createElement("canvas");
          const max = 1600;
          const ratio = Math.min(max / img.width, max / img.height, 1);

          canvas.width = img.width * ratio;
          canvas.height = img.height * ratio;

          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);

          resolve(canvas.toDataURL("image/jpeg", 0.82));
        };

        img.src = reader.result as string;
      };

      reader.readAsDataURL(file);
    });
  };

  const uploadThumbnail = async (file?: File) => {
    if (!file) return;

    const image = await resizeImage(file);

    setForm((prev) => ({
      ...prev,
      thumbnail: image
    }));
  };

  const uploadBlockImage = async (file: File, blockId: string) => {
    const image = await resizeImage(file);

    setForm((prev) => ({
      ...prev,
      blocks: prev.blocks.map((block) =>
        block.id === blockId
          ? {
              ...block,
              content: image
            }
          : block
      )
    }));
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

  const saveEntry = () => {
    if (!form.title.trim()) return;

    const id = form.id || crypto.randomUUID();

    const entry: Entry = {
      ...form,
      id,
      date: form.date || new Date().toISOString().slice(0, 10)
    };

    const exists = entries.find((item) => item.id === id);

    if (exists) {
      saveEntries(entries.map((item) => (item.id === id ? entry : item)));
    } else {
      saveEntries([...entries, entry]);
    }

    setSelectedId(id);
    setEditorOpen(false);
  };

  const deleteEntry = () => {
    if (!selected) return;

    saveEntries(entries.filter((entry) => entry.id !== selected.id));
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
        <button>contact us</button>

        <div className="logo">void</div>

        {selected ? (
          <button onClick={editCurrent}>edit</button>
        ) : (
          <button onClick={createNew}>add</button>
        )}
      </header>

      {!selected && (
        <>
          <section className="gallery" ref={galleryRef}>
            {sortedEntries.map((entry, index) => {
              const previous = sortedEntries[index - 1];
              const week = getWeekKey(entry.date);
              const previousWeek = previous ? getWeekKey(previous.date) : "";

              return (
                <article
                  key={entry.id}
                  className="timelineItem"
                  onClick={() => setSelectedId(entry.id)}
                >
                  {week !== previousWeek && (
                    <div className="weekMark">
                      <span>{week}</span>
                    </div>
                  )}

                  <div className="card">
                    {entry.thumbnail ? (
                      <img src={entry.thumbnail} alt="" />
                    ) : (
                      <div className="placeholder" />
                    )}
                  </div>
                </article>
              );
            })}
          </section>

          <div
            className="scrollSpace"
            style={{
              height: `${Math.max(sortedEntries.length * 900, 2200)}px`
            }}
          />
        </>
      )}

      {selected && (
        <section className="detail">
          <button className="back" onClick={() => setSelectedId("")}>
            back
          </button>

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
