//  ____  _____   _                _         ______            _    
// |_   \|_   _| (_)              (_)       |_   _ \          / |_  
//   |   \ | |   __   _ .--.      __  ,--.    | |_) |   .--. `| |-' 
//   | |\ \| |  [  | [ `.-. |    [  |`'_\ :   |  __'. / .'`\ \| |   
//  _| |_\   |_  | |  | | | |  _  | |// | |, _| |__) || \__. || |,  
// |_____|\____|[___][___||__][ \_| |\'-;__/|_______/  '.__.' \__/  
//                             \____/                                
// Pedro Henrique - system.pedrohenrique@gmail.com
// http://pedrohenrique.ninja

try {
    var app = require('app');
    var BrowserWindow = require('browser-window');
    var fs = require('fs');
    var socket_io = require('socket.io')();
    var socket_io_client = require('socket.io-client');
    var nedb = require('nedb');
    var nodemailer = require('nodemailer');

    // Configuration and utility
    var config = require('./config.js');
    var email_credentials = require('./email.json');
    var utils = require('./utils.js');
    var server_handle = require('./server_handle.js');
    var client_handle = require('./client_handle.js');

    // Create our log function
    global.log = function(message) {
        console.log(message);

        // log to file as well
        fs.appendFile(config.log_file_name, utils.date_log() + ": " + message + "\n", function (err) {});
    };

    // Set our database as a global object
    global.db = new nedb({ filename: config.database_name, autoload: true});


    // Make sure we are using a single instance of our application
    var shouldQuit = app.makeSingleInstance(function(commandLine, workingDirectory) {
        log("The NinjaBot is already running");
    });

    if (shouldQuit) {
        app.quit();
        return;
    }
    

    // Define our mail function 
    global.send_mail = function(to, subject, html) {

        if (!config.send_email) {
            return;
        }

        // replace the @ symbol
        email_credentials.email = email_credentials.email.replace(/@/gi, "%40");

        var transporter = nodemailer.createTransport('smtps://' + email_credentials.email + ':' + email_credentials.password + '@smtp.gmail.com');
        message = utils.strip_html(html);

        var mailOptions = {
            from: '"NinjaBot 🕵" <' + email_credentials.email +'>', 
            to: to, 
            subject: "NinjaBot: " + subject,
            text: message,
            html: html
        };

        // send mail with defined transport object
        transporter.sendMail(mailOptions, function(error, info){
            if (error) {
                log("Error while trying to send an email")
                log(error);
            }

            log('Email sent to: ' + to + " with subject: " + subject + " \n" + info.response);
        });
    };

    var client_socket = null;
    var background_window = null;

    app.on('ready', function() {
        utils.print_logo();

        // create our background window
        // this prevent our app from closing suddenly
        var background_window = new BrowserWindow({
            width: 800,
            height: 480,
            show: false,
            webPreferences: {
                nodeIntegration: false
            }
        });

        background_window.on('closed', function() {
            background_window = null;
        });

        server_handle.setup(app, BrowserWindow, config, db, fs, client_handle);
        client_handle.setup(app, BrowserWindow, config, db, fs);

        // Create our server socket and client socket and pass through
        socket_io.on('connection', server_handle.on_connection);
        socket_io.listen(config.socket_port);
        log("Listening on port:" + config.socket_port);

        socket_client = socket_io_client.connect("http://localhost:" + config.socket_port);
        client_handle.on_connect(socket_client);
        

    });

} catch(err) {
    console.log("An exception was raised");
    console.log(err);
}
