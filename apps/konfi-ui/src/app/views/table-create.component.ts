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
import {Router} from "@angular/router";

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
  ],
  template: `
    <div
      class="flex-row  h-screen w-full justify-center items-center block ml-auto mr-auto align-content-center align-items-center"
    >
      <div
        class="flex flex-column flex-nowrap block m-auto justify-content-center align-content-center align-items-center"
      >
        <div class="block justify-content-center align-self-center">
          <h3>Name des Tisches</h3>
          <div class="mt-3 grid grid-cols-2 gap-2">
            <div class="w-1/3 block">
              <p-floatlabel pStyleClass="w-6">
                <input
                  id="tablename"
                  tabindex="1"
                  pInputText
                  [invalid]="tablename.trim().length === 0"
                  [(ngModel)]="tablename"
                />
                <label for="tablename">Tablename</label>
              </p-floatlabel>
            </div>
            <div class="w-1/3 block">
              <button pButton>
                <i class="pi pi-check" pButtonIcon></i>
                <span
                  pButtonLabel
                  tabindex="2"
                  (keydown.enter)="createTable()"
                  (click)="createTable()"
                  >Ok</span
                >
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
  private readonly router = inject(Router)
  public tablename = ""
  public createTable(){
    if (this.tablename.trim().length > 0) {
      let tableId = this.tablename.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '');
      if (tableId === "admin") tableId = "admin-table";
      this.router.navigateByUrl(`/table/admin/${tableId}`).then((v)=>console.log(v)).catch(err=>console.error(err));
    }
  }
}
