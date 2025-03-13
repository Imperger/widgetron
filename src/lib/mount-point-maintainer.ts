export type MountPointSelector = (persistentNode: HTMLElement) => HTMLElement | null;

export type OnMount = (mountNode: HTMLElement) => void;

export type OnUnmount = () => void;

export type MountPointWatchReleaser = () => void;

export class MountPointMaintainer {
  private readonly observers: MutationObserver[] = [];

  constructor(private readonly persistentNode: HTMLElement) {
    if (this.persistentNode === null) {
      throw new Error('PersistentNode must exist before MountPointMaintainer is created');
    }
  }

  watch(
    mountPointSelector: MountPointSelector,
    onMount: OnMount,
    onUnmount?: OnUnmount,
  ): MountPointWatchReleaser {
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

    return () => {
      const removeIdx = this.observers.indexOf(observer);

      if (removeIdx !== -1) {
        this.observers[removeIdx].disconnect();
        this.observers.splice(removeIdx, 1);
      }
    };
  }

  disconnect(): void {
    this.observers.forEach((x) => x.disconnect());
  }
}
