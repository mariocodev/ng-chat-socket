const { spawnSync } = require('node:child_process');

const configurations = {
	dev: 'development',
	local: 'local',
	prod: 'production'
};
const environment = process.argv[2] || 'local';
const configuration = configurations[environment];

if (!configuration) {
	console.error(`Entorno inválido: ${environment}. Usa dev, local o prod.`);
	process.exit(1);
}

const result = spawnSync(process.execPath, [
	require.resolve('@angular/cli/bin/ng.js'),
	'serve',
	'-o',
	`--configuration=${configuration}`,
	...process.argv.slice(3)
], { stdio: 'inherit' });

if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
