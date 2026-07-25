import type { JSX } from "react";

/**
 * A small original sticker pack. Every sticker here is hand-drawn flat-vector
 * doodle art invented for this app — no real people, idols, or copyrighted
 * characters. Sticker messages store just the `id` below; the component is
 * looked up locally, so sending one never needs an upload.
 */

export type StickerId =
  | "chibi-wave"
  | "chibi-heart-eyes"
  | "chibi-dance"
  | "chibi-sleepy"
  | "chibi-blush"
  | "chibi-shy"
  | "chibi-laugh"
  | "chibi-wink"
  | "chibi-cry"
  | "chibi-angry"
  | "chibi-cool"
  | "chibi-kiss"
  | "chibi-starstruck"
  | "chibi-thumbs-up"
  | "chibi-hug"
  | "chibi-party"
  | "chibi-nervous"
  | "chibi-love-struck"
  | "sunflower"
  | "rose"
  | "tulip"
  | "daisy"
  | "cherry-blossom"
  | "bouquet"
  | "flower-heart"
  | "confetti-hearts"
  | "heart-balloon"
  | "love-letter"
  | "teddy-bear"
  | "cupcake"
  | "coffee-cup"
  | "moon-stars"
  | "rainbow"
  | "gift-box"
  | "paper-plane"
  | "music-notes"
  | "holding-hands"
  | "couple-hug"
  | "kiss-mark";

export const STICKER_IDS: StickerId[] = [
  "chibi-wave",
  "chibi-heart-eyes",
  "chibi-dance",
  "chibi-sleepy",
  "chibi-blush",
  "chibi-shy",
  "chibi-laugh",
  "chibi-wink",
  "chibi-cry",
  "chibi-angry",
  "chibi-cool",
  "chibi-kiss",
  "chibi-starstruck",
  "chibi-thumbs-up",
  "chibi-hug",
  "chibi-party",
  "chibi-nervous",
  "chibi-love-struck",
  "sunflower",
  "rose",
  "tulip",
  "daisy",
  "cherry-blossom",
  "bouquet",
  "flower-heart",
  "confetti-hearts",
  "heart-balloon",
  "love-letter",
  "teddy-bear",
  "cupcake",
  "coffee-cup",
  "moon-stars",
  "rainbow",
  "gift-box",
  "paper-plane",
  "music-notes",
  "holding-hands",
  "couple-hug",
  "kiss-mark",
];

export const STICKER_LABELS: Record<StickerId, string> = {
  "chibi-wave": "Waving hello",
  "chibi-heart-eyes": "Heart eyes",
  "chibi-dance": "Happy dance",
  "chibi-sleepy": "Sleepy",
  "chibi-blush": "Blushing",
  "chibi-shy": "Shy giggle",
  "chibi-laugh": "LOL",
  "chibi-wink": "Wink",
  "chibi-cry": "Crying",
  "chibi-angry": "Grumpy",
  "chibi-cool": "Feeling cool",
  "chibi-kiss": "Blowing a kiss",
  "chibi-starstruck": "Starstruck",
  "chibi-thumbs-up": "Thumbs up",
  "chibi-hug": "Sending a hug",
  "chibi-party": "Party time",
  "chibi-nervous": "Nervous",
  "chibi-love-struck": "Love struck",
  sunflower: "Sunflower",
  rose: "Rose",
  tulip: "Tulip",
  daisy: "Daisy",
  "cherry-blossom": "Cherry blossom",
  bouquet: "Bouquet",
  "flower-heart": "Flower heart",
  "confetti-hearts": "Confetti hearts",
  "heart-balloon": "Heart balloon",
  "love-letter": "Love letter",
  "teddy-bear": "Teddy bear",
  cupcake: "Cupcake",
  "coffee-cup": "Coffee",
  "moon-stars": "Goodnight",
  rainbow: "Rainbow",
  "gift-box": "Gift",
  "paper-plane": "Paper plane",
  "music-notes": "Music notes",
  "holding-hands": "Holding hands",
  "couple-hug": "Couple hug",
  "kiss-mark": "Kiss mark",
};

