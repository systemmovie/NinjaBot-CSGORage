// check if cloudflare is active
var cloudflare = document.querySelector("#cf_alert_div");
var csgorage = document.querySelector(".col-lg-12.title");

if (!!cloudflare) {
	socket.emit('csgorage cloudflare alwaysonline', {}); // retry in a few minutes
} else if (!!csgorage) {
	// check if the login button i
	var login = document.querySelector('.black_background .container .login a');

	if (!!login) {

		// if not connected we send a message to close the window
		// maybe send an email telling that the account is not connected
		socket.emit('csgorage not connected', {
	      account_name: window.ACC_NAME,
	      email: window.ACC_EMAIL
	    });

	} else {

		// if we are on the list of free raflles pages 
		if(location.href == "http://csgorage.com/free-raffles/current") {
			// get all the free raffles
			var links = document.querySelectorAll('.row .raffle_box_lg a');

			var link;
			var links_length = links.length;
			var ribbon;

			for(var i = 0; i < links_length; i++) {
				link = links[i];

				// check if we have the ribbon that we are in
				ribbon = link.querySelector('.ribbon-blue-mms');

				if (!ribbon) {
					// if we dont have the ribbon we change the page url 
					// to the raffle url
					var href = links[i].getAttribute('href');
					location.href = href;
				}
			}

			setTimeout(function() {
				socket.emit('csgorage done checking', {
					account_name: window.ACC_NAME
				});
			}, 100);

		} else {
			// if we are not on the free raffle page list we must be on the raffle page per si.
			var raffle_name = document.querySelector('p.gun').textContent.trim();


			//override the alert function
			function alert(message) {
				var result = message;
				if (result == "Success!") {
					socket.emit('csgorage sucess enter raffle', {
						name: raffle_name,
						email: window.ACC_EMAIL
					});
				}
			}

			var randomize_btn = document.querySelector("#randomize");
			
			if (randomize_btn) {
				randomize_btn.click();
				setTimeout(function() {
					document.querySelector("#getrandomslot").click();
				}, 1000);
			} else {
				// if we dont find a randomize button we must be already on the raffle
				// so we just go back to the raffle list
				location.href = "http://csgorage.com/free-raffles/current";	
			}
		} // if location.href free-raffles/current
	} // if login
} else {
	var cloudflare_captcha = document.querySelector("#cf-error-details");

	if (!!cloudflare_captcha) {
		socket.emit('csgorage cloudflare captcha', {});
	} else {
		socket.emit('csgorage page error', {});
	}
	
} // if cloudflare alwaysonline