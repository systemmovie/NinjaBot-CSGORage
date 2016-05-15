var utils = require('./utils.js')

module.exports = {
	__dev: false,
	socket_port: 3131,
	database_name: "./data/accounts.dat",
	log_file_name: "./logs/log_" + utils.date_file_system() + ".log",
	send_email: false,
	use_proxy: false,
	proxy_list: [], // proxy strings with ip and port "0.0.0.0:8080", "1.1.1.1:8080"
	___current_proxy: 0
};

