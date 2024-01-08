import { TestBed } from '@angular/core/testing';

import { CharacterActivityService } from './character-activity.service';

describe('CharacterActivityService', () => {
  let service: CharacterActivityService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CharacterActivityService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
