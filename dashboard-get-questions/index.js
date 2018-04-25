const AWS = require('aws-sdk');
const REGION = 'us-east-1';
const docClient = new AWS.DynamoDB.DocumentClient({ region: REGION });
const DYNAMO_TABLE_NAME = 'docquestion';

exports.handler = (event, context, callback) => {
	if (event.body !== null && event.body !== undefined) {
		event = JSON.parse(event.body)
	}

	let params = {
		ProjectionExpression: "qid, question, options, qtype, subCategory, correct, infonote",
		FilterExpression: "category = :category and NOT deleted in (:delete)",
		ExpressionAttributeValues: {
			":category": event.category,
			":delete": true
		},
		TableName: DYNAMO_TABLE_NAME
	};

	docClient.scan(params, function(error, data) {
		if (error) {
			console.log(error);
			callback(null, {
				statusCode: error.statusCode || 501,
				headers: { 'Content-Type': 'application/text', 'Access-Control-Allow-Origin': '*' },
				body: JSON.stringify({
					"status": 0,
					"message": "Could not fetch question."
				}),
			});
		}
		else {
			let response;
			// create a response
			if (data.Items.length > 0) {
				
				data.Items.map((item) => {
					console.log('correct type', typeof item.correct);
					console.log('option type', typeof item.options);
					item.options = (typeof item.options === 'object') ? '' : JSON.parse(item.options);
					item.correct = (typeof item.correct === 'object') ? '' : JSON.parse(item.correct);
				});
				response = {
					statusCode: 200,
					headers: { 'Content-Type': 'application/text', 'Access-Control-Allow-Origin': '*' },
					body: JSON.stringify({
						"status": 1,
						"questions": data.Items
					})
				};
			}
			else {
				response = {
					statusCode: 200,
					headers: { 'Content-Type': 'application/text', 'Access-Control-Allow-Origin': '*' },
					body: JSON.stringify({
						"status": 0,
						"message": "Could not fetch questions!"
					})
				};
			}

			callback(null, response);
		}
	});

};
