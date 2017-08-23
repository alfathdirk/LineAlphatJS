import { LineClient } from './clients';
import LINE from './main.js';
import http from 'http';

const client = new LineClient();
// const cl = client.getQrFirst();
let auth = {
	authToken: 'EklwWUym75DsLJ0OVR2b.YtXZAOS4uGJcQNRTwn4S6W.T+VxorBWjZlzelB8O67Bxe8grCsd2bUC7lhs/i+Rp88=',
	certificate: 'f81dcfed8310d63af98afa6c788fecb06e4698ad5538d4502c7bf6b747139630'
}
// cl.then((auth) => {
let server = http.createServer((req,res) => {
	  res.statusCode = 200;
		res.setHeader('Content-Type', 'text/plain');
		res.end('Hello World\n');
})

server.listen(process.env.PORT || 5000,() => {
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
})
// });
