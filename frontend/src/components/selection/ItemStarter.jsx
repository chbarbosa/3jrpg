import { theme } from '../../styles/theme';
import { ITEM_LIST } from '../../data/items';

const MAX_ITEMS = 2;
const EXCLUDE_IDS = new Set(['reviveScroll']);

export default function ItemStarter({ items, onUpdate }) {
  const available = ITEM_LIST.filter((i) => !EXCLUDE_IDS.has(i.id));

  function adjust(itemId, delta) {
    const current = items[itemId] ?? 0;
    const next = Math.max(0, current + delta);
    const updated = { ...items };
    if (next === 0) delete updated[itemId];
    else updated[itemId] = next;
    onUpdate(updated);
  }

  const totalItems = Object.values(items).reduce((s, q) => s + q, 0);
  const atCap = totalItems >= MAX_ITEMS;

  const btnBase = {
    width: '28px',
    height: '28px',
    borderRadius: theme.radius.sm,
    border: 'none',
    cursor: 'pointer',
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.bold,
    lineHeight: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: `background ${theme.transitions.fast}`,
  };

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xs }}>
        {available.map((item) => {
          const qty = items[item.id] ?? 0;
          const plusDisabled = atCap;
          return (
            <div
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.sm,
                padding: theme.spacing.xs,
                background: qty > 0 ? theme.colors.bgPanelDark : theme.colors.bgPanel,
                border: `1px solid ${qty > 0 ? theme.colors.borderGold : theme.colors.borderBrown}`,
                borderRadius: theme.radius.sm,
                transition: `background ${theme.transitions.fast}`,
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: theme.fontSizes.sm,
                  fontWeight: theme.fontWeights.bold,
                  color: theme.colors.textPrimary,
                }}>
                  {item.label}
                </div>
                <div style={{ fontSize: theme.fontSizes.xs, color: theme.colors.textMuted }}>
                  {item.description}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs }}>
                <button
                  onClick={() => adjust(item.id, -1)}
                  disabled={qty === 0}
                  style={{
                    ...btnBase,
                    background: theme.colors.bgPanel,
                    border: `1px solid ${theme.colors.borderBrown}`,
                    color: theme.colors.textPrimary,
                    cursor: qty === 0 ? 'not-allowed' : 'pointer',
                    opacity: qty === 0 ? 0.4 : 1,
                  }}
                >
                  −
                </button>
                <span style={{
                  minWidth: '20px',
                  textAlign: 'center',
                  fontSize: theme.fontSizes.sm,
                  fontWeight: theme.fontWeights.bold,
                  color: theme.colors.textPrimary,
                }}>
                  {qty}
                </span>
                <button
                  onClick={() => !plusDisabled && adjust(item.id, 1)}
                  disabled={plusDisabled}
                  title={plusDisabled ? 'Maximum 2 starting items reached' : undefined}
                  style={{
                    ...btnBase,
                    background: plusDisabled ? theme.colors.bgPanelDark : theme.colors.borderGold,
                    color: plusDisabled ? theme.colors.textMuted : theme.colors.bgPage,
                    cursor: plusDisabled ? 'not-allowed' : 'pointer',
                    opacity: plusDisabled ? 0.5 : 1,
                    border: `1px solid ${plusDisabled ? theme.colors.borderBrown : 'transparent'}`,
                  }}
                  onMouseEnter={(e) => { if (!plusDisabled) e.currentTarget.style.background = theme.colors.actionHover; }}
                  onMouseLeave={(e) => { if (!plusDisabled) e.currentTarget.style.background = theme.colors.borderGold; }}
                >
                  +
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{
        marginTop: theme.spacing.sm,
        fontSize: theme.fontSizes.xs,
        color: atCap ? theme.colors.textHeader : theme.colors.textMuted,
        textAlign: 'right',
        fontWeight: atCap ? theme.fontWeights.bold : theme.fontWeights.normal,
      }}>
        Items: {totalItems} / {MAX_ITEMS}
      </div>
    </div>
  );
}
