const uuidv1 = require('uuid/v1');
const AWS = require('aws-sdk');
const REGION = 'us-east-1';
const docClient = new AWS.DynamoDB.DocumentClient({
    region: REGION
});
const DYNAMO_TABLE_NAME = 'docquest_users';
const PROMO_CODE_TABLE_NAME = 'dental-promo-codes';

exports.handler = (event, context, callback) => {
    if (event.body !== null && event.body !== undefined) {
        event = JSON.parse(event.body);
    }
    const timestamp = new Date().getTime();
    let randomString = (length, chars) => {
        var mask = '';
        if (chars.indexOf('a') > -1) mask += 'abcdefghijklmnopqrstuvwxyz';
        if (chars.indexOf('A') > -1) mask += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        if (chars.indexOf('#') > -1) mask += '0123456789';
        if (chars.indexOf('!') > -1) mask += '~`!@#$%^&*()_+-={}[]:";\'<>?,./|\\';
        var result = '';
        for (var i = length; i > 0; --i) result += mask[Math.round(Math.random() * (mask.length - 1))];
        return result;
    };
    const PROMO_CODE = randomString(5, '#A!');
    let params = {
        Item: {
            "id": uuidv1(),
            "username": event.name,
            "mobile": event.mobile,
            "email": event.email,
            "password": event.password,
            "address": event.address,
            "stream": event.stream,
            "user_kind": event.userKind,
            "createdAt": timestamp,
            "shareCode": PROMO_CODE,
            "updatedAt": timestamp,
        },

        TableName: DYNAMO_TABLE_NAME
    };

    let promoTableParmas = {
        Item: {
            "promo_code": PROMO_CODE,
            "createdAt": timestamp,
            "updatedAt": timestamp,
        },
        TableName: PROMO_CODE_TABLE_NAME
    };

    docClient.put(params, function (error, data) {
        if (error) {
            console.log('error', error, data);
            callback(null, {
                statusCode: error.statusCode || 501,
                headers: {
                    'Content-Type': 'application/text',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({
                    "status": 0,
                    "message": "Could not create user."
                }),
            });
        } else {
            // create a response
            const response = {
                statusCode: 200,
                headers: {
                    'Content-Type': 'application/text',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({
                    "status": 1,
                    "message": "User created successfully."
                })
            };
            callback(null, response);
            docClient.put(promoTableParmas, (err, data) => {
                err ? callback(err, {}) : callback(data, {});
            });
        }
    });


};