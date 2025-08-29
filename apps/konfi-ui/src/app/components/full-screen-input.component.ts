import {
  ChangeDetectionStrategy,
  Component,
  Input,
  Output,
  ViewEncapsulation,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputText } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { ButtonDirective, ButtonIcon, ButtonLabel } from 'primeng/button';
import { StyleClass } from 'primeng/styleclass';
import {
  debounce,
  debounceTime,
  distinctUntilChanged,
  NEVER,
  shareReplay,
  Subject,
  map,
  switchMap,
  take,
} from 'rxjs';
import { PushPipe } from '@ngrx/component';

@Component({
  selector: 'app-full-screen-input',
  imports: [
    CommonModule,
    FloatLabelModule,
    InputText,
    FormsModule,
    ButtonLabel,
    ButtonIcon,
    ButtonDirective,
    StyleClass,
    PushPipe,
  ],
  template: `
    <div
      class="flex-row  h-screen w-full justify-center items-center block ml-auto mr-auto align-content-center align-items-center"
    >
      <div
        class="flex flex-column flex-nowrap block m-auto justify-content-center align-content-center align-items-center"
      >
        <div class="block justify-content-center align-self-center">
          <h3>{{ title }}</h3>
          <div class="mt-3 grid grid-cols-2 gap-2">
            <div class="w-1/3 block">
              <p-floatlabel pStyleClass="w-6">
                <input
                  [id]="id"
                  tabindex="1"
                  pInputText
                  (keydown.enter)="onSubmitAction$.next()"
                  [ngModel]="viewValue$ | ngrxPush"
                  (ngModelChange)="modelValue$.next($event)"
                />
                <label for="{{ id }}">Username</label>
              </p-floatlabel>
            </div>
            <div class="w-1/3 block">
              <button pButton>
                <i class="pi pi-check" pButtonIcon></i>
                <span
                  pButtonLabel
                  tabindex="2"
                  (keydown.enter)="onSubmitAction$.next()"
                  (click)="onSubmitAction$.next()"
                  >{{ buttonLabel }}</span
                >
              </button>
            </div>
          </div>
        </div>
        <div class="block"></div>
      </div>
    </div>
  `,
  styles: `
    :host {
      display: contents;
    }
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FullScreenInputComponent {
  @Input() id = '';
  @Input() buttonLabel = 'Ok';
  @Input() title = 'Gib deinen Namen an';
  public readonly onSubmitAction$ = new Subject<void>();
  public readonly modelValue$ = new Subject<string>();
  @Input() set value(val: string) {
    this.modelValue$.next(val);
  }
  public readonly viewValue$ = this.modelValue$.pipe(
    debounceTime(800),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  @Output()
  public readonly sucessfullSubmit$ = this.viewValue$.pipe(
    map((value) => value?.trim()?.length > 0),
    distinctUntilChanged(),
    switchMap((valid) =>
      valid
        ? this.onSubmitAction$.pipe(
            debounce(() => this.viewValue$),
            switchMap(() => this.viewValue$.pipe(take(1)))
          )
        : NEVER
    )
  );
}
