const https = require('https');
const aws = require("aws-sdk");
var config = require("leo-config");
module.exports = {
	dynamodb: {
		docClient: new aws.DynamoDB.DocumentClient({
			region: config.Region,
			maxRetries: 2,
			httpOptions: {
				agent: new https.Agent({
					ciphers: 'ALL',
				}),
				connectTimeout: 2000,
				timeout: 5000,
			},
			convertEmptyValues: true
		}),
	},
	configuration: {
		resources: config.leoauth
	}
}
