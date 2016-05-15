var app;
var BrowserWindow;
var config;
var db;
var fs;
var client_handlel

var csgorage_window_worker;

module.exports = {
	setup: function(_app, _BrowserWindow, _config, _db, _fs, _client_handle) {
		app = _app;
		BrowserWindow = _BrowserWindow;
		config = _config;
		db = _db;
		fs = _fs;
		client_handle = _client_handle;
	},
	on_connection: function(socket) {
		log("New connection");

        socket.on('global erase database', function(payload) {
            log("[Emit:erase database] Database erased");
            db.remove({}, { multi: true }, function (err, numRemoved) {});
        }); // socket on global erase database

        socket.on('global close', function(payload) {
            log("[Emit:close] Close app");
            app.exit(1)
        }); // socket on global close

        socket.on('global show database', function(payload) {
            log("[Emit:show database] Show database");
            db.find(payload, function(err, result) {
                log(JSON.stringify(result));
            });
        });

        //    ____ ____   ____  ___  ____                  
        //  / ___/ ___| / ___|/ _ \|  _ \ __ _  __ _  ___ 
        // | |   \___ \| |  _| | | | |_) / _` |/ _` |/ _ \
        // | |___ ___) | |_| | |_| |  _ < (_| | (_| |  __/
        //  \____|____/ \____|\___/|_| \_\__,_|\__, |\___|
        //                                     |___/      
        // CSGORage Module

        socket.on('csgorage delete account', function(payload) {
        	log("CSGORage: [Emit:delete account] Delete account " + payload.email);
        	db.remove({module: "csgorage", email: payload.email}, { multi: true }, function (err, numRemoved) {
		  		if (err) {
		  			log("CSGORage: Error while trying to delete an account");
		  		} else {
		  			log("CSGORage: account deleted");
		  		}
			});
        });

        socket.on('csgorage register account', function(payload) {
            log("CSGORage: [Emit:register account] register new account");

            var new_account_data = {
                module: "csgorage",
                account: payload.account_name,
                email: payload.email,
                cookie_name: payload.cookie_name,
                cookie_value: payload.cookie_value,
                number_checks: 0,
                number_registered: 0,
                enable: true // we can disable new account registration if we need
            };


            db.find({module: "csgorage", email: payload.email}, function(err, data) {
                if (err) {
                    log("CSGORage: error while trying to get information from the database, can't create a new account");
                } 

                if (data.length >= 1) {
                    log("CSGORage: Email already registered");

                } else {
                    db.insert(new_account_data, function(err, new_data) {
                        if (err) {
                            log("CSGORage: error while trying to insert data on database");
                        } else {
                            log("CSGORage: new account saved on database");
                        }
                    });
                }
                
            });

        }); // socket on csgorage register account

        socket.on('csgorage not connected', function(payload) {
            log("CSGORage: [Emit:not connected] account " + payload.account_name + " not connected");

            send_mail(payload.email, "CSGORage - Conta não linkada", "Ao tentar entrar em uma rifa no CSGORage, encontramos um problema,<br> sua conta: " + payload.account_name + " parece não possuir informações de login válidas.<br> Atualize as informações de login (cookies) no <a href='http://bot.pedrohenrique.ninja'>site do bot</a>.<br><br>NinjaBot");

            if (csgorage_window_worker) {
                csgorage_window_worker.close();
            }

        }); // socket on csgorage not connected

        socket.on('csgorage done checking', function(payload) {
            log("CSGORage: [Emit:done checking] done checking for account " + payload.account_name);

            if (csgorage_window_worker) {
                csgorage_window_worker.close();
            }
        }); // socket on csgorage done checking

        socket.on('csgorage sucess enter raffle', function(payload) {
            log("CSGORage: [Emit:sucess enter raffle] registered on raffle: " + payload.name);

            db.find({module: "csgorage", email: payload.email}, function(err, result) {
                if (err) {
                    log("CSGORage: error while trying to get information from the database")
                }

                // simple increment
                var new_number_registered = Number(result[0]["number_registered"]);
                new_number_registered++;

                db.update({module: "csgorage", email: payload.email}, { $set: { number_registered: new_number_registered } }, { multi: true }, function (err, numReplaced) {
                    if (err) {
                        log("CSGORage: error while trying to update the database")
                    }
                });
            });

        }); // socket on csgorage sucess enter raffle

        socket.on('csgorage cloudflare alwaysonline', function(payload) {
            log("CSGORage: [Emit:cloudflare alwaysonline] CloudFlare AlwaysOnline detected, trying again in a few minutes");
        	setTimeout(function() {
        		client_handle.csgorage_check();
        	}, 5 * 60 * 1000); // retry in 5 minutes
        }); // socket on csgorage cloudflare alwaysonline

        socket.on('csgorage page error', function(payload) {
            log("CSGORage: [Emit:page error] we can't get the raffle page");
            send_mail("system.pedrohenrique@gmail.com", "CSGORage - Sem acesso a página", "Mensagem: CSGORage: [Emit:page error] we can't get the raffle page<br>");
        }); // socket on csgorage page error

        socket.on('csgorage clear cache', function(payload) {
            log("CSGORage: [Emit:page error] clear cache");
            csgorage_window_worker.webContents.session.clearCache(function(){});
        }); // clear cache

        socket.on('csgorage cloudflare captcha', function(payload) {
            log("CSGORage: [Emit:cloudflare captcha] CloudFlare is requesting a captcha validation");
            send_mail("system.pedrohenrique@gmail.com", "CSGORage - CloudFlare Solicitando Captcha", "Mensagem: CSGORage: [Emit:cloudflare captcha] CloudFlare is requesting a captcha validation<br><br> Faça login no VPS para responder a captcha");
        }); // socket on csgorage cloudflare captcha

        socket.on('csgorage check raffles', function(payload) {
            log("CSGORage: [Emit:check raffles] check raffles");

            if (csgorage_window_worker) {
                log("CSGORage: already making a checking or using the CSGORage Window worker");
                return;
            }

            db.find({ module: "csgorage", enable: true }, function (err, accounts) {
                if (err) {
                    log("CSGORage: error while trying to get data from database");
                } else {
                    var number_accounts = accounts.length;
                    var account_list = accounts;
                    log(number_accounts + " accounts to check");

                    var current_account = 0;

                    var check_account = function(acc) {
                        log("checking " + acc.account + " account");

                        var show_window = false;

                        if (config.__dev) {
                            show_window = true;
                        }

                        csgorage_window_worker = new BrowserWindow({
                            width: 800,
                            height: 480,
                            show: show_window,
                            webPreferences: {
                                nodeIntegration: false
                            }
                        });

                        if (config.__dev) {
                            csgorage_window_worker.openDevTools();
                        }
                        

                        csgorage_window_worker.loadURL("http://csgorage.com/free-raffles/current");

                        var session = csgorage_window_worker.webContents.session;

                        session.cookies.set({
                            url: "http://csgorage.com/",
                            name: acc.cookie_name,
                            value: acc.cookie_value,
                            domain: ".csgorage.com",
                            path: "/"
                        }, function(err) {
                            if (err) {
                                log("CSGORage: error while trying to set the cookie");
                            }
                        });

                        db.find({module: "config", name: "cf_clearance"}, function(err, data) {
                        	if (err) {
                        		log("CSGORage: error while trying to set the cf_clearance cookie");
                        	} else {
                        		if (data.length > 0) {
		                        	session.cookies.set({
			                            url: "http://csgorage.com/",
			                            name: "cf_clearance",
			                            value: data[0].value,
			                            domain: ".csgorage.com",
			                            path: "/"
			                        }, function(err) {
			                            if (err) {
			                                log("CSGORage: error while trying to set the cf_clearance cookie");
			                            } // if err set cookie
			                        }); // set cookie
		                        } // if data.length > 0
	                        } // if err
                        }); // find module config cf_clearance

                        if (config.use_proxy && config.proxy_list.length > 0) {
                            var proxy = config.proxy_list[config.___current_proxy];
                            session.setProxy({
                               "proxyRules": proxy
                            }, function() {
                               log("CSGORage: Proxy " + proxy + " set");
                            });

                            config.___current_proxy++;
                            if (config.___current_proxy >= config.proxy_list.length) {
                                config.___current_proxy = 0;
                            }
                        }


                        csgorage_window_worker.on('closed', function() {

	                        // save the cf_clearance cookies if have it
	                        // this cookie is need to avoid CloudFlare anti-bot system
	                        session.cookies.get({
	                        	name: "cf_clearance"
	                        }, function(err, cookies) {
	                            if (err) { log("CSGORage: error while trying to get the cf_clearance cookie information");
	                        	} else {
	                            	if (cookies.length > 0) {
	                            		db.find({module: "config", name: "cf_clearance"}, function(err, data) { 
	                            			if (err) { log("CSGORage: error while trying the cf_clearance database information");
	                            			} else {
	                            				if (data.length > 0) { // update
	                            					db.update({module: "config", name: "cf_clearance"}, { $set: { value: cookies[0].value} }, { multi: true }, function (err, numReplaced) {
					                                    if (err) {
					                                        log("CSGORage: error while trying to update cf_clearance database information")
					                                    } else {
					                                    	log("CSGORage: cf_clearance updated on database");
					                                    }// if err
					                                }); // db update 
	                            				} else { // insert
	                            					db.insert({ module: "config", name: "cf_clearance", value: cookies[0].value}, function(err, new_data) {
								                        if (err) { log("CSGORage: error while trying to insert cf_clearance on database");
								                        } else {
								                            log("CSGORage: cf_clearance saved on database");
								                        } // if err insert cf_clearance database
								                    }); // db insert
	                            				} // if data.length > 0
	                            			} // if err find config cf_clearance
	                            		}); // db find config cf_clearance
	                            	} // if cookies.length > 0
	                            } // if err get cookies
	                        }); // session cookies get

                            csgorage_window_worker = null;
                            current_account++;
                            
                            db.find({module: "csgorage", email: acc.email}, function(err, result) {
                                if (err) {
                                    log("CSGORage: error while trying to get information from the database")
                                }

                                // simple increment
                                var new_number_checks = Number(result[0]["number_checks"]);
                                new_number_checks++;

                                db.update({module: "csgorage", email: acc.email}, { $set: { number_checks: new_number_checks } }, { multi: true }, function (err, numReplaced) {
                                    if (err) {
                                        log("CSGORage: error while trying to update the database")
                                    }
                                });
                            });

                            if (current_account < number_accounts) {
                                check_account(account_list[current_account]);
                            } else {
                                log("CSGORage: done checking accounts");
                            }
                        });

                        csgorage_window_worker.webContents.on('dom-ready', function() { 
                            var socket_src_code = fs.readFile('./assets/socket.io.min.js', 'utf8', function(err, data) {
                                csgorage_window_worker.webContents.executeJavaScript(data);

                                var socket_code = 'var socket = io.connect("http://localhost:' + config.socket_port + '");';
                                csgorage_window_worker.webContents.executeJavaScript(socket_code);

                                csgorage_window_worker.webContents.executeJavaScript("window.ACC_NAME = '" + acc.account + "'; window.ACC_EMAIL = '" + acc.email + "'");

                                var raffle_code = fs.readFileSync('./assets/raffle.js', 'utf8');
                                csgorage_window_worker.webContents.executeJavaScript(raffle_code);
                            });
                        });

                    };

                    if (number_accounts > 0) {
                        check_account(account_list[current_account]);    
                    }
                }
            });
        }); // socket on csgorage check raffles

        //    ____ ____   ____  ___  ____                  
        //  / ___/ ___| / ___|/ _ \|  _ \ __ _  __ _  ___ 
        // | |   \___ \| |  _| | | | |_) / _` |/ _` |/ _ \
        // | |___ ___) | |_| | |_| |  _ < (_| | (_| |  __/
        //  \____|____/ \____|\___/|_| \_\__,_|\__, |\___|
        //                                     |___/        
        // Fim CSGORage Module
	}
};