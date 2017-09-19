const router = require("cmdrouter");
const path = require("path");
const fs = require("fs-extra-plus");
const postcss = require("postcss");
const hbsPrecompile = require("hbsp").precompile; // promise style

const rollup = require('rollup');
const rollup_cjs = require('rollup-plugin-commonjs');
const rollup_re = require('rollup-plugin-node-resolve');
const rollup_ts = require('rollup-plugin-typescript2');
// Latest rollup-plugin-multi does not work with latest rollup, but pull request worked (https://github.com/rollup/rollup-plugin-multi-entry/pull/23)
// so, this is the temporary patched version
const rollup_multi = require('./rollup-plugin-multi-entry-patched');

const processors = [
	require("postcss-import"),
	require("postcss-mixins"),
	require("postcss-simple-vars"),
	require("postcss-nested"),
	require("postcss-cssnext")({ browsers: ["last 2 versions"] })
];

// Define the constant for this project (needs to be before the router...route())
const rootDir = "./"; // here we assume we script will be run from the package.json dir
const srcDir = path.join(rootDir, "src/");
const webDir = path.join(rootDir, "web/");

const jsDistDir = path.join(webDir, "js/");
const cssDistDir = path.join(webDir, "css/");

// function that returns the full name from the srcDir
const sourceName = name => path.join(srcDir, name);

// src dirs
const pcssSrcDirs = ["pcss/", "view/", "elem/"].map(sourceName);
const tmplSrcDirs = ["view/"].map(sourceName);

// we route the command to the appropriate function
router({ _default, app, lib, css, tmpl, watch }).route();

// --------- Command Functions --------- //
async function _default() {
	await lib();
	await app();
	await tmpl();
	await css();
	//await testCss();
	//await testTmpl();
}

async function app(){
	var start = now();
	ensureDist();
	
	var dist = path.join(webDir, "js/app-bundle.js");
	var entries = await fs.listFiles("src/", ".ts");	
	// var entries = await fs.listFiles(jsSrcDirs, ".ts");	
	try{
		await rollupFiles(entries, dist, {ts: true, globals: {
			"d3": "window.d3",
			"mvdom": "window.mvdom", 
			"handlebars": "window.Handlebars"
		}});
	}catch(ex){
		console.log("BUILD ERROR - something when wrong on rollup\n\t" + ex);
		console.log("Empty string was save to the app bundle");
		console.log("Trying saving again...");
		return;
	}

	await printLog("Rollup", dist, start);
}

async function lib(){
	var start = now();
	ensureDist();
	
	var dist = path.join(webDir, "js/lib-bundle.js");
	var entries = ["src/lib-bundle.js"];	

	await rollupFiles(entries, dist, {ts: false});

	await printLog("Rollup", dist, start);
}

async function css() {
	var start = now();
	ensureDist();

	var dist = path.join(cssDistDir, "all-bundle.css");
	await pcssFiles(await fs.listFiles(pcssSrcDirs, ".pcss"), dist);

	await printLog("postCSS", dist, start);
}

async function tmpl() {
	var start = now();
	ensureDist();

	var dist = path.join(webDir, "js/templates.js");
	await tmplFiles(await fs.listFiles(tmplSrcDirs, ".tmpl"), dist);

	await printLog("Template", dist, start);
}


async function watch() {
	// first we build all
	await _default();

	// NOTE: here we do not need to do await (even if we could) as it is fine to not do them sequentially. 

	fs.watchDirs(["src/"], ".ts", () => app());

	fs.watchDirs(pcssSrcDirs, ".pcss", () => css());

	fs.watchDirs(tmplSrcDirs, ".tmpl", () => tmpl());

}
// --------- /Command Functions --------- //


// --------- Utils --------- //

// make sure the dist folder exists
function ensureDist() {
	fs.ensureDirSync(jsDistDir);
	fs.ensureDirSync(cssDistDir);
}


