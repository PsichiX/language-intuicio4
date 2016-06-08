'use strict';

var CompositeDisposable = require('atom').CompositeDisposable;

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

	subs.add(atom.commands.add('atom-text-editor', 'intuicio4:compile', function(){
		self.onCompile(this);
	}));

};

Intuicio.prototype.deactivate = function(){

	this.subscriptions.dispose();
	this.subscriptions = null;

};

Intuicio.prototype.onCompile = function(dom){

	console.log('COMPILE', dom);

};

module.exports = new Intuicio();
