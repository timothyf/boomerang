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

// A private object to encapsulate all your implementation details
// This is optional, but the way we recommend you do it.
var impl = {
	complete: false,	//! Set when this plugin has completed
};
	
BOOMR.plugins.CUST = {
	init: function(config) {
		var properties = ["cust_id"];

		// This block is only needed if you actually have user configurable properties
		BOOMR.utils.pluginConfig(impl, config, "CUST", properties);

		BOOMR.addVar("cust_id", impl.cust_id);

		// make ajax call to server to get plugins list
		
		// for each plugin, get the plugin javascript file

		// init each of the plugins
		
		impl.complete = true;
		return this;
	},

	is_complete: function() { return impl.complete; }
};

}(window));

