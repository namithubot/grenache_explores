const { PeerRPCServer, Link } = require('grenache-nodejs-ws');
const readline = require('node:readline');
const orderUtil = readline('orders.js');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Create a link to your Grape setup
const link = new Link({ grape: 'http://127.0.0.1:30001' });
link.start();

// Initialize a PeerRPCServer
const peer = new PeerRPCServer(link, {});
peer.init();

// Create an RPC server and listen on port 1337
const service = peer.transport('server');
service.listen(1337);

// Announce your exchange worker
setInterval(() => {
  link.announce('swapper', service.port, {});
}, 1000);

const orderbook = [
	{
		timeStamp: "",
		quantity: 0,
		itemId: "",
		type: 0, // 0 for buy, 1 for sell
	}
];

service.on('request', (rid, key, payload, handler) => {
	const { action, data } = payload;
  console.log(payload) //  { msg: 'hello' }
  handler.reply(null, { msg: 'world' })
});

function executeOrder(action) {
	if (action === 'quit') {
		return;
	}

	const [ type, itemId, quantity ] = action.split(' ');
	orderbook.push(orderUtil.createNewOrder(itemId, quantity, type));



}

async function main() {
	let action = '';
	while (action != 'quit') {
		action = await rl.question('Press the buy/sell as order: order itemid itemcount');
		executeOrder(action);
	}
	
}

main();