/**
	customer.js
	Customer info plugin.
	This plugin will add a customer ID variable to the beacon.
	
	It will also request a list of enabled plugins from the collector.
	The list of enabled plugins is returned as a JavaScript snippet which
	also calls the BOOMR.plugins.CUST.disablePlugins() method to disable
	all plugins which are not enabled.
*/

(function(w) {

var d=w.document;

BOOMR = BOOMR || {};
BOOMR.plugins = BOOMR.plugins || {};


var impl = {
	complete: false,	//! Set when this plugin has completed
	session_id: null,
	cust_enabled_plugins: null,
	
    sendByScript: function(path) {
		var s=document.createElement('script');
		s.src = '/collector/cid?cust_id=123';  //path;
		s.type='text/javascript';
		if (document.body) {
			document.body.appendChild(s);
		}
		else if (document.documentElement.getElementsByTagName('head')[0]) {
			document.documentElement.getElementsByTagName('head')[0].appendChild(s);
		}
		impl.complete = true;
    }
};
	
BOOMR.plugins.CUST = {
	init: function(config) {
		var properties = ["cust_id", "cust_page_id", "cust_group_id", "config_path"];

		// This block is only needed if you actually have user configurable properties
		BOOMR.utils.pluginConfig(impl, config, "CUST", properties);

		BOOMR.addVar("cust_id", impl.cust_id);
		BOOMR.addVar("cust_page_id", impl.page_id);
		BOOMR.addVar("cust_group_id", impl.group_id);

		// dynamically load JS which will init enabled plugins
		impl.sendByScript(impl.config_path);
		
		return this;
	},
	
	setSessionId: function(session_id) {
		impl.session_id = session_id;
	},
	
	// enable all plugins included in array passed in
	// this method should be called by the JS returned from collector
	enablePlugins: function(enabled_plugins) {
		impl.cust_enabled_plugins = enabled_plugins;
	},
	
	// check to see if the plugin passed in is enabled
	// other plugins should call this method to see if they are still enabled
	isEnabled: function(plugin) {
		// see if plugin is in impl.cust_enabled_plugins
		return this.include(impl.cust_enabled_plugins,plugin);
	},
	
	include: function(arr,obj) {
	    return (arr.indexOf(obj) != -1);
	},

	is_complete: function() { return impl.complete; }
};

}(window));


