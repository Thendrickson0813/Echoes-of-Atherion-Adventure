import { TestBed } from '@angular/core/testing';

import { TextFeedService } from './text-feed.service';

describe('TextFeedService', () => {
  let service: TextFeedService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TextFeedService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
