export type MountPointSelector = (persistentNode: HTMLElement) => HTMLElement | null;

export type OnMount = (mountNode: HTMLElement) => void;

export type OnUnmount = () => void;

export class MountPointMaintainer {
  private readonly observers: MutationObserver[] = [];

  constructor(private readonly persistentNode: HTMLElement) {
    if (this.persistentNode === null) {
      throw new Error('PersistentNode must exist before MountPointMaintainer is created');
    }
  }

  watch(mountPointSelector: MountPointSelector, onMount: OnMount, onUnmount?: OnUnmount): void {
    let mountPoint: HTMLElement | null = null;

    const observer = new MutationObserver((mutations) => {
      const isNonMountPointRemoved = (x: MutationRecord) =>
        x.removedNodes.length > 0 && !x.target.contains(mountPoint);

      if (
        mutations.every(isNonMountPointRemoved) ||
        mutations.every((x) => x.addedNodes.length === 0)
      ) {
        return;
      }

      mountPoint = mountPointSelector(this.persistentNode);

      if (mountPoint !== null) {
        onMount(mountPoint);
      } else {
        onUnmount?.();
      }
    });

    observer.observe(this.persistentNode, { subtree: true, childList: true });

    this.observers.push(observer);
  }

  disconnect(): void {
    this.observers.forEach((x) => x.disconnect());
  }
}
