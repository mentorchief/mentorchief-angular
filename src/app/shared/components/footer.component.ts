import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'mc-footer',
  standalone: true,
  imports: [RouterLink],
  template: `
    <footer class="bg-foreground text-white/70">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
        <div class="grid grid-cols-2 md:grid-cols-5 gap-x-8 gap-y-10">
          <!-- Brand -->
          <div class="col-span-2 md:col-span-2">
            <div class="flex items-center gap-2.5 mb-4">
              <div class="w-9 h-9 bg-primary rounded-md flex items-center justify-center shrink-0">
                <span class="text-white font-bold text-sm">M</span>
              </div>
              <span class="text-white tracking-tight font-serif text-xl">
                Mentor<span class="text-primary">chief</span>
              </span>
            </div>
            <p class="text-white/50 text-sm leading-relaxed max-w-xs">
              Connecting ambitious mentees with world-class mentors. Your growth, secured.
            </p>
          </div>

          <!-- Platform -->
          <div class="col-span-1">
            <h4 class="text-white text-sm font-semibold uppercase tracking-wider mb-4">Platform</h4>
            <div class="flex flex-col gap-3">
              <a routerLink="/browse" class="text-white/50 hover:text-white transition-colors no-underline text-sm">Find Mentors</a>
              <a routerLink="/signup" class="text-white/50 hover:text-white transition-colors no-underline text-sm">Become a Mentor</a>
              <a routerLink="/how-it-works" class="text-white/50 hover:text-white transition-colors no-underline text-sm">How It Works</a>
            </div>
          </div>

          <!-- Company -->
          <div class="col-span-1">
            <h4 class="text-white text-sm font-semibold uppercase tracking-wider mb-4">Company</h4>
            <div class="flex flex-col gap-3">
              <a routerLink="/about" class="text-white/50 hover:text-white transition-colors no-underline text-sm">About Us</a>
              <a routerLink="/blog" class="text-white/50 hover:text-white transition-colors no-underline text-sm">Blog</a>
            </div>
          </div>

          <!-- Support -->
          <div class="col-span-1">
            <h4 class="text-white text-sm font-semibold uppercase tracking-wider mb-4">Support</h4>
            <div class="flex flex-col gap-3">
              <a routerLink="/help" class="text-white/50 hover:text-white transition-colors no-underline text-sm">Help Center</a>
              <a routerLink="/terms" class="text-white/50 hover:text-white transition-colors no-underline text-sm">Terms of Service</a>
              <a routerLink="/privacy" class="text-white/50 hover:text-white transition-colors no-underline text-sm">Privacy Policy</a>
            </div>
          </div>
        </div>

        <div class="border-t border-white/10 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-white/40 text-sm">
          <span>&copy; 2026 Mentorchief. All rights reserved.</span>
          <span class="text-white/20 text-xs">Built for ambitious learners.</span>
        </div>
      </div>
    </footer>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FooterComponent {}
