import { useEffect, useRef, useState } from "react";
import { initialNow, remaining } from "./countdown";
import "@fontsource/cinzel/latin-400.css";
import "@fontsource/manrope/latin-400.css";
import "@fontsource/manrope/latin-500.css";
import "./App.css";

const scenes = [
  {
    name: "Kokiri Forest",
    image: "kokiri.png",
    caption: "Where every legend begins.",
  },
  {
    name: "Hyrule Field",
    image: "hyrule.avif",
    caption: "A world worth returning to.",
  },
  {
    name: "The Great Deku Tree",
    image: "deku.avif",
    caption: "An ancient promise. A new beginning.",
  },
];

function Triforce({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 40 36"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M20 1 30 18H10ZM10 18 20 35H0ZM30 18 40 35H20Z" />
    </svg>
  );
}

function App() {
  const [origin] = useState(() => ({
    now: initialNow(),
    start: performance.now(),
  }));
  const [clock, setClock] = useState(() => remaining(origin.now));
  const [scene, setScene] = useState(0);
  const [sound, setSound] = useState(false);
  const [soundError, setSoundError] = useState("");
  const [copied, setCopied] = useState(false);
  const audio = useRef<AudioContext | null>(null);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  useEffect(() => {
    const update = () =>
      setClock(remaining(origin.now + performance.now() - origin.start));
    const timer = window.setInterval(update, 1000);
    document.addEventListener("visibilitychange", update);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", update);
    };
  }, [origin]);

  useEffect(
    () => () => {
      void audio.current?.close();
      clearTimeout(copyTimer.current);
    },
    [],
  );

  async function toggleSound() {
    if (audio.current) {
      await audio.current.close();
      audio.current = null;
      setSound(false);
      return;
    }
    try {
      const context = new AudioContext();
      audio.current = context;
      const volume = context.createGain();
      volume.gain.value = 0.035;
      volume.connect(context.destination);
      [146.83, 220, 293.66, 440.01].forEach((frequency) => {
        const oscillator = context.createOscillator();
        oscillator.type = "sine";
        oscillator.frequency.value = frequency;
        oscillator.connect(volume);
        oscillator.start();
      });
      await context.resume();
      setSound(true);
      setSoundError("");
    } catch {
      void audio.current?.close();
      audio.current = null;
      setSoundError("Sound is unavailable in this browser.");
    }
  }

  function saveDate() {
    const calendar = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Return to Hyrule//EN",
      "BEGIN:VEVENT",
      "UID:ocarina-20261105@return-to-hyrule.local",
      "DTSTAMP:20260930T000000Z",
      "DTSTART:20261105T050000Z",
      "DTEND:20261105T060000Z",
      "SUMMARY:Return to Hyrule — Ocarina of Time",
      "DESCRIPTION:The countdown ends. November 5 at midnight Eastern Time.",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    const url = URL.createObjectURL(
      new Blob([calendar], { type: "text/calendar;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "return-to-hyrule.ics";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function share() {
    const url = new URL(window.location.href);
    url.search = "";
    try {
      await navigator.clipboard.writeText(url.href);
      setCopied(true);
      clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
      setSoundError(
        "Could not copy the link. You can share the address from your browser.",
      );
    }
  }

  const released = clock.total === 0;

  return (
    <div className={`experience scene-${scene} ${released ? "released" : ""}`}>
      <div className="landscape" aria-hidden="true">
        {scenes.map((item, index) => (
          <img
            key={item.image}
            src={`/images/${item.image}`}
            className={scene === index ? "active" : ""}
            alt=""
          />
        ))}
      </div>
      <div className="shade" />
      <div className="fireflies" aria-hidden="true">
        {Array.from({ length: 17 }, (_, i) => (
          <i
            key={i}
            style={{
              left: `${(i * 31 + 7) % 100}%`,
              top: `${(i * 17 + 23) % 100}%`,
              animationDelay: `${i * -1.7}s`,
            }}
          />
        ))}
      </div>
      <header>
        <a className="wordmark" href="#main">
          <Triforce />
          <span>RETURN TO HYRULE</span>
        </a>
        <div className="platform">
          <span className="switch-symbol" aria-hidden="true">
            ◖◗
          </span>
          <span>
            NINTENDO
            <br />
            <b>SWITCH 2</b>
          </span>
        </div>
      </header>
      <main id="main">
        <div className="hero-content">
          <div className="eyebrow">
            <span /> THE LEGEND REAWAKENS <span />
          </div>
          <h1>
            <span className="legend">THE LEGEND OF</span>
            <span className="zelda">ZELDA</span>
            <span className="ocarina">OCARINA OF TIME</span>
          </h1>
          <div className="remake">REIMAGINED FOR NINTENDO SWITCH 2</div>
          <div className="ornament" aria-hidden="true">
            <span />
            <Triforce />
            <span />
          </div>
          <p className="countdown-intro">
            {released
              ? "The wait is over. Your adventure begins."
              : "Time passes. The legend never fades."}
          </p>
          <time
            dateTime={clock.duration}
            aria-label={
              released
                ? "The countdown is complete"
                : `${clock.values[0]} days, ${clock.values[1]} hours, ${clock.values[2]} minutes, ${clock.values[3]} seconds remaining`
            }
          >
            {clock.values.map((value, index) => (
              <span className="time-unit" key={index}>
                <span className="digits">{String(value).padStart(2, "0")}</span>
                <span className="unit-label">
                  {["DAYS", "HOURS", "MINUTES", "SECONDS"][index]}
                </span>
              </span>
            ))}
          </time>
          <div className="release-date">
            <span className="live-dot" />
            {released ? "WELCOME BACK TO HYRULE" : "NOVEMBER 05, 2026"}
            <span className="date-separator">/</span>
            <span>{released ? "THE TIME HAS COME" : "MIDNIGHT ET"}</span>
          </div>
          <div className="actions">
            <button className="primary-button" onClick={saveDate}>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
                aria-hidden="true"
              >
                <rect x="4" y="6" width="16" height="15" rx="1" />
                <path d="M8 3v6m8-6v6M4 12h16m-11 4h6" />
              </svg>
              Save the date<span>↗</span>
            </button>
            <button className="share-button" onClick={share}>
              {copied ? "Link copied" : "Share the moment"}
              <span aria-hidden="true">{copied ? "✓" : "↗"}</span>
            </button>
          </div>
          <p className="sr-only" role="status">
            {released
              ? "The countdown is complete. Welcome back to Hyrule."
              : ""}
            {copied ? "Link copied to clipboard." : ""}
            {soundError}
          </p>
        </div>
      </main>
      <section className="scene-bar" aria-label="Choose your view of Hyrule">
        <div className="scene-description">
          <span className="small-label">A WINDOW INTO HYRULE</span>
          <p>{scenes[scene].caption}</p>
        </div>
        <div className="scene-options">
          {scenes.map((item, index) => (
            <button
              key={item.name}
              className={`scene-button ${scene === index ? "selected" : ""}`}
              onClick={() => setScene(index)}
              aria-pressed={scene === index}
            >
              <img src={`/images/${item.image}`} alt="" />
              <span className="scene-number">0{index + 1}</span>
              <span className="scene-name">{item.name}</span>
            </button>
          ))}
        </div>
        <button
          className={`sound-button ${sound ? "playing" : ""}`}
          onClick={() => void toggleSound()}
          aria-pressed={sound}
        >
          <span className="sound-bars" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
          </span>
          <span>AMBIENCE {sound ? "ON" : "OFF"}</span>
        </button>
      </section>
      <footer>
        <span>AN UNOFFICIAL TRIBUTE TO A TIMELESS ADVENTURE</span>
        <span>ALL THE TIME IN THE WORLD. UNTIL IT’S TIME.</span>
        <span>© NINTENDO · FAN CONCEPT</span>
      </footer>
    </div>
  );
}

export default App;
