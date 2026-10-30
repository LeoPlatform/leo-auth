"use strict";
var request = require("leo-auth");

exports.handler = async function(event) {
  let user = await request.authorize(event.body.event, event.body.resource);
  return {
    authorized: event.body.request_id,
    user: user
  };
};
