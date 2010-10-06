/**
	customer.js
	Customer info plugin.
	This plugin will add a customer ID variable to the beacon.
	It will also request a list of plugins from the collector.
	The list of plugins returned from the collector will be downloaded and initialized.
*/

(function(w) {

var d=w.document;

BOOMR = BOOMR || {};
BOOMR.plugins = BOOMR.plugins || {};


var impl = {
	complete: false,	//! Set when this plugin has completed
	
    sendByScript: function(path) {
		var s=document.createElement('script');
		s.src=path;
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
		var properties = ["cust_id", "cust_page_id", "cust_group_id"];

		// This block is only needed if you actually have user configurable properties
		BOOMR.utils.pluginConfig(impl, config, "CUST", properties);

		BOOMR.addVar("cust_id", impl.cust_id);
		BOOMR.addVar("cust_page_id", impl.page_id);
		BOOMR.addVar("cust_group_id", impl.group_id);

		// dynamically load JS which will init enabled plugins
		impl.sendByScript(impl.config_path);
		
		return this;
	},

	is_complete: function() { return impl.complete; }
};

}(window));

