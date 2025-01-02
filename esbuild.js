const esbuild = require('esbuild');

const buildOptions = {
	entryPoints: ['./src/extension.ts'],
	bundle: true,
	outfile: 'dist/extension.js',
	external: ['vscode'],
	format: 'cjs',
	platform: 'node',
	target: 'node14',
};

const args = process.argv.slice(2);

if (args.includes('--watch')) {
	// Watch mode
	esbuild.context(buildOptions).then(ctx => {
		ctx.watch();
	});
} else {
	// Single build
	esbuild.build({
		...buildOptions,
		minify: args.includes('--minify'),
	}).catch(() => process.exit(1));
}
