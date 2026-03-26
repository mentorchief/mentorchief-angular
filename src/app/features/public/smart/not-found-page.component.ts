import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'mc-not-found-page',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="min-h-[60vh] flex items-center justify-center px-4">
      <div class="text-center">
        <h1 class="text-8xl font-bold text-primary">404</h1>
        <h2 class="text-2xl font-semibold text-foreground mt-4">Page not found</h2>
        <p class="text-muted-foreground mt-3 max-w-md mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div class="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            routerLink="/"
            class="px-6 py-2.5 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity no-underline"
          >
            Go Home
          </a>
          <a
            routerLink="/browse"
            class="px-6 py-2.5 border border-border text-foreground rounded-md hover:bg-muted transition-colors no-underline"
          >
            Browse Mentors
          </a>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFoundPageComponent {}
