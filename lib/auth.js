const https = require('https');
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocument } = require("@aws-sdk/lib-dynamodb");
var config = require("leo-config");
module.exports = {
	dynamodb: {
		docClient: DynamoDBDocument.from(new DynamoDBClient({
			region: config.Region,
			maxAttempts: 3,
			requestHandler: {
				httpsAgent: new https.Agent({
					ciphers: 'ALL',
				}),
				connectionTimeout: 2000,
				requestTimeout: 5000,
			}
		}), {
			marshallOptions: {
				convertEmptyValues: true,
				removeUndefinedValues: true
			}
		}),
	},
	configuration: {
		resources: config.leoauth
	}
}
