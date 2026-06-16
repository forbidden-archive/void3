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

const initialEntries: Entry[] = [
  {
    id: "001",
    date: "2026-06-05",
    title: "VOIDの定義",
    text: "社会に価値を与えたことで、社会から切り離された存在。",
    tag: "concept"
  },
  {
    id: "002",
    date: "2026-06-08",
    title: "下を向く人々",
    text: "スマホによって人の視線は下へ向かう。",
    tag: "gaze"
  },
  {
    id: "003",
    date: "2026-06-10",
    title: "上にある電波塔",
    text: "通信を支える塔は上にあるが、誰も見上げない。",
    tag: "tower"
  }
];

export default function Home() {
  const [entries, setEntries] = useState<Entry[]>(initialEntries);
  const [selectedId, setSelectedId] = useState("001");
  const [query, setQuery] = useState("");
  const [openAdd, setOpenAdd] = useState(false);

  const [form, setForm] = useState({
    date: "",
    title: "",
    text: "",
    tag: "",
    drawing: "",
    photo: ""
  });

  useEffect(() => {
    const saved = localStorage.getItem("void-horizontal-archive");
    if (saved) setEntries(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("void-horizontal-archive", JSON.stringify(entries));
  }, [entries]);

  const filtered = useMemo(() => {
    return entries
      .filter((entry) => {
        const target = `${entry.date} ${entry.title} ${entry.text} ${entry.tag}`;
        return target.toLowerCase().includes(query.toLowerCase());
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [entries, query]);

  const selected =
    entries.find((entry) => entry.id === selectedId) || filtered[0] || entries[0];

  const upload = (file: File | undefined, key: "drawing" | "photo") => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setForm((prev) => ({
        ...prev,
        [key]: String(reader.result)
      }));
    };
    reader.readAsDataURL(file);
  };

  const addEntry = () => {
    if (!form.title.trim()) return;

    const newEntry: Entry = {
      id: String(Date.now()),
      date: form.date || new Date().toISOString().slice(0, 10),
      title: form.title,
      text: form.text,
      tag: form.tag || "untagged",
      drawing: form.drawing,
      photo: form.photo
    };

    setEntries((prev) => [...prev, newEntry]);
    setSelectedId(newEntry.id);
    setForm({
      date: "",
      title: "",
      text: "",
      tag: "",
      drawing: "",
      photo: ""
    });
    setOpenAdd(false);
  };

  const reset = () => {
    setEntries(initialEntries);
    setSelectedId("001");
    localStorage.removeItem("void-horizontal-archive");
  };

  return (
    <main className="archive">
      <header className="header">
        <div>
          <p>VOID TOWER ARCHIVE</p>
          <h1>RESEARCH DRAWINGS</h1>
        </div>

        <div className="tools">
          <input
            placeholder="SEARCH"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button onClick={() => setOpenAdd(!openAdd)}>ADD</button>
        </div>
      </header>

      <nav className="timeline">
        {filtered.map((entry) => (
          <button
            key={entry.id}
            className={selectedId === entry.id ? "active" : ""}
            onClick={() => setSelectedId(entry.id)}
          >
            <span>{entry.date.slice(5).replace("-", ".")}</span>
          </button>
        ))}
      </nav>

      {openAdd && (
        <section className="addPanel">
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
            placeholder="topic text / observation"
            value={form.text}
            onChange={(e) => setForm({ ...form, text: e.target.value })}
          />

          <input
            placeholder="tag"
            value={form.tag}
            onChange={(e) => setForm({ ...form, tag: e.target.value })}
          />

          <label>
            DRAWING
            <input
              type="file"
              accept="image/*"
              onChange={(e) => upload(e.target.files?.[0], "drawing")}
            />
          </label>

          <label>
            PHOTO
            <input
              type="file"
              accept="image/*"
              onChange={(e) => upload(e.target.files?.[0], "photo")}
            />
          </label>

          <div className="addActions">
            <button onClick={addEntry}>SAVE</button>
            <button onClick={reset}>RESET</button>
          </div>
        </section>
      )}

      <section className="horizontal">
        {filtered.map((entry, index) => (
          <article
            key={entry.id}
            className={`drawingCard ${selectedId === entry.id ? "active" : ""}`}
            onClick={() => setSelectedId(entry.id)}
          >
            <p className="number">{String(index + 1).padStart(2, "0")}</p>

            <div className="imageBox">
              {entry.drawing ? (
                <img src={entry.drawing} alt="" />
              ) : (
                <div className="placeholder">
                  <span>{entry.title}</span>
                </div>
              )}
            </div>

            <div className="cardMeta">
              <span>{entry.date}</span>
              <h2>{entry.title}</h2>
              <p>#{entry.tag}</p>
            </div>
          </article>
        ))}
      </section>

      {selected && (
        <aside className="detail">
          <button className="close" onClick={() => setSelectedId("")}>
            ×
          </button>

          <p className="detailDate">{selected.date}</p>
          <h2>{selected.title}</h2>
          <p className="detailText">{selected.text}</p>
          <p className="tag">#{selected.tag}</p>

          <div className="detailImages">
            {selected.drawing && (
              <div>
                <span>DRAWING</span>
                <img src={selected.drawing} alt="" />
              </div>
            )}

            {selected.photo && (
              <div>
                <span>PHOTO</span>
                <img src={selected.photo} alt="" />
              </div>
            )}
          </div>
        </aside>
      )}
    </main>
  );
}
