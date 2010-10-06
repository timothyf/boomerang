/**
	iframes.js
	Iframes plugin.
	This plugin will add RT tracking to all of the iframes contained on the page
	Requires UTIL plugin
*/

(function(w) {

var d=w.document;

BOOMR = BOOMR || {};
BOOMR.plugins = BOOMR.plugins || {};

var impl = {
	complete: false,	// Set when this plugin has completed
	iframes_poll_id: null,
	iframes_store: new Object,
	
    iframeLoaded: function(e) {
        var i = impl.getObject(e);
        if(i) {
			BOOMR.plugins.RT.endTimer(i.timer)
		}
    },

    getObject: function(e) {
        var evt = window.event ? window.event : e;
		var a = BOOMR.plugins.UTIL.searchElement(evt);
		var i;
		i = impl.iframes_store[a.src || a.href];
        return i;
    },
	
    pollIframes: function() {  
        var all_iframes = document.getElementsByTagName('iframe');
        if (all_iframes) {
            var l = all_iframes.length;
            for(var i=0; i<l; i++) {
                var path = all_iframes[i].src || all_iframes[i].href;
                if(path && !impl.iframes_store[path]) {
					var timer_name = "t_iframe_" + i;
					BOOMR.plugins.RT.startTimer(timer_name);
					impl.iframes_store[path] = new BOOMR.plugins.UTIL.ObjectRecord(timer_name, BOOMR.plugins.UTIL.formatUrl(path, 1));
					BOOMR.plugins.UTIL.addEvent(all_iframes[i], 'load', impl.iframeLoaded, false);
                }
            }
        }
    }
};
	
BOOMR.plugins.IFRAMES = {
	init: function(config) {		
		impl.pollIframes();
		impl.iframes_poll_id = setInterval(impl.pollIframes, 10);		
		BOOMR.subscribe("page_ready", this.done, null, this);
		return this;
	},
	
	// Called when the page has reached a "usable" state.  This may be when the
	// onload event fires, or it could be at some other moment during/after page
	// load when the page is usable by the user
	done: function() {
		if(impl.iframes_poll_id) clearInterval(impl.iframes_poll_id);
		impl.complete = true;
		
		var count=0;
		for(var prop in impl.iframes_store) {
		    if (impl.iframes_store.hasOwnProperty(prop)) {
				var timers = BOOMR.plugins.RT.getTimers();
				var start = timers[impl.iframes_store[prop].timer].start;
				var end = timers[impl.iframes_store[prop].timer].end;
		        BOOMR.addVar("iframe_obj_" + count++, impl.iframes_store[prop].host + '|' + start + '|' + end);
			}
		}
		
		BOOMR.sendBeacon();	// we call sendBeacon() anyway because some other plugin
					// may have blocked waiting for RT to complete
	},

	is_complete: function() { return impl.complete; }
};

}(window));
