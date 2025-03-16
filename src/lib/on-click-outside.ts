import { reinterpret_cast } from './reinterpret-cast';

export type OnClickOutsideHandler = (e: Event) => void;
export type OnListOutsideDeactivator = () => void;

export function onClickOutside(
  target: HTMLElement,
  onClick: OnClickOutsideHandler,
): OnListOutsideDeactivator {
  const listener = (e: Event) => {
    if (!target.contains(reinterpret_cast<HTMLElement>(e.target))) {
      onClick(e);
    }
  };

  document.addEventListener('click', listener);

  return () => document.removeEventListener('click', listener);
}
