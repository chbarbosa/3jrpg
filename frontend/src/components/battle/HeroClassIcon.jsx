import { theme } from '../../styles/theme';

const ICON_PATHS = {
  warrior: (
    <>
      <path d="M3 2h10v2h1v6h-1v2h-2v2H9v1H7v-1H5v-2H3v-2H2V4h1z" fill="currentColor" />
      <path d="M4 4h8v6h-1v2H9v1H7v-1H5v-2H4z" fill="var(--pixel-icon-dark)" />
      <path d="M5 4h6v5h-1v2H8V5H5z" fill="var(--pixel-icon-light)" />
      <path d="M7 5h2v2h2v2H9v2H7V9H5V7h2z" fill="var(--pixel-icon-shine)" />
    </>
  ),
  ranger: (
    <>
      <path d="M4 2h5v1h2v1h1v2h1v6h-2V7h-1V5H8V4H4zM3 3h2v10H3zM5 7h6v2H5z" fill="var(--pixel-icon-outline)" />
      <path d="M5 2h4v1h2v2h1v2h-2V6H9V5H5zM11 9h2v3h-2z" fill="currentColor" />
      <path d="M4 4h1v8H4zM6 7h5v1H6z" fill="var(--pixel-icon-light)" />
      <path d="M10 8h1v1h-1z" fill="var(--pixel-icon-shine)" />
    </>
  ),
  mage: (
    <>
      <path d="M10 1h4v1h1v4h-1v1h-3L5 14H2v-3l7-6V2h1z" fill="var(--pixel-icon-outline)" />
      <path d="M10 2h4v4h-4zM4 11l6-6 2 2-6 6H4z" fill="currentColor" />
      <path d="M11 2h2v2h-2zM5 10h2v2H5z" fill="var(--pixel-icon-light)" />
      <path d="M12 2h1v1h-1z" fill="var(--pixel-icon-shine)" />
    </>
  ),
  cleric: (
    <>
      <path d="M7 0h2v4h2V2h2v3h3v2h-4v2h3v2h-4v3H9v2H7v-2H5v-3H1V9h3V7H0V5h3V2h2v2h2z" fill="var(--pixel-icon-outline)" />
      <path d="M7 2h2v4h4v4H9v4H7v-4H3V6h4z" fill="currentColor" />
      <path d="M6 5h4v6H6zM5 7h6v2H5z" fill="var(--pixel-icon-light)" />
      <path d="M7 6h2v3H7z" fill="var(--pixel-icon-shine)" />
    </>
  ),
  thief: (
    <>
      <path d="M10 2h4v4l-5 5H7v2H5v2H2v-3h2v-2h2V8z" fill="var(--pixel-icon-outline)" />
      <path d="M10 3h3v2L8 10 6 8z" fill="currentColor" />
      <path d="M11 3h2v1L8 9 7 8z" fill="var(--pixel-icon-light)" />
      <path d="M5 8h4v2H5z" fill="var(--pixel-icon-shine)" />
      <path d="M4 10h2v3H3v-2h1z" fill="var(--pixel-icon-dark)" />
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
      viewBox="0 0 16 16"
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
