import { LineConnect } from './connect';
import LINE from './main.js';

//using auth token
 let auth = {
 	authToken: 'Ek7i6aodDSc4NTJGzOsb.YtXZAOS4uGJcQNRTwn4S6W.18zbsyCGN7SC8YGmmbuV1wXiIZjNW/WqItbNZ39qpOU=',
 	certificate: 'c7af8d3647546200e737675ba09ad944898803873f8f32f32c56661c906c2b10',
 } 

let client =  new LineConnect(auth);
//let client =  new LineConnect();

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
