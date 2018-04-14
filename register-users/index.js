const uuidv1 = require('uuid/v1');
const AWS = require('aws-sdk');
const REGION = process.env.REGION;
const dynamodb = new AWS.DynamoDB.DocumentClient({
    region: REGION
});
const USER_TABLE_NAME = process.env.USERS_TABLE;

exports.handler = (event, context, callback) => {
    if (event.body !== null && event.body !== undefined) {
        event = JSON.parse(event.body);
    }
    const timestamp = new Date().getTime();
    if(event.action === 'register') {
        const newUser = {};
        newUser['Item'] = {
            'email': event.email,
            'userid': uuidv1().toString(),
            'firstname': event.firstname,
            'lastname': event.lastname,
            'password': event.password,
            'createdAt': timestamp,
            'updatedAt': timestamp
        };
        newUser['TableName'] = USER_TABLE_NAME;
        console.log(newUser);
        dynamodb.put(newUser, (err, data) => {
            if (err) {
                console.log('error', err);
                callback(null, {
                    statusCode: err.statusCode || 501,
                    headers: { 'Content-Type': 'application/text', 'Access-Control-Allow-Origin': '*' },
                    body: JSON.stringify({
                        'status': 0,
                        'message': 'Not able to register user.'
                    }),
                });
            } else {
                callback(null, {
                    statusCode: 200,
                    headers: { 'Content-Type': 'application/text', 'Access-Control-Allow-Origin': '*' },
                    body: JSON.stringify({
                        'status': 0,
                        'message': 'User created successful'
                    }),
                });
            }
        });
    } else if(event.action === 'login') {
        event.name , event.password;
        /*
        const queryParams = {
            TableName : USER_TABLE_NAME,
            KeyConditionExpression: '#EMAIL = :email and #PASSWORD = :password',
            ExpressionAttributeNames:{
                '#EMAIL': 'email',
                '#PASSWORD': 'password'
            },
            ExpressionAttributeValues: {
                ':email': event.email,
                ':password': event.password
            }
        };
        dynamodb.query(queryParams, (err, data) => {
            if (err) {
                console.log('error', err);
                callback(null, {
                    statusCode: err.statusCode || 501,
                    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                    body: JSON.stringify({
                        'status': 0,
                        'message': 'Not able to register user.'
                    }),
                });
            } else {
                callback(null, {
                    statusCode: 200,
                    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                    body: JSON.stringify({
                        'status': 0,
                        'data': data
                    }),
                });
            }
        });
        */
        const scanParams = {
            TableName: USER_TABLE_NAME,
            ProjectionExpression: "#EMAIL, #USERID, #FIRST_NAME, #LAST_NAME",
            FilterExpression: '#EMAIL = :email and #PASSWORD = :password',
            ExpressionAttributeNames: {
                '#EMAIL': 'email',
                '#USERID': 'userid',
                '#FIRST_NAME': 'firstname',
                '#LAST_NAME': 'lastname',
                '#PASSWORD': 'password'
            },
            ExpressionAttributeValues: {
                ':email': event.email,
                ':password': event.password
            }
        };
        dynamodb.scan(scanParams, (err, data) => {
            if (err) {
                console.log('error', err);
                callback(null, {
                    statusCode: err.statusCode || 501,
                    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                    body: JSON.stringify({
                        'status': 0,
                        'message': 'Not able to register user.'
                    }),
                });
            } else {
                
                if(data.Items.length > 0) {
                    callback(null, {
                        statusCode: 200,
                        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                        body: JSON.stringify({
                            'status': 0,
                            'data': data.Items[0]
                        }),
                    });
                } else {
                    callback(null, {
                        statusCode: 200,
                        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                        body: JSON.stringify({
                            'status': 0,
                            'data': "No users found"
                        }),
                    });
                }
                
            }
        });
    } else {
        callback(null, {
            statusCode: 501,
            headers: { 'Content-Type': 'application/text', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({
                'status': 0,
                'message': 'No supported action found.'
            }),
        });
    }

};
