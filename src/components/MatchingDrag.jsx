import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';

export default function MatchingDrag({ pairs, value, onChange, disabled, renderLabel }) {
  const { t } = useTranslation();
  const [activeLeftId, setActiveLeftId] = useState(null);
  const [draggingRightId, setDraggingRightId] = useState(null);
  const [draggingTouchPos, setDraggingTouchPos] = useState(null);
  const ghostRef = useRef(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  const safePairs = Array.isArray(pairs) ? pairs : [];

  const leftMap = new Map();
  const rightMap = new Map();

  safePairs.forEach((item) => {
    if (item?.left?.id && !leftMap.has(item.left.id)) {
      leftMap.set(item.left.id, {
        id: item.left.id,
        label: item.left.label || '',
      });
    }
    if (item?.right?.id && !rightMap.has(item.right.id)) {
      rightMap.set(item.right.id, {
        id: item.right.id,
        label: item.right.label || '',
      });
    }
  });

  const leftItems = Array.from(leftMap.values());
  const rightItems = Array.from(rightMap.values());

  const selectedMap = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const selectedRightIds = new Set(Object.values(selectedMap));

  const hasActiveOption = Boolean(draggingRightId);

  const handleSelect = (leftId, rightId) => {
    if (disabled) return;
    if (!leftId || !rightId) return;

    const next = { ...selectedMap };

    Object.keys(next).forEach((lid) => {
      if (next[lid] === rightId) {
        delete next[lid];
      }
    });

    next[leftId] = rightId;
    onChange(next);

    setDraggingRightId(null);
  };

  const handleLeftClick = (leftId) => {
    if (disabled) return;
    setActiveLeftId((current) => (current === leftId ? null : leftId));
  };

  const handleOptionClick = (rightId) => {
    if (disabled) return;
    if (activeLeftId) {
      handleSelect(activeLeftId, rightId);
    }
  };

  const handleDrop = (leftId) => {
    if (disabled) return;
    const rightId = draggingRightId;
    if (!rightId) return;
    handleSelect(leftId, rightId);
  };

  const getAssignedRight = (leftId) => {
    const rightId = selectedMap[leftId];
    if (!rightId) return null;
    return rightItems.find((item) => item.id === rightId) || null;
  };

  const handleOptionTouchStart = (e, rightId) => {
    if (disabled) return;
    setDraggingRightId(rightId);

    const touch = e.touches && e.touches[0];
    if (!touch) return;

    const target = e.currentTarget;
    if (target && target.getBoundingClientRect) {
      const rect = target.getBoundingClientRect();
      dragOffsetRef.current = {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
      setDraggingTouchPos({
        x: rect.left,
        y: rect.top,
      });
    } else {
      dragOffsetRef.current = { x: 0, y: 0 };
      setDraggingTouchPos({ x: touch.clientX, y: touch.clientY });
    }
  };

  const handleOptionTouchMove = (e) => {
    if (!draggingRightId) return;
    const touch = e.touches && e.touches[0];
    if (!touch) return;

    const baseX = touch.clientX - dragOffsetRef.current.x;
    const baseY = touch.clientY - dragOffsetRef.current.y;

    if (ghostRef.current) {
      const el = ghostRef.current;
      el.style.left = `${baseX}px`;
      el.style.top = `${baseY}px`;
    }

    if (e.cancelable) {
      e.preventDefault();
    }
    e.stopPropagation();
  };

  const handleOptionTouchEnd = (e, rightId) => {
    if (disabled) return;
    try {
      const touch = e.changedTouches && e.changedTouches[0];
      if (!touch && !ghostRef.current) {
        setDraggingRightId(null);
        setDraggingTouchPos(null);
        return;
      }

      let clientX = touch ? touch.clientX : null;
      let clientY = touch ? touch.clientY : null;

      if (ghostRef.current && ghostRef.current.getBoundingClientRect) {
        const rect = ghostRef.current.getBoundingClientRect();
        clientX = rect.left + rect.width / 2;
        clientY = rect.top + rect.height / 2;
      }

      const el =
        clientX != null && clientY != null ? document.elementFromPoint(clientX, clientY) : null;

      if (el) {
        const slotEl = el.closest('[data-left-slot]');
        if (slotEl) {
          const leftId = slotEl.getAttribute('data-left-slot');
          if (leftId) {
            handleSelect(leftId, rightId);
          }
        }
      }
    } catch (_) {}
    setDraggingRightId(null);
    setDraggingTouchPos(null);
    if (e && typeof e.preventDefault === 'function' && e.cancelable) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  useEffect(() => {
    if (disabled || !draggingRightId) return undefined;

    if (typeof window === 'undefined') {
      return undefined;
    }

    const handleTouchMove = (event) => {
      if (!event) return;
      if (event.cancelable) {
        event.preventDefault();
      }
    };

    try {
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
    } catch (_) {
      window.addEventListener('touchmove', handleTouchMove);
    }

    return () => {
      try {
        window.removeEventListener('touchmove', handleTouchMove);
      } catch (_) {}
    };
  }, [draggingRightId, disabled]);

  const ghostItem = draggingRightId
    ? rightItems.find((item) => item.id === draggingRightId) || null
    : null;

  return (
    <div className="relative rounded-xl pt-6 sm:pt-7 pb-8 sm:pb-10">
      {hasActiveOption && (
        <div className="pointer-events-none fixed inset-0 z-10 bg-black/35 sm:bg-black/40" />
      )}

      {hasActiveOption && (
        <div className="absolute inset-x-0 -top-14 sm:-top-16 z-30 flex justify-center px-3 pointer-events-none">
          <div className="pointer-events-auto inline-flex items-center gap-2 max-w-md bg-slate-900/90 text-slate-50 shadow-xl rounded-full border border-emerald-400/70 px-4 py-2 text-xs sm:text-sm backdrop-blur-md matching-hint-pop">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 border border-emerald-400 text-[10px]">
              ⇅
            </span>
            <span>{t('test.matchingHint')}</span>
          </div>
        </div>
      )}

      {ghostItem && draggingTouchPos && (
        <div
          ref={ghostRef}
          className="fixed z-40 pointer-events-none"
          style={{
            top: draggingTouchPos.y,
            left: draggingTouchPos.x,
          }}
        >
          <div className="px-4 py-2 rounded-full border text-sm sm:text-base flex items-center space-x-2 bg-emerald-100 border-emerald-600 text-emerald-900 shadow-xl matching-ghost-anim">
            <span className="font-semibold">
              {String.fromCharCode(65 + rightItems.findIndex((r) => r.id === ghostItem.id))}.
            </span>
            {renderLabel ? (
              <div className="text-sm sm:text-base">
                {renderLabel(ghostItem.label || ghostItem.id)}
              </div>
            ) : (
              <span>{ghostItem.label || ghostItem.id}</span>
            )}
          </div>
        </div>
      )}

      <div className="relative z-20 space-y-3 sm:space-y-4">
        <div className="space-y-2 sm:space-y-3">
          {leftItems.map((item, index) => {
            const assignedRight = getAssignedRight(item.id);
            const rightIndex = assignedRight
              ? rightItems.findIndex((r) => r.id === assignedRight.id)
              : -1;
            const letter = rightIndex >= 0 ? String.fromCharCode(65 + rightIndex) : null;
            const isActiveRow = item.id === activeLeftId;

            return (
              <div
                key={item.id}
                className="grid grid-cols-[minmax(0,1.7fr)_minmax(0,1.1fr)] gap-2 sm:gap-3 items-stretch"
              >
                <button
                  type="button"
                  className={`w-full text-left px-4 py-2.5 rounded-lg border text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:ring-offset-white dark:focus:ring-offset-gray-900 transition ${
                    isActiveRow
                      ? 'bg-blue-50 border-blue-500 dark:bg-blue-900/40'
                      : 'bg-white/90 dark:bg-gray-800/90 border-gray-200 dark:border-gray-700 hover:border-blue-400'
                  }`}
                  onClick={() => handleLeftClick(item.id)}
                >
                  <span className="mr-2 font-semibold text-gray-700 dark:text-gray-200">
                    {index + 1}.
                  </span>
                  {renderLabel ? (
                    <div className="text-base sm:text-lg text-gray-900 dark:text-white">
                      {renderLabel(item.label || item.id)}
                    </div>
                  ) : (
                    <span className="text-base sm:text-lg text-gray-900 dark:text-white">
                      {item.label || item.id}
                    </span>
                  )}
                </button>

                <div
                  data-left-slot={item.id}
                  className={`px-3 py-2.5 rounded-lg border border-dashed text-sm sm:text-base flex items-center justify-start transition ${
                    hasActiveOption
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/25 matching-dropzone-anim'
                      : 'border-gray-300 dark:border-gray-600 bg-white/80 dark:bg-gray-900/40'
                  }`}
                  onDragOver={(e) => {
                    if (disabled) return;
                    e.preventDefault();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleDrop(item.id);
                  }}
                  onClick={() => {
                    if (disabled) return;
                    setActiveLeftId((current) => (current === item.id ? null : item.id));
                  }}
                >
                  {assignedRight && letter ? (
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-gray-700 dark:text-gray-200">
                        {letter}.
                      </span>
                      <span className="text-sm sm:text-base text-gray-900 dark:text-white">
                        {assignedRight.label || assignedRight.id}
                      </span>
                    </div>
                  ) : (
                    <span className="flex items-center space-x-2 text-gray-400 dark:text-gray-500">
                      {hasActiveOption && (
                        <ArrowRight className="h-4 w-4 text-emerald-500 animate-pulse" />
                      )}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-1 border-t border-dashed border-gray-200 dark:border-gray-700" />

        <div className="flex flex-wrap gap-2 sm:gap-3 mt-1">
          {rightItems.map((item, index) => {
            const matched = selectedRightIds.has(item.id);
            const isDraggingThis = draggingRightId === item.id;
            return (
              <button
                key={item.id}
                type="button"
                draggable={!disabled}
                onDragStart={() => {
                  if (disabled) return;
                  setDraggingRightId(item.id);
                }}
                onDragEnd={() => {
                  setDraggingRightId(null);
                  setDraggingTouchPos(null);
                }}
                onTouchStart={(e) => handleOptionTouchStart(e, item.id)}
                onTouchMove={handleOptionTouchMove}
                onTouchEnd={(e) => handleOptionTouchEnd(e, item.id)}
                onClick={(e) => {
                  if (draggingRightId) return;
                  handleOptionClick(item.id);
                }}
                className={`px-4 py-2 rounded-full border text-sm sm:text-base flex items-center space-x-2 cursor-pointer transition transform select-none touch-none ${
                  isDraggingThis && draggingTouchPos ? 'opacity-0 ' : ''
                }${
                  isDraggingThis
                    ? 'bg-emerald-100 border-emerald-600 text-emerald-900 dark:bg-emerald-900/60 dark:border-emerald-400 dark:text-emerald-50 shadow-lg scale-105 z-30'
                    : matched
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800 dark:bg-emerald-900/30 dark:border-emerald-500/80 dark:text-emerald-100'
                      : 'bg-white/90 dark:bg-gray-800/90 border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 hover:border-emerald-400'
                }`}
              >
                <span className="font-semibold">{String.fromCharCode(65 + index)}.</span>
                {renderLabel ? (
                  <div className="text-sm sm:text-base">{renderLabel(item.label || item.id)}</div>
                ) : (
                  <span>{item.label || item.id}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
      <style>{`
        .matching-dropzone-anim {
          animation: matching-dropzone-pulse 1.4s ease-in-out infinite;
        }

        @keyframes matching-dropzone-pulse {
          0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.24); }
          50% { box-shadow: 0 0 0 6px rgba(16, 185, 129, 0.16); }
          100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.0); }
        }

        .matching-ghost-anim {
          animation: matching-ghost-pop 0.18s ease-out forwards;
        }

        @keyframes matching-ghost-pop {
          0% { transform: scale(0.9); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }

        .matching-hint-pop {
          animation: matching-hint-pop 0.22s ease-out forwards;
        }

        @keyframes matching-hint-pop {
          0% { transform: translateY(8px) scale(0.9); opacity: 0; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
