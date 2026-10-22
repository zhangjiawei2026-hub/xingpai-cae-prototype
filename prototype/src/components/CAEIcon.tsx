// Professional SVG placeholders. Semantics and source status: docs/icon-manifest.md.
export function CAEIcon({ name, size = 24 }: { name: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {name === "nodes" ? (
        <>
          <path
            d="M6 9 22 4l5 18-16 6L6 9Z M6 9l13 9 8 4M19 18l3-14M19 18l-8 10"
            stroke="#7493b4"
          />
          {[
            [6, 9],
            [22, 4],
            [27, 22],
            [11, 28],
            [19, 18],
          ].map(([x, y]) => (
            <circle
              key={x}
              cx={x}
              cy={y}
              r="2.6"
              fill="#4b87d2"
              stroke="#e8f1ff"
            />
          ))}
        </>
      ) : name === "step" ? (
        <>
          <path d="M4 24h7V16h8V8h9" stroke="#3e83cc" strokeWidth="3" />
          <path d="m23 4 5 4-5 4M4 29h24" stroke="#8298ae" />
          <circle cx="11" cy="16" r="2" fill="#f2bd6c" stroke="#d8a44e" />
        </>
      ) : name === "domain" ? (
        <>
          <path
            d="m16 3 13 7v14l-13 6-13-6V10L16 3Z"
            fill="#e6eef7"
            stroke="#7c99b8"
          />
          <path d="m3 10 13 7 13-7M16 17v13" stroke="#7c99b8" />
          <path d="m11 12 8-3 6 3-9 5-5-5Z" fill="#eac387" stroke="#d0a460" />
          <path d="m11 12 5 5v9l-5-3V12Z" fill="#87b6c4" stroke="#649aac" />
        </>
      ) : name === "mesh" ? (
        <>
          <path
            d="m16 3 13 7v14l-13 6-13-6V10L16 3Z"
            fill="#e6f0f6"
            stroke="#548fa9"
          />
          <path
            d="m3 10 13 7 13-7M16 17v13M9 7v20M23 7v20M3 17l13 7 13-7M9 7l14 20M23 7 9 27"
            stroke="#548fa9"
          />
        </>
      ) : name === "material" ? (
        <>
          <path
            d="M4 10 16 4l12 6-12 6-12-6ZM4 16l12 6 12-6M4 22l12 6 12-6"
            stroke="#8583bd"
            strokeWidth="2"
          />
        </>
      ) : name === "load" ? (
        <>
          <path d="M5 26h22M10 21h12l4 5H6l4-5Z" stroke="#7f9ab5" />
          <path d="M16 3v15m-5-5 5 5 5-5" stroke="#c88d55" strokeWidth="2.5" />
        </>
      ) : (
        <>
          <path
            d="m16 3 13 7v14l-13 6-13-6V10L16 3Z"
            fill="#eaf0f7"
            stroke="#7b97b4"
          />
          <path d="m3 10 13 7 13-7M16 17v13" stroke="#7b97b4" />
        </>
      )}
    </svg>
  );
}
