import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  ViewEncapsulation,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Card } from 'primeng/card';
import { FloatLabel } from 'primeng/floatlabel';
import { InputText } from 'primeng/inputtext';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  BehaviorSubject,
  debounceTime,
  filter,
  map,
  Subject,
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
    }
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BrunchCreateComponent implements OnInit {
  private readonly bcs = inject(BrunchCreateService);
  private sub: Subscription = new Subscription();
  public readonly idRegexp = /^[a-zA-Z0-9-]+$/;
  ngOnInit(): void {
    const s = this.form.controls.title.valueChanges
      .pipe(
        filter(
          (value): value is string =>
            typeof value === 'string' && value?.trim()?.length > 3
        ),
        debounceTime(500),
        map((input) => input.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, ''))
      )
      .subscribe({ next: (value) => this.form.controls.id.patchValue(value) });
    this.sub.add(s);
  }
  private readonly fb = inject(FormBuilder);
  public readonly form = this.fb.group({
    title: this.fb.control('', Validators.required),
    id: this.fb.control('', [
      Validators.required,
      Validators.minLength(3),
      Validators.pattern('^[a-zA-Z0-9-]+$'),
      Validators.maxLength(50),
    ]),
    votingPassword: this.fb.control(''),
    adminPassword: this.fb.control(''),
    question: this.fb.control('', Validators.required),
  });
  isInvalid(controlName: string) {
    const control = this.form.get(controlName);
    return control?.invalid && control.touched;
  }

  onSubmit() {
    const subscr = this.bcs
      .send(this.form.value)
      .subscribe((value) => console.log(value));
    this.sub.add(subscr);
  }
}
