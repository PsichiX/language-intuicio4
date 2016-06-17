'use strict';

var CompositeDisposable = require('atom').CompositeDisposable,
	shelljs = require('shelljs'),
	child_process = require('child_process'),
	path = require('path'),
	version = '4.0.0',
	intuicio_toolset_download_url = 'https://github.com/PsichiX/language-intuicio4/releases';

function Intuicio() {

	this.config = {
		compileOnSave: {
			title: 'Compile on Save',
			description: 'If set to true, then *.i4s file is compiled on Save',
			type: 'boolean',
			default: true
		}
	};

}

Intuicio.prototype = Object.create(null);

Intuicio.prototype.config = null;
Intuicio.prototype.subscriptions = null;

Intuicio.prototype.activate = function(state){

	var subs = this.subscriptions = new CompositeDisposable(),
		self = this;

	subs.add(atom.commands.add('atom-text-editor', 'intuicio4:check-syntax', function(){
		self.onCheckSyntax(this);
	}));
	subs.add(atom.commands.add('atom-text-editor', 'intuicio4:run', function(){
		self.onRun(this);
	}));
	subs.add(atom.commands.add('atom-text-editor', 'intuicio4:compile', function(){
		//self.onCompile(this);
		throw Error('COMPILATION TO NATIVE MODULE IS NOT YET IMPLEMENTED!');
	}));
	subs.add(atom.commands.add('*', 'intuicio4:info', function(){
		self.onInfo(this);
	}));

};

Intuicio.prototype.deactivate = function(){

	this.subscriptions.dispose();
	this.subscriptions = null;

};

Intuicio.prototype.promiseCheckBinaries = function(){

	return new Promise(function(accept, reject){

		if(!shelljs.which('intuicio')){
			atom.notifications.addError('There is no Intuicio Toolset installed on this machine!\n\nAfter closing this dialog, you\'ll be able to download Intuicio Toolset from official GitHub webpage.');
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
					atom.notifications.addError('Intuicio Toolset version does not match Atom language version supported!\nIntuicio Toolset installed: ' + m[1] + '\nAtom language support: ' + version);
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

		var cmd = 'intuicio ' + filePath;

		child_process.exec(cmd, function(error, stdout, stderr){
			if(error){
				atom.notifications.addError(stdout);
				reject();
			}else{
				accept();
			}
		});

	});

};

Intuicio.prototype.promiseCompileScript = function(filePath){

	return new Promise(function(accept, reject){

		reject();

	});

};

Intuicio.prototype.promiseRunScript = function(filePath){

	return new Promise(function(accept, reject){

		var dir = path.dirname(filePath),
			cmd = 'intuicio ' + filePath
				+ ' -sd ' + dir
				+ ' -ep I4Run -mcs 8';

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

Intuicio.prototype.onCheckSyntax = function(dom){

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
			atom.notifications.addError(reason);
		});

};

Intuicio.prototype.onCompile = function(dom){

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
			atom.notifications.addError(reason);
		});

};

Intuicio.prototype.onRun = function(dom){

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
			atom.notifications.addError(reason);
		});

};

Intuicio.prototype.onInfo = function(dom){

	this.promiseCheckBinaries()
		.then(this.promiseShowInfo.bind(this))
		.catch(function(reason){
			atom.notifications.addError(reason);
		});

};

module.exports = new Intuicio();
