import { useEffect, useRef, useState } from "react";
import "./HeroIntro.css";

const COUNT_TARGET = 10;      // ᴺ0 → ᴺ10
const COUNT_DURATION = 1600;  // ms
const HOLD_MS = 350;          // pause on final number before reveal

// Set to true if the intro should play only once per browser session
const ONCE_PER_SESSION = false;

export default function HeroIntro() {
  const [phase, setPhase] = useState("loading"); // "loading" | "revealing" | "done"
  const [count, setCount] = useState(0);
  const barRef = useRef(null);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const seen = ONCE_PER_SESSION && sessionStorage.getItem("opt_intro_seen");

    if (reduced || seen) {
      setPhase("done");
      return;
    }

    let raf = 0;
    const start = performance.now();

    const tick = (now) => {
      const p = Math.min((now - start) / COUNT_DURATION, 1);
      const eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
      setCount(Math.round(eased * COUNT_TARGET));
      if (barRef.current) barRef.current.style.width = `${eased * 100}%`;
      if (p < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        setTimeout(() => {
          setPhase("revealing");
          if (ONCE_PER_SESSION) sessionStorage.setItem("opt_intro_seen", "1");
          setTimeout(() => setPhase("done"), 1400);
        }, HOLD_MS);
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className={`opt-hero-root opt-${phase}`}>
      {/* ---------- PRELOADER ---------- */}
      {phase !== "done" && (
        <div className="opt-loader" aria-hidden="true">
          <span className="opt-corner opt-tl">OnlinePT.in</span>
          <span className="opt-corner opt-tr">● Live sessions</span>
          <span className="opt-corner opt-bl">Virtual clinic</span>
          <span className="opt-corner opt-br">Physio, online</span>
          <div className="opt-counter">
            <span className="opt-prefix">ᴺ</span>
            <span className="opt-num">{count}</span>
          </div>
          <div className="opt-bar" ref={barRef} />
        </div>
      )}

      {/* ---------- WIPE PANELS ---------- */}
      {phase !== "done" && (
        <div className="opt-wipe" aria-hidden="true">
          <span /><span /><span /><span /><span />
        </div>
      )}

      {/* ---------- HERO ---------- */}
      <section className="opt-hero">
        <div className="opt-glow" aria-hidden="true" />

        <div className="opt-main">
          <div className="opt-eyebrow">Virtual physical therapy · Wherever you are</div>
          <h1 className="opt-h1">
            <span className="opt-line"><span>Recover at home,</span></span>
            <span className="opt-line"><span>guided by a</span></span>
            <span className="opt-line"><span><span className="opt-accent">real physiotherapist.</span></span></span>
          </h1>
          <p className="opt-sub">
            Video consultations, personalised exercise plans, and progress
            tracking — from first assessment to full recovery, without
            leaving your home.
          </p>
          <div className="opt-actions">
            <a className="opt-btn opt-btn-primary" href="#signup">Start your recovery</a>
            <a className="opt-btn opt-btn-ghost" href="#features">How it works</a>
          </div>
        </div>

        <div className="opt-foot">
          <div className="opt-stat"><b>10+</b> Conditions treated</div>
          <div className="opt-stat"><b>1:1</b> Live video sessions</div>
          <div className="opt-stat"><b>Worldwide</b> Consult from anywhere</div>
        </div>
      </section>
    </div>
  );
}
