import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrunchCreateComponent } from './brunch-create.component';

describe('BrunchCreateComponent', () => {
  let component: BrunchCreateComponent;
  let fixture: ComponentFixture<BrunchCreateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BrunchCreateComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BrunchCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
