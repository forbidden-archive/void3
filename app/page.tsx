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
  const [openAdd, setOpenAdd] = useState(false);
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
    const saved = localStorage.getItem("void-clean-archive-v2");
    if (saved) setEntries(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("void-clean-archive-v2", JSON.stringify(entries));
  }, [entries]);

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

  const upload = (file: File | undefined, key: "drawing" | "photo") => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setForm((prev) => ({ ...prev, [key]: String(reader.result) }));
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
    setOpenAdd(false);
    setForm({ date: "", title: "", text: "", tag: "", drawing: "", photo: "" });
  };

  const reset = () => {
    localStorage.removeItem("void-clean-archive-v2");
    setEntries(initialEntries);
    setSelectedId("");
  };

  return (
    <main className="page">
      <header className="top">
        <button>contact us</button>
        <div className="logo">void</div>
        <button onClick={() => setOpenAdd(true)}>add</button>
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
        </section>
      )}

      {openAdd && (
        <section className="add">
          <button className="addClose" onClick={() => setOpenAdd(false)}>
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

          <button className="save" onClick={addEntry}>
            save
          </button>

          <button className="reset" onClick={reset}>
            reset
          </button>
        </section>
      )}
    </main>
  );
}
