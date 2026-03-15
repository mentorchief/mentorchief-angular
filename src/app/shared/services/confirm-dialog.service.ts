import { Injectable } from '@angular/core';

export interface ConfirmDialogOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary' | 'default';
}

export interface ConfirmDialogState extends ConfirmDialogOptions {
  open: boolean;
  resolve?: (value: boolean) => void;
}

@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  private state: ConfirmDialogState = {
    open: false,
    title: '',
    message: '',
  };

  private listeners: ((state: ConfirmDialogState) => void)[] = [];

  confirm(options: ConfirmDialogOptions): Promise<boolean> {
    return new Promise((resolve) => {
      this.state = {
        ...options,
        open: true,
        confirmLabel: options.confirmLabel ?? 'Confirm',
        cancelLabel: options.cancelLabel ?? 'Cancel',
        variant: options.variant ?? 'default',
        resolve,
      };
      this.notify();
    });
  }

  getState(): ConfirmDialogState {
    return { ...this.state };
  }

  subscribe(listener: (state: ConfirmDialogState) => void): () => void {
    this.listeners.push(listener);
    listener(this.getState());
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  onConfirm(): void {
    this.state.resolve?.(true);
    this.close();
  }

  onCancel(): void {
    this.state.resolve?.(false);
    this.close();
  }

  private close(): void {
    this.state = { ...this.state, open: false, resolve: undefined };
    this.notify();
  }

  private notify(): void {
    const state = this.getState();
    this.listeners.forEach((l) => l(state));
  }
}
