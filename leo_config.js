'use strict';
const resources = process.env.Resources && JSON.parse(process.env.Resources) || {};
module.exports = {
	/**defaults applied to every system**/
	_global: {
		leoauth: resources
	},
	_local: {
		leoaws: {
			profile: 'default',
			region: resources.Region || 'us-east-1'
		}
	}
};
