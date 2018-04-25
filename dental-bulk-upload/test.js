const fs = require('fs');
const csv = require('fast-csv');
const uid = require('uuid/v1');
const AWS = require('aws-sdk');
const DYNAMO_TABLE_NAME = 'QUESTION_LSIST';

const config = {
    test: {
        endpoint: 'http://localhost:8000',
        accessKeyId: 'dynamo',
        region: 'uploadQuestion',
        apiVersion: '2012-08-10',
        secretAccessKey: 'testDummyKey'
    }
};

const DDB = new AWS.DynamoDB(config.test);

Object.defineProperty(Array.prototype, 'chunk', {
    value: function (chunkSize) {
        var R = [];
        for (var i = 0; i < this.length; i += chunkSize)
            R.push(this.slice(i, i + chunkSize));
        return R;
    }
});

let stream = fs.createReadStream('peri.csv', {
    encoding: 'utf8'
});
let questons = [];
let parser = csv.fromStream(stream, {
        headers: false
    })
    .on('data', (data) => {
        let correctoption;
        if (data[5] === 'MCSS') {
            correctoption = data[6];
        } else {
            // TODO : For MCMS the correct option will be column index separated by comma
            correctoption = [];
        }
        if (data[8] !== 'category') {
            let item = {
                PutRequest: {
                    Item: {
                        "qid": uid(),
                        "category": data[8].toLowerCase(),
                        "subCategory": data[9].toLowerCase(),
                        "question": data[0],
                        "options": JSON.stringify([data[1], data[2], data[3], data[4]]),
                        "correct": JSON.stringify([correctoption]),
                        "qtype": data[5],
                        "infonote": data[7],
                        "created": Date.now(),
                        "updated": Date.now()
                    }
                }
            }
            questons.push(item);
        }
    })
    .on('end', () => {
        questons = questons.chunk(25);
        console.log(questons[0]);
        questons.forEach(question => {
            let tableParams = {
                RequestItems: {}
            };

            tableParams.RequestItems[DYNAMO_TABLE_NAME] = question;
            console.log('Question', question[0]);
            DDB.batchWrite(tableParams, function (err, data) {
                if (err) {
                    console.log("Error", err);
                } else {
                    console.log("Success", data);
                }
            });
        });
    });