async function tmplFiles(files, distFile) {

	await fs.unlinkFiles([distFile]);

	var templateContent = [];

	for (let file of files) {

		let htmlTemplate = await fs.readFile(file, "utf8");
		let template = await hbsPrecompile(file, htmlTemplate);
		templateContent.push(template);
	}

	await fs.writeFile(distFile, templateContent.join("\n"), "utf8");
}

async function pcssFiles(entries, distFile) {

	try {
		var mapFile = distFile + ".map";
		await fs.unlinkFiles([distFile, mapFile]);

		var processor = postcss(processors);
		var pcssNodes = [];

		// we parse all of the .pcss files
		for (let srcFile of entries) {
			// read the file
			let pcss = await fs.readFile(srcFile, "utf8");

			var pcssNode = postcss.parse(pcss, {
				from: srcFile
			});
			pcssNodes.push(pcssNode);
		}

		// build build the combined rootNode and its result
		var rootNode = null;
		for (let pcssNode of pcssNodes) {
			rootNode = (rootNode) ? rootNode.append(pcssNode) : pcssNode;
		}
		var rootNodeResult = rootNode.toResult();

		// we process the rootNodeResult
		var pcssResult = await processor.process(rootNodeResult, {
			to: distFile,
			map: { inline: false }
		});
	} catch (ex) {
		console.log(`postcss ERROR - Cannot process ${distFile} because (setting css empty file) \n${ex}`);
		// we write the .css and .map files
		await fs.writeFile(distFile, "", "utf8");
		await fs.writeFile(mapFile, "", "utf8");
		return;
	}

	// we write the .css and .map files
	await fs.writeFile(distFile, pcssResult.css, "utf8");
	await fs.writeFile(mapFile, pcssResult.map, "utf8");
}


var defaultOpts = {
	ts: true
};

/**
 * 
 * @param {*} entries 
 * @param {*} distFile 
 * @param {*} opts 
 *    - ts?: boolean - (default true)
 *    - globals?: {importName: globalName} - (default undefined) define the list of global names (assumed to be mapped to window._name_)
 */
async function rollupFiles(entries, distFile, opts) {
	opts = Object.assign({}, defaultOpts, opts);

	await fs.remove("./.rpt2_cache");

	// delete the previous ouutput files
	var mapFile = distFile + ".map";
	await fs.unlinkFiles([distFile, mapFile]);

	// set the default rollup input options
	const inputOptions = {
		input: entries, 
		plugins: [rollup_multi(), rollup_cjs(), rollup_re()]
	};

	// set the default rollup output options
	// make the name from file name "web/js/lib-bundle.js" : "lib_bundle"
	var name = path.parse(distFile).name.replace(/\W+/g, "_");
	const outputOptions = {
		file: distFile,
		format: 'iife',
		name: name,
		sourcemap: true,
		sourcemapFile: mapFile
	};

	// if ts, then, we add the rollup_ts plugin
	if (opts.ts){
		// Note: if we do not have clean:true, we get some exception when watch.
		inputOptions.plugins.push(rollup_ts({clean: true}));
	}

	// if we have some globals, we add them accordingly
	if (opts.globals){
		// for input, just set the external (clone to be safe(r))
		inputOptions.external = Object.keys(opts.globals);
		outputOptions.globals = opts.globals;
	}

	try{
		// bundle
		const bundle = await rollup.rollup(inputOptions);

		// write
		await bundle.write(outputOptions);

		// make sure the .rpt2_cache/ folder is delete (apparently, clean:true does not work)
		//await fs.remove("./.rpt2_cache");
	}catch(ex){
		// make sure we write nothing in the file, to know nothing got compiled
		await fs.writeFile(distFile, "", "utf8");
		throw ex;
	}
}

// return now in milliseconds using high precision
function now() {
	var hrTime = process.hrtime();
	return hrTime[0] * 1000 + hrTime[1] / 1000000;
}

async function printLog(txt, dist, start) {
	var size = (await fs.stat(dist)).size;
	size = Math.round(size / 1000.0);

	console.log(txt + " - " + dist + " - " + Math.round(now() - start) + "ms - " + size + "kb" );
}
// --------- /Utils --------- //
