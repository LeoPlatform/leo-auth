var aws = require("aws-sdk");
var auth = require("../../lib/auth");
var dynamodb = auth.dynamodb;
var async = require("async");

let AUTH_TABLE = auth.configuration.resources.LeoAuth;
let IDENTITY_TABLE = auth.configuration.resources.LeoAuthIdentity;
let POLICY_TABLE = auth.configuration.resources.LeoAuthPolicy;

exports.handler = function(event, context, callback) {
  var policies = [];
  var identities = [];
  var record = event.Records[0]; //We limit to 1 event per call
  console.log(record.eventSourceARN);
  if (record.eventSourceARN.match(POLICY_TABLE)) {
    console.log(record);
    var policy = aws.DynamoDB.Converter.unmarshall(record.dynamodb.NewImage);
    console.log(policy);
    dynamodb.docClient.query({
      TableName: IDENTITY_TABLE,
      IndexName: "policy-identity-id",
      KeyConditionExpression: "policy = :policy",
      ExpressionAttributeValues: {
        ":policy": policy.name
      }
    }, function(err, data) {
      if (err) {
        callback(err);
      } else {
        var updates = [];

        var ids = data.Items.reduce((sum, each) => {
          sum[each.identity] = true;
          return sum;
        }, {});

        // Verify all entries have the default policies object
        Object.keys(ids).forEach(id => {
          updates.push(function(done) {
            console.log("ID", id)
            dynamodb.docClient.update({
              TableName: AUTH_TABLE,
              Key: {
                identity: id
              },
              UpdateExpression: 'set #policies = if_not_exists(#policies, :policies)',
              ExpressionAttributeNames: {
                '#policies': "policies"
              },
              ExpressionAttributeValues: {
                ':policies': {}
              }
            }, done);
          });
        });

        data.Items.forEach(function(identity) {
          updates.push(function(done) {
            console.log("Identity", identity.identity, policy.name, policy.statements)
            dynamodb.docClient.update({
              TableName: AUTH_TABLE,
              Key: {
                identity: identity.identity
              },
              UpdateExpression: 'set policies.#policy  = :policy',
              ExpressionAttributeNames: {
                '#policy': policy.name
              },
              ExpressionAttributeValues: {
                ':policy': policy.statements
              }
            }, done);
          });
        });
        async.series(updates, callback);
      }
    });
  } else {
    var keys = aws.DynamoDB.Converter.unmarshall(record.dynamodb.Keys);
    dynamodb.docClient.get({
      TableName: AUTH_TABLE,
      Key: {
        identity: keys.identity
      }
    }, function(err, data) {
      if (err) {
        callback(err);
      } else {
        var identity = {};
        if (data.Item) {
          identity = data.Item;
        } else {
          identity = {
            identity: keys.identity,
            policies: {}
          };
        }
        console.log("in identity", identity);
        if (record.eventName == "REMOVE") {
          delete identity.policies[keys.policy.toLowerCase()];
          saveIdentity(identity, callback);
        } else {
          dynamodb.docClient.get({
            TableName: POLICY_TABLE,
            Key: {
              name: keys.policy
            }
          }, function(err, data) {
            if (err) {
              callback(err);
            } else if (data.Item) {
              identity.policies[keys.policy.toLowerCase()] = data.Item.statements;
            } else {
              identity.policies[keys.policy.toLowerCase()] = "";
            }
            console.log(identity);
            saveIdentity(identity, callback);
          });
        }
      }
    });
  }
};

function saveIdentity(identity, callback) {
  console.log("out identity", identity);
  dynamodb.docClient.put({
    TableName: AUTH_TABLE,
    Item: identity
  }, callback);
}
