'use client';

import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ActionMenuItem {
  label: string;
  icon?: LucideIcon;
  onSelect: () => void;
  /** Red styling for destructive actions such as Delete. */
  danger?: boolean;
  /** Leave the item out, e.g. "Reject documents" when there is nothing to review. */
  hidden?: boolean;
}

const MENU_WIDTH = 208;

/**
 * A "Manage ▾" button that opens a list of actions. The menu is rendered on top of the
 * page (a portal) so it is never cut off by a scrolling table or a card's rounded edges.
 */
export function ActionMenu({ label = 'Manage', items, ariaLabel }: { label?: string; items: ActionMenuItem[]; ariaLabel?: string }) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const visible = items.filter((item) => !item.hidden);

  // Place the menu under the button, right-aligned, and flip above it near the bottom of the screen.
  useLayoutEffect(() => {
    if (!open || !buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const height = menuRef.current?.offsetHeight ?? visible.length * 40 + 8;
    const below = rect.bottom + 4;
    const top = below + height > window.innerHeight ? Math.max(8, rect.top - height - 4) : below;
    setPosition({ top, left: Math.max(8, rect.right - MENU_WIDTH) });
  }, [open, visible.length]);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const onPointer = (e: MouseEvent) => {
      const target = e.target as Node;
      if (!menuRef.current?.contains(target) && !buttonRef.current?.contains(target)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close();
        buttonRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    // The menu is positioned once, so close it rather than leave it floating when the page moves.
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [open]);

  // Move focus into the menu so keyboard users can act straight away.
  useEffect(() => {
    if (open && position) menuRef.current?.querySelector<HTMLButtonElement>('button')?.focus();
  }, [open, position]);

  const onMenuKey = (e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    const buttons = Array.from(menuRef.current?.querySelectorAll<HTMLButtonElement>('button') ?? []);
    const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
    const next = e.key === 'ArrowDown' ? (index + 1) % buttons.length : (index - 1 + buttons.length) % buttons.length;
    buttons.at(next)?.focus();
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={ariaLabel}
        onClick={(e) => {
          e.stopPropagation();
          setPosition(null);
          setOpen((o) => !o);
        }}
        className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
      >
        {label}
        <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')} aria-hidden />
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            id={menuId}
            role="menu"
            onKeyDown={onMenuKey}
            onClick={(e) => e.stopPropagation()}
            style={{ top: position?.top ?? -9999, left: position?.left ?? -9999, width: MENU_WIDTH }}
            className="fixed z-[70] overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
          >
            {visible.map(({ label: itemLabel, icon: Icon, onSelect, danger }) => (
              <button
                key={itemLabel}
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  onSelect();
                }}
                className={cn(
                  'flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm focus:outline-none',
                  danger ? 'text-red-600 hover:bg-red-50 focus:bg-red-50' : 'text-slate-700 hover:bg-slate-50 focus:bg-slate-50',
                )}
              >
                {Icon && <Icon className={cn('h-4 w-4', danger ? 'text-red-500' : 'text-slate-400')} aria-hidden />}
                {itemLabel}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </>
  );
}
