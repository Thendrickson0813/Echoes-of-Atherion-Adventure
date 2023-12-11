import { TestBed } from '@angular/core/testing';

import { LocationUpdateFireService } from './location-update-fire.service';

describe('LocationUpdateFireService', () => {
  let service: LocationUpdateFireService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LocationUpdateFireService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
