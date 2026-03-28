import { makeAutoObservable } from "mobx";

export class ToastStore {
  message = "";
  isError = false;
  isVisible = false;
  private timeoutId: number | null = null;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  show(message: string, isError = false) {
    this.message = message;
    this.isError = isError;
    this.isVisible = true;

    if (this.timeoutId !== null) {
      window.clearTimeout(this.timeoutId);
    }

    this.timeoutId = window.setTimeout(() => {
      this.hide();
    }, 3600);
  }

  showError(error: unknown) {
    this.show(error instanceof Error ? error.message : String(error), true);
  }

  hide() {
    this.isVisible = false;
  }
}
