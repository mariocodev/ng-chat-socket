import { ComponentFixture, TestBed } from '@angular/core/testing';
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
    imports: [ChatComponent],
    providers: [
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: (key: string) => key === 'userId' ? 'user-1' : 'user-2' } } } },
        { provide: Router, useValue: { navigate: jasmine.createSpy('navigate') } },
        { provide: AuthService, useValue: { users: () => of([]), currentUser: () => of({
                    id: 'user-1', name: 'Usuario actual', email: 'user@example.com', picture: null, unreadCount: 0, online: true
                }) } },
        { provide: ChatService, useValue: {
                getMessageSubject: () => of([]),
                getHasMore: () => of(false),
                getErrors: () => of(''),
                getUnreadRefresh: () => of(),
                getPresenceUpdates: () => of(),
                getConnectionState: () => of(false),
                connect: jasmine.createSpy('connect'),
                openConversation: jasmine.createSpy('openConversation')
            } }
    ]
});
    fixture = TestBed.createComponent(ChatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows fallback initials after a profile image fails to load', () => {
    component.onPictureError('https://example.com/avatar.png');

    expect(component.hasPicture('https://example.com/avatar.png')).toBeFalse();
    expect(component.hasPicture(null)).toBeFalse();
  });
});
