import { TestBed } from '@angular/core/testing';

import { RealTimeService } from './real-time.service';

describe('RealTimeService', () => {
  let service: RealTimeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RealTimeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
