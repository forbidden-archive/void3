"use client";

import { useEffect, useState } from "react";

type Block = {
  id: string;
  type: "text" | "image" | "drawing";
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

const STORAGE_KEY = "void-archive-v5";

const starterData: Entry[] = [
  {
    id: "1",
    date: "2026-06-05",
    title: "VOID",
    tag: "concept",
    blocks: [
      {
        id: "b1",
        type: "text",
        content:
          "社会に価値を与えたことで社会から切り離された存在。"
      }
    ]
  }
];

export default function Home() {
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

  const saveEntries = (next: Entry[]) => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(next)
    );

    setEntries(next);
  };

  const selected = entries.find(
    (entry) => entry.id === selectedId
  );

  const resizeImage = (
    file: File
  ): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();

      reader.onload = () => {
        const img = new Image();

        img.onload = () => {
          const canvas =
            document.createElement("canvas");

          const max = 1600;

          const ratio = Math.min(
            max / img.width,
            max / img.height,
            1
          );

          canvas.width = img.width * ratio;
          canvas.height = img.height * ratio;

          const ctx =
            canvas.getContext("2d");

          ctx?.drawImage(
            img,
            0,
            0,
            canvas.width,
            canvas.height
          );

          resolve(
            canvas.toDataURL(
              "image/jpeg",
              0.82
            )
          );
        };

        img.src = reader.result as string;
      };

      reader.readAsDataURL(file);
    });
  };

  const uploadThumbnail = async (
    file?: File
  ) => {
    if (!file) return;

    const image =
      await resizeImage(file);

    setForm((prev) => ({
      ...prev,
      thumbnail: image
    }));
  };

  const uploadBlockImage = async (
    file: File,
    blockId: string
  ) => {
    const image =
      await resizeImage(file);

    setForm((prev) => ({
      ...prev,
      blocks: prev.blocks.map((b) =>
        b.id === blockId
          ? {
              ...b,
              content: image
            }
          : b
      )
    }));
  };

  const addBlock = (
    type:
      | "text"
      | "image"
      | "drawing"
  ) => {
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

  const saveEntry = () => {
    if (!form.title) return;

    const id =
      form.id ||
      crypto.randomUUID();

    const entry = {
      ...form,
      id
    };

    const exists =
      entries.find(
        (e) => e.id === id
      );

    if (exists) {
      saveEntries(
        entries.map((e) =>
          e.id === id ? entry : e
        )
      );
    } else {
      saveEntries([
        ...entries,
        entry
      ]);
    }

    setSelectedId(id);

    setEditorOpen(false);
  };

  const deleteEntry = () => {
    if (!selected) return;

    saveEntries(
      entries.filter(
        (e) => e.id !== selected.id
      )
    );

    setSelectedId("");
    setEditorOpen(false);
  };

  const createNew = () => {
    setForm({
      id: "",
      date: new Date()
        .toISOString()
        .slice(0, 10),
      title: "",
      tag: "",
      thumbnail: "",
      blocks: []
    });

    setEditorOpen(true);
  };

  const editCurrent = () => {
    if (!selected) return;

    setForm(selected);

    setEditorOpen(true);
  };

  return (
    <main className="page">
      <header className="top">

        <button>
          contact us
        </button>

        <div className="logo">
          void
        </div>

        {selected ? (
          <button
            onClick={
              editCurrent
            }
          >
            edit
          </button>
        ) : (
          <button
            onClick={
              createNew
            }
          >
            add
          </button>
        )}

      </header>

      {!selected && (
        <section className="gallery">

          {entries.map(
            (entry) => (
              <article
                key={entry.id}
                className="card"
                onClick={() =>
                  setSelectedId(
                    entry.id
                  )
                }
              >
                {entry.thumbnail ? (
                  <img
                    src={
                      entry.thumbnail
                    }
                    alt=""
                  />
                ) : (
                  <div className="placeholder" />
                )}
              </article>
            )
          )}

        </section>
      )}

      {selected && (
        <section className="detail">

          <button
            className="back"
            onClick={() =>
              setSelectedId("")
            }
          >
            back
          </button>

          <h1>
            {selected.title}
          </h1>

          <p className="date">
            {selected.date}
          </p>

          {selected.blocks.map(
            (block) => {
              if (
                block.type ===
                "text"
              ) {
                return (
                  <p
                    key={
                      block.id
                    }
                    className="bodyText"
                  >
                    {
                      block.content
                    }
                  </p>
                );
              }

              return (
                <img
                  key={
                    block.id
                  }
                  src={
                    block.content
                  }
                  alt=""
                  className="contentImage"
                />
              );
            }
          )}
        </section>
      )}

      {editorOpen && (
        <section className="editor">

          <button
            onClick={() =>
              setEditorOpen(
                false
              )
            }
          >
            close
          </button>

          <input
            type="date"
            value={form.date}
            onChange={(e) =>
              setForm({
                ...form,
                date:
                  e.target
                    .value
              })
            }
          />

          <input
            placeholder="title"
            value={form.title}
            onChange={(e) =>
              setForm({
                ...form,
                title:
                  e.target
                    .value
              })
            }
          />

          <input
            placeholder="tag"
            value={form.tag}
            onChange={(e) =>
              setForm({
                ...form,
                tag:
                  e.target
                    .value
              })
            }
          />

          <label>
            thumbnail

            <input
              type="file"
              accept="image/*"
              onChange={(e) =>
                uploadThumbnail(
                  e.target
                    .files?.[0]
                )
              }
            />
          </label>

          <div className="blockButtons">

            <button
              onClick={() =>
                addBlock(
                  "text"
                )
              }
            >
              + text
            </button>

            <button
              onClick={() =>
                addBlock(
                  "image"
                )
              }
            >
              + image
            </button>

            <button
              onClick={() =>
                addBlock(
                  "drawing"
                )
              }
            >
              + drawing
            </button>

          </div>

          {form.blocks.map(
            (block) => (
              <div
                key={block.id}
              >
                {block.type ===
                "text" ? (
                  <textarea
                    value={
                      block.content
                    }
                    onChange={(
                      e
                    ) =>
                      setForm(
                        (
                          prev
                        ) => ({
                          ...prev,
                          blocks:
                            prev.blocks.map(
                              (
                                b
                              ) =>
                                b.id ===
                                block.id
                                  ? {
                                      ...b,
                                      content:
                                        e
                                          .target
                                          .value
                                    }
                                  : b
                            )
                        })
                      )
                    }
                  />
                ) : (
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(
                      e
                    ) =>
                      e.target
                        .files?.[0] &&
                      uploadBlockImage(
                        e.target
                          .files[0],
                        block.id
                      )
                    }
                  />
                )}
              </div>
            )
          )}

          <button
            className="save"
            onClick={saveEntry}
          >
            save
          </button>

          <button
            className="delete"
            onClick={deleteEntry}
          >
            delete
          </button>

        </section>
      )}
    </main>
  );
}
