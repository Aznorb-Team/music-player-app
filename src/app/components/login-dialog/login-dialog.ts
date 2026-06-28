import {
  ChangeDetectionStrategy,
  Component,
  inject,
  output,
  signal,
} from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Dialog } from 'primeng/dialog';
import { InputText } from 'primeng/inputtext';
import { Password } from 'primeng/password';
import { Button } from 'primeng/button';
import { AuthService } from '../../services/auth-service/auth-service';
import {
  DEMO_AUTH_EMAIL,
  DEMO_AUTH_PASSWORD,
} from '../../services/auth-service/auth-service.const';

@Component({
  selector: 'app-login-dialog',
  templateUrl: './login-dialog.html',
  styleUrl: './login-dialog.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Dialog, InputText, Password, Button, ReactiveFormsModule],
})
export class LoginDialogComponent {
  private readonly _authService = inject(AuthService);

  readonly closed = output<void>();

  protected readonly visible = signal(true);
  protected readonly demoEmail = DEMO_AUTH_EMAIL;
  protected readonly demoPassword = DEMO_AUTH_PASSWORD;

  protected readonly emailControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.email],
  });
  protected readonly passwordControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required],
  });

  protected submit(): void {
    if (this.emailControl.invalid || this.passwordControl.invalid) {
      this.emailControl.markAsTouched();
      this.passwordControl.markAsTouched();
      return;
    }

    const success = this._authService.login(
      this.emailControl.value,
      this.passwordControl.value,
    );

    if (success) {
      this.close();
    }
  }

  protected onVisibleChange(visible: boolean): void {
    if (this.visible() === visible) {
      return;
    }

    this.visible.set(visible);

    if (!visible) {
      this.closed.emit();
    }
  }

  protected close(): void {
    if (!this.visible()) {
      return;
    }

    this.visible.set(false);
    this.closed.emit();
  }
}
