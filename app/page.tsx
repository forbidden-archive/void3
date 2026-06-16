export default function Home() {
  return (
    <main>
      <header className="menu">
        <span>VOID TOWER ARCHIVE</span>
        <span>2026</span>
      </header>

      <section className="hero">
        <div className="bgText">
          SIGNAL / VOID / TOWER / GAZE / CONNECT
        </div>

        <div className="heroContent">
          <p className="label">DESIGN 3</p>

          <h1>
            CONNECTING
            <br />
            VOID
          </h1>

          <p className="lead">
            人々をつなげているものが、
            最も人々から切り離されている。
          </p>
        </div>

        <svg className="tower" viewBox="0 0 300 700">
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

        <h2>
          社会に価値を与えたことで、
          <br />
          社会から切り離された存在。
        </h2>
      </section>

      <section className="logs">
        <div className="log">
          <span>01</span>
          <h3>VOIDの定義</h3>
          <p>
            VOIDとは社会に価値を与えたことで、
            社会から切り離された存在である。
          </p>
        </div>

        <div className="log">
          <span>02</span>
          <h3>下を向く人々</h3>
          <p>
            通学路で多くの人がスマホを見ながら歩いていた。
          </p>
        </div>

        <div className="log">
          <span>03</span>
          <h3>上にある電波塔</h3>
          <p>
            通信を支える塔は常に上にある。
          </p>
        </div>

        <div className="log">
          <span>04</span>
          <h3>人を繋げるVOID</h3>
          <p>
            電波塔は人を繋げたことでVOIDになった。
          </p>
        </div>
      </section>
    </main>
  );
}
