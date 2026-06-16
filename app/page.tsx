"use client";

import { useEffect, useMemo, useState } from "react";

type NodeType = "text" | "photo" | "drawing" | "concept";

type VoidNode = {
  id: string;
  title: string;
  type: NodeType;
  body: string;
  tag: string;
  x: number;
  y: number;
};

const initialNodes: VoidNode[] = [
  {
    id: "001",
    title: "VOIDの定義",
    type: "concept",
    body: "VOIDとは、社会に価値を与えたことで、社会から切り離された存在である。",
    tag: "definition",
    x: 22,
    y: 28
  },
  {
    id: "002",
    title: "下を向く人々",
    type: "text",
    body: "通学路で多くの人がスマホを見ながら歩いていた。接続は視線を下へ向かわせる。",
    tag: "gaze",
    x: 72,
    y: 24
  },
  {
    id: "003",
    title: "上にある電波塔",
    type: "photo",
    body: "通信を支える塔は常に上にあるが、誰も見上げない。",
    tag: "tower",
    x: 18,
    y: 68
  },
  {
    id: "004",
    title: "人を繋げるVOID",
    type: "concept",
    body: "電波塔は人を繋げたことで、自らVOIDになった。",
    tag: "connect",
    x: 76,
    y: 70
  }
];

export default function Home() {
  const [nodes, setNodes] = useState<VoidNode[]>(initialNodes);
  const [selectedId, setSelectedId] = useState("001");
  const [query, setQuery] = useState("");
  const [form, setForm] = useState({
    title: "",
    type: "text" as NodeType,
    body: "",
    tag: ""
  });

  useEffect(() => {
    const saved = localStorage.getItem("void-nodes");
    if (saved) {
      setNodes(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("void-nodes", JSON.stringify(nodes));
  }, [nodes]);

  const filteredNodes = useMemo(() => {
    return nodes.filter((node) => {
      const text = `${node.title} ${node.body} ${node.tag} ${node.type}`;
      return text.toLowerCase().includes(query.toLowerCase());
    });
  }, [nodes, query]);

  const selectedNode =
    nodes.find((node) => node.id === selectedId) || nodes[0];

  const addNode = () => {
    if (!form.title.trim()) return;

    const angle = Math.random() * Math.PI * 2;
    const radius = 22 + Math.random() * 24;

    const newNode: VoidNode = {
      id: String(Date.now()),
      title: form.title,
      type: form.type,
      body: form.body,
      tag: form.tag || "untagged",
      x: 50 + Math.cos(angle) * radius,
      y: 50 + Math.sin(angle) * radius
    };

    setNodes((prev) => [...prev, newNode]);
    setSelectedId(newNode.id);
    setForm({
      title: "",
      type: "text",
      body: "",
      tag: ""
    });
  };

  const resetNodes = () => {
    setNodes(initialNodes);
    setSelectedId("001");
    localStorage.removeItem("void-nodes");
  };

  return (
    <main className="database">
      <header className="topbar">
        <div>
          <p>VOID DATABASE</p>
          <h1>SYNAPSE MODE</h1>
        </div>
        <div className="status">
          <span>{nodes.length} NODES</span>
          <span>{filteredNodes.length} VISIBLE</span>
        </div>
      </header>

      <aside className="panel leftPanel">
        <p className="panelLabel">ADD NODE</p>

        <input
          placeholder="title"
          value={form.title}
          onChange={(e) =>
            setForm({ ...form, title: e.target.value })
          }
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
          onChange={(e) =>
            setForm({ ...form, body: e.target.value })
          }
        />

        <input
          placeholder="tag"
          value={form.tag}
          onChange={(e) =>
            setForm({ ...form, tag: e.target.value })
          }
        />

        <button onClick={addNode}>ADD TO VOID</button>
        <button className="ghost" onClick={resetNodes}>
          RESET
        </button>
      </aside>

      <section className="networkArea">
        <div className="scan" />

        <svg className="synapseLines">
          {filteredNodes.map((node) => (
            <line
              key={node.id}
              x1="50%"
              y1="50%"
              x2={`${node.x}%`}
              y2={`${node.y}%`}
            />
          ))}

          {filteredNodes.slice(0, -1).map((node, i) => (
            <line
              key={`${node.id}-chain`}
              x1={`${node.x}%`}
              y1={`${node.y}%`}
              x2={`${filteredNodes[i + 1].x}%`}
              y2={`${filteredNodes[i + 1].y}%`}
              className="thin"
            />
          ))}
        </svg>

        <button className="core" onClick={() => setSelectedId("001")}>
          <span>VOID</span>
          <small>CORE</small>
        </button>

        {filteredNodes.map((node) => (
          <button
            key={node.id}
            className={`node node-${node.type} ${
              selectedId === node.id ? "active" : ""
            }`}
            style={{ left: `${node.x}%`, top: `${node.y}%` }}
            onClick={() => setSelectedId(node.id)}
          >
            <span>{node.type}</span>
            <strong>{node.title}</strong>
          </button>
        ))}
      </section>

      <aside className="panel rightPanel">
        <p className="panelLabel">SELECTED NODE</p>

        {selectedNode && (
          <>
            <span className="type">{selectedNode.type}</span>
            <h2>{selectedNode.title}</h2>
            <p>{selectedNode.body}</p>
            <div className="tag">#{selectedNode.tag}</div>
          </>
        )}

        <div className="searchBox">
          <p className="panelLabel">FILTER</p>
          <input
            placeholder="search tag / word"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </aside>
    </main>
  );
}
