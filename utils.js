module.exports = {
	date_file_system: function() {
		var date = new Date().toISOString();
	    date = date.replace(/-/gi, "_");
	    date = date.replace(/:/gi, "_");
	    date = date.replace(/T/gi, "__");
	    date = date.slice(0, 20);
	    return date;
	},
	date_log: function() {
	    var date = new Date().toISOString();
	    date = date.replace(/T/gi, "  ");
	    date = date.slice(0, 20);
	    return date;
	},
	strip_html: function(html) {
	    html=html.replace(/<br>/gi, "\n");
	    html=html.replace(/<p.*>/gi, "\n");
	    html=html.replace(/<a.*href="(.*?)".*>(.*?)<\/a>/gi, " $2 (Link->$1) ");
	    html=html.replace(/<(?:.|\s)*?>/g, "");
	    return html;
	},
	print_logo: function() {
		log(" ____  _____   _                _         ______            _    ");
		log("|_   \|_   _| (_)              (_)       |_   _ \          / |_  ");
		log("  |   \ | |   __   _ .--.      __  ,--.    | |_) |   .--. `| |-' ");
		log("  | |\ \| |  [  | [ `.-. |    [  |`'_\ :   |  __'. / .'`\ \| |   ");
		log(" _| |_\   |_  | |  | | | |  _  | |// | |, _| |__) || \__. || |,  ");
		log("|_____|\____|[___][___||__][ \_| |\'-;__/|_______/  '.__.' \__/  ");
		log("                            \____/                               ");
		log("Pedro Henrique - system.pedrohenrique@gmail.com------------------");
	}

};

