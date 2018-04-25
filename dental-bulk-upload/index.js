const csv = require('fast-csv');
const uid = require('uuid/v1');
const AWS = require('aws-sdk');
const dynamoS3Bucket = new AWS.S3();
const ddb = new AWS.DynamoDB.DocumentClient({ region: 'us-east-1' });
const DYNAMO_TABLE_NAME =  process.env.DATA_TABLE_NAME;;
let stream;
// stream = dynamoS3Bucket.getObject({ Bucket: 'dental-bulk-upload', Key: 'test.csv' }).createReadStream();

Object.defineProperty(Array.prototype, 'chunk', {
	value: function (chunkSize) {
		var R = [];
		for (var i = 0; i < this.length; i += chunkSize)
			R.push(this.slice(i, i + chunkSize));
		return R;
	}
});

exports.handler = (event, context, callback) => {


	if (event) {
		let bucket = event.Records[0].s3.bucket.name;
		let key = event.Records[0].s3.object.key;
		stream = dynamoS3Bucket.getObject({ Bucket: bucket, Key: key }).createReadStream();
	}

	let put_items = [];

	let parser = csv.fromStream(stream, { headers: false }).on("data", function (data) {
		let correctoption;
		if(data[5] === 'MCSS') {
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
						"category": data[8],
						"subCategory": data[9],
						"question": data[0],
						"options": JSON.stringify([data[1], data[2], data[3], data[4]]),
						"correct": JSON.stringify([correctoption]),
						"qtype": data[5],
						"infonote": data[7],
						"timestamp": Date.now()
					}
				}
			}
			put_items.push(item);
		}
	}).on("end", function () {
		
		console.log(JSON.stringify(put_items));

		// chunk data
		
		put_items = put_items.chunk(25);

		put_items.forEach(item => {
			let tableParams = {
				RequestItems: {}
			};

			tableParams.RequestItems[DYNAMO_TABLE_NAME] = item;
			console.log('batch', item[0])
			ddb.batchWrite(tableParams, function (err, data) {
				if (err) {
					console.log("Error", err);
				}
				else {
					console.log("Success", data);
				}
			});
		});
		
	});

}
