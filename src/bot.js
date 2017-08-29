const LineConnect = require('./connect');
let LINE = require('./main.js');


const auth = {
 authToken: 'Ek4Kr5RlXL7kjzS9QmLb.DJL32RkCVw/GY+QFfzT2IW.zM6+VYLYfhj6Z0n+AKcwfWdaqLSgdjQj76zd8SjLSjA=',
certificate: '2dad4b3a906abb0f9f72b5b2a75d9fe62f59171f02d8f9379c3f003bb6bd8072'
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
