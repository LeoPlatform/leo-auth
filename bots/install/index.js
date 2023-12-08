"use strict";

const https = require("https");
const url = require("url");
const auth = require("../../lib/auth");
exports.handler = (event, context, callback) => {
  console.log(event);

  function sendResponse(result) {
    console.log(result);
    var responseBody = JSON.stringify(result);
    var parsedUrl = url.parse(event.ResponseURL);
    var options = {
      hostname: parsedUrl.hostname,
      port: 443,
      path: parsedUrl.path,
      method: "PUT",
      headers: {
        "content-type": "",
        "content-length": responseBody.length
      }
    };

    var request = https.request(options, function(response) {
      console.log("Status code: " + response.statusCode);
      console.log("Status message: " + response.statusMessage);
      callback(null, result);
    });

    request.on("error", function(error) {
      console.log("send(..) failed executing https.request(..): " + error);
      callback(error);
    });
    request.write(responseBody);
    request.end();
  }

  process.on('uncaughtException', function(err) {
    console.log("Got unhandled Exception");
    console.log(err);
    sendResponse({
      Status: 'FAILED',
      Reason: 'Uncaught Exception',
      PhysicalResourceId: event.PhysicalResourceId,
      StackId: event.StackId,
      RequestId: event.RequestId,
      LogicalResourceId: event.LogicalResourceId
    });
  });

  event.PhysicalResourceId = "install";
  let steps = [];

  if (event.RequestType === "Create") {
    steps.push(addIdentity({
      identity: "*",
      policy: "*"
    }).then(addPolicy({
      name: "*",
      statements: [
        "{\"Effect\": \"Allow\",\"Action\": \"*\",\"Resource\": \"*\"}"
      ]
    })));
  }

  Promise.all(steps).then(() => {
    console.log("Got success");
    sendResponse({
      Status: 'SUCCESS',
      PhysicalResourceId: event.PhysicalResourceId,
      StackId: event.StackId,
      RequestId: event.RequestId,
      LogicalResourceId: event.LogicalResourceId
    });
  }).catch((err) => {
    console.log("Got error");
    console.log(err);
    sendResponse({
      Status: 'FAILED',
      Reason: 'it failed',
      PhysicalResourceId: event.PhysicalResourceId,
      StackId: event.StackId,
      RequestId: event.RequestId,
      LogicalResourceId: event.LogicalResourceId
    });
  });
};

function addPolicy(policy, done) {
  return new Promise((resolve, reject) => {
    console.log("Adding policy", auth.configuration.resources.LeoAuthPolicy, policy);
    auth.dynamodb.docClient.update({
      TableName: auth.configuration.resources.LeoAuthPolicy,
      Key: {
        name: policy.name
      },
      UpdateExpression: 'set statements  = :statements',
      ExpressionAttributeValues: {
        ':statements': policy.statements
      }
    }, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data)
      }
    });
  });
}

function addIdentity(identity, done) {
  return new Promise((resolve, reject) => {
    console.log("Adding Identity", auth.configuration.resources.LeoAuthIdentity, identity);
    auth.dynamodb.docClient.update({
      TableName: auth.configuration.resources.LeoAuthIdentity,
      Key: {
        identity: identity.identity,
        policy: identity.policy
      }
    }, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data)
      }
    });
  });
}
