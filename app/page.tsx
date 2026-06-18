"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../lib/supabase";

type ViewMode =
  | "timeline"
  | "archive"
  | "drawings"
  | "photos";

type BlockType =
  | "text"
  | "image"
  | "drawing";

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
  thumbnailType: "photo" | "drawing";
  blocks: Block[];
};

const getNowForInput = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset();

  const local = new Date(
    now.getTime() - offset * 60 * 1000
  );

  return local
    .toISOString()
    .slice(0, 16);
};

const formatDate = (value: string) => {
  if (!value) return "";

  return value.replace("T", " ");
};

export default function Home() {
  const galleryRef =
    useRef<HTMLElement>(null);

  const currentX = useRef(0);
  const targetX = useRef(0);
  const rafRef =
    useRef<number | null>(null);

  const dragRef = useRef({
    active: false,
    moved: false,
    startX: 0,
    lastX: 0
  });

  const [entries, setEntries] =
    useState<Entry[]>([]);

  const [selectedId, setSelectedId] =
    useState("");

  const [editorOpen, setEditorOpen] =
    useState(false);

  const [view, setView] =
    useState<ViewMode>("timeline");

  const [form, setForm] =
    useState<Entry>({
      id: "",
      date: "",
      title: "",
      tag: "",
      thumbnail: "",
      thumbnailType: "photo",
      blocks: []
    });

  const sortedEntries = useMemo(() => {
    return [...entries].sort((a, b) =>
      a.date.localeCompare(b.date)
    );
  }, [entries]);

  const drawingItems = useMemo(() => {
    return sortedEntries.flatMap(
      (entry) => {
        const items = entry.blocks
          .filter(
            (block) =>
              block.type ===
                "drawing" &&
              block.content
          )
          .map((block) => ({
            image: block.content,
            entryId: entry.id,
            title: entry.title,
            date: entry.date
          }));

        if (
          entry.thumbnail &&
          entry.thumbnailType ===
            "drawing"
        ) {
          items.unshift({
            image: entry.thumbnail,
            entryId: entry.id,
            title: entry.title,
            date: entry.date
          });
        }

        return items;
      }
    );
  }, [sortedEntries]);

  const photoItems = useMemo(() => {
    return sortedEntries.flatMap(
      (entry) => {
        const items = entry.blocks
          .filter(
            (block) =>
              block.type ===
                "image" &&
              block.content
          )
          .map((block) => ({
            image: block.content,
            entryId: entry.id,
            title: entry.title,
            date: entry.date
          }));

        if (
          entry.thumbnail &&
          entry.thumbnailType ===
            "photo"
        ) {
          items.unshift({
            image: entry.thumbnail,
            entryId: entry.id,
            title: entry.title,
            date: entry.date
          });
        }

        return items;
      }
    );
  }, [sortedEntries]);

  const selected =
    sortedEntries.find(
      (entry) =>
        entry.id === selectedId
    );

  const selectedIndex =
    sortedEntries.findIndex(
      (entry) =>
        entry.id === selectedId
    );

  const prevEntry =
    selectedIndex > 0
      ? sortedEntries[
          selectedIndex - 1
        ]
      : null;

  const nextEntry =
    selectedIndex >= 0 &&
    selectedIndex <
      sortedEntries.length - 1
      ? sortedEntries[
          selectedIndex + 1
        ]
      : null;

  useEffect(() => {
    loadEntries();
  }, []);

  useEffect(() => {
    if (
      selectedId ||
      view !== "timeline"
    )
      return;

    const animate = () => {
      if (
        window.innerWidth > 900
      ) {
        targetX.current =
          window.scrollY;
      }

      currentX.current +=
        (targetX.current -
          currentX.current) *
        0.08;

      if (galleryRef.current) {
        galleryRef.current.style.transform =
          `translateX(${-currentX.current}px)`;
      }

      rafRef.current =
        requestAnimationFrame(
          animate
        );
    };

    rafRef.current =
      requestAnimationFrame(
        animate
      );

    return () => {
      if (rafRef.current)
        cancelAnimationFrame(
          rafRef.current
        );
    };
  }, [selectedId, view]);

  const loadEntries =
    async () => {
      const {
        data,
        error
      } = await supabase
        .from("entries")
        .select("*")
        .order("date", {
          ascending: true
        });

      if (error) {
        alert(
          "読み込みできませんでした"
        );

        return;
      }

      setEntries(
        (data || []) as Entry[]
      );
    };

  const uploadImageToSupabase =
    async (file: File) => {
      const ext =
        file.name
          .split(".")
          .pop();

      const fileName = `${crypto.randomUUID()}.${ext}`;

      const filePath = `images/${fileName}`;

      const { error } =
        await supabase.storage
          .from(
            "archive-images"
          )
          .upload(
            filePath,
            file
          );

      if (error) {
        alert(
          "画像アップロードに失敗しました"
        );

        return "";
      }

      const { data } =
        supabase.storage
          .from(
            "archive-images"
          )
          .getPublicUrl(
            filePath
          );

      return data.publicUrl;
    };

  const uploadThumbnail =
    async (
      file?: File
    ) => {
      if (!file) return;

      const imageUrl =
        await uploadImageToSupabase(
          file
        );

      if (!imageUrl) return;

      setForm((prev) => ({
        ...prev,
        thumbnail: imageUrl
      }));
    };

  const uploadBlockImage =
    async (
      file: File,
      blockId: string
    ) => {
      const imageUrl =
        await uploadImageToSupabase(
          file
        );

      if (!imageUrl) return;

      setForm((prev) => ({
        ...prev,
        blocks:
          prev.blocks.map(
            (block) =>
              block.id ===
              blockId
                ? {
                    ...block,
                    content:
                      imageUrl
                  }
                : block
          )
      }));
    };  const saveEntryToSupabase =
    async (entry: Entry) => {
      const { error } =
        await supabase
          .from("entries")
          .upsert({
            id: entry.id,
            date: entry.date,
            title: entry.title,
            tag: entry.tag,
            thumbnail:
              entry.thumbnail,
            thumbnailType:
              entry.thumbnailType,
            blocks: entry.blocks
          });

      if (error) {
        alert(
          "保存できませんでした"
        );
        return;
      }

      await loadEntries();
    };

  const addBlock = (
    type: BlockType
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

  const saveEntry =
    async () => {
      if (
        !form.title.trim()
      )
        return;

      const id =
        form.id ||
        crypto.randomUUID();

      const entry: Entry = {
        ...form,
        id,
        date:
          form.date ||
          getNowForInput()
      };

      await saveEntryToSupabase(
        entry
      );

      setSelectedId(id);
      setEditorOpen(false);
    };

  const createNew =
    () => {
      setForm({
        id: "",
        date:
          getNowForInput(),
        title: "",
        tag: "",
        thumbnail: "",
        thumbnailType:
          "photo",
        blocks: []
      });

      setEditorOpen(true);
    };

  return (
    <main
      className={
        selected
          ? "page detailMode"
          : "page"
      }
    >
      <header className="top">
        {!selected ? (
          <div className="viewSwitch">
            <button
              onClick={() =>
                setView(
                  "timeline"
                )
              }
            >
              timeline
            </button>

            <button
              onClick={() =>
                setView(
                  "archive"
                )
              }
            >
              archive
            </button>

            <button
              onClick={() =>
                setView(
                  "drawings"
                )
              }
            >
              drawings
            </button>

            <button
              onClick={() =>
                setView(
                  "photos"
                )
              }
            >
              photos
            </button>
          </div>
        ) : (
          <button
            onClick={() =>
              setSelectedId(
                ""
              )
            }
          >
            back
          </button>
        )}

        <div className="logo">
          void
        </div>

        <button
          onClick={
            createNew
          }
        >
          add
        </button>
      </header>

      {view ===
        "drawings" &&
        !selected && (
          <section className="gridGallery">
            {drawingItems.map(
              (
                item,
                index
              ) => (
                <article
                  key={
                    index
                  }
                  className="gridCard"
                  onClick={() =>
                    setSelectedId(
                      item.entryId
                    )
                  }
                >
                  <div className="gridImage">
                    <img
                      src={
                        item.image
                      }
                      alt=""
                    />
                  </div>
                </article>
              )
            )}
          </section>
        )}

      {view ===
        "photos" &&
        !selected && (
          <section className="gridGallery">
            {photoItems.map(
              (
                item,
                index
              ) => (
                <article
                  key={
                    index
                  }
                  className="gridCard"
                  onClick={() =>
                    setSelectedId(
                      item.entryId
                    )
                  }
                >
                  <div className="gridImage">
                    <img
                      src={
                        item.image
                      }
                      alt=""
                    />
                  </div>
                </article>
              )
            )}
          </section>
        )}

      {editorOpen && (
        <section className="editor">
          <label>
            thumbnail

            <input
              type="file"
              accept="image/*"
              onChange={(
                e
              ) =>
                uploadThumbnail(
                  e.target
                    .files?.[0]
                )
              }
            />
          </label>

          <select
            value={
              form.thumbnailType
            }
            onChange={(
              e
            ) =>
              setForm({
                ...form,
                thumbnailType:
                  e.target
                    .value as
                    | "photo"
                    | "drawing"
              })
            }
          >
            <option value="photo">
              photo
            </option>

            <option value="drawing">
              drawing
            </option>
          </select>

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

          <button
            className="save"
            onClick={
              saveEntry
            }
          >
            save
          </button>
        </section>
      )}
    </main>
  );
}
