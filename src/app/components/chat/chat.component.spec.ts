import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { ChatComponent } from './chat.component';
import { AuthService } from '../../services/auth.service';
import { ChatService } from '../../services/chat.service';

describe('ChatComponent', () => {
  let component: ChatComponent;
  let fixture: ComponentFixture<ChatComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CommonModule, FormsModule],
      declarations: [ChatComponent],
      providers: [
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: (key: string) => key === 'userId' ? 'user-1' : 'user-2' } } } },
        { provide: Router, useValue: { navigate: jasmine.createSpy('navigate') } },
        { provide: AuthService, useValue: { users: () => of([]) } },
        { provide: ChatService, useValue: { getMessageSubject: () => of([]), getUnreadCounts: () => of({}), openConversation: jasmine.createSpy('openConversation') } }
      ]
    });
    fixture = TestBed.createComponent(ChatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
