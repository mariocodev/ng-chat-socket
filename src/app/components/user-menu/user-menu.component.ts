import { Component, EventEmitter, HostBinding, Input, Output } from '@angular/core';
import { NgClass } from '@angular/common';
import { ThemeMode, ThemeService } from '../../services/theme.service';

@Component({
	selector: 'app-user-menu',
	standalone: true,
	imports: [NgClass],
	templateUrl: './user-menu.component.html',
	styleUrls: ['./user-menu.component.scss']
})
export class UserMenuComponent {
	@HostBinding('class.compact')
	get compactClass(): boolean {
		return this.compact;
	}

	@Input() userName: string | null | undefined;
	@Input() userEmail: string | null | undefined;
	@Input() compact = false;
	@Output() logout = new EventEmitter<void>();

	readonly themeMode = this.themeService.mode;

	constructor(private themeService: ThemeService) {}

	setThemeMode(mode: ThemeMode): void {
		this.themeService.setMode(mode);
	}

	onLogout(): void {
		this.logout.emit();
	}
}
