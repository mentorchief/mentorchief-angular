import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { ConfirmDialogService } from '../services/confirm-dialog.service';

@Component({
  selector: 'mc-confirm-dialog',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  template: `
    @if (state.open) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
      >
        <!-- Backdrop -->
        <div
          class="absolute inset-0 bg-foreground/50 backdrop-blur-sm"
          (click)="dialog.onCancel()"
        ></div>

        <!-- Dialog -->
        <div
          class="relative bg-card rounded-lg shadow-xl border border-border max-w-md w-full p-6"
          (click)="$event.stopPropagation()"
        >
          <div class="flex gap-4">
            <div
              [class]="iconClass"
              class="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
            >
              <fa-icon [icon]="iconFa" class="text-xl" />
            </div>
            <div class="flex-1">
              <h2 id="confirm-dialog-title" class="text-lg font-medium text-foreground">
                {{ state.title }}
              </h2>
              <p class="text-muted-foreground text-sm mt-2">{{ state.message }}</p>
            </div>
          </div>

          <div class="flex justify-end gap-3 mt-6">
            <button
              type="button"
              (click)="dialog.onCancel()"
              class="px-4 py-2 border border-border text-foreground rounded-md hover:bg-muted transition-colors"
            >
              {{ state.cancelLabel }}
            </button>
            <button
              type="button"
              (click)="dialog.onConfirm()"
              [class]="confirmButtonClass"
              class="px-4 py-2 rounded-md transition-opacity hover:opacity-90"
            >
              {{ state.confirmLabel }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDialogComponent implements OnDestroy {
  readonly dialog = inject(ConfirmDialogService);
  private readonly cdr = inject(ChangeDetectorRef);
  state = this.dialog.getState();
  private unsub: (() => void) | null = null;

  constructor() {
    this.unsub = this.dialog.subscribe((s) => {
      this.state = s;
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this.unsub?.();
  }

  get iconFa(): [string, string] {
    switch (this.state.variant) {
      case 'danger': return ['fas', 'triangle-exclamation'];
      case 'primary': return ['fas', 'circle-info'];
      default: return ['fas', 'circle-question'];
    }
  }

  get iconClass(): string {
    switch (this.state.variant) {
      case 'danger': return 'bg-destructive/10 text-destructive';
      case 'primary': return 'bg-primary/10 text-primary';
      default: return 'bg-muted text-muted-foreground';
    }
  }

  get confirmButtonClass(): string {
    switch (this.state.variant) {
      case 'danger': return 'bg-destructive text-destructive-foreground';
      case 'primary': return 'bg-primary text-primary-foreground';
      default: return 'bg-primary text-primary-foreground';
    }
  }
}
