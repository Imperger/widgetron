const messageStorage = new (class Storage {
  public readonly softMax = 100000;
  public readonly overflowFactor = 1.2;

  get hardMax(): number {
    return this.softMax * this.overflowFactor;
  }
})();

export const storage = { message: messageStorage };
