import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InteractiveWindowComponent } from './interactive-window.component';

describe('InteractiveWindowComponent', () => {
  let component: InteractiveWindowComponent;
  let fixture: ComponentFixture<InteractiveWindowComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [InteractiveWindowComponent]
    });
    fixture = TestBed.createComponent(InteractiveWindowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