function Face({
  hair = "#4a3728",
  skin = "#ffe0c2",
  cheeks = true,
  eyes,
  mouth,
  extra,
}: {
  hair?: string;
  skin?: string;
  cheeks?: boolean;
  eyes: JSX.Element;
  mouth: JSX.Element;
  extra?: JSX.Element;
}) {
  return (
    <g>
      {/* body */}
      <path d="M40 92c0-16 13-24 24-24s24 8 24 24v10H40V92z" fill="#F6C945" />
      {/* head */}
      <circle cx="64" cy="52" r="30" fill={skin} />
      {/* hair */}
      <path
        d="M34 50c-2-20 13-33 30-33s32 13 30 33c-6-8-14-4-18-10-6 8-16 8-24 2-6 6-14 4-18 8z"
        fill={hair}
      />
      {eyes}
      {cheeks && (
        <>
          <ellipse cx="48" cy="58" rx="5" ry="3.5" fill="#ffb3ba" opacity="0.8" />
          <ellipse cx="80" cy="58" rx="5" ry="3.5" fill="#ffb3ba" opacity="0.8" />
        </>
      )}
      {mouth}
      {extra}
    </g>
  );
}

function StickerFrame({ children }: { children: JSX.Element }) {
  return (
    <svg viewBox="0 0 128 128" className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
      {children}
    </svg>
  );
}

export function StickerArt({ id, className }: { id: StickerId; className?: string }) {
  return <div className={className}>{STICKER_ART[id]}</div>;
}

