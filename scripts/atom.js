'use strict';

var CompositeDisposable = require('atom').CompositeDisposable,
	shelljs = require('shelljs'),
	child_process = require('child_process'),
	path = require('path'),
	version = '4.0.0',
	intuicio_toolset_download_url = 'https://github.com/PsichiX/language-intuicio4/releases';

function formatString(format, object)
{
	if(!format){
		return "";
	}
	return format.replace(/\$\{([a-zA-Z0-9_]+)\}/g,
		function(value, id)
		{
			var r = object[id];
			return typeof r === 'string' ? r : value;
		}
	);

}

function Intuicio() {

	this.config = {
		/*checkSyntaxOnSave: {
			title: 'Check syntax on Save',
			description: 'If set to true, then *.i4s file will checked for syntax errors on Save',
			type: 'boolean',
			default: true
		}*/
		commandCheckSyntax: {
			title: 'Check syntax command',
			description: 'Command triggered on syntax check',
			type: 'string',
			default: 'intuicio ${FILE_PATH} -sd ${FILE_DIR}'
		},
		commandRunScript: {
			title: 'Run script command',
			description: 'Command triggered on script run',
			type: 'string',
			default: 'intuicio ${FILE_PATH} -sd ${FILE_DIR} -ep I4Run -sd ${FILE_DIR} -mcs 8'
		}
	};

}

Intuicio.prototype = Object.create(null);

Intuicio.prototype.config = null;
Intuicio.prototype.subscriptions = null;

Intuicio.prototype.activate = function(state){

	var subs = this.subscriptions = new CompositeDisposable();

	subs.add(atom.commands.add('atom-text-editor', 'intuicio4:check-syntax', function(){
		this.onCheckSyntax();
	}.bind(this)));
	subs.add(atom.commands.add('atom-text-editor', 'intuicio4:run', function(){
		this.onRun();
	}.bind(this)));
	subs.add(atom.commands.add('atom-text-editor', 'intuicio4:compile', function(){
		this.onCompile();
	}.bind(this)));
	subs.add(atom.commands.add('*', 'intuicio4:info', function(){
		this.onInfo();
	}.bind(this)));

};

Intuicio.prototype.deactivate = function(){

	this.subscriptions.dispose();
	this.subscriptions = null;

};

Intuicio.prototype.promiseCheckBinaries = function(){

	return new Promise(function(accept, reject){

		if(!shelljs.which('intuicio')){
			atom.notifications.addError('There is no Intuicio Toolset installed on this machine!', {
				detail: 'Please, download Intuicio Toolset from official releases webpage at GitHub.'
			});
			var platform = process.platform,
				cmd = '';
			if('win32'){
				cmd = 'start ' + intuicio_toolset_download_url;
			}else if('linux'){
				cmd = 'xdg-open ' + intuicio_toolset_download_url;
			}else if('darwin'){
				cmd = 'open ' + intuicio_toolset_download_url;
			}
			shelljs.exec(cmd, {async: true});
			reject();
		}else{
			child_process.exec('intuicio -v', function(error, stdout, stderr){
				var r = /^Intuicio\s+v([0-9]+\.[0-9]+\.[0-9]+)$/,
					m = stdout.match(r);
				if(m.length < 2 || m[1] !== version){
					atom.notifications.addError('Intuicio Toolset version does not match Atom language version supported!', {
						detail: 'Intuicio Toolset installed: ' + m[1] + '\nAtom language support: ' + version
					});
					reject();
				}else{
					accept();
				}
			});
		}

	});

};

Intuicio.prototype.promiseCheckSyntax = function(filePath){

	return new Promise(function(accept, reject){

		var dir = path.dirname(filePath),
			cmd = formatString(
				atom.config.get('language-intuicio4.commandCheckSyntax'),
				{
					FILE_PATH: filePath,
					FILE_DIR: dir
				}
			);

		child_process.exec(cmd, {
			cwd: dir
		}, function(error, stdout, stderr){
			if(error){
				atom.notifications.addError(stdout);
				reject();
			}else{
				atom.notifications.addSuccess(filePath + ' is free from syntax errors!');
				accept();
			}
		});

	});

};

Intuicio.prototype.promiseCompileScript = function(filePath){

	return new Promise(function(accept, reject){

		atom.notifications.addError('COMPILATION TO NATIVE MODULE IS NOT YET IMPLEMENTED!');
		reject();

	});

};

Intuicio.prototype.promiseRunScript = function(filePath){

	return new Promise(function(accept, reject){

		var dir = path.dirname(filePath),
			cmd = formatString(
				atom.config.get('language-intuicio4.commandRunScript'),
				{
					FILE_PATH: filePath,
					FILE_DIR: dir
				}
			);

		child_process.exec(cmd, {
			cwd: dir
		}, function(error, stdout, stderr){
			if(error){
				atom.notifications.addError('Running: ' + filePath, {
					detail: stdout
				});
				reject();
			}else{
				atom.notifications.addSuccess('Running: ' + filePath, {
					detail: stdout
				});
				accept();
			}
		});

	});

};

Intuicio.prototype.promiseShowInfo = function(filePath){

	return new Promise(function(accept, reject){

		var cmd = 'intuicio -v';

		child_process.exec(cmd, function(error, stdout, stderr){
			if(error){
				atom.notifications.addError(stdout);
				reject();
			}else{
				atom.notifications.addSuccess(stdout);
				accept();
			}
		});

	});

};

Intuicio.prototype.onCheckSyntax = function(){

	var editor = atom.workspace.getActivePaneItem(),
		file = editor ? editor.buffer.file : null,
		filePath = file ? file.path : null,
		ext = filePath ? path.extname(filePath) : null;

	if(ext !== '.i4s'){
		return;
	}
	this.promiseCheckBinaries()
		.then(this.promiseCheckSyntax.bind(this, filePath))
		.catch(function(reason){
			if(reason){
				atom.notifications.addError(reason.toString());
			}
		});

};

Intuicio.prototype.onCompile = function(){

	var editor = atom.workspace.getActivePaneItem(),
		file = editor ? editor.buffer.file : null,
		filePath = file ? file.path : null,
		ext = filePath ? path.extname(filePath) : null;

	if(ext !== '.i4s'){
		return;
	}
	this.promiseCheckBinaries()
		.then(this.promiseCompileScript.bind(this, filePath))
		.catch(function(reason){
			if(reason){
				atom.notifications.addError(reason.toString());
			}
		});

};

Intuicio.prototype.onRun = function(){

	var editor = atom.workspace.getActivePaneItem(),
		file = editor ? editor.buffer.file : null,
		filePath = file ? file.path : null,
		ext = filePath ? path.extname(filePath) : null;

	if(ext !== '.i4s'){
		return;
	}
	this.promiseCheckBinaries()
		.then(this.promiseRunScript.bind(this, filePath))
		.catch(function(reason){
			if(reason){
				atom.notifications.addError(reason.toString());
			}
		});

};

Intuicio.prototype.onInfo = function(){

	this.promiseCheckBinaries()
		.then(this.promiseShowInfo.bind(this))
		.catch(function(reason){
			if(reason){
				atom.notifications.addError(reason.toString());
			}
		});

};

module.exports = new Intuicio();
