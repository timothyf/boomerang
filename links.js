/**
	links.js
	Links plugin.
	This plugin will add RT tracking to all of the link elements contained on the page
	Requires UTIL plugin
*/

(function(w) {

var d=w.document;

BOOMR = BOOMR || {};
BOOMR.plugins = BOOMR.plugins || {};

var impl = {
	complete: false,	// Set when this plugin has completed
	links_poll_id: null,
	links_store: new Object,
	
    linkLoaded: function(e) {
        var i = impl.getObject(e);
        if(i) {
			BOOMR.plugins.RT.endTimer(i.timer)
		}
    },

    getObject: function(e) {
        var evt = window.event ? window.event : e;
		var a = BOOMR.plugins.UTIL.searchElement(evt);
		var i;
		i = impl.links_store[a.src || a.href];
        return i;
    },
	
    pollLinks: function() {  
        var all_links = document.getElementsByTagName('link');
        if (all_links) {
            var l = all_links.length;
            for(var i=0; i<l; i++) {
                var path = all_links[i].src || all_links[i].href;
                if(path && !impl.links_store[path]) {
					var timer_name = "t_links_" + i;
					BOOMR.plugins.RT.startTimer(timer_name);
					impl.links_store[path] = new BOOMR.plugins.UTIL.ObjectRecord(timer_name, BOOMR.plugins.UTIL.formatUrl(path, 1));
					BOOMR.plugins.UTIL.addEvent(all_links[i], 'load', impl.linkLoaded, false);
                }
            }
        }
    }	
};

BOOMR.plugins.LINKS = {
	init: function(config) {		
		impl.pollLinks();
		impl.links_poll_id = setInterval(impl.pollLinks, 10);		
		BOOMR.subscribe("page_ready", this.done, null, this);
		return this;
	},
	
	// Called when the page has reached a "usable" state.  This may be when the
	// onload event fires, or it could be at some other moment during/after page
	// load when the page is usable by the user
	done: function() {
		if(impl.links_poll_id) clearInterval(impl.links_poll_id);
		impl.complete = true;
		
		// only add beacon vars if this plugin is still enabled
		if (!BOOMR.plugins.CUST ||
			BOOMR.plugins.CUST && BOOMR.plugins.CUST.isEnabled('LINKS')) {
			var count=0;
			for(var prop in impl.links_store) {
			    if (impl.links_store.hasOwnProperty(prop)) {
					var timers = BOOMR.plugins.RT.getTimers();
					var start = timers[impl.links_store[prop].timer].start;
					var end = timers[impl.links_store[prop].timer].end;
			        BOOMR.addVar("links_obj_" + count++, impl.links_store[prop].host + '|' + start + '|' + end);
				}
			}
		}
		
		// we call sendBeacon() anyway because some other plugin
		// may have blocked waiting for RT to complete
		BOOMR.sendBeacon();
					
	},

	is_complete: function() { return impl.complete; }
};

}(window));