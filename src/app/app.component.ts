import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { ConfirmDialogComponent } from './shared/components/confirm-dialog.component';
import { ToastComponent } from './shared/components/toast.component';
import { appFontAwesomeIcons } from './core/icons/fontawesome.icons';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, FontAwesomeModule, ConfirmDialogComponent, ToastComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  constructor() {
    const library = inject(FaIconLibrary);
    library.addIcons(...appFontAwesomeIcons);
  }
}
