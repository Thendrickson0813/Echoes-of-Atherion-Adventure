import { TestBed } from '@angular/core/testing';

import { EventBroadcastService } from './event-broadcast.service';

describe('EventBroadcastService', () => {
  let service: EventBroadcastService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EventBroadcastService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
