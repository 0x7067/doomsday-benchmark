import { useEffect, useRef, useState } from "react";
import { createClock, getRemaining } from "./countdown";
import "./App.css";

const scenes = [
  {
    name: "Kokiri Forest",
    subtitle: "Where the journey begins",
    image: "kokiri.webp",
    number: "01",
  },
  {
    name: "The Great Deku Tree",
    subtitle: "An ancient guardian awaits",
    image: "deku.avif",
    number: "02",
  },
  {
    name: "Hyrule Field",
    subtitle: "Beyond the familiar horizon",
    image: "hyrule.avif",
    number: "03",
  },
];

function Triforce({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 40 35"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M20 1 30 18H10ZM10 18 20 35H0ZM30 18 40 35H20Z" />
    </svg>
  );
}

function SoundIcon({ active }: { active: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <path d="M4 9h4l5-4v14l-5-4H4Z" />
      {active ? (
        <>
          <path d="M16 8c3 2 3 6 0 8M19 5c5 4 5 10 0 14" />
        </>
      ) : (
        <path d="m17 9 5 6m0-6-5 6" />
      )}
    </svg>
  );
}

function App() {
  const [clock] = useState(createClock);
  const [remaining, setRemaining] = useState(() => getRemaining(clock()));
  const [scene, setScene] = useState(0);
  const [sound, setSound] = useState(false);
  const [focused, setFocused] = useState(false);
  const [notice, setNotice] = useState("");
  const audio = useRef<AudioContext | null>(null);
  const released = remaining.total === 0;

  useEffect(() => {
    const tick = () => setRemaining(getRemaining(clock()));
    const interval = window.setInterval(tick, 250);
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [clock]);

  useEffect(() => {
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFocused(false);
    };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, []);

  useEffect(
    () => () => {
      void audio.current?.close();
    },
    [],
  );

  async function toggleSound() {
    try {
      if (audio.current?.state === "running") {
        await audio.current.suspend();
        setSound(false);
        return;
      }
      if (!audio.current) {
        const context = new AudioContext();
        const master = context.createGain();
        master.gain.value = 0.035;
        master.connect(context.destination);
        [146.83, 220, 293.66, 440.5].forEach((frequency, index) => {
          const oscillator = context.createOscillator();
          const gain = context.createGain();
          oscillator.type = "sine";
          oscillator.frequency.value = frequency;
          gain.gain.value = index === 0 ? 0.5 : 0.18;
          oscillator.connect(gain);
          gain.connect(master);
          oscillator.start();
        });
        audio.current = context;
      }
      await audio.current.resume();
      setSound(true);
    } catch {
      setNotice("Ambient audio is unavailable in this browser.");
    }
  }

  function saveReminder() {
    const calendar = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Hyrule Countdown//EN",
      "BEGIN:VEVENT",
      "UID:ocarina-2026@hyrule-countdown.local",
      "DTSTAMP:20260101T000000Z",
      "DTSTART:20261105T050000Z",
      "DTEND:20261105T051500Z",
      "SUMMARY:Ocarina of Time — The return to Hyrule",
      "DESCRIPTION:Release countdown target: November 5 at midnight Eastern Time.",
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
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice(
      "Reminder downloaded. Open it in your calendar to save the date.",
    );
  }

  return (
    <div
      className={`experience ${focused ? "is-focused" : ""} ${released ? "is-released" : ""}`}
    >
      <section className="hero" aria-label="Release countdown">
        <div className="landscapes" aria-hidden="true">
          {scenes.map((item, index) => (
            <img
              key={item.image}
              className={index === scene ? "landscape active" : "landscape"}
              src={`./images/${item.image}`}
              alt=""
            />
          ))}
        </div>
        <div className="shade" />
        <div className="motes" aria-hidden="true">
          {Array.from({ length: 18 }, (_, i) => (
            <i
              key={i}
              style={
                {
                  "--x": `${(i * 37 + 13) % 100}%`,
                  "--y": `${(i * 23 + 9) % 100}%`,
                  "--delay": `${-i * 1.7}s`,
                  "--speed": `${9 + (i % 7)}s`,
                } as React.CSSProperties
              }
            />
          ))}
        </div>
        <header className="header">
          <a className="brand" href="#" aria-label="Hyrule countdown home">
            <Triforce />
            <span>
              THE LEGEND OF ZELDA
              <span className="brand-sub">OCARINA OF TIME</span>
            </span>
          </a>
          <div className="header-right">
            <span className="platform">
              NINTENDO SWITCH <b>2</b>
            </span>
            <span className="header-divider" />
            <button
              className="sound-button"
              onClick={() => void toggleSound()}
              aria-pressed={sound}
            >
              <SoundIcon active={sound} />
              <span>AMBIENCE {sound ? "ON" : "OFF"}</span>
            </button>
          </div>
        </header>
        <main className="hero-content">
          <div className="intro">
            <p className="eyebrow">
              <span /> THE RETURN TO HYRULE
            </p>
            <h1>
              {released ? (
                <>
                  The time
                  <br />
                  has come.
                </>
              ) : (
                <>
                  A legend.
                  <br />
                  <em>Reawakened.</em>
                </>
              )}
            </h1>
            <p className="intro-copy">
              {released
                ? "A new dawn. A familiar world. Your adventure awaits."
                : "The world you remember. The adventure you never forgot."}
            </p>
          </div>
          <div className="clock-section">
            <div className="clock-heading">
              <span className="rule" />
              <Triforce />
              <p>
                {released
                  ? "YOUR NEXT CHAPTER BEGINS"
                  : "EVERY SECOND BRINGS US CLOSER"}
              </p>
              <span className="rule" />
            </div>
            <time className="sr-only" dateTime={remaining.duration}>
              {remaining.description} remaining
            </time>
            <div className="countdown" aria-hidden="true">
              {remaining.values.map((value, index) => (
                <div className="clock-unit" key={index}>
                  <span
                    className={`digits ${index === 3 ? "seconds" : ""}`}
                    key={index === 3 ? value : index}
                  >
                    {String(value).padStart(2, "0")}
                  </span>
                  <span className="unit-label">
                    {["DAYS", "HOURS", "MINUTES", "SECONDS"][index]}
                  </span>
                  {index < 3 && <span className="colon">:</span>}
                </div>
              ))}
            </div>
            <div className="release-line">
              <span className="small-diamond" />
              <span>NOVEMBER 5, 2026</span>
              <span className="date-divider">/</span>
              <span>MIDNIGHT ET</span>
              <span className="small-diamond" />
            </div>
            <div className="hero-actions">
              <button className="primary-button" onClick={saveReminder}>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  aria-hidden="true"
                >
                  <rect x="4" y="5" width="16" height="16" rx="1" />
                  <path d="M8 2v6m8-6v6M4 11h16m-8 3v4m-2-2h4" />
                </svg>
                SAVE THE DATE<span>↗</span>
              </button>
              <button
                className="focus-button"
                onClick={() => setFocused(!focused)}
                aria-pressed={focused}
              >
                <span className="focus-icon">⌗</span>
                {focused ? "EXIT FOCUS" : "FOCUS MODE"}
              </button>
            </div>
            <p className="notice" role="status">
              {notice}
            </p>
          </div>
        </main>
        <div className="hero-bottom">
          <div className="scene-selector" aria-label="Choose a landscape">
            {scenes.map((item, index) => (
              <button
                key={item.name}
                onClick={() => setScene(index)}
                aria-pressed={scene === index}
                aria-label={`Show ${item.name}`}
                className={scene === index ? "selected" : ""}
              >
                {item.number}
                <span />
              </button>
            ))}
            <span className="scene-name">{scenes[scene].name}</span>
          </div>
          <a className="explore" href="#discover">
            REDISCOVER HYRULE <span>↓</span>
          </a>
          <span className="live-label">
            <i />
            {released ? "THE WAIT IS OVER" : "THE COUNTDOWN IS LIVE"}
          </span>
        </div>
      </section>
      <section id="discover" className="discover">
        <div className="discover-heading">
          <div>
            <p className="eyebrow">A WORLD WORTH RETURNING TO</p>
            <h2>Some adventures stay with you.</h2>
          </div>
          <p>
            From the first steps in Kokiri Forest to the open skies of Hyrule. A
            familiar feeling. A new beginning.
          </p>
        </div>
        <div className="scene-cards">
          {scenes.map((item, index) => (
            <button
              key={item.name}
              className="scene-card"
              onClick={() => {
                setScene(index);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              <img
                src={`./images/${item.image}`}
                alt={
                  index === 0
                    ? "Link and a glowing fairy in the lush Kokiri Forest"
                    : index === 1
                      ? "Link standing before the enormous Great Deku Tree"
                      : "Link on Epona overlooking Death Mountain"
                }
                loading="lazy"
              />
              <span className="card-content">
                <span className="card-number">{item.number} / HYRULE</span>
                <strong>{item.name}</strong>
                <span>{item.subtitle}</span>
              </span>
              <span className="card-arrow">↗</span>
            </button>
          ))}
        </div>
      </section>
      <footer>
        <Triforce />
        <p>A tribute to the adventure that started it all.</p>
        <span>
          Unofficial fan experience · Not affiliated with Nintendo.
          <br />
          Countdown date supplied for this concept.
        </span>
      </footer>
      {focused && (
        <button className="exit-focus" onClick={() => setFocused(false)}>
          EXIT FOCUS <span>ESC</span>
        </button>
      )}
    </div>
  );
}

export default App;
