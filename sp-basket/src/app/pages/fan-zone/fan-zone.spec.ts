import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FanZone } from './fan-zone';

describe('FanZone', () => {
  let component: FanZone;
  let fixture: ComponentFixture<FanZone>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FanZone]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FanZone);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
