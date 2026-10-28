# NgChatSocket

This project uses Angular 21 and standalone components. Use Node.js 22.12+ (or 20.19+). Templates use Angular's built-in `@if` and `@for` control flow, and component state uses signals where it changes asynchronously.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

The home page signs in through Google. After signing in, users who have previously logged in appear in the contact list; each private conversation remains at `/chat/:userId/:contactId` and is saved in this browser.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## GitHub Pages deployment

The workflow deploys on pushes to `main` or can be started manually from the Actions tab. Set the repository variable `API_URL` to the public backend URL, then set **Settings → Pages → Build and deployment → Source** to **GitHub Actions**.

## Vercel deployment

Import the repository into Vercel and set the `API_URL` environment variable to the HTTPS URL of the backend for each deployment environment. `vercel.json` configures the production build, static output directory, and Angular route fallback.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.
