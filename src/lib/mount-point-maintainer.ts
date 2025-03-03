export type MountPointSelector = (persistentNode: HTMLElement) => HTMLElement | null;

export type OnMount = (mountNode: HTMLElement) => void;

export class MountPointMaintainer {
  private readonly observers: MutationObserver[] = [];

  constructor(private readonly persistentNode: HTMLElement) {}

  watch(mountPointSelector: MountPointSelector, onMount: OnMount): void {
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
      }
    });

    observer.observe(this.persistentNode, { subtree: true, childList: true });

    this.observers.push(observer);
  }

  disconnect(): void {
    this.observers.forEach((x) => x.disconnect());
  }
}
