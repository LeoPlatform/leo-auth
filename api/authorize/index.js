"use strict";
var request = require("leo-auth");

exports.handler = function(event, context, callback) {

  request.authorize(event.body.event, event.body.resource, function(err, user) {
    if (err) {
      callback(err);
    } else {
      callback(null, {
        authorized: event.body.request_id,
        user: user
      });
    }
  });

};
