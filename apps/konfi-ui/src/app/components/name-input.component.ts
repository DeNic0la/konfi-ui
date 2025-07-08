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
import { NameService } from '../services/name.service';

@Component({
  selector: 'app-name-input',
  imports: [
    CommonModule,
    FloatLabelModule,
    InputText,
    FormsModule,
    ButtonLabel,
    ButtonIcon,
    ButtonDirective,
    StyleClass,
  ],
  template: `
    <div
      class="flex-row  h-screen w-full justify-center items-center block ml-auto mr-auto align-content-center align-items-center"
    >
      <div
        class="flex flex-column flex-nowrap block m-auto justify-content-center align-content-center align-items-center"
      >
        <div class="block justify-content-center align-self-center">
          <h3>Gib deinen Namen an</h3>
          <div class="mt-3 grid grid-cols-2 gap-2">
            <div class="w-1/3 block">
              <p-floatlabel pStyleClass="w-6">
                <input
                  id="username"
                  tabindex="1"
                  pInputText
                  [(ngModel)]="nameService.username"
                />
                <label for="username">Username</label>
              </p-floatlabel>
            </div>
            <div class="w-1/3 block">
              <button pButton>
                <i class="pi pi-check" pButtonIcon></i>
                <span
                  pButtonLabel
                  tabindex="2"
                  (keydown.enter)="nameService.confirmName()"
                  (click)="nameService.confirmName()"
                  >Ok</span
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
export class NameInputComponent {
  public readonly nameService = inject(NameService);
}
