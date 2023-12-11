import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GamePlayComponent } from './game-play.component';

describe('GamePlayComponent', () => {
  let component: GamePlayComponent;
  let fixture: ComponentFixture<GamePlayComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [GamePlayComponent]
    });
    fixture = TestBed.createComponent(GamePlayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
