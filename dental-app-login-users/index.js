const AWS = require('aws-sdk');
const REGION = 'us-east-1';
const docClient = new AWS.DynamoDB.DocumentClient({region: REGION});
const DYNAMO_TABLE_NAME = 'docquest_users';

exports.handler = (event, context, callback) => {
    if (event.body !== null && event.body !== undefined) {
        event = JSON.parse(event.body)
    }
    let params = {
        ProjectionExpression:"id, username, mobile, email, shareCode",
		FilterExpression: "email = :email and password = :password",
		ExpressionAttributeValues: {
			":email": event.email,
			":password": event.password
		},
        TableName: DYNAMO_TABLE_NAME
    };

    docClient.scan(params, function(err, data) {
        if (err) {
			callback(null, {
                    statusCode: err.statusCode || 501,
                    headers: { 'Content-Type': 'application/text', 'Access-Control-Allow-Origin' : '*' },
                    body: JSON.stringify({
						"status": 0,
						"message": "Could not login!"
					}),
            });
        } else {
            let response;
            console.log("Query succeeded.");
            console.log(" -", JSON.stringify(data.Items));
			if(data.Items.length > 0) {
				response = {
				  statusCode: 200,
				  headers: { 'Content-Type': 'application/text', 'Access-Control-Allow-Origin' : '*' },
				  body: JSON.stringify({
						"status": 1,
						"message": "Login successful!",
						"data": data.Items
				  })
				};
			} else {
				response = {
				  statusCode: 200,
				  headers: { 'Content-Type': 'application/text', 'Access-Control-Allow-Origin' : '*' },
				  body: JSON.stringify({
						"status": 0,
						"message": "Could not login!"
				  })
				};
			}
			
			callback(null, response);
        }
    });
};