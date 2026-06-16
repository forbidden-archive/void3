"use client";

import { useEffect, useMemo, useState } from "react";

type ViewMode = "synapse" | "timeline";
type NodeType = "text" | "photo" | "drawing" | "concept";

type VoidNode = {
  id: string;
  title: string;
  date: string;
  type: NodeType;
  body: string;
  tag: string;
  image?: string;
  x: number;
  y: number;
};

const initialNodes: VoidNode[] = [
  {
    id: "001",
    title: "VOIDの定義",
    date: "2026-06-05",
    type: "concept",
    body: "VOIDとは、社会に価値を与えたことで、社会から切り離された存在である。",
    tag: "definition",
    x: 26,
    y: 25
  },
  {
    id: "002",
    title: "下を向く人々",
    date: "2026-06-08",
    type: "text",
    body: "スマホによって人の視線は下へ向かう。接続は身体の向きを変えている。",
    tag: "gaze",
    x: 72,
    y: 28
  },
  {
    id: "003",
    title: "上にある電波塔",
    date: "2026-06-10",
    type: "photo",
    body: "通信を支える塔は上にあるが、誰も見上げない。",
    tag: "tower",
    x: 20,
    y: 70
  },
  {
    id: "004",
    title: "人を繋げるVOID",
    date: "2026-06-12",
    type: "concept",
    body: "電波塔は人を繋げたことで、自らVOIDになった。",
    tag: "connect",
    x: 76,
    y: 72
  }
];

