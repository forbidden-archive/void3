"use client";

import { useEffect, useState } from "react";

const logs = [
  ["01", "VOIDの定義", "社会に価値を与えたことで、社会から切り離された存在。"],
  ["02", "下を向く人々", "スマホによって人の視線は下へ向かう。"],
  ["03", "上にある電波塔", "通信を支える塔は上にあるが、誰も見上げない。"],
  ["04", "人を繋げるVOID", "電波塔は人を繋げたことで、自らVOIDになった。"]
];

export default function Home() {
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [progress, setProgress] = useState(0);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const move = (e: MouseEvent) => {
      setMouse({
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2
      });
    };

    const scroll = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(h > 0 ? Math.round((window.scrollY / h) * 100) : 0);
    };

    window.addEventListener("mousemove", move);
    window.addEventListener("scroll", scroll);
    scroll();

    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("scroll", scroll);
    };
  }, []);

  return (
    <main>
      <div className="cursor" style={{ left: `${50 + mouse.x * 50}%`, top: `${50 + mouse.y * 50}%` }} />
      <div className="scroll">SCROLL {progress}%</div>

      <header className="menu">
        <span>VOID TOWER ARCHIVE</span>
        <span>2026</span>
      </header>

      <section className="hero">
        <div className="scan" />
        <div className="bgText">SIGNAL / VOID / GAZE / CONNECT /</div>

        <div className="heroContent">
          <p className="label">DESIGN 3 / RESEARCH DATABASE</p>
          <h1>CONNECTING<br />VOID</h1>
          <p className="lead">
            人々をつなげているものが、最も人々から切り離されている。
          </p>
        </div>

        <svg
          className="tower"
          style={{
            transform: `rotateY(${mouse.x * 22}deg) rotateX(${-mouse.y * 12}deg)`
          }}
          viewBox="0 0 300 700"
        >
          <line x1="110" y1="690" x2="145" y2="80" />
          <line x1="190" y1="690" x2="155" y2="80" />
          <line x1="110" y1="690" x2="190" y2="690" />
          <line x1="120" y1="560" x2="180" y2="560" />
          <line x1="130" y1="430" x2="170" y2="430" />
          <line x1="140" y1="300" x2="160" y2="300" />
          <line x1="110" y1="690" x2="180" y2="560" />
          <line x1="190" y1="690" x2="120" y2="560" />
          <line x1="120" y1="560" x2="170" y2="430" />
          <line x1="180" y1="560" x2="130" y2="430" />
          <line x1="130" y1="430" x2="160" y2="300" />
          <line x1="170" y1="430" x2="140" y2="300" />
          <circle cx="150" cy="80" r="44" />
          <circle cx="150" cy="80" r="76" />
          <line x1="74" y1="80" x2="226" y2="80" />
          <line x1="150" y1="4" x2="150" y2="156" />
        </svg>
      </section>

      <section className="statement">
        <p className="small">VOID DEFINITION</p>
        <h2>社会に価値を与えたことで、<br />社会から切り離された存在。</h2>
      </section>

      <section className="logs">
        {logs.map((log, i) => (
          <button
            className={`log ${active === i ? "active" : ""}`}
            key={log[0]}
            onClick={() => setActive(i)}
          >
            <span>{log[0]}</span>
            <h3>{log[1]}</h3>
            <p>{log[2]}</p>
          </button>
        ))}
      </section>
    </main>
  );
}
