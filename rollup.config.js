import {eslint} from 'rollup-plugin-eslint';
import strip from 'rollup-plugin-strip';
import buble from 'rollup-plugin-buble';
import {uglify} from 'rollup-plugin-uglify';
import filesize from 'rollup-plugin-filesize';
import pkg from './package.json';

var browser = (process.env.NODE_ENV === 'browser' || process.env.NODE_ENV === 'minify'),
	minify = (process.env.NODE_ENV === 'minify'),
	banner = `/**
 * @name ${pkg.name}
 * @version ${pkg.version}
 * @description ${pkg.description}
 * @author ${pkg.author}
 * @license ${pkg.license}
 */
`;

export default {
	input: 'src/index.js',
	plugins: [
		eslint(),
		buble(),
		(browser && strip({
			debugger: true,
			functions: ['console.log', 'assert.*', 'debug', 'alert'],
			sourceMap: false
		})),
		(minify && uglify({
			output: {
				comments: (node, comment) => {
					if (comment.type == 'comment2') {
						return /@name|@version|@author|@license/i.test(comment.value);
					}
				}
			}
		})),
		filesize()
	],
	output: {
		banner: !minify ? banner : false,
		name: 'Scorm',
		format: browser ? 'iife' : 'cjs',
		sourcemap: !browser,
		sourcemapFile: 'index.js.map',
		file: minify && 'simple-scorm-wrapper.min.js' || browser && 'simple-scorm-wrapper.js' || 'index.js'
	},
}