const AWS = require('aws-sdk');
const REGION = 'us-east-1';
const docClient = new AWS.DynamoDB.DocumentClient({region: REGION});
const DYNAMO_TABLE_NAME = 'docquestion';

exports.handler = (event, context, callback) => {
    if (event.body !== null && event.body !== undefined) {
        event = JSON.parse(event.body)
    }
    const timestamp = new Date().getTime();
    let params = {
        ProjectionExpression:"qid, question, options, subCategory, qtype, correct, infonote",
		FilterExpression: "category = :category and subCategory = :subcategory",
		ExpressionAttributeValues: {
			":category": event.category,
			":subcategory": event.subCategory
		},
        TableName: DYNAMO_TABLE_NAME
    };
    
    docClient.scan(params, function(error, data) {
        if(error){
            callback(null, {
                    statusCode: error.statusCode || 501,
                    headers: { 'Content-Type': 'application/text', 'Access-Control-Allow-Origin' : '*' },
                    body: JSON.stringify({
						"status": 0,
						"message": "Could not fetch question."
					}),
            });
        }else{
            let response;
             // create a response
            if(data.Items.length > 0) {
            	data.Items.map((item) => {
            		item.options = JSON.parse(item.options);
            		item.correct = JSON.parse(item.correct);
            	});
				response = {
				  statusCode: 200,
				  headers: { 'Content-Type': 'application/text', 'Access-Control-Allow-Origin' : '*' },
				  body: JSON.stringify({
						"status": 1,
						"questions": data.Items
				  })
				};
			} else {
				response = {
				  statusCode: 200,
				  headers: { 'Content-Type': 'application/text', 'Access-Control-Allow-Origin' : '*' },
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