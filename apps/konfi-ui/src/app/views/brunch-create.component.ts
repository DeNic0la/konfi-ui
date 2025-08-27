import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  ViewEncapsulation,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Card } from 'primeng/card';
import { FloatLabel } from 'primeng/floatlabel';
import { InputText } from 'primeng/inputtext';
import {
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  debounceTime,
  filter,
  map,
  Subscription,
} from 'rxjs';
import { KeyFilter } from 'primeng/keyfilter';
import { Password } from 'primeng/password';
import { Button } from 'primeng/button';
import { BrunchCreateService } from '../services/brunch-create.service';

@Component({
  selector: 'app-brunch-create',
  imports: [
    CommonModule,
    Card,
    FloatLabel,
    InputText,
    FormsModule,
    ReactiveFormsModule,
    KeyFilter,
    Password,
    Button,
  ],
  templateUrl: './brunch-create.component.html',
  styles: `
    :host {
      display: block;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 1rem;
    }

    .brunch-create-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem 0;
    }

    .brunch-create-navigation {
      margin-bottom: 1rem;
    }

    .back-button {
      color: rgba(255, 255, 255, 0.9) !important;
    }

    .back-button:hover {
      color: white !important;
      background-color: rgba(255, 255, 255, 0.1) !important;
    }

    .brunch-create-header {
      text-align: center;
      margin-bottom: 2rem;
      color: white;
    }

    .brunch-create-title {
      font-size: 2.5rem;
      font-weight: 600;
      margin: 0 0 0.5rem 0;
      text-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .brunch-create-subtitle {
      font-size: 1.1rem;
      opacity: 0.9;
      margin: 0;
    }

    .brunch-create-content {
      animation: slideUp 0.6s ease-out;
    }

    .brunch-create-card {
      box-shadow: 0 20px 60px rgba(0,0,0,0.15);
      border-radius: 16px;
      border: none;
      overflow: hidden;
    }

    .brunch-create-card .p-card-body {
      padding: 3rem;
    }

    .brunch-create-form {
      max-width: none;
    }

    .form-section {
      margin-bottom: 2.5rem;
    }

    .form-section:last-child {
      margin-bottom: 0;
    }

    .section-title {
      font-size: 1.3rem;
      font-weight: 600;
      color: #2c3e50;
      margin: 0 0 0.5rem 0;
      display: flex;
      align-items: center;
    }

    .section-title i {
      color: #667eea;
      font-size: 1.2rem;
    }

    .section-description {
      color: #6c757d;
      margin: 0 0 1.5rem 0;
      font-size: 0.95rem;
      line-height: 1.5;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
      margin-bottom: 1rem;
      margin-top: 1.5rem;

    }

    .form-field {
      position: relative;
    }

    .form-field .p-floatlabel {
      margin-bottom: 0.5rem;
    }

    .form-field input,
    .form-field .p-password .p-password-input {
      font-size: 1rem;
      border-radius: 8px;
      border: 2px solid #e9ecef;
      padding: 0.75rem 1rem;
      transition: all 0.3s ease;
      width: 100%;
    }

    .form-field .p-password {
      width: 100%;
    }

    .form-field input:focus,
    .form-field .p-password .p-password-input:focus {
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    .form-field input.ng-invalid.ng-touched,
    .form-field .p-password.ng-invalid.ng-touched .p-password-input {
      border-color: #e74c3c;
    }

    .form-field label {
      font-weight: 500;
      color: #495057;
    }

    .form-help {
      color: #6c757d;
      font-size: 0.875rem;
      line-height: 1.4;
      margin-top: 0.25rem;
      display: block;
    }

    .form-error {
      color: #e74c3c;
      font-size: 0.875rem;
      margin-top: 0.25rem;
      display: flex;
      align-items: center;
      animation: fadeIn 0.3s ease-in;
    }

    .form-error i {
      font-size: 0.75rem;
    }

    .form-actions {
      margin-top: 2rem;
      text-align: center;
    }

    .submit-button {
      min-width: 200px;
      padding: 0.75rem 2rem;
      font-size: 1.1rem;
      font-weight: 600;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
      transition: all 0.3s ease;
    }

    .submit-button:hover:not([disabled]) {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
    }

    .submit-button[disabled] {
      opacity: 0.6;
      cursor: not-allowed;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      :host {
        padding: 0.5rem;
      }

      .brunch-create-container {
        padding: 1rem 0;
      }

      .brunch-create-title {
        font-size: 2rem;
      }

      .brunch-create-card .p-card-body {
        padding: 2rem;
      }

      .form-row {
        grid-template-columns: 1fr;
        gap: 1rem;
      }

      .section-title {
        font-size: 1.2rem;
      }
    }

    @media (max-width: 480px) {
      .brunch-create-title {
        font-size: 1.8rem;
      }

      .brunch-create-card .p-card-body {
        padding: 1.5rem;
      }

      .submit-button {
        width: 100%;
        min-width: auto;
      }
    }

    /* Animations */
    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateX(-10px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    /* PrimeNG Component Overrides */
    .p-floatlabel {
      position: relative;
    }

    .p-floatlabel label {
      position: absolute;
      top: 50%;
      left: 0.75rem;
      transform: translateY(-50%);
      transition: all 0.2s ease;
      pointer-events: none;
      font-size: 1rem;
      color: #6c757d;
      font-weight: 400;
      z-index: 1;
    }


    .p-floatlabel input:focus ~ label {
      color: #667eea;
    }

    .p-floatlabel input.ng-invalid.ng-touched ~ label {
      color: #e74c3c;
    }

    .p-password {
      display: block;
    }

    .p-password .p-password-input {
      width: 100% !important;
      box-sizing: border-box;
    }

    .p-password .p-password-toggle {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      color: #6c757d;
      cursor: pointer;
      padding: 0;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .p-password .p-password-toggle:hover {
      color: #495057;
    }

    .p-button.p-button-loading .p-button-icon {
      margin-right: 0.5rem;
    }
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BrunchCreateComponent implements OnInit, OnDestroy {
  private readonly bcs = inject(BrunchCreateService);
  private readonly router = inject(Router);
  private sub: Subscription = new Subscription();
  public readonly idRegexp = /^[a-zA-Z0-9-]+$/;
  public isSubmitting = false;

  ngOnInit(): void {
    const s = this.form.controls.title.valueChanges
      .pipe(
        filter(
          (value): value is string =>
            typeof value === 'string' && value?.trim()?.length > 0
        ),
        debounceTime(300),
        map((input) => input.trim().replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '').toLowerCase())
      )
      .subscribe({ next: (value) => this.form.controls.id.patchValue(value) });
    this.sub.add(s);
  }

  private readonly fb = inject(FormBuilder);
  public readonly form = this.fb.group({
    title: this.fb.control('', [Validators.required, Validators.minLength(2)]),
    id: this.fb.control('', [
      Validators.required,
      Validators.minLength(3),
      Validators.pattern('^[a-zA-Z0-9-]+$'),
      Validators.maxLength(50),
    ]),
    votingPassword: this.fb.control(''),
    adminPassword: this.fb.control(''),
    question: this.fb.control('', [Validators.required, Validators.minLength(5)]),
  });

  isInvalid(controlName: string) {
    const control = this.form.get(controlName);
    return control?.invalid && (control.touched || control.dirty);
  }

  onSubmit() {
    if (this.form.invalid) {
      this.markAllFieldsAsTouched();
      return;
    }

    this.isSubmitting = true;
    const subscr = this.bcs
      .send(this.form.value)
      .subscribe({
        next: (value) => {
          console.log('Brunch created successfully:', value);
          this.isSubmitting = false;

          // Navigate to admin page with the created brunch ID
          const brunchId = this.form.value.id;
          if (brunchId) {
            this.router.navigate(['/table/admin', brunchId])
              .then(() => console.log('Navigated to admin page'))
              .catch(err => console.error('Navigation error:', err));
          }
        },
        error: (error) => {
          console.error('Error creating brunch:', error);
          this.isSubmitting = false;
          // TODO: Show error message to user with toast or inline message
        }
      });
    this.sub.add(subscr);
  }

  private markAllFieldsAsTouched() {
    Object.keys(this.form.controls).forEach(key => {
      this.form.get(key)?.markAsTouched();
    });
  }


  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }
}
