export class CssInjector {
  constructor(private readonly id: string) {}

  update(content: string): void {
    this.stylesheet.innerHTML = content;
  }

  private get stylesheet(): HTMLStyleElement {
    return document.querySelector(`#${this.id}`) ?? this.createStylesheet();
  }

  private createStylesheet(): HTMLStyleElement {
    const stylesheet = document.createElement('style');
    stylesheet.id = this.id;

    document.head.append(stylesheet);

    return stylesheet;
  }
}
