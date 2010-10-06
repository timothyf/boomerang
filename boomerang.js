/**
\file boomerang.js
boomerang measures various performance characteristics of your user's browsing
experience and beacons it back to your server.

\details
To use this you'll need a web site, lots of users and the ability to do
something with the data you collect.  How you collect the data is up to
you, but we have a few ideas.

Copyright (c) 2010 Yahoo! Inc. All rights reserved.
Code licensed under the BSD License.  See the file LICENSE.txt
for the full license text.
*/

// beaconing section
// the parameter is the window
(function(w) {

var impl, boomr, k, d=w.document;

// Short namespace because I don't want to keep typing BOOMERANG
if(typeof BOOMR === "undefined") {
	BOOMR = {};
}
// don't allow this code to be included twice
if(BOOMR.version) {
	return;
}

BOOMR.version = "0.9";


// impl is a private object not reachable from outside the BOOMR object
// users can set properties by passing in to the init() method
impl = {
	// properties
	beacon_url: "",
	// strip out everything except last two parts of hostname.
	// This doesn't work well for domains that end with a country tld,
	// but we allow the developer to override site_domain for that.
	site_domain: w.location.hostname.
				replace(/.*?([^.]+\.[^.]+)\.?$/, '$1').
				toLowerCase(),
	//! User's ip address determined on the server.  Used for the BA cookie
	user_ip: '',

	// Ratio, used for the percentage-users tracking. Set ratio to the numeric percentage you want
	// tracked, 0-100, with 100 being full tracking. No % sign.
	ratio: '',
	ratiocookiename: 'boomrsession',

	events: {
		"page_ready": [],
		"page_unload": [],
		"before_beacon": []
	},

	vars: {},

	disabled_plugins: {},

	fireEvent: function(e_name, data) {
		var i, h, e;
		if(!this.events.hasOwnProperty(e_name)) {
			return false;
		}

		e = this.events[e_name];

		for(i=0; i<e.length; i++) {
			h = e[i];
			h[0].call(h[2], data, h[1]);
		}

		return true;
	},

	addListener: function(el, sType, fn, capture) {
		if(el.addEventListener) {
			el.addEventListener(sType, fn, (capture));
		}
		else if(el.attachEvent) {
			el.attachEvent("on" + sType, fn);
		}
	}
};


// We create a boomr object and then copy all its properties to BOOMR so that
// we don't overwrite anything additional that was added to BOOMR before this
// was called... for example, a plugin.
boomr = {
	// Utility functions
	utils: {
		getCookie: function(name) {
			if(!name) {
				return null;
			}

			name = ' ' + name + '=';
		
			var i, cookies;
			cookies = ' ' + d.cookie + ';';
			if ( (i=cookies.indexOf(name)) >= 0 ) {
				i += name.length;
				cookies = cookies.substring(i, cookies.indexOf(';', i));
				return cookies;
			}
		
			return null;
		},
		
		setCookie: function(name, subcookies, max_age, path, domain, sec) {
			var value = "",
			    k, nameval, c,
			    exp = "";

			if(!name) {
				return false;
			}
		
			for(k in subcookies) {
				if(subcookies.hasOwnProperty(k)) {
					value += '&' + encodeURIComponent(k)
							+ '=' + encodeURIComponent(subcookies[k]);
				}
			}
			value = value.replace(/^&/, '');
		
			if(max_age) {
				exp = new Date();
				exp.setTime(exp.getTime() + max_age*1000);
				exp = exp.toGMTString();
			}
		
			nameval = name + '=' + value;
			c = nameval +
				((max_age) ? "; expires=" + exp : "" ) +
				((path) ? "; path=" + path : "") +
				((typeof domain !== "undefined") ? "; domain="
						+ (domain !== null ? domain : impl.site_domain ) : "") +
				((sec) ? "; secure" : "");
		
			if ( nameval.length < 4000 ) {
				d.cookie = c;
				// confirm cookie was set (could be blocked by user's settings, etc.)
				return ( value === this.getCookie(name) );
			}
		
			return false;
		},
		
		getSubCookies: function(cookie) {
			var cookies_a,
			    i, l, kv,
			    cookies={};

			if(!cookie) {
				return null;
			}
		
			cookies_a = cookie.split('&');
		
			if(cookies_a.length === 0) {
				return null;
			}
		
			for(i=0, l=cookies_a.length; i<l; i++) {
				kv = cookies_a[i].split('=');
				kv.push("");	// just in case there's no value
				cookies[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1]);
			}
		
			return cookies;
		},
		
		removeCookie: function(name) {
			return this.setCookie(name, {}, 0, "/", null);
		},
		
		pluginConfig: function(o, config, plugin_name, properties) {
			var i, props=0;

			if(!config || !config[plugin_name]) {
				return false;
			}

			for(i=0; i<properties.length; i++) {
				if(typeof config[plugin_name][properties[i]] !== "undefined") {
					o[properties[i]] = config[plugin_name][properties[i]];
					props++;
				}
			}

			return (props>0);
		}
	},

	init: function(config) {
		var i, k,
		    properties = ["beacon_url", "site_domain", "user_ip","ratio","ratiocookiename"];
	
		if(!config) {
			config = {};
		}

		for(i=0; i<properties.length; i++) {
			if(typeof config[properties[i]] !== "undefined") {
				impl[properties[i]] = config[properties[i]];
			}
		}

		if(typeof config.log  !== "undefined") {
			this.log = config.log;
		}
		if(!this.log) {
			this.log = function(m,l,s) { };
		}

		//check if ratio has been set
		if(impl.ratio != ''){
			var tc=BOOMR.utils.getSubCookies(BOOMR.utils.getCookie(impl.ratiocookiename));

			// if boomr run is true then run boomerang during their session
			// 	and skip calculating the ratio this time
			if(tc != null && tc.run == "true"){
				var runRatio = false;
			// if boomr don't run session is false then don't run run boomerang during their session
			// 	and just return
			}else if(tc != null && tc.run == "false"){
				return false;
			}else{
					//If ratio is set and no session cookie exists then roll the dice
                     var runRatio = true;
			}

			if(runRatio){
				if(!this.randomNess()){
                                        // set don't run boomerang session subcookie
                                        BOOMR.utils.setCookie(
                                                        impl.ratiocookiename,
                                                        {run: "false"},
                                                        0,
                                                        "/", 
                                                        null);
                                        return false;
				}else{


                                      	// set run boomerang session subcookie
                                        BOOMR.utils.setCookie(
                                                        impl.ratiocookiename,
                                                        {run: "true"},
                                                        0,
                                                        "/", 
                                                        null);
				}
			}
		}

		for(k in this.plugins) {
			// config[pugin].enabled has been set to false
			if( config[k]
				&& typeof config[k].enabled !== "undefined"
				&& config[k].enabled === false
			) {
				impl.disabled_plugins[k] = 1;
				continue;
			}
			else if(impl.disabled_plugins[k]) {
				delete impl.disabled_plugins[k];
			}

			// plugin exists and has an init method
			if(this.plugins.hasOwnProperty(k)
				&& typeof this.plugins[k].init === "function"
			) {
				this.plugins[k].init(config); 
			}
		}
	
		// The developer can override onload by setting autorun to false
		if(typeof config.autorun === "undefined" || config.autorun !== false) {
			impl.addListener(w, "load",
						function() {
							impl.fireEvent("page_ready");
						}
					);
		}

		// This must be the last one to fire
		impl.addListener(w, "unload", function() { w=null; });
	
		return this;
	},

	// The page dev calls this method when they determine the page is usable.
	// Only call this if autorun is explicitly set to false
	page_ready: function() {
		impl.fireEvent("page_ready");
		return this;
	},

	subscribe: function(e_name, fn, cb_data, cb_scope) {
		var i, h, e;

		if(!impl.events.hasOwnProperty(e_name)) {
			return this;
		}

		e = impl.events[e_name];

		// don't allow a handler to be attached more than once to the same event
		for(i=0; i<e.length; i++) {
			h = e[i];
			if(h[0] === fn && h[1] === cb_data && h[2] === cb_scope) {
				return this;
			}
		}
		e.push([ fn, cb_data || {}, cb_scope || null ]);

		// Attach unload handlers directly to the window.onunload and
		// window.onbeforeunload events. The first of the two to fire will clear
		// fn so that the second doesn't fire. We do this because technically
		// onbeforeunload is the right event to fire, but all browsers don't
		// support it.  This allows us to fall back to onunload when onbeforeunload
		// isn't implemented
		if(e_name === 'page_unload') {
			impl.addListener(w, "unload",
						function() {
							if(fn) {
								fn.call(cb_scope, null, cb_data);
							}
							fn=cb_scope=cb_data=null;
						}
					);
			impl.addListener(w, "beforeunload",
						function() {
							if(fn) {
								fn.call(cb_scope, null, cb_data);
							}
							fn=cb_scope=cb_data=null;
						}
					);
		}

		return this;
	},

	addVar: function(name, value) {
		if(typeof name === "string") {
			impl.vars[name] = value;
		}
		else if(typeof name === "object") {
			var o = name, k;
			for(k in o) {
				if(o.hasOwnProperty(k)) {
					impl.vars[k] = o[k];
				}
			}
		}
		return this;
	},

	removeVar: function() {
		var i, params;
		if(!arguments.length) {
			return this;
		}

		if(arguments.length === 1
				&& Object.prototype.toString.apply(arguments[0]) === "[object Array]") {
			params = arguments[0];
		}
		else {
			params = arguments;
		}

		for(i=0; i<params.length; i++) {
			if(impl.vars.hasOwnProperty(params[i])) {
				delete impl.vars[params[i]];
			}
		}

		return this;
	},

	sendBeacon: function() {
		var k, url, img, nparams=0;
	
		// At this point someone is ready to send the beacon.  We send
		// the beacon only if all plugins have finished doing what they
		// wanted to do
		for(k in this.plugins) {
			if(this.plugins.hasOwnProperty(k)) {
				if(impl.disabled_plugins[k]) {
					continue;
				}
				if(!this.plugins[k].is_complete()) {
					BOOMR.warn("Incomplete plugins, not sending beacon");
					return this;
				}
			}
		}
	
		// If we reach here, all plugins have completed
		impl.fireEvent("before_beacon", impl.vars);

		// Don't send a beacon if no beacon_url has been set
		if(!impl.beacon_url) {
			BOOMR.warn("No beacon_url set, not sending beacon");
			return this;
		}
		else {
			BOOMR.warn("Sending beacon");
		}

		url = impl.beacon_url + '?v=' + encodeURIComponent(BOOMR.version);
		for(k in impl.vars) {
			if(impl.vars.hasOwnProperty(k)) {
				nparams++;
				url += "&" + encodeURIComponent(k)
					+ "=" + encodeURIComponent(impl.vars[k]);
			}
		}
	
		// only send beacon if we actually have something to beacon back
		if(nparams) {
			img = new Image();
			img.src=url;
		}

		return this;
	},

	randomNess: function() {
		var randomnumber=Math.floor((Math.random()*100) + 1);
		if (randomnumber <= impl.ratio) { return true;}
		else { return false;}
	}

};

var make_logger = function(l) {
	return function(m, s) {
		this.log(m, l, "boomerang" + (s?"."+s:"")); return this;
	};
};

boomr.debug = make_logger("debug");
boomr.info = make_logger("info");
boomr.warn = make_logger("warn");
boomr.error = make_logger("error");

if(w.YAHOO && w.YAHOO.widget && w.YAHOO.widget.Logger) {
	boomr.log = w.YAHOO.log;
}
else if(typeof w.Y !== "undefined" && typeof w.Y.log !== "undefined") {
	boomr.log = w.Y.log;
}
else if(typeof console !== "undefined" && typeof console.log !== "undefined") {
	boomr.log = function(m,l,s) { console.log(s + ": [" + l + "] ", m); };
}


for(k in boomr) {
	if(boomr.hasOwnProperty(k)) {
		BOOMR[k] = boomr[k];
	}
}

BOOMR.plugins = BOOMR.plugins || {};

}(window));

// end of boomerang beaconing section
// Now we start built in plugins.
