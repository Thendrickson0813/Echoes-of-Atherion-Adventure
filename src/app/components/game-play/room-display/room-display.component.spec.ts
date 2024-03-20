import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoomDisplayComponent } from './room-display.component';

describe('RoomDisplayComponent', () => {
  let component: RoomDisplayComponent;
  let fixture: ComponentFixture<RoomDisplayComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [RoomDisplayComponent]
    });
    fixture = TestBed.createComponent(RoomDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
