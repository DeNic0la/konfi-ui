import {
  afterNextRender,
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  PLATFORM_ID,
  ViewEncapsulation,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { WebSocketConnectingService } from '../services/web-socket-connecting.service';
import { interval } from 'rxjs';
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
