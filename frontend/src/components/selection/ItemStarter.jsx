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

  return (
    <div>
      <div className="item-starter-list">
        {available.map((item) => {
          const qty = items[item.id] ?? 0;
          const plusDisabled = atCap;
          return (
            <div
              key={item.id}
              className="item-starter-row"
              style={{
                background: qty > 0 ? theme.colors.bgPanelDark : theme.colors.bgPanel,
                border: `1px solid ${qty > 0 ? theme.colors.borderGold : theme.colors.borderBrown}`,
              }}
            >
              <div className="item-starter-info">
                <div className="item-starter-label">
                  {item.label}
                </div>
                <div className="item-starter-desc">
                  {item.description}
                </div>
              </div>
              <div className="item-qty-controls">
                <button
                  onClick={() => adjust(item.id, -1)}
                  disabled={qty === 0}
                  className="item-qty-btn item-qty-btn--minus"
                  style={{ cursor: qty === 0 ? 'not-allowed' : 'pointer', opacity: qty === 0 ? 0.4 : 1 }}
                >
                  −
                </button>
                <span className="item-qty-value">
                  {qty}
                </span>
                <button
                  onClick={() => !plusDisabled && adjust(item.id, 1)}
                  disabled={plusDisabled}
                  title={plusDisabled ? 'Maximum 2 starting items reached' : undefined}
                  className={`item-qty-btn ${plusDisabled ? 'item-qty-btn--plus-disabled' : 'item-qty-btn--plus-active'}`}
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
      <div
        className="item-starter-counter"
        style={{
          color: atCap ? theme.colors.textHeader : theme.colors.textMuted,
          fontWeight: atCap ? 'var(--fw-bold)' : 'var(--fw-normal)',
        }}
      >
        Items: {totalItems} / {MAX_ITEMS}
      </div>
    </div>
  );
}
