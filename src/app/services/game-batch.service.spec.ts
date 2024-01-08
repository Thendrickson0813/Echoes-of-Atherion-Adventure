import { TestBed } from '@angular/core/testing';

import { GameBatchService } from './game-batch.service';

describe('GameBatchService', () => {
  let service: GameBatchService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GameBatchService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
