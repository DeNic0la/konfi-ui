import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  ViewEncapsulation,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NameService } from '../services/name.service';
import { KonfiSelectionComponent } from '../components/konfi-selection.component';
import { NameInputComponent } from '../components/name-input.component';

@Component({
  selector: 'app-table',
  imports: [CommonModule, KonfiSelectionComponent, NameInputComponent],
  template: `<div>
    @if (nameService.nameConfirmed){
    <app-konfi-selection [id]="id()"></app-konfi-selection>
    } @else {
    <app-name-input></app-name-input>
    }
  </div> `,
  styles: `
    :host {
      display: block;
    }
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableComponent {
  public readonly nameService = inject(NameService);
  id = input<string>();
}
