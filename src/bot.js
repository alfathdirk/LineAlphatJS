const LineConnect = require('./connect');
let LINE = require('./main.js');

const auth = {
	authToken: 'EkhKpJrY4uAEW0eLJtQb.DJL32RkCVw/GY+QFfzT2IW.Glp/DCyaiJSF7+yDbCsP9OHsXzdJvE/cHOhGu6pqDAA=',
	certificate: '2c0a5dbde000c76c2fa05510742ac44ac6f44a26cb78dd83304caf5da0273371'
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
