import { ITEM_LIST } from '../../data/items';

const MAX_ITEMS = 3;
const EXCLUDE_IDS = new Set(['reviveScroll']);

export default function ItemStarter({ items, onUpdate }) {
  const available = ITEM_LIST.filter((item) => !EXCLUDE_IDS.has(item.id));
  const totalItems = Object.values(items).reduce((sum, qty) => sum + qty, 0);
  const atCap = totalItems >= MAX_ITEMS;

  function addItem(itemId) {
    if (atCap) return;
    const current = items[itemId] ?? 0;
    onUpdate({ ...items, [itemId]: current + 1 });
  }

  function removeItem(itemId) {
    const current = items[itemId] ?? 0;
    if (current <= 0) return;

    const updated = { ...items };
    if (current === 1) delete updated[itemId];
    else updated[itemId] = current - 1;
    onUpdate(updated);
  }

  const selectedItems = Object.entries(items)
    .flatMap(([itemId, qty]) => Array.from({ length: qty }, () => itemId))
    .map((itemId) => available.find((item) => item.id === itemId))
    .filter(Boolean);

  return (
    <div className="item-starter">
      <div className="item-starter-grid">
        {available.map((item) => {
          const qty = items[item.id] ?? 0;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => addItem(item.id)}
              disabled={atCap}
              title={atCap ? 'Maximum 3 starting items reached' : item.label}
              className={`item-starter-card ${qty > 0 ? 'item-starter-card--selected' : ''}`}
            >
              <span className={`item-pixel-sprite item-pixel-sprite--${item.id}`} aria-hidden="true" />
              <span className="item-starter-info">
                <span className="item-starter-label">
                  {item.label}
                </span>
                <span className="item-starter-desc">
                  {item.description}
                </span>
              </span>
              {qty > 0 && (
                <span className="item-starter-card-count">
                  {qty}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="item-starter-picked">
        <div className="item-starter-picked-header">
          <span>Selected Items</span>
          <span className={atCap ? 'item-starter-counter item-starter-counter--cap' : 'item-starter-counter'}>
            {totalItems} / {MAX_ITEMS}
          </span>
        </div>

        {selectedItems.length === 0 ? (
          <div className="item-starter-empty">-</div>
        ) : (
          <div className="item-starter-picked-list">
            {selectedItems.map((item, index) => (
              <div key={`${item.id}-${index}`} className="item-starter-picked-row">
                <span
                  className={`item-pixel-sprite item-pixel-sprite--small item-pixel-sprite--${item.id}`}
                  aria-hidden="true"
                />
                <span className="item-starter-picked-name">{item.label}</span>
                <button type="button" className="item-starter-remove-btn" onClick={() => removeItem(item.id)}>
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
