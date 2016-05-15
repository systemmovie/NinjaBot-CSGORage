var app;
var BrowserWindow;
var config;
var db;
var fs;
var socket;

module.exports = {
	setup: function(_app, _BrowserWindow, _config, _db, _fs) {
		app = _app;
		BrowserWindow = _BrowserWindow;
		config = _config;
		db = _db;
		fs = _fs;
	},
	on_connect: function(_socket) {
		socket = _socket;

		this.csgorage_check();

		var $this = this;
		
		setInterval(function() {
			log("ClientSocket: Checking...");
			$this.csgorage_check();
		}, 20 * 60 * 1000);
	},
	csgorage_check: function() {
		socket.emit('csgorage check raffles', {});
	}
};