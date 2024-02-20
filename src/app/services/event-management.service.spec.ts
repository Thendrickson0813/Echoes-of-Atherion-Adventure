import { TestBed } from '@angular/core/testing';

import { EventManagementService } from './event-management.service';

describe('EventManagementService', () => {
  let service: EventManagementService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EventManagementService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
