import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FriendsSidebarComponent } from './friends-sidebar.component';

describe('FriendsSidebarComponent', () => {
  let component: FriendsSidebarComponent;
  let fixture: ComponentFixture<FriendsSidebarComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FriendsSidebarComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FriendsSidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
