const LineConnect = require('./connect');
let LINE = require('./main.js');

const auth = {
	authToken: 'ElB813Hda05m8tbXHjV5.iwXqCRJeB45B9XC5RwWiPq.4FYt43zA8TYQzrzo3wwqiudntgs6m7sLBx1xV9x7gMQ=',
	certificate: 'bf5ffe333eac919273db35e84b3e4359ada8f38438de20765d569acde6ec5698',
}
// let client =  new LineConnect(auth);
let client =  new LineConnect();

client.startx().then(async (res) => {
	
	while(true) {
		try {
			ops = await client.fetchOps(res.operation.revision);
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
