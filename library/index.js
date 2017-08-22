'use strict';

var _clients = require('./clients');

var _main = require('./main.js');

var _main2 = _interopRequireDefault(_main);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var client = new _clients.LineClient();
var cl = client.getQrFirst();

cl.then(function (auth) {
	client.startx(auth).then(async function (res) {
		var ops = void 0;
		while (true) {
			try {
				ops = await client.fetchOps(res.operation.revision, 5);
			} catch (error) {
				console.log('error', error);
			}
			for (var op in ops) {
				if (ops[op].revision.toString() != -1) {
					res.operation.revision = ops[op].revision;
					_main2.default.poll(ops[op]);
				}
			}
		}
	});
});