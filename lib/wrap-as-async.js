"use strict";

// nodejs24+ Lambda runtimes reject callback-style handlers.
module.exports = function wrapAsAsync(handler) {
	return async function(event, context) {
		return new Promise((resolve, reject) => {
			handler(event, context, function(err, result) {
				if (err) reject(err);
				else resolve(result);
			});
		});
	};
};