const STICKER_ART: Record<StickerId, JSX.Element> = {
  "chibi-wave": (
    <StickerFrame>
      <Face
        eyes={
          <>
            <path
              d="M52 50a4 4 0 0 1 8 0"
              stroke="#2a2a2a"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M68 50a4 4 0 0 1 8 0"
              stroke="#2a2a2a"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
            />
          </>
        }
        mouth={
          <path
            d="M56 66q8 8 16 0"
            stroke="#2a2a2a"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />
        }
        extra={
          <g>
            <circle cx="100" cy="60" r="9" fill="#ffe0c2" />
            <path d="M96 44l8 20" stroke="#ffe0c2" strokeWidth="9" strokeLinecap="round" />
          </g>
        }
      />
    </StickerFrame>
  ),
  "chibi-heart-eyes": (
    <StickerFrame>
      <Face
        eyes={
          <>
            <path d="M48 54l-4-4 4-4 4 4z" fill="#e8607a" transform="translate(0,2) scale(1)" />
            <path d="M44 50c0-3 4-5 6-2 2-3 6-1 6 2 0 3-6 8-6 8s-6-5-6-8z" fill="#e8607a" />
            <path d="M72 50c0-3 4-5 6-2 2-3 6-1 6 2 0 3-6 8-6 8s-6-5-6-8z" fill="#e8607a" />
          </>
        }
        mouth={<ellipse cx="64" cy="66" rx="6" ry="4" fill="#c2455f" />}
      />
    </StickerFrame>
  ),
  "chibi-dance": (
    <StickerFrame>
      <g>
        <path d="M36 96c2-18 14-26 28-26s26 8 28 26v6H36v-6z" fill="#F6C945" />
        <circle cx="64" cy="52" r="30" fill="#ffe0c2" />
        <path
          d="M34 50c-2-20 13-33 30-33s32 13 30 33c-6-8-14-4-18-10-6 8-16 8-24 2-6 6-14 4-18 8z"
          fill="#4a3728"
        />
        <path
          d="M52 50a4 4 0 0 1 8 0"
          stroke="#2a2a2a"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M68 50a4 4 0 0 1 8 0"
          stroke="#2a2a2a"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
        />
        <ellipse cx="48" cy="58" rx="5" ry="3.5" fill="#ffb3ba" opacity="0.8" />
        <ellipse cx="80" cy="58" rx="5" ry="3.5" fill="#ffb3ba" opacity="0.8" />
        <ellipse cx="64" cy="66" rx="7" ry="5" fill="#c2455f" />
        <path d="M38 88l-14-14" stroke="#ffe0c2" strokeWidth="9" strokeLinecap="round" />
        <path d="M90 88l14-14" stroke="#ffe0c2" strokeWidth="9" strokeLinecap="round" />
        <path d="M18 24l4 8-4 8-4-8z" fill="#F6C945" />
        <path d="M108 20l4 8-4 8-4-8z" fill="#e8a13d" />
        <path d="M100 96l4 7-4 7-4-7z" fill="#e8607a" />
      </g>
    </StickerFrame>
  ),
  "chibi-sleepy": (
    <StickerFrame>
      <Face
        eyes={
          <>
            <path
              d="M48 52q4-3 8 0"
              stroke="#2a2a2a"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M72 52q4-3 8 0"
              stroke="#2a2a2a"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
            />
          </>
        }
        mouth={<circle cx="64" cy="66" r="3" fill="#2a2a2a" />}
        extra={
          <g fill="#9aa3d1" fontFamily="ui-sans-serif" fontWeight="700">
            <text x="86" y="32" fontSize="12">
              z
            </text>
            <text x="96" y="22" fontSize="16">
              z
            </text>
            <text x="108" y="10" fontSize="20">
              Z
            </text>
          </g>
        }
      />
    </StickerFrame>
  ),
  "chibi-blush": (
    <StickerFrame>
      <Face
        eyes={
          <>
            <circle cx="52" cy="50" r="3.5" fill="#2a2a2a" />
            <circle cx="76" cy="50" r="3.5" fill="#2a2a2a" />
          </>
        }
        mouth={
          <path
            d="M58 64q6 5 12 0"
            stroke="#2a2a2a"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />
        }
        extra={
          <g>
            <ellipse cx="46" cy="60" rx="8" ry="5.5" fill="#ff9aa8" opacity="0.9" />
            <ellipse cx="82" cy="60" rx="8" ry="5.5" fill="#ff9aa8" opacity="0.9" />
          </g>
        }
      />
    </StickerFrame>
  ),
  "chibi-shy": (
    <StickerFrame>
      <g>
        <path d="M40 92c0-16 13-24 24-24s24 8 24 24v10H40V92z" fill="#F6C945" />
        <circle cx="64" cy="54" r="30" fill="#ffe0c2" />
        <path
          d="M34 52c-2-20 13-33 30-33s32 13 30 33c-6-8-14-4-18-10-6 8-16 8-24 2-6 6-14 4-18 8z"
          fill="#4a3728"
        />
        <path
          d="M50 54a3 3 0 1 1 0-0.1"
          stroke="#2a2a2a"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
        />
        <ellipse cx="48" cy="60" rx="6" ry="4" fill="#ff9aa8" opacity="0.9" />
        <ellipse cx="80" cy="60" rx="6" ry="4" fill="#ff9aa8" opacity="0.9" />
        <path
          d="M58 68q6 4 12 0"
          stroke="#2a2a2a"
          strokeWidth="2.2"
          fill="none"
          strokeLinecap="round"
        />
        <ellipse cx="98" cy="56" rx="16" ry="18" fill="#ffe0c2" transform="rotate(20 98 56)" />
      </g>
    </StickerFrame>
  ),
  sunflower: (
    <StickerFrame>
      <g>
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
          <ellipse
            key={angle}
            cx="64"
            cy="30"
            rx="10"
            ry="18"
            fill="#F6C945"
            transform={`rotate(${angle} 64 64)`}
          />
        ))}
        <circle cx="64" cy="64" r="18" fill="#7a4f2a" />
        <circle cx="58" cy="58" r="2" fill="#5c3a1f" />
        <circle cx="70" cy="60" r="2" fill="#5c3a1f" />
        <circle cx="64" cy="70" r="2" fill="#5c3a1f" />
        <circle cx="72" cy="70" r="2" fill="#5c3a1f" />
        <circle cx="56" cy="68" r="2" fill="#5c3a1f" />
      </g>
    </StickerFrame>
  ),
  rose: (
    <StickerFrame>
      <g>
        <path d="M64 118V70" stroke="#5a8a5a" strokeWidth="5" strokeLinecap="round" />
        <path d="M64 96c-10 2-16-4-16-4s8-2 16 2" fill="#5a8a5a" />
        <path d="M64 104c10 2 16-6 16-6s-9-2-16 3" fill="#5a8a5a" />
        <circle cx="64" cy="44" r="26" fill="#e8607a" />
        <circle cx="64" cy="44" r="19" fill="#f0899f" />
        <circle cx="64" cy="44" r="12" fill="#e8607a" />
        <circle cx="64" cy="44" r="5" fill="#c2455f" />
      </g>
    </StickerFrame>
  ),
  "cherry-blossom": (
    <StickerFrame>
      <g>
        <path
          d="M16 92q40-30 96-56"
          stroke="#6b4a35"
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
        />
        {[
          [40, 74],
          [60, 58],
          [82, 44],
          [100, 34],
          [50, 68],
        ].map(([cx, cy], i) => (
          <g key={i}>
            {[0, 72, 144, 216, 288].map((angle) => (
              <ellipse
                key={angle}
                cx={cx}
                cy={cy - 7}
                rx="5"
                ry="7"
                fill="#ffc4d6"
                transform={`rotate(${angle} ${cx} ${cy})`}
              />
            ))}
            <circle cx={cx} cy={cy} r="3" fill="#f2a3bd" />
          </g>
        ))}
      </g>
    </StickerFrame>
  ),
  bouquet: (
    <StickerFrame>
      <g>
        <path d="M50 122l14-38 14 38z" fill="#e8a13d" />
        {[
          { cx: 46, cy: 60, c: "#e8607a" },
          { cx: 64, cy: 46, c: "#F6C945" },
          { cx: 82, cy: 60, c: "#c58ce0" },
          { cx: 56, cy: 76, c: "#8fb7f0" },
          { cx: 74, cy: 76, c: "#ff9aa8" },
        ].map((f, i) => (
          <g key={i}>
            {[0, 72, 144, 216, 288].map((angle) => (
              <ellipse
                key={angle}
                cx={f.cx}
                cy={f.cy - 7}
                rx="6"
                ry="8"
                fill={f.c}
                transform={`rotate(${angle} ${f.cx} ${f.cy})`}
              />
            ))}
            <circle cx={f.cx} cy={f.cy} r="3.5" fill="#7a4f2a" />
          </g>
        ))}
      </g>
    </StickerFrame>
  ),
  "flower-heart": (
    <StickerFrame>
      <g>
        <path
          d="M64 106S22 78 22 48a22 22 0 0 1 42-8 22 22 0 0 1 42 8c0 30-42 58-42 58z"
          fill="#ffd6de"
        />
        {[
          [46, 46, "#e8607a"],
          [64, 34, "#F6C945"],
          [82, 46, "#c58ce0"],
          [64, 60, "#ff9aa8"],
        ].map(([cx, cy, c], i) => (
          <g key={i}>
            {[0, 90, 180, 270].map((angle) => (
              <ellipse
                key={angle}
                cx={cx as number}
                cy={(cy as number) - 5}
                rx="4.5"
                ry="6"
                fill={c as string}
                transform={`rotate(${angle} ${cx} ${cy})`}
              />
            ))}
            <circle cx={cx as number} cy={cy as number} r="2.5" fill="#7a4f2a" />
          </g>
        ))}
      </g>
    </StickerFrame>
  ),
  "confetti-hearts": (
    <StickerFrame>
      <g>
        <path
          d="M64 84S36 64 36 42a16 16 0 0 1 28-10 16 16 0 0 1 28 10c0 22-28 42-28 42z"
          fill="#e8607a"
        />
        {[
          [20, 20, "#F6C945", 6],
          [104, 24, "#8fb7f0", 5],
          [18, 96, "#c58ce0", 5],
          [108, 92, "#ff9aa8", 6],
          [96, 56, "#F6C945", 4],
          [24, 60, "#8fb7f0", 4],
        ].map(([cx, cy, c, r], i) => (
          <circle key={i} cx={cx as number} cy={cy as number} r={r as number} fill={c as string} />
        ))}
      </g>
    </StickerFrame>
  ),

  "chibi-laugh": (
    <StickerFrame>
      <Face
        eyes={
          <>
            <path
              d="M46 50q6-6 12 0"
              stroke="#2a2a2a"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M70 50q6-6 12 0"
              stroke="#2a2a2a"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
            />
          </>
        }
        mouth={<ellipse cx="64" cy="68" rx="9" ry="7" fill="#7a3b3b" />}
        extra={
          <>
            <path
              d="M40 60q-4 6-2 10"
              stroke="#8fc7f0"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M88 60q4 6 2 10"
              stroke="#8fc7f0"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
            />
          </>
        }
      />
    </StickerFrame>
  ),
  "chibi-wink": (
    <StickerFrame>
      <Face
        eyes={
          <>
            <path
              d="M48 50q4-4 8 0"
              stroke="#2a2a2a"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
            />
            <circle cx="76" cy="50" r="3.5" fill="#2a2a2a" />
          </>
        }
        mouth={
          <path
            d="M56 65q8 6 16 0"
            stroke="#2a2a2a"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />
        }
        extra={
          <path d="M96 40l4 4M100 36l-4 8" stroke="#F6C945" strokeWidth="2" strokeLinecap="round" />
        }
      />
    </StickerFrame>
  ),
  "chibi-cry": (
    <StickerFrame>
      <Face
        eyes={
          <>
            <circle cx="52" cy="50" r="3.5" fill="#2a2a2a" />
            <circle cx="76" cy="50" r="3.5" fill="#2a2a2a" />
          </>
        }
        mouth={
          <path
            d="M58 68q6-4 12 0"
            stroke="#2a2a2a"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />
        }
        extra={
          <>
            <path d="M50 55q-3 8 0 14a3 3 0 0 0 3-14z" fill="#8fc7f0" />
            <path d="M78 55q3 8 0 14a3 3 0 0 1-3-14z" fill="#8fc7f0" />
          </>
        }
      />
    </StickerFrame>
  ),
  "chibi-angry": (
    <StickerFrame>
      <Face
        cheeks={false}
        eyes={
          <>
            <path d="M46 46l10 4" stroke="#2a2a2a" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M82 46l-10 4" stroke="#2a2a2a" strokeWidth="2.5" strokeLinecap="round" />
          </>
        }
        mouth={
          <path
            d="M56 68q8-4 16 0"
            stroke="#2a2a2a"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />
        }
        extra={
          <g stroke="#c2455f" strokeWidth="2" strokeLinecap="round">
            <path d="M96 30l6 6M100 24l2 8" />
          </g>
        }
      />
    </StickerFrame>
  ),
  "chibi-cool": (
    <StickerFrame>
      <Face
        eyes={
          <g>
            <rect x="42" y="46" width="18" height="9" rx="4" fill="#3a3a3a" />
            <rect x="66" y="46" width="18" height="9" rx="4" fill="#3a3a3a" />
            <path d="M60 50h6" stroke="#3a3a3a" strokeWidth="2.5" />
          </g>
        }
        mouth={
          <path
            d="M56 66q8 4 16 0"
            stroke="#2a2a2a"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />
        }
      />
    </StickerFrame>
  ),
  "chibi-kiss": (
    <StickerFrame>
      <Face
        eyes={
          <>
            <path
              d="M48 50q4-3 8 0"
              stroke="#2a2a2a"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M72 50q4-3 8 0"
              stroke="#2a2a2a"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
            />
          </>
        }
        mouth={
          <ellipse cx="66" cy="66" rx="5" ry="4" fill="#c2455f" transform="rotate(20 66 66)" />
        }
        extra={<path d="M92 40c0-3 3-5 5-2 2-3 5-1 5 2 0 3-5 7-5 7s-5-4-5-7z" fill="#e8607a" />}
      />
    </StickerFrame>
  ),
  "chibi-starstruck": (
    <StickerFrame>
      <Face
        eyes={
          <>
            {[
              [52, 50],
              [76, 50],
            ].map(([cx, cy], i) => (
              <path
                key={i}
                d={`M${cx} ${cy - 5}l1.6 4.6 4.9.1-3.9 3 1.5 4.7-4.1-2.9-4.1 2.9 1.5-4.7-3.9-3 4.9-.1z`}
                fill="#F6C945"
              />
            ))}
          </>
        }
        mouth={<ellipse cx="64" cy="67" rx="5" ry="3.5" fill="#2a2a2a" />}
      />
    </StickerFrame>
  ),
  "chibi-thumbs-up": (
    <StickerFrame>
      <Face
        eyes={
          <>
            <path
              d="M48 50q4-3 8 0"
              stroke="#2a2a2a"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M72 50q4-3 8 0"
              stroke="#2a2a2a"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
            />
          </>
        }
        mouth={
          <path
            d="M56 65q8 6 16 0"
            stroke="#2a2a2a"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />
        }
        extra={
          <g transform="translate(88,52) rotate(-15)">
            <rect x="-4" y="0" width="14" height="16" rx="4" fill="#ffe0c2" />
            <rect x="-10" y="4" width="8" height="9" rx="3" fill="#ffe0c2" />
            <rect x="2" y="-12" width="7" height="16" rx="3.5" fill="#ffe0c2" />
          </g>
        }
      />
    </StickerFrame>
  ),
  "chibi-hug": (
    <StickerFrame>
      <g>
        <path d="M40 92c0-16 13-24 24-24s24 8 24 24v10H40V92z" fill="#F6C945" />
        <circle cx="64" cy="52" r="30" fill="#ffe0c2" />
        <path
          d="M34 50c-2-20 13-33 30-33s32 13 30 33c-6-8-14-4-18-10-6 8-16 8-24 2-6 6-14 4-18 8z"
          fill="#4a3728"
        />
        <path d="M50 50a3.5 3.5 0 1 0 7 0 3.5 3.5 0 1 0-7 0" fill="#2a2a2a" />
        <path d="M71 50a3.5 3.5 0 1 0 7 0 3.5 3.5 0 1 0-7 0" fill="#2a2a2a" />
        <ellipse cx="48" cy="60" rx="6" ry="4" fill="#ff9aa8" opacity="0.9" />
        <ellipse cx="80" cy="60" rx="6" ry="4" fill="#ff9aa8" opacity="0.9" />
        <path
          d="M58 66q6 5 12 0"
          stroke="#2a2a2a"
          strokeWidth="2.3"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M18 70q20-10 30 4"
          stroke="#ffe0c2"
          strokeWidth="10"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M110 70q-20-10-30 4"
          stroke="#ffe0c2"
          strokeWidth="10"
          strokeLinecap="round"
          fill="none"
        />
      </g>
    </StickerFrame>
  ),
  "chibi-party": (
    <StickerFrame>
      <Face
        eyes={
          <>
            <path
              d="M48 50q4-4 8 0"
              stroke="#2a2a2a"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M72 50q4-4 8 0"
              stroke="#2a2a2a"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
            />
          </>
        }
        mouth={<ellipse cx="64" cy="67" rx="7" ry="5" fill="#7a3b3b" />}
        extra={
          <>
            <path d="M50 24l28-14 4 26z" fill="#e8607a" />
            <circle cx="82" cy="12" r="3" fill="#F6C945" />
            {[
              [20, 30, "#F6C945"],
              [108, 34, "#8fb7f0"],
              [24, 90, "#c58ce0"],
              [104, 88, "#ff9aa8"],
            ].map(([cx, cy, c], i) => (
              <rect
                key={i}
                x={(cx as number) - 2}
                y={(cy as number) - 2}
                width="4"
                height="4"
                fill={c as string}
                transform={`rotate(${i * 37} ${cx} ${cy})`}
              />
            ))}
          </>
        }
      />
    </StickerFrame>
  ),
  "chibi-nervous": (
    <StickerFrame>
      <Face
        eyes={
          <>
            <circle cx="52" cy="50" r="3" fill="#2a2a2a" />
            <circle cx="76" cy="50" r="3" fill="#2a2a2a" />
          </>
        }
        mouth={
          <path
            d="M58 67q6 2 12 0"
            stroke="#2a2a2a"
            strokeWidth="2.3"
            fill="none"
            strokeLinecap="round"
          />
        }
        extra={
          <path
            d="M82 30q4 4 1 10"
            stroke="#8fc7f0"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
        }
      />
    </StickerFrame>
  ),
  "chibi-love-struck": (
    <StickerFrame>
      <Face
        eyes={
          <>
            <path d="M44 50c0-3 4-5 6-2 2-3 6-1 6 2 0 3-6 8-6 8s-6-5-6-8z" fill="#e8607a" />
            <path d="M72 50c0-3 4-5 6-2 2-3 6-1 6 2 0 3-6 8-6 8s-6-5-6-8z" fill="#e8607a" />
          </>
        }
        mouth={<ellipse cx="64" cy="67" rx="6" ry="4" fill="#c2455f" />}
        extra={
          <>
            <path
              d="M18 20c0-3 3-5 5-2 2-3 5-1 5 2 0 3-5 7-5 7s-5-4-5-7z"
              fill="#e8607a"
              opacity="0.8"
            />
            <path
              d="M100 16c0-2 2-4 4-2 2-2 4 0 4 2 0 2-4 5-4 5s-4-3-4-5z"
              fill="#e8607a"
              opacity="0.8"
            />
          </>
        }
      />
    </StickerFrame>
  ),

  tulip: (
    <StickerFrame>
      <g>
        <path d="M64 118V66" stroke="#5a8a5a" strokeWidth="5" strokeLinecap="round" />
        <path d="M64 100c-10 0-14-8-14-8s7-4 14 2" fill="#5a8a5a" />
        <path d="M64 106c10 0 14-8 14-8s-7-4-14 2" fill="#5a8a5a" />
        <path d="M64 30c-14 4-16 22-16 34h32c0-12-2-30-16-34z" fill="#e8607a" />
        <path d="M64 34c-9 5-10 18-10 26h20c0-8-1-21-10-26z" fill="#f0899f" />
      </g>
    </StickerFrame>
  ),
  daisy: (
    <StickerFrame>
      <g>
        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle) => (
          <ellipse
            key={angle}
            cx="64"
            cy="34"
            rx="5"
            ry="22"
            fill="#ffffff"
            stroke="#f0e6d2"
            strokeWidth="1"
            transform={`rotate(${angle} 64 64)`}
          />
        ))}
        <circle cx="64" cy="64" r="14" fill="#F6C945" />
      </g>
    </StickerFrame>
  ),
  "heart-balloon": (
    <StickerFrame>
      <g>
        <path d="M64 74V116" stroke="#c9a876" strokeWidth="2" />
        <path
          d="M64 74S30 50 30 26a20 20 0 0 1 34-14 20 20 0 0 1 34 14c0 24-34 48-34 48z"
          fill="#e8607a"
        />
        <ellipse
          cx="50"
          cy="24"
          rx="7"
          ry="10"
          fill="#ffffff"
          opacity="0.35"
          transform="rotate(-25 50 24)"
        />
      </g>
    </StickerFrame>
  ),
  "love-letter": (
    <StickerFrame>
      <g>
        <rect
          x="18"
          y="38"
          width="92"
          height="62"
          rx="6"
          fill="#fff6e6"
          stroke="#e8c98a"
          strokeWidth="2"
        />
        <path
          d="M18 42l46 34 46-34"
          stroke="#e8c98a"
          strokeWidth="2"
          fill="none"
          strokeLinejoin="round"
        />
        <path
          d="M64 58S52 48 52 40a8 8 0 0 1 12-6 8 8 0 0 1 12 6c0 8-12 18-12 18z"
          fill="#e8607a"
        />
      </g>
    </StickerFrame>
  ),
  "teddy-bear": (
    <StickerFrame>
      <g fill="#c68a52">
        <circle cx="40" cy="30" r="12" />
        <circle cx="88" cy="30" r="12" />
        <circle cx="40" cy="30" r="6" fill="#e8b98a" />
        <circle cx="88" cy="30" r="6" fill="#e8b98a" />
        <circle cx="64" cy="52" r="30" />
        <ellipse cx="64" cy="60" rx="14" ry="12" fill="#e8b98a" />
        <circle cx="54" cy="48" r="3.5" fill="#2a2a2a" />
        <circle cx="74" cy="48" r="3.5" fill="#2a2a2a" />
        <ellipse cx="64" cy="58" rx="4" ry="3" fill="#3a2a1a" />
        <path
          d="M64 60q0 4-6 5M64 60q0 4 6 5"
          stroke="#3a2a1a"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />
        <ellipse cx="46" cy="60" rx="4" ry="3" fill="#e8a4b0" opacity="0.8" />
        <ellipse cx="82" cy="60" rx="4" ry="3" fill="#e8a4b0" opacity="0.8" />
      </g>
    </StickerFrame>
  ),
  cupcake: (
    <StickerFrame>
      <g>
        <path d="M40 70h48l-6 34a6 6 0 0 1-6 5H52a6 6 0 0 1-6-5z" fill="#e8a13d" />
        <path d="M46 70l4-8h28l4 8z" fill="#f0b95c" opacity="0" />
        <path d="M38 66c0-12 10-20 26-20s26 8 26 20c0 4-4 6-4 6H42s-4-2-4-6z" fill="#ffe0c2" />
        <path d="M64 26c-4 4-4 9 0 13 4-4 4-9 0-13z" fill="#e8607a" />
        <circle cx="64" cy="20" r="4" fill="#e8607a" />
      </g>
    </StickerFrame>
  ),
  "coffee-cup": (
    <StickerFrame>
      <g>
        <path d="M34 50h52l-6 40a8 8 0 0 1-8 7H48a8 8 0 0 1-8-7z" fill="#7a4f2a" />
        <path
          d="M86 56h6a12 12 0 0 1 0 24h-8"
          stroke="#7a4f2a"
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M44 40q4-8 0-14M60 40q4-8 0-14M76 40q4-8 0-14"
          stroke="#c9b8a0"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
      </g>
    </StickerFrame>
  ),
  "moon-stars": (
    <StickerFrame>
      <g>
        <path d="M78 20a34 34 0 1 0 30 46 26 26 0 0 1-30-46z" fill="#F6C945" />
        {[
          [30, 34, 6],
          [100, 70, 5],
          [22, 84, 4],
          [92, 30, 4],
        ].map(([cx, cy, r], i) => (
          <path
            key={i}
            d={`M${cx} ${(cy as number) - (r as number) * 2}l${r} ${r} ${r} ${-(r as number)}-${r} ${-r}-${r} ${r}z`}
            fill="#fff3cf"
          />
        ))}
      </g>
    </StickerFrame>
  ),
  rainbow: (
    <StickerFrame>
      <g fill="none" strokeLinecap="round">
        <path d="M14 100a50 50 0 0 1 100 0" stroke="#e8607a" strokeWidth="8" />
        <path d="M24 100a40 40 0 0 1 80 0" stroke="#F6C945" strokeWidth="8" />
        <path d="M34 100a30 30 0 0 1 60 0" stroke="#8fb7f0" strokeWidth="8" />
        <path d="M44 100a20 20 0 0 1 40 0" stroke="#8fd0a0" strokeWidth="8" />
        <ellipse cx="18" cy="102" rx="10" ry="7" fill="#fff" opacity="0.85" />
        <ellipse cx="110" cy="102" rx="10" ry="7" fill="#fff" opacity="0.85" />
      </g>
    </StickerFrame>
  ),
  "gift-box": (
    <StickerFrame>
      <g>
        <rect x="26" y="54" width="76" height="50" rx="4" fill="#e8607a" />
        <rect x="26" y="54" width="76" height="14" fill="#c2455f" />
        <rect x="58" y="54" width="12" height="50" fill="#F6C945" />
        <path d="M64 54c-10-16-30-14-26-2 2 6 14 4 26 2z" fill="#F6C945" />
        <path d="M64 54c10-16 30-14 26-2-2 6-14 4-26 2z" fill="#F6C945" />
      </g>
    </StickerFrame>
  ),
  "paper-plane": (
    <StickerFrame>
      <g>
        <path d="M14 60L112 20 76 114l-14-34-30-8z" fill="#F6C945" />
        <path d="M62 80l14 34L112 20 62 80z" fill="#e8a13d" />
        <path d="M32 68l30 12 50-60z" fill="#fff3cf" opacity="0.5" />
      </g>
    </StickerFrame>
  ),
  "music-notes": (
    <StickerFrame>
      <g fill="#c58ce0">
        <ellipse cx="36" cy="94" rx="12" ry="9" transform="rotate(-15 36 94)" />
        <rect x="45" y="30" width="5" height="62" />
        <path d="M45 30l38-10v18l-38 10z" />
        <ellipse cx="80" cy="76" rx="12" ry="9" transform="rotate(-15 80 76)" />
        <rect x="89" y="14" width="5" height="62" />
      </g>
    </StickerFrame>
  ),
  "holding-hands": (
    <StickerFrame>
      <g>
        <path
          d="M22 66c4-10 14-14 22-10l10 6 10-6c8-4 18 0 22 10 5 12-2 22-14 28l-18 10-18-10c-12-6-19-16-14-28z"
          fill="#ffe0c2"
        />
        <path d="M64 62v10" stroke="#e8a13d" strokeWidth="2" strokeLinecap="round" />
        <path
          d="M64 40S52 30 52 22a8 8 0 0 1 12-6 8 8 0 0 1 12 6c0 8-12 18-12 18z"
          fill="#e8607a"
        />
      </g>
    </StickerFrame>
  ),
  "couple-hug": (
    <StickerFrame>
      <g>
        <circle cx="46" cy="42" r="18" fill="#ffe0c2" />
        <path
          d="M32 40c-1-11 7-18 14-18s15 7 14 18c-3-4-8-2-10-6-3 4-9 4-13 1-3 3-4 1-5 5z"
          fill="#4a3728"
        />
        <circle cx="41" cy="42" r="2.3" fill="#2a2a2a" />
        <circle cx="51" cy="42" r="2.3" fill="#2a2a2a" />
        <ellipse cx="37" cy="47" rx="3.5" ry="2.5" fill="#ff9aa8" opacity="0.85" />
        <path
          d="M42 49q4 3 8 0"
          stroke="#2a2a2a"
          strokeWidth="1.8"
          fill="none"
          strokeLinecap="round"
        />

        <circle cx="82" cy="42" r="18" fill="#ffdcb0" />
        <path d="M67 38c0-11 8-19 15-19s15 8 15 19c-8-6-22-6-30 0z" fill="#2a2118" />
        <circle cx="77" cy="43" r="2.3" fill="#2a2a2a" />
        <circle cx="87" cy="43" r="2.3" fill="#2a2a2a" />
        <ellipse cx="91" cy="48" rx="3.5" ry="2.5" fill="#ff9aa8" opacity="0.85" />
        <path
          d="M78 50q4 3 8 0"
          stroke="#2a2a2a"
          strokeWidth="1.8"
          fill="none"
          strokeLinecap="round"
        />

        <path d="M30 100c2-20 14-30 34-30s32 10 34 30v6H30v-6z" fill="#F6C945" />
        <path
          d="M48 78q16 14 32 0"
          stroke="#e8a13d"
          strokeWidth="5"
          fill="none"
          strokeLinecap="round"
        />
        <path d="M60 92S52 84 52 78a8 8 0 0 1 12-6 8 8 0 0 1 12 6c0 6-8 14-8 14z" fill="#e8607a" />
      </g>
    </StickerFrame>
  ),
  "kiss-mark": (
    <StickerFrame>
      <g fill="#c2455f">
        <path d="M40 46c-10 8-10 20 0 26 4-8 10-8 12 0 6-6 6-16-2-24-3 6-7 4-10-2z" />
        <path d="M76 40c-8 10-6 22 4 26 2-8 8-9 12-2 4-8 0-18-10-22-1 6-5 5-6-2z" />
        <path d="M50 72c-6 10-2 22 8 24 0-8 6-10 10-4 4-8-2-18-12-20 1 6-3 6-6 0z" />
      </g>
    </StickerFrame>
  ),
};
