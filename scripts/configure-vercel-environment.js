const fs = require('node:fs');

const apiUrl = process.env.API_URL;
if (!apiUrl) throw new Error('Set the API_URL environment variable in Vercel.');

const parsedUrl = new URL(apiUrl);
if (parsedUrl.protocol !== 'https:') throw new Error('API_URL must use HTTPS.');

fs.writeFileSync(
	'src/environments/environment.vercel.ts',
	`export const environment = ${JSON.stringify({
		production: true,
		apiUrl: apiUrl.replace(/\/+$/, '')
	})};\n`
);
