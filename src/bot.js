const LineConnect = require('./connect');
let LINE = require('./main.js');

const auth = {
	authToken: 'EkYmu9gJ8OQyw46Iua2b.DJL32RkCVw/GY+QFfzT2IW.u5XTfi3+RFzTfvEwcpKbq8QB1XFN/9tpQXs2ddXt5BQ=',
	certificate: 'c33dfd02378ef60b4a63df7d40c2c6b7704eec6b30d764f8cc25712093dc2677',
}

let client =  new LineConnect(auth);

client.startx().then(async (res) => {
	let ops;
	while(true) {
		try {
			ops = await client.fetchOps(res.operation.revision, 5);
		} catch(error) {
			console.log('error',error)
		}
		for (let op in ops) {
			if(ops[op].revision.toString() != -1){
				res.operation.revision = ops[op].revision;
				LINE.poll(ops[op])
			}
		}
	}
});
