import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { BrunchCreateComponent } from './brunch-create.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('BrunchCreateComponent', () => {
  let component: BrunchCreateComponent;
  let fixture: ComponentFixture<BrunchCreateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BrunchCreateComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(BrunchCreateComponent, {
        set: {
          template: '<div>Test Template</div>',
          schemas: [NO_ERRORS_SCHEMA],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(BrunchCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
