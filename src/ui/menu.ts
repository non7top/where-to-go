import type { MenuItem } from '../lib/cities';
import { esc } from './esc';

export function initMenu(
  button: HTMLButtonElement,
  menu: HTMLElement,
  items: readonly MenuItem[],
  pick: (id: string) => void,
) {
  let lastGroup: string | undefined;
  menu.innerHTML = items
    .map((it) => {
      const header = it.group !== undefined && it.group !== lastGroup ? `<li role="presentation" class="menu-group">${esc(it.group)}</li>` : '';
      lastGroup = it.group;
      return `${header}<li role="none"><button type="button" role="menuitem" data-id="${esc(it.id)}">${esc(it.label)}</button></li>`;
    })
    .join('');

  const setOpen = (open: boolean) => {
    menu.hidden = !open;
    button.setAttribute('aria-expanded', String(open));
    if (open) menu.querySelector<HTMLButtonElement>('button')?.focus();
  };

  button.addEventListener('click', () => setOpen(Boolean(menu.hidden)));
  menu.addEventListener('click', (e) => {
    const id = (e.target as HTMLElement).closest<HTMLElement>('[data-id]')?.dataset.id;
    if (!id) return;
    setOpen(false);
    pick(id);
  });
  menu.addEventListener('keydown', (e) => {
    const buttons = [...menu.querySelectorAll<HTMLButtonElement>('button')];
    const i = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (e.key === 'ArrowDown') buttons[(i + 1) % buttons.length]?.focus();
    else if (e.key === 'ArrowUp') buttons[(i - 1 + buttons.length) % buttons.length]?.focus();
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
