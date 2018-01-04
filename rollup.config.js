import eslint from 'rollup-plugin-eslint';
import strip from 'rollup-plugin-strip';
import buble from 'rollup-plugin-buble';
import uglify from 'rollup-plugin-uglify';
import filesize from 'rollup-plugin-filesize';

var browser = (process.env.NODE_ENV === 'browser' || process.env.NODE_ENV === 'minify');
var minify = (process.env.NODE_ENV === 'minify');

var dest = 'index.js';
if(browser){
	dest = "simple-scorm-wrapper.js";
}
if(minify){
	dest = "simple-scorm-wrapper.min.js";
}


var name = require('./package.json').name,
	author = require('./package.json').author,
	version = require('./package.json').version,
	license = require('./package.json').license,
	description = require('./package.json').description;

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
				comments: function(node, comment) {
					var text = comment.value;
					var type = comment.type;
					if (type == "comment2") {
						return /@name|@version|@author|@license/i.test(text);
					}
				}
			}
		})),
		filesize()
	],
	output: {
		banner: ['/**','@name ' + name,'@version ' + version,'@description ' + description,'@author ' + author,'@license ' + license,'*/',].join('\n* '),
		name: "Scorm",
		format: browser ? "iife" : "cjs",
		sourcemap: !browser,
		sourcemapfile: 'index.js.map',
		file: dest,
	},
}