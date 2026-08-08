import { theme } from '../../styles/theme';

const ICON_PATHS = {
  warrior: (
    <>
      <path d="M4 2h16v3h2v10h-2v3h-3v2h-3v2h-4v-2H7v-2H4v-3H2V5h2z" fill="var(--pixel-icon-outline)" />
      <path d="M5 4h14v2h1v8h-2v3h-3v2h-2v2h-2v-2H8v-2H6v-3H4V6h1z" fill="var(--pixel-icon-dark)" />
      <path d="M7 5h10v2h2v6h-2v3h-3v2h-4v-2H8v-3H6V7h1z" fill="currentColor" />
      <path d="M8 6h4v10h-2v-2H8z" fill="var(--pixel-icon-light)" />
      <path d="M10 8h4V6h2v2h2v4h-4v4h-4v-4H7V8z" fill="var(--pixel-icon-shine)" />
    </>
  ),
  ranger: (
    <>
      <path d="M5 2h7v2h3v2h2v3h2v10h-4v-8h-2V8h-3V6H5zM3 3h4v18H3zM6 10h11v4H6z" fill="var(--pixel-icon-outline)" />
      <path d="M6 3h5v2h3v2h2v3h-3V9h-2V7H6zM16 14h3v5h-3z" fill="currentColor" />
      <path d="M5 5h2v14H5zM8 11h8v2H8z" fill="var(--pixel-icon-light)" />
      <path d="M14 11h4v2h-2v2h-2z" fill="var(--pixel-icon-shine)" />
      <path d="M17 10h2v2h2v2h-2v2h-2z" fill="var(--pixel-icon-dark)" />
    </>
  ),
  mage: (
    <>
      <path d="M14 1h7v2h2v7h-2v2h-5L8 20H6v2H1v-5h2v-2l8-8V3h3z" fill="var(--pixel-icon-outline)" />
      <path d="M14 3h6v2h1v4h-2v1h-5l-2-2V5h2zM3 18l9-9 3 3-9 9H3z" fill="currentColor" />
      <path d="M15 3h4v2h2v2h-3v2h-4V5h1zM5 17h3v3H5z" fill="var(--pixel-icon-light)" />
      <path d="M16 3h3v2h-3z" fill="var(--pixel-icon-shine)" />
      <path d="M8 14h3v3H8z" fill="var(--pixel-icon-dark)" />
    </>
  ),
  cleric: (
    <>
      <path d="M10 0h4v5l3-3 3 3-3 3h6v4h-5l4 3-3 4-4-4v8h-6v-7l-4 4-4-4 5-4H0V8h6L3 5l3-3 4 3z" fill="var(--pixel-icon-outline)" />
      <path d="M11 2h2v6l4-3 1 2-4 4h6v2h-6l5 3-1 2-5-4v7h-2v-7l-5 4-2-2 6-4H2v-2h8L5 6l1-1 5 3z" fill="currentColor" />
      <path d="M8 7h8v10H8zM6 9h12v6H6z" fill="var(--pixel-icon-light)" />
      <path d="M10 9h4v5h-4z" fill="var(--pixel-icon-shine)" />
    </>
  ),
  thief: (
    <>
      <path d="M14 2h7v7l-7 7h-3l-2 2H7v3H5v2H1v-4h2v-3h3v-2h2v-3z" fill="var(--pixel-icon-outline)" />
      <path d="M15 4h4v4l-7 6-3-3z" fill="currentColor" />
      <path d="M16 4h3v2l-7 6-1-1z" fill="var(--pixel-icon-light)" />
      <path d="M8 10h3l4 4-2 2-2-2-3 3-2-2 3-3z" fill="var(--pixel-icon-shine)" />
      <path d="M6 15h3v3H7v3H3v-2h2v-3z" fill="var(--pixel-icon-dark)" />
    </>
  ),
};

export default function HeroClassIcon({ className }) {
  const classId = className?.toLowerCase();
  const palette = theme.pixelIconColors[classId] ?? theme.pixelIconColors.thief;
  const label = classId ? `${className} class icon` : 'Hero class icon';

  return (
    <svg
      className="hero-class-icon"
      viewBox="0 0 24 24"
      role="img"
      aria-label={label}
      shapeRendering="crispEdges"
      style={{
        color: palette.base,
        '--pixel-icon-dark': palette.dark,
        '--pixel-icon-light': palette.light,
        '--pixel-icon-shine': palette.shine,
        '--pixel-icon-outline': theme.colors.pixelOutline,
      }}
    >
      {ICON_PATHS[classId] ?? ICON_PATHS.thief}
    </svg>
  );
}
