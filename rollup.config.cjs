const { babel } = require('@rollup/plugin-babel');
const { nodeResolve: resolve } = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');
const { terser } = require('rollup-plugin-terser');

const { builtinModules } = require('module');
const { dependencies } = require('./package.json');

module.exports = {
	input: 'src/index.js',
	output: [
		{
			file: `dist/index.cjs`,
			format: 'cjs',
			preferConst: true,
		},
		{
			file: `dist/index.mjs`,
			format: 'esm',
			preferConst: true,
		},
	],
	plugins: [
		babel({
			babelHelpers: 'bundled',
			exclude: '**/node_modules/**',
		}),
		commonjs(),
		resolve(),
		terser(),
	],
	external: [...builtinModules, ...Object.keys(dependencies)],
};
