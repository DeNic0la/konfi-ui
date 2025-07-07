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
import {interval} from "rxjs";

@Component({
  selector: 'app-table',
  imports: [CommonModule],
  template: `<div>
    <p>TableComponent</p>
    <p>{{id()}}</p>
    <p>{{interval | async}}</p>
  </div>`,
  styles: `
    :host {
      display: block;
    }
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableComponent implements AfterViewInit {
  private readonly webSocketService = inject(WebSocketConnectingService);
  private readonly plattform = inject(PLATFORM_ID);
  id = input<string>();
  public readonly interval = interval(1000)
  constructor() {
    afterNextRender(() => {
      // Safe to check `scrollHeight` because this will only run in the browser, not the server.
    });
  }
  ngAfterViewInit(): void {
    console.log(this.plattform);

    if (isPlatformBrowser(this.plattform)) {
      this.webSocketService
        .observeTopic('/table/' + this.id())
        .subscribe((res) => {
          console.log(res);
        });

      this.webSocketService.publish("/table/"+this.id(),JSON.stringify({
        type: "JOIN",
        konfi: 0,
        user: "ME"
      }))
    }
  }
}
