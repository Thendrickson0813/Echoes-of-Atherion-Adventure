import { TestBed } from '@angular/core/testing';

import { MyFsService } from './my-fs';

describe('MyFsService', () => {
  let service: MyFsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MyFsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
