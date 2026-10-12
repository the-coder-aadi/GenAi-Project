import { useEffect, useState } from "react";
const logoSrc = "/medhaai.png";
import "./MedhaSplashLoader.css";

/* ============================================================
   TUNING CONSTANTS – change things here
   ============================================================ */

// Timeline in ms, written for a 3000ms animation.
// If you pass a different `duration` prop, everything scales proportionally.
const BASE_DURATION = 3000;
const TIMELINE = {
  bookFadeIn:   { delay: 0,    duration: 400  }, // closed book appears
  bookOpen:     { delay: 400,  duration: 900  }, // pages swing open
  stageSettle:  { delay: 400,  duration: 2200 }, // book glides from screen-centre to final spot
  mRise:        { delay: 900,  duration: 1300 }, // M rises out of the book
  leavesReveal: { delay: 1800, duration: 800  }, // flame/leaves appear
};

// Easing
const EASE_SOFT = "cubic-bezier(0.65, 0, 0.35, 1)"; // ease-in-out
const EASE_OUT  = "cubic-bezier(0.22, 1, 0.36, 1)"; // gentle deceleration, no overshoot

// Fade-out when isLoading becomes false (ms)
const EXIT_FADE_MS = 300;

// Splash background (the logo PNG has a white background, so keep it white)
const BACKGROUND_CLASS = "bg-white";

// Logo size: responsive, never overflows, aspect ratio kept by the <img>
const LOGO_WIDTH = "min(72vw, clamp(150px, 44vmin, 380px))";

// Geometry, in % of the logo image. Tuned to the supplied logo.
// If the animation shows cut-off pieces, nudge these.
const BOOK_TOP   = 75.5; // y where the book starts (below the M's serifs)
const M_TOP      = 29.5; // y where M serifs/head start (above = leaves zone)
const CENTER_L   = 41;   // x range of the "leaves" zone between the serifs
const CENTER_R   = 69.5;
const LEAF_BAND_BOTTOM = 35.5; // how far the leaves zone reaches down in the middle
const LEAF_X_MIN = 28;
const LEAF_X_MAX = 75;

// Motion amounts
const BOOK_CLOSED_ANGLE = "70deg"; // how far the pages are folded when "closed"
const STAGE_START_OFFSET = "-37%"; // closed book starts at screen centre
const M_START_OFFSET = "47%";      // M starts fully hidden below the book line
const LEAF_START_OFFSET = "5%";

/* ============================================================
   Clip paths (derived from the constants above)
   ============================================================ */
const CLIP = {
  window: `inset(0 0 ${100 - BOOK_TOP}% 0)`,
  bookLeft: `inset(${BOOK_TOP}% 50% 0 0)`,
  bookRight: `inset(${BOOK_TOP}% 0 0 50%)`,
  m: `polygon(0% ${M_TOP}%, ${CENTER_L}% ${M_TOP}%, ${CENTER_L}% ${LEAF_BAND_BOTTOM}%, ${CENTER_R}% ${LEAF_BAND_BOTTOM}%, ${CENTER_R}% ${M_TOP}%, 100% ${M_TOP}%, 100% 100%, 0% 100%)`,
  leaves: `polygon(${LEAF_X_MIN}% 0%, ${LEAF_X_MAX}% 0%, ${LEAF_X_MAX}% ${M_TOP}%, ${CENTER_R}% ${M_TOP}%, ${CENTER_R}% ${LEAF_BAND_BOTTOM}%, ${CENTER_L}% ${LEAF_BAND_BOTTOM}%, ${CENTER_L}% ${M_TOP}%, ${LEAF_X_MIN}% ${M_TOP}%)`,
};

const layerClass =
  "pointer-events-none absolute inset-0 block h-full w-full select-none";

export default function MedhaSplashLoader({ isLoading, duration = BASE_DURATION }) {
  const [mounted, setMounted] = useState(isLoading);
  const [leaving, setLeaving] = useState(false);

  // Show when loading starts; fade out + unmount when it ends.
  // (The only timer here is the 300ms exit fade, not a fake load.)
  useEffect(() => {
    if (isLoading) {
      setMounted(true);
      setLeaving(false);
      return;
    }
    setLeaving(true);
    const id = setTimeout(() => setMounted(false), EXIT_FADE_MS);
    return () => clearTimeout(id);
  }, [isLoading]);

  if (!mounted) return null;

  const k = duration / BASE_DURATION;
  const anim = (name, { delay, duration: d }, ease) =>
    `${name} ${d * k}ms ${ease} ${delay * k}ms both`;

  const T = TIMELINE;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading Medhā AI"
      data-leaving={leaving}
      className={`medha-splash fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden ${BACKGROUND_CLASS}`}
      style={{
        "--closed-angle": BOOK_CLOSED_ANGLE,
        "--stage-offset": STAGE_START_OFFSET,
        "--m-offset": M_START_OFFSET,
        "--leaf-offset": LEAF_START_OFFSET,
        "--exit-ms": `${EXIT_FADE_MS}ms`,
      }}
    >
      <div className="relative" style={{ width: LOGO_WIDTH }}>
        {/* FINAL STATE: the untouched original logo. Defines the box size and
            takes over at exactly `duration`. */}
        <img
          src={logoSrc}
          alt=""
          draggable={false}
          className="medha-final relative z-10 block h-auto w-full select-none"
          style={{
            opacity: 0,
            animation: `medha-show 1ms linear ${duration}ms forwards`,
          }}
        />

        {/* ANIMATED LAYERS (all are the same PNG, clipped) */}
        <div
          className="medha-layers absolute inset-0"
          aria-hidden="true"
          style={{
            perspective: "1200px",
            perspectiveOrigin: `50% ${BOOK_TOP + 12}%`,
            animation: [
              anim("medha-fade-in", T.bookFadeIn, "ease-out"),
              anim("medha-stage", T.stageSettle, EASE_SOFT),
              `medha-hide 1ms linear ${duration}ms forwards`,
            ].join(", "),
          }}
        >
          {/* Fixed window: everything above the book line. M rises through it. */}
          <div className="absolute inset-0" style={{ clipPath: CLIP.window }}>
            <img
              src={logoSrc}
              alt=""
              draggable={false}
              className={layerClass}
              style={{
                clipPath: CLIP.m,
                animation: anim("medha-m-rise", T.mRise, EASE_OUT),
              }}
            />
            <img
              src={logoSrc}
              alt=""
              draggable={false}
              className={layerClass}
              style={{
                clipPath: CLIP.leaves,
                animation: anim("medha-leaves", T.leavesReveal, EASE_OUT),
              }}
            />
          </div>

          {/* Book halves, hinged at the spine */}
          <img
            src={logoSrc}
            alt=""
            draggable={false}
            className={layerClass}
            style={{
              clipPath: CLIP.bookLeft,
              animation: anim("medha-book-left", T.bookOpen, EASE_SOFT),
            }}
          />
          <img
            src={logoSrc}
            alt=""
            draggable={false}
            className={layerClass}
            style={{
              clipPath: CLIP.bookRight,
              animation: anim("medha-book-right", T.bookOpen, EASE_SOFT),
            }}
          />
        </div>
      </div>
    </div>
  );
}