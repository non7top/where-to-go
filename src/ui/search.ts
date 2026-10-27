import { search } from '../lib/search';
import type { SearchItem } from '../lib/search';
import { iconDataUrl } from '../map/icons';
import { esc } from './esc';
import { flagImg } from './flags';

// Global search: places by name or airport code, and events by name or local name.
export function initSearch(
  input: HTMLInputElement,
  list: HTMLElement,
  index: readonly SearchItem[],
  pick: (item: SearchItem) => void,
) {
  let results: SearchItem[] = [];
  let active = -1;

  const close = () => {
    list.hidden = true;
    input.setAttribute('aria-expanded', 'false');
    active = -1;
  };
  const mark = () => {
    list.querySelectorAll('li').forEach((li, i) => li.classList.toggle('active', i === active));
    input.setAttribute('aria-activedescendant', active >= 0 ? `search-opt-${active}` : '');
  };
  const render = () => {
    results = search(index, input.value);
    if (!input.value.trim()) return close();
    list.innerHTML = results.length
      ? results
          .map((r, i) => {
            const lead = r.icon ? `<img class="ev-icon" alt="" src="${iconDataUrl(r.icon)}">` : r.country ? flagImg(r.country) : '';
            return `<li role="option" id="search-opt-${i}" data-i="${i}">${lead}<span class="pick-main"><b>${esc(r.label)}</b><small>${esc(r.sub)}</small></span></li>`;
          })
          .join('')
      : '<li class="none">Nothing found</li>';
    list.hidden = false;
    input.setAttribute('aria-expanded', 'true');
    active = results.length ? 0 : -1;
    mark();
  };
  const choose = (i: number) => {
    const item = results[i];
    if (!item) return;
    close();
    input.value = '';
    input.blur();
    pick(item);
  };

  input.addEventListener('input', render);
  input.addEventListener('focus', () => input.value && render());
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' && results.length) active = (active + 1) % results.length;
    else if (e.key === 'ArrowUp' && results.length) active = (active - 1 + results.length) % results.length;
    else if (e.key === 'Enter') return void (active >= 0 && choose(active));
    else if (e.key === 'Escape') {
      e.preventDefault();
      input.value = '';
      close();
      return void input.blur();
    } else return;
    e.preventDefault();
    mark();
  });
  list.addEventListener('pointerdown', (e) => {
    // Keep the input focused until the click is handled.
    e.preventDefault();
    const i = Number((e.target as HTMLElement).closest<HTMLElement>('[data-i]')?.dataset.i);
    if (Number.isInteger(i)) choose(i);
  });
  input.addEventListener('blur', close);
  // "/" jumps to the search box from anywhere that is not a text field.
  document.addEventListener('keydown', (e) => {
    const t = e.target as HTMLElement;
    if (e.key === '/' && !/^(input|textarea)$/i.test(t.tagName)) {
      e.preventDefault();
      input.focus();
    }
  });

  return { isOpen: () => !list.hidden || document.activeElement === input };
}
