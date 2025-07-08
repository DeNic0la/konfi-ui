import { ComponentFixture, TestBed } from '@angular/core/testing';
import { KonfiSelectionComponent } from './konfi-selection.component';

describe('KonfiSelectionComponent', () => {
  let component: KonfiSelectionComponent;
  let fixture: ComponentFixture<KonfiSelectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KonfiSelectionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(KonfiSelectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
