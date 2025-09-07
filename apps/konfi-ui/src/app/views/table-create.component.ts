import {
  ChangeDetectionStrategy,
  Component,
  inject,
  ViewEncapsulation,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputText } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { ButtonDirective, ButtonIcon, ButtonLabel } from 'primeng/button';
import { StyleClass } from 'primeng/styleclass';
import { Router } from '@angular/router';
import { AutoFocus } from 'primeng/autofocus';
import {
  catchError,
  combineLatest,
  debounceTime,
  delay,
  filter,
  from,
  map,
  merge,
  Observable,
  of,
  ReplaySubject,
  shareReplay,
  skip,
  startWith,
  switchMap,
  tap,
} from 'rxjs';
import { LetDirective } from '@ngrx/component';

@Component({
  selector: 'app-table-create',
  imports: [
    CommonModule,
    FloatLabelModule,
    InputText,
    FormsModule,
    ButtonLabel,
    ButtonIcon,
    ButtonDirective,
    StyleClass,
    AutoFocus,
    LetDirective,
  ],
  template: `
    <div
      class="flex-row  h-screen w-full justify-center items-center block ml-auto mr-auto align-content-center align-items-center"
    >
      <div
        class="flex flex-column flex-nowrap block m-auto justify-content-center align-content-center align-items-center"
        *ngrxLet="vm$ as vm"
      >
        <div class="block justify-content-center align-self-center">
          <h3>Name des Tisches</h3>
          <div class="mt-3 grid grid-cols-2 gap-2">
            <div class="w-1/3 block">
              <p-floatlabel pStyleClass="w-6">
                <input
                  id="tablename"
                  [pAutoFocus]="true"
                  tabindex="1"
                  pInputText
                  (keydown.enter)="createTable()"
                  [invalid]="vm.invalid"
                  [(ngModel)]="tablename"
                />
                <label for="tablename">Tablename</label>
              </p-floatlabel>
            </div>
            <div class="w-1/3 block">
              <button
                pButton
                [disabled]="vm.loading"
                [severity]="vm.buttonSeverity"
                tabindex="2"
                (keydown.enter)="createTable()"
                (click)="createTable()"
                [loading]="vm.loading"
              >
                <i class="pi pi-check" pButtonIcon></i>
                <span pButtonLabel>Ok</span>
              </button>
            </div>
          </div>
        </div>
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
export class TableCreateComponent {
  private isLoading = false;
  private readonly router = inject(Router);
  public tablename = '';

  public createTable() {
    if (this.isLoading) return;
    this.createTable$.next(this.tablename);
  }
  private readonly createTable$ = new ReplaySubject<string>(1);
  private readonly validTableName$ = this.createTable$.pipe(
    map((name) => {
      const tableId = this.tablename
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-zA-Z0-9-]/g, '');
      const isValid = tableId.length > 0 && tableId !== 'admin';
      return { tableId, isValid };
    }),
    startWith({ tableId: '', isValid: false }),
    shareReplay({ refCount: true, bufferSize: 1 })
  );
  private readonly tablenameIsInvalid$ = this.validTableName$.pipe(
    map(({ isValid }) => !isValid),
    skip(1),
    startWith(false),
    shareReplay({ refCount: true, bufferSize: 1 })
  );
  private readonly navigationResult$ = this.validTableName$.pipe(
    filter(({ isValid }) => isValid),
    switchMap(({ tableId }) => {
      return from(
        this.router
          .navigateByUrl(`/table/admin/${tableId}`)
          .then((success) => ({ success }))
      ).pipe(
        catchError((error) => of({ success: false, error })),
        tap((value) => {
          console.log(value);
        })
      );
    }),
    shareReplay({ refCount: true, bufferSize: 1 })
  );
  private readonly updateButtonSeverity$ = merge(
    this.tablenameIsInvalid$.pipe(
      filter((isInvalid) => isInvalid),
      map(() => 'danger')
    ),
    this.navigationResult$.pipe(
      map(({ success }) => (success ? 'success' : 'danger'))
    )
  ).pipe(shareReplay({ refCount: true, bufferSize: 1 }));
  private readonly buttonSeverity$ = merge(
    this.updateButtonSeverity$,
    this.updateButtonSeverity$.pipe(
      debounceTime(3000),
      delay(3000),
      map(() => 'primary')
    )
  ).pipe(
    startWith('primary'),
    shareReplay({ refCount: true, bufferSize: 1 })
  ) as Observable<
    | 'success'
    | 'info'
    | 'warn'
    | 'danger'
    | 'help'
    | 'primary'
    | 'secondary'
    | 'contrast'
    | null
    | undefined
  >;
  private readonly isLoading$ = merge(
    this.validTableName$.pipe(
      filter(({ isValid }) => isValid),
      skip(1),
      map(() => true)
    ),
    this.navigationResult$.pipe(map(() => false))
  ).pipe(
    tap((value) => {
      this.isLoading = value;
    }),
    startWith(false),
    shareReplay({ refCount: true, bufferSize: 1 })
  );
  public readonly vm$ = combineLatest({
    invalid: this.tablenameIsInvalid$,
    loading: this.isLoading$,
    buttonSeverity: this.buttonSeverity$,
  }).pipe(
    tap((value) => {
      console.log(value);
    }),
    startWith({
      invalid: false,
      loading: false,
      buttonSeverity: 'primary' as
        | 'success'
        | 'info'
        | 'warn'
        | 'danger'
        | 'help'
        | 'primary'
        | 'secondary'
        | 'contrast'
        | null
        | undefined,
    })
  );
}
