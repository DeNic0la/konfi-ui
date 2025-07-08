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
import {
  CommonModule,
  isPlatformBrowser,
  NgOptimizedImage,
} from '@angular/common';
import { NameService } from '../services/name.service';
import { WebSocketConnectingService } from '../services/web-socket-connecting.service';
import { FormsModule } from '@angular/forms';
import { Rating } from 'primeng/rating';

@Component({
  selector: 'app-konfi-selection',
  imports: [
    CommonModule,
    FormsModule,
    Rating,
    NgOptimizedImage,
  ],
  template: ` <div
    class="flex-row h-screen w-full justify-center items-center block ml-auto mr-auto align-content-center align-items-center"
  >
    <div
      class="flex flex-column flex-nowrap block m-auto justify-content-center align-content-center align-items-center"
    >
      <div class="block justify-content-center align-self-center">
        <h3>Dein Voting</h3>
        <p-rating [ngModel]="value" (ngModelChange)="select($event)">
          <ng-template #onicon>
            <img
              ngSrc="konfi.svg"
              alt="Konfi-Full"
              height="100"
              width="100"
              priority
            />
          </ng-template>
          <ng-template #officon>
            <img
              ngSrc="konfi_gray.svg"
              alt="Konfi-Empty"
              height="100"
              width="100"
              priority
            />
          </ng-template>
        </p-rating>
      </div>
    </div>
  </div>`,
  styles: `
    :host {
      display: block;
    }
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KonfiSelectionComponent implements AfterViewInit {
  public readonly nameService = inject(NameService);
  private readonly webSocketService = inject(WebSocketConnectingService);
  private readonly plattform = inject(PLATFORM_ID);
  public value = 0;
  public select(vote: number) {
    this.webSocketService.updateKonfiVote(
      <string>this.id(),
      this.nameService.username,
      vote
    );
  }
  id = input<string>();
  constructor() {
    afterNextRender(() => {
      this.webSocketService.joinTable(
        <string>this.id(),
        this.nameService.username
      );
    });
  }
  ngAfterViewInit(): void {
    console.log(this.plattform);

    if (isPlatformBrowser(this.plattform)) {
      this.webSocketService.observeTable(<string>this.id()).subscribe((res) => {
        console.log(res);
      });

      this.webSocketService.updateKonfiVote(
        <string>this.id(),
        this.nameService.username,
        0
      );
    }
  }
}
