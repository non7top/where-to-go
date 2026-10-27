import type { Shortcut } from '../data/types';
import { esc } from './esc';

export function initShortcuts(
  button: HTMLButtonElement,
  menu: HTMLElement,
  shortcuts: Shortcut[],
  go: (s: Shortcut) => void,
) {
  menu.innerHTML = shortcuts
    .map((s) => `<li role="none"><button type="button" role="menuitem" data-id="${esc(s.id)}">${esc(s.name)}</button></li>`)
    .join('');

  const setOpen = (open: boolean) => {
    menu.hidden = !open;
    button.setAttribute('aria-expanded', String(open));
    if (open) menu.querySelector<HTMLButtonElement>('button')?.focus();
  };

  button.addEventListener('click', () => setOpen(Boolean(menu.hidden)));
  menu.addEventListener('click', (e) => {
    const id = (e.target as HTMLElement).closest<HTMLElement>('[data-id]')?.dataset.id;
    const s = shortcuts.find((x) => x.id === id);
    if (!s) return;
    setOpen(false);
    go(s);
  });
  menu.addEventListener('keydown', (e) => {
    const items = [...menu.querySelectorAll<HTMLButtonElement>('button')];
    const i = items.indexOf(document.activeElement as HTMLButtonElement);
    if (e.key === 'ArrowDown') items[(i + 1) % items.length]?.focus();
    else if (e.key === 'ArrowUp') items[(i - 1 + items.length) % items.length]?.focus();
    else return;
    e.preventDefault();
  });
  document.addEventListener('click', (e) => {
    if (!menu.hidden && !menu.contains(e.target as Node) && e.target !== button) setOpen(false);
  });

  return {
    close() {
      if (menu.hidden) return false;
      setOpen(false);
      button.focus();
      return true;
    },
  };
}
