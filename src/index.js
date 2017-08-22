import { LineClient } from './clients';
import LINE from './main.js';

const client = new LineClient();
const cl = client.getQrFirst();

cl.then((auth) => {
	client.startx(auth).then(async (res) => {
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
});
