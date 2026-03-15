import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { ToastService, type Toast, type ToastType } from '../services/toast.service';

@Component({
  selector: 'mc-toast',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  template: `
    <div class="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      <div class="pointer-events-auto flex flex-col gap-2">
        @for (toast of toasts; track toast.id) {
          <div
            [class]="getToastClasses(toast.type)"
            class="rounded-lg border shadow-lg px-4 py-3 flex items-start gap-3"
          >
            <fa-icon [icon]="getIcon(toast.type)" class="shrink-0 w-4 h-4" />
            <p class="text-sm font-medium flex-1">{{ toast.message }}</p>
            <button
              type="button"
              (click)="toastService.dismiss(toast.id)"
              class="shrink-0 text-current opacity-70 hover:opacity-100 p-0.5 -m-0.5"
              aria-label="Dismiss"
            >
              <fa-icon [icon]="['fas', 'xmark']" class="w-4 h-4" />
            </button>
          </div>
        }
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastComponent implements OnDestroy {
  readonly toastService = inject(ToastService);
  private readonly cdr = inject(ChangeDetectorRef);
  toasts: Toast[] = [];
  private unsub: (() => void) | null = null;

  constructor() {
    this.unsub = this.toastService.subscribe((t) => {
      this.toasts = t;
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this.unsub?.();
  }

  getIcon(type: ToastType): [string, string] {
    switch (type) {
      case 'success': return ['fas', 'check'];
      case 'error': return ['fas', 'xmark'];
      case 'warning': return ['fas', 'triangle-exclamation'];
      default: return ['fas', 'circle-info'];
    }
  }

  getToastClasses(type: ToastType): string {
    const base = 'bg-card border';
    switch (type) {
      case 'success': return `${base} border-green-200 bg-green-50 text-green-800`;
      case 'error': return `${base} border-destructive/30 bg-destructive/10 text-destructive`;
      case 'warning': return `${base} border-amber-200 bg-amber-50 text-amber-800`;
      default: return `${base} border-border text-foreground`;
    }
  }
}
