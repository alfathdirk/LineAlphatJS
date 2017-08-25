import { LineConnect } from './connect';
import LINE from './main.js';

//using auth token
// let auth = {
// 	authToken: 'your token here',
// 	certificate: 'your cert here',
// } 

// let client =  new LineConnect(auth);


let client =  new LineConnect();
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
