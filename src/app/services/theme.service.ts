import { Injectable, effect, signal } from '@angular/core';

export type ThemeMode = 'light' | 'dark' | 'system';

@Injectable({
	providedIn: 'root'
})
export class ThemeService {
	private readonly storageKey = 'app-theme';
	readonly mode = signal<ThemeMode>(this.getInitialMode());

	constructor() {
		effect(() => {
			const mode = this.mode();
			localStorage.setItem(this.storageKey, mode);
			this.applyTheme(mode);
		});

		window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
			if (this.mode() === 'system') {
				this.applyTheme('system');
			}
		});
	}

	setMode(mode: ThemeMode): void {
		this.mode.set(mode);
	}

	toggle(): void {
		const current = this.mode();
		if (current === 'light') {
			this.setMode('dark');
		} else if (current === 'dark') {
			this.setMode('system');
		} else {
			this.setMode('light');
		}
	}

	private getInitialMode(): ThemeMode {
		const stored = localStorage.getItem(this.storageKey) as ThemeMode | null;
		if (stored === 'light' || stored === 'dark' || stored === 'system') {
			return stored;
		}
		return 'system';
	}

	private applyTheme(mode: ThemeMode): void {
		const root = document.documentElement;
		const body = document.body;
		root.classList.remove('app-dark', 'dark');
		body.classList.remove('app-dark', 'dark');

		if (mode === 'dark') {
			root.classList.add('app-dark', 'dark');
			body.classList.add('app-dark', 'dark');
			return;
		}

		if (mode === 'system') {
			const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
			if (prefersDark) {
				root.classList.add('app-dark', 'dark');
				body.classList.add('app-dark', 'dark');
			}
		}
	}
}
