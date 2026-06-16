"use client";

import { useEffect, useMemo, useState } from "react";

type Entry = {
  id: string;
  date: string;
  title: string;
  text: string;
  tag: string;
  drawing?: string;
  photo?: string;
};

const STORAGE_KEY = "void-clean-archive-v4";

const initialEntries: Entry[] = [
  {
    id: "001",
    date: "2026-06-05",
    title: "VOID",
    text: "社会に価値を与えたことで、社会から切り離された存在。",
    tag: "concept"
  },
  {
    id: "002",
    date: "2026-06-08",
    title: "gaze",
    text: "スマホによって人の視線は下へ向かう。",
    tag: "gaze"
  },
  {
    id: "003",
    date: "2026-06-10",
    title: "tower",
    text: "通信を支える塔は上にあるが、誰も見上げない。",
    tag: "tower"
  }
];

export default function Home() {
  const [entries, setEntries] = useState<Entry[]>(initialEntries);
  const [selectedId, setSelectedId] = useState("");
  const [openForm, setOpenForm] = useState(false);
  const [mode, setMode] = useState<"add" | "edit">("add");
  const [query, setQuery] = useState("");

  const [form, setForm] = useState({
    date: "",
    title: "",
    text: "",
    tag: "",
    drawing: "",
    photo: ""
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setEntries(JSON.parse(saved));
    } catch {
      setEntries(initialEntries);
    }
  }, []);

  const saveEntries = (nextEntries: Entry[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextEntries));
    setEntries(nextEntries);
  };

  const filtered = useMemo(() => {
    return entries
      .filter((e) =>
        `${e.date} ${e.title} ${e.text} ${e.tag}`
          .toLowerCase()
          .includes(query.toLowerCase())
      )
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [entries, query]);

  const selected = entries.find((e) => e.id === selectedId);

  const resizeImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        const img = new Image();

        img.onload = () => {
          const canvas = document.createElement("canvas");
          const maxSize = 1200;
          const ratio = Math.min(maxSize / img.width, maxSize / img.height, 1);

          canvas.width = Math.round(img.width * ratio);
          canvas.height = Math.round(img.height * ratio);

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Canvas error"));
            return;
          }

          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", 0.72));
        };

        img.onerror = reject;
        img.src = String(reader.result);
      };

      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const upload = async (
    file: File | undefined,
    key: "drawing" | "photo"
  ) => {
    if (!file) return;

    try {
      const resized = await resizeImage(file);
      setForm((prev) => ({ ...prev, [key]: resized }));
    } catch {
      alert("画像の読み込みに失敗しました");
    }
  };

  const openAddForm = () => {
    setMode("add");
    setForm({
      date: "",
      title: "",
      text: "",
      tag: "",
      drawing: "",
      photo: ""
    });
    setOpenForm(true);
  };

  const openEditForm = () => {
    if (!selected) return;

    setMode("edit");
    setForm({
      date: selected.date,
      title: selected.title,
      text: selected.text,
      tag: selected.tag,
      drawing: selected.drawing || "",
      photo: selected.photo || ""
    });
    setOpenForm(true);
  };

  const submitForm = () => {
    if (!form.title.trim()) {
      alert("titleを入れて");
      return;
    }

    try {
      if (mode === "add") {
        const newEntry: Entry = {
          id: String(Date.now()),
          date: form.date || new Date().toISOString().slice(0, 10),
          title: form.title,
          text: form.text,
          tag: form.tag || "untagged",
          drawing: form.drawing,
          photo: form.photo
        };

        const nextEntries = [...entries, newEntry];
        saveEntries(nextEntries);
        setSelectedId(newEntry.id);
      } else {
        if (!selected) return;

        const nextEntries = entries.map((entry) =>
          entry.id === selected.id
            ? {
                ...entry,
                date: form.date || entry.date,
                title: form.title,
                text: form.text,
                tag: form.tag || "untagged",
                drawing: form.drawing,
                photo: form.photo
              }
            : entry
        );

        saveEntries(nextEntries);
      }

      setOpenForm(false);
      setForm({
        date: "",
        title: "",
        text: "",
        tag: "",
        drawing: "",
        photo: ""
      });
    } catch (error) {
      console.error(error);
      alert("保存できません。画像サイズが大きすぎる可能性があります。");
    }
  };

  const deleteSelected = () => {
    if (!selected) return;
    const nextEntries = entries.filter((entry) => entry.id !== selected.id);
    saveEntries(nextEntries);
    setSelectedId("");
    setOpenForm(false);
  };

  const reset = () => {
    localStorage.removeItem(STORAGE_KEY);
    setEntries(initialEntries);
    setSelectedId("");
    setOpenForm(false);
  };

  return (
    <main className={selected ? "page detailMode" : "page"}>
      <header className="top">
        <button>contact us</button>
        <div className="logo">void</div>
        {selected ? (
          <button onClick={openEditForm}>edit</button>
        ) : (
          <button onClick={openAddForm}>add</button>
        )}
      </header>

      {!selected && (
        <>
          <section className="intro">
            <p>Connecting void.</p>

            <div className="sort">
              <span>sort by :</span>
              <input
                placeholder="tag"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </section>

          <nav className="timeline">
            {filtered.map((entry) => (
              <button key={entry.id} onClick={() => setSelectedId(entry.id)}>
                {entry.date.slice(5).replace("-", ".")}
              </button>
            ))}
          </nav>

          <section className="gallery">
            {filtered.map((entry) => (
              <article
                key={entry.id}
                className="item"
                onClick={() => setSelectedId(entry.id)}
              >
                <div className="image">
                  {entry.photo ? (
                    <img className="photo" src={entry.photo} alt="" />
                  ) : (
                    <div className="empty" />
                  )}

                  {entry.drawing ? (
                    <img className="drawing" src={entry.drawing} alt="" />
                  ) : (
                    <svg className="lineDrawing" viewBox="0 0 300 420">
                      <path d="M80 250 C120 150, 180 150, 210 230" />
                      <path d="M110 280 C150 210, 190 250, 170 320" />
                      <path d="M120 110 C180 80, 220 130, 190 180" />
                    </svg>
                  )}
                </div>
              </article>
            ))}
          </section>
        </>
      )}

      {selected && (
        <section className="detailPage">
          <button className="back" onClick={() => setSelectedId("")}>
            back
          </button>

          <p className="detailDate">{selected.date}</p>

          <div className="heroImage">
            {selected.photo ? (
              <img className="photo" src={selected.photo} alt="" />
            ) : (
              <div className="empty" />
            )}

            {selected.drawing && (
              <img className="drawing" src={selected.drawing} alt="" />
            )}
          </div>

          <article className="detailText">
            <h1>{selected.title}</h1>
            <p>{selected.text}</p>
            <span>#{selected.tag}</span>
          </article>

          <div className="bottomSpace" />
        </section>
      )}

      {openForm && (
        <section className="add">
          <button className="addClose" onClick={() => setOpenForm(false)}>
            close
          </button>

          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />

          <input
            placeholder="title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />

          <textarea
            placeholder="text"
            value={form.text}
            onChange={(e) => setForm({ ...form, text: e.target.value })}
          />

          <input
            placeholder="tag"
            value={form.tag}
            onChange={(e) => setForm({ ...form, tag: e.target.value })}
          />

          <label>
            drawing
            <input
              type="file"
              accept="image/*"
              onChange={(e) => upload(e.target.files?.[0], "drawing")}
            />
          </label>

          <label>
            photo
            <input
              type="file"
              accept="image/*"
              onChange={(e) => upload(e.target.files?.[0], "photo")}
            />
          </label>

          {form.drawing && <p className="loaded">drawing loaded</p>}
          {form.photo && <p className="loaded">photo loaded</p>}

          <button className="save" onClick={submitForm}>
            {mode === "add" ? "save" : "update"}
          </button>

          {mode === "edit" && (
            <button className="delete" onClick={deleteSelected}>
              delete
            </button>
          )}

          <button className="reset" onClick={reset}>
            reset
          </button>
        </section>
      )}
    </main>
  );
}