export default function Home() {
  const [nodes, setNodes] = useState<VoidNode[]>(initialNodes);
  const [selectedId, setSelectedId] = useState("001");
  const [query, setQuery] = useState("");
  const [view, setView] = useState<ViewMode>("synapse");
  const [form, setForm] = useState({
    title: "",
    date: "",
    type: "text" as NodeType,
    body: "",
    tag: "",
    image: ""
  });

  useEffect(() => {
    const saved = localStorage.getItem("void-nodes-v2");
    if (saved) setNodes(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("void-nodes-v2", JSON.stringify(nodes));
  }, [nodes]);

  const filteredNodes = useMemo(() => {
    return nodes.filter((node) => {
      const text = `${node.title} ${node.body} ${node.tag} ${node.type} ${node.date}`;
      return text.toLowerCase().includes(query.toLowerCase());
    });
  }, [nodes, query]);

  const sortedNodes = [...filteredNodes].sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  const selectedNode =
    nodes.find((node) => node.id === selectedId) || nodes[0];

  const addNode = () => {
    if (!form.title.trim()) return;

    const angle = Math.random() * Math.PI * 2;
    const radius = 18 + Math.random() * 27;

    const newNode: VoidNode = {
      id: String(Date.now()),
      title: form.title,
      date: form.date || new Date().toISOString().slice(0, 10),
      type: form.type,
      body: form.body,
      tag: form.tag || "untagged",
      image: form.image,
      x: 50 + Math.cos(angle) * radius,
      y: 50 + Math.sin(angle) * radius
    };

    setNodes((prev) => [...prev, newNode]);
    setSelectedId(newNode.id);
    setForm({
      title: "",
      date: "",
      type: "text",
      body: "",
      tag: "",
      image: ""
    });
  };

  const uploadImage = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setForm((prev) => ({
        ...prev,
        image: String(reader.result),
        type: "photo"
      }));
    };
    reader.readAsDataURL(file);
  };

  const resetNodes = () => {
    setNodes(initialNodes);
    setSelectedId("001");
    localStorage.removeItem("void-nodes-v2");
  };

  return (
    <main className="database">
      <header className="topbar">
        <div>
          <p>VOID DATABASE</p>
          <h1>SYNAPTIC ARCHIVE</h1>
        </div>

        <div className="viewSwitch">
          <button
            className={view === "synapse" ? "active" : ""}
            onClick={() => setView("synapse")}
          >
            SYNAPSE
          </button>
          <button
            className={view === "timeline" ? "active" : ""}
            onClick={() => setView("timeline")}
          >
            TIMELINE
          </button>
        </div>
      </header>

      <aside className="panel leftPanel">
        <p className="panelLabel">ADD OBSERVATION</p>

        <input
          placeholder="title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />

        <input
          type="date"
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
        />

        <select
          value={form.type}
          onChange={(e) =>
            setForm({ ...form, type: e.target.value as NodeType })
          }
        >
          <option value="text">text</option>
          <option value="photo">photo</option>
          <option value="drawing">drawing</option>
          <option value="concept">concept</option>
        </select>

        <textarea
          placeholder="body / thought / observation"
          value={form.body}
          onChange={(e) => setForm({ ...form, body: e.target.value })}
        />

        <input
          placeholder="tag"
          value={form.tag}
          onChange={(e) => setForm({ ...form, tag: e.target.value })}
        />

        <label className="fileInput">
          ADD PHOTO
          <input
            type="file"
            accept="image/*"
            onChange={(e) => uploadImage(e.target.files?.[0])}
          />
        </label>

        {form.image && <img className="preview" src={form.image} alt="" />}

        <button onClick={addNode}>INJECT NODE</button>
        <button className="ghost" onClick={resetNodes}>
          RESET
        </button>
      </aside>

      <section className="stage">
        <div className="noise" />
        <div className="grain" />

        {view === "synapse" && (
          <div className="synapseView">
            <svg className="synapseSvg">
              <defs>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {filteredNodes.map((node, index) => (
                <path
                  key={`${node.id}-core`}
                  d={`M 50 50 C ${50 + (node.x - 50) * 0.35} ${
                    50 + Math.sin(index) * 18
                  }, ${50 + (node.x - 50) * 0.7} ${
                    node.y + Math.cos(index) * 10
                  }, ${node.x} ${node.y}`}
                  pathLength="100"
                />
              ))}

              {filteredNodes.slice(0, -1).map((node, index) => {
                const next = filteredNodes[index + 1];
                return (
                  <path
                    key={`${node.id}-chain`}
                    className="secondary"
                    d={`M ${node.x} ${node.y} C ${(node.x + next.x) / 2} ${
                      node.y - 18
                    }, ${(node.x + next.x) / 2} ${next.y + 18}, ${next.x} ${
                      next.y
                    }`}
                    pathLength="100"
                  />
                );
              })}
            </svg>

            <button className="core" onClick={() => setSelectedId("001")}>
              <span>VOID</span>
              <small>CORE</small>
            </button>

            {filteredNodes.map((node, index) => (
              <button
                key={node.id}
                className={`neuron neuron-${node.type} ${
                  selectedId === node.id ? "active" : ""
                }`}
                style={{
                  left: `${node.x}%`,
                  top: `${node.y}%`,
                  animationDelay: `${index * -0.6}s`
                }}
                onClick={() => setSelectedId(node.id)}
              >
                {node.image && (
                  <img className="nodeImage" src={node.image} alt="" />
                )}
                <i />
                <span>{node.date}</span>
                <strong>{node.title}</strong>
              </button>
            ))}
          </div>
        )}

        {view === "timeline" && (
          <div className="timelineView">
            {sortedNodes.map((node) => (
              <button
                key={node.id}
                className={`timelineItem ${
                  selectedId === node.id ? "active" : ""
                }`}
                onClick={() => setSelectedId(node.id)}
              >
                <span>{node.date}</span>
                <h2>{node.title}</h2>
                <p>{node.body}</p>
                {node.image && <img src={node.image} alt="" />}
              </button>
            ))}
          </div>
        )}
      </section>

      <aside className="panel rightPanel">
        <p className="panelLabel">SELECTED MEMORY</p>

        {selectedNode && (
          <>
            {selectedNode.image && (
              <img className="detailImage" src={selectedNode.image} alt="" />
            )}
            <span className="type">{selectedNode.type}</span>
            <p className="date">{selectedNode.date}</p>
            <h2>{selectedNode.title}</h2>
            <p>{selectedNode.body}</p>
            <div className="tag">#{selectedNode.tag}</div>
          </>
        )}

        <div className="searchBox">
          <p className="panelLabel">FILTER</p>
          <input
            placeholder="search tag / word / date"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </aside>
    </main>
  );
}
