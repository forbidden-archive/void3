"use client";

import { useEffect, useMemo, useRef, useState } from "react";

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
    x: 0,
    y: 0
  },
  {
    id: "002",
    title: "下を向く人々",
    date: "2026-06-08",
    type: "text",
    body: "スマホによって人の視線は下へ向かう。接続は身体の向きを変えている。",
    tag: "gaze",
    x: -310,
    y: -170
  },
  {
    id: "003",
    title: "上にある電波塔",
    date: "2026-06-10",
    type: "photo",
    body: "通信を支える塔は上にあるが、誰も見上げない。",
    tag: "tower",
    x: 310,
    y: -120
  },
  {
    id: "004",
    title: "人を繋げるVOID",
    date: "2026-06-12",
    type: "concept",
    body: "電波塔は人を繋げたことで、自らVOIDになった。",
    tag: "connect",
    x: -230,
    y: 240
  },
  {
    id: "005",
    title: "通信の不可視性",
    date: "2026-06-14",
    type: "drawing",
    body: "通信は都市を満たしているが、通常は視覚化されない。",
    tag: "signal",
    x: 360,
    y: 250
  }
];

const colors: Record<NodeType, string> = {
  text: "#7db7ff",
  photo: "#ffffff",
  drawing: "#b78cff",
  concept: "#80ffe2"
};

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imagesRef = useRef<Record<string, HTMLImageElement>>({});
  const particlesRef = useRef<
    Record<string, { ox: number; oy: number; a: number; r: number; s: number }[]>
  >({});

  const [nodes, setNodes] = useState<VoidNode[]>(initialNodes);
  const [selectedId, setSelectedId] = useState("001");
  const [view, setView] = useState<ViewMode>("synapse");
  const [query, setQuery] = useState("");
  const [camera, setCamera] = useState({ x: 0, y: 0, scale: 1 });
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef({ x: 0, y: 0 });
  const cameraRef = useRef(camera);
  const nodesRef = useRef(nodes);
  const selectedRef = useRef(selectedId);

  const [form, setForm] = useState({
    title: "",
    date: "",
    type: "text" as NodeType,
    body: "",
    tag: "",
    image: ""
  });

  useEffect(() => {
    const saved = localStorage.getItem("void-canvas-nodes");
    if (saved) setNodes(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("void-canvas-nodes", JSON.stringify(nodes));
    nodesRef.current = nodes;
  }, [nodes]);

  useEffect(() => {
    cameraRef.current = camera;
  }, [camera]);

  useEffect(() => {
    selectedRef.current = selectedId;
  }, [selectedId]);

  const filteredNodes = useMemo(() => {
    return nodes.filter((node) => {
      const text = `${node.title} ${node.body} ${node.tag} ${node.type} ${node.date}`;
      return text.toLowerCase().includes(query.toLowerCase());
    });
  }, [nodes, query]);

  const selectedNode = nodes.find((n) => n.id === selectedId) || nodes[0];

  const sortedNodes = [...filteredNodes].sort((a, b) =>
    a.date.localeCompare(b.date)
  );

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

  const addNode = () => {
    if (!form.title.trim()) return;

    const angle = Math.random() * Math.PI * 2;
    const radius = 260 + Math.random() * 260;

    const newNode: VoidNode = {
      id: String(Date.now()),
      title: form.title,
      date: form.date || new Date().toISOString().slice(0, 10),
      type: form.type,
      body: form.body,
      tag: form.tag || "untagged",
      image: form.image,
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius
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

  const resetNodes = () => {
    setNodes(initialNodes);
    setSelectedId("001");
    localStorage.removeItem("void-canvas-nodes");
  };

  useEffect(() => {
    nodes.forEach((node) => {
      if (!particlesRef.current[node.id]) {
        const count = node.id === "001" ? 420 : node.image ? 260 : 190;
        particlesRef.current[node.id] = Array.from({ length: count }).map(() => {
          const angle = Math.random() * Math.PI * 2;
          const radius = Math.pow(Math.random(), 0.55) * (node.id === "001" ? 105 : 78);
          return {
            ox: Math.cos(angle) * radius,
            oy: Math.sin(angle) * radius * (0.72 + Math.random() * 0.5),
            a: Math.random() * Math.PI * 2,
            r: 0.7 + Math.random() * 2.2,
            s: 0.3 + Math.random() * 1.5
          };
        });
      }

      if (node.image && !imagesRef.current[node.id]) {
        const img = new Image();
        img.src = node.image;
        imagesRef.current[node.id] = img;
      }
    });
  }, [nodes]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frame = 0;
    let raf = 0;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const worldToScreen = (x: number, y: number) => {
      const cam = cameraRef.current;
      return {
        x: window.innerWidth / 2 + cam.x + x * cam.scale,
        y: window.innerHeight / 2 + cam.y + y * cam.scale
      };
    };

    const drawNode = (node: VoidNode, t: number) => {
      const cam = cameraRef.current;
      const p = worldToScreen(node.x, node.y);
      const particles = particlesRef.current[node.id] || [];
      const color = colors[node.type];
      const selected = selectedRef.current === node.id;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.scale(cam.scale, cam.scale);

      const glow = selected ? 1.6 : 1;

      ctx.globalCompositeOperation = "lighter";

      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, node.id === "001" ? 150 : 105);
      gradient.addColorStop(0, `${color}66`);
      gradient.addColorStop(0.42, `${color}22`);
      gradient.addColorStop(1, "transparent");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(0, 0, node.id === "001" ? 155 : 105, 0, Math.PI * 2);
      ctx.fill();

      particles.forEach((pt, i) => {
        const wobble =
          Math.sin(t * pt.s + pt.a + i * 0.13) * 7 +
          Math.cos(t * 0.7 + pt.a) * 4;

        const x = pt.ox + Math.cos(pt.a + t * 0.35) * wobble;
        const y = pt.oy + Math.sin(pt.a + t * 0.45) * wobble;

        ctx.beginPath();
        ctx.fillStyle = selected ? "#ffffff" : color;
        ctx.globalAlpha = (0.25 + Math.sin(t * pt.s + i) * 0.18 + 0.32) * glow;
        ctx.arc(x, y, pt.r * (selected ? 1.35 : 1), 0, Math.PI * 2);
        ctx.fill();
      });

      if (node.image && imagesRef.current[node.id]) {
        const img = imagesRef.current[node.id];
        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = 0.74;
        ctx.save();
        ctx.beginPath();
        ctx.arc(0, 0, 44, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(img, -44, -44, 88, 88);
        ctx.restore();
      }

      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;

      ctx.fillStyle = "#eef6ff";
      ctx.font = node.id === "001" ? "700 18px Arial" : "700 13px Arial";
      ctx.textAlign = "center";
      ctx.fillText(node.title, 0, node.id === "001" ? 7 : 4);

      ctx.fillStyle = color;
      ctx.font = "10px Arial";
      ctx.fillText(node.date, 0, node.id === "001" ? 28 : 23);

      ctx.restore();
    };

    const drawConnection = (
      a: VoidNode,
      b: VoidNode,
      t: number,
      strong = false
    ) => {
      const pa = worldToScreen(a.x, a.y);
      const pb = worldToScreen(b.x, b.y);

      const mx = (pa.x + pb.x) / 2 + Math.sin(t + a.x * 0.01) * 40;
      const my = (pa.y + pb.y) / 2 + Math.cos(t + b.y * 0.01) * 40;

      const grad = ctx.createLinearGradient(pa.x, pa.y, pb.x, pb.y);
      grad.addColorStop(0, "rgba(125,183,255,0.08)");
      grad.addColorStop(0.5, strong ? "rgba(255,255,255,0.72)" : "rgba(125,183,255,0.32)");
      grad.addColorStop(1, "rgba(183,140,255,0.08)");

      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = grad;
      ctx.lineWidth = strong ? 1.2 : 0.55;
      ctx.setLineDash([7, 12]);
      ctx.lineDashOffset = -t * 28;
      ctx.beginPath();
      ctx.moveTo(pa.x, pa.y);
      ctx.quadraticCurveTo(mx, my, pb.x, pb.y);
      ctx.stroke();

      for (let i = 0; i < 4; i++) {
        const k = (t * 0.12 + i * 0.22) % 1;
        const x =
          (1 - k) * (1 - k) * pa.x +
          2 * (1 - k) * k * mx +
          k * k * pb.x;
        const y =
          (1 - k) * (1 - k) * pa.y +
          2 * (1 - k) * k * my +
          k * k * pb.y;

        ctx.fillStyle = "rgba(255,255,255,0.85)";
        ctx.beginPath();
        ctx.arc(x, y, strong ? 2.6 : 1.6, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
      ctx.setLineDash([]);
    };

    const draw = () => {
      frame += 0.016;
      const t = frame;
      const currentNodes = nodesRef.current;

      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      ctx.fillStyle = "#020306";
      ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

      for (let i = 0; i < 120; i++) {
        const x = (Math.sin(i * 91.7) * 0.5 + 0.5) * window.innerWidth;
        const y = (Math.cos(i * 57.3 + t * 0.15) * 0.5 + 0.5) * window.innerHeight;
        ctx.fillStyle = "rgba(125,183,255,0.18)";
        ctx.beginPath();
        ctx.arc(x, y, i % 3 === 0 ? 1.2 : 0.6, 0, Math.PI * 2);
        ctx.fill();
      }

      const core = currentNodes[0];

      currentNodes.forEach((node, i) => {
        if (node.id !== core.id) {
          drawConnection(core, node, t, selectedRef.current === node.id);
        }

        const next = currentNodes[i + 1];
        if (next) drawConnection(node, next, t, false);
      });

      currentNodes.forEach((node) => drawNode(node, t));

      raf = requestAnimationFrame(draw);
    };

    resize();
    draw();

    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  const canvasClick = (e: React.MouseEvent) => {
    if (dragging) return;

    const cam = cameraRef.current;
    const sx = e.clientX;
    const sy = e.clientY;

    let closestId = "";
let closestDistance = Infinity;

nodesRef.current.forEach((node) => {
  const px = window.innerWidth / 2 + cam.x + node.x * cam.scale;
  const py = window.innerHeight / 2 + cam.y + node.y * cam.scale;
  const d = Math.hypot(px - sx, py - sy);

  if (d < 90 * cam.scale && d < closestDistance) {
    closestId = node.id;
    closestDistance = d;
  }
});

if (closestId) setSelectedId(closestId);
  };

  return (
    <main className="database">
      <canvas
        ref={canvasRef}
        className="canvas"
        onMouseDown={(e) => {
          setDragging(false);
          dragRef.current = { x: e.clientX, y: e.clientY };
        }}
        onMouseMove={(e) => {
          if (e.buttons !== 1 || view !== "synapse") return;

          const dx = e.clientX - dragRef.current.x;
          const dy = e.clientY - dragRef.current.y;

          if (Math.abs(dx) + Math.abs(dy) > 2) setDragging(true);

          setCamera((prev) => ({
            ...prev,
            x: prev.x + dx,
            y: prev.y + dy
          }));

          dragRef.current = { x: e.clientX, y: e.clientY };
        }}
        onMouseUp={canvasClick}
        onWheel={(e) => {
          if (view !== "synapse") return;
          setCamera((prev) => ({
            ...prev,
            scale: Math.min(2.4, Math.max(0.45, prev.scale - e.deltaY * 0.001))
          }));
        }}
      />

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
            SYNAPSE VIEW
          </button>
          <button
            className={view === "timeline" ? "active" : ""}
            onClick={() => setView("timeline")}
          >
            TIMELINE VIEW
          </button>
        </div>
      </header>

      <aside className="panel leftPanel">
        <p className="panelLabel">ADD NEW MEMORY</p>

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
          onChange={(e) => setForm({ ...form, type: e.target.value as NodeType })}
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

        <button onClick={addNode}>ADD NODE</button>
        <button className="ghost" onClick={resetNodes}>
          RESET DATABASE
        </button>

        <p className="hint">drag = move / wheel = zoom / click = select</p>
      </aside>

      {view === "timeline" && (
        <section className="timelineView">
          {sortedNodes.map((node) => (
            <button
              key={node.id}
              className={`timelineItem ${selectedId === node.id ? "active" : ""}`}
              onClick={() => setSelectedId(node.id)}
            >
              <span>{node.date}</span>
              <h2>{node.title}</h2>
              <p>{node.body}</p>
              {node.image && <img src={node.image} alt="" />}
            </button>
          ))}
        </section>
      )}

      <aside className="panel rightPanel">
        <p className="panelLabel">MEMORY DETAILS</p>

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
