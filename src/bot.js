const LineConnect = require('./connect');
let LINE = require('./main.js');

// //using auth token
 let auth = {
 	authToken: 'EkdIeTLip4h8235aAjj7.i2UiVX6Sk5dOskyzGvlMrW.kKm08oTE6oodnQjWHfgxQMVjkxmTOXPfGp5Sj1Y1rsI=',
 	certificate: '9b1b7010d143afe9867b82f15ccbf119229ef775cfc3bf81973dabd6c4d5d2d5',
 } 

let client =  new LineConnect(auth);
// let client =  new LineConnect();

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
