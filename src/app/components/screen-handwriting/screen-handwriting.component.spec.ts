import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScreenHandwritingComponent } from './screen-handwriting.component';

describe('ScreenHandwritingComponent', () => {
  let component: ScreenHandwritingComponent;
  let fixture: ComponentFixture<ScreenHandwritingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScreenHandwritingComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ScreenHandwritingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
