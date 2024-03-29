// This client will as the DHT for a service called `rpc_test`
// and then establishes a P2P connection it.
// It will then send { msg: 'hello' } to the RPC server

'use strict'

const { PeerRPCClient }  = require('grenache-nodejs-http')
const Link = require('grenache-nodejs-link');
const readline = require('node:readline/promises');
const { stdin: input, stdout: output } = require('node:process');

const rl = readline.createInterface({ input, output });


const link = new Link({
  grape: 'http://127.0.0.1:30001'
})
link.start()

const peer = new PeerRPCClient(link, {})
peer.init()

let clientId = '';

function submitNewOrder(itemId, quantity, type) {
	if (quantity < 1) {
		console.error('Quantity should be at least 1');
		return;
	}
	
	peer.request('rpc_test', { data : {itemId, quantity, type, clientId }, action: 'order' }, { timeout: 10000 }, (err, data) => {
		if (err) {
			console.error(err)
			process.exit(-1)
		}
		console.log(data);
		const idx = orderbook.findIndex(o => o.itemId === itemId);
		if (idx !== -1) {
			orderbook[idx] = data;
		} else {
			orderbook.push(data);
		}
    });

}

function refreshOrderBook() {
	peer.request('rpc_test', { action: 'refresh' }, { timeout: 10000 }, (err, data) => {
		if (err) {
			console.error(err)
			process.exit(-1)
		}
		console.log(data);
		orderbook = data;
    });

}

let orderbook = [
	{
		clientId: 0,
		timeStamp: "",
		quantity: 0,
		itemId: "",
		type: 0, // 0 for buy, 1 for sell
	}
];

function executeOrder(action) {
	if (action === 'quit') {
		return;
	}

	const [ type, itemId, quantity ] = action.split(' ');
	switch(type) {
		case 'sell':
		case 'buy': submitNewOrder(itemId, parseInt(quantity), type); break;
		case 'print': console.log(orderbook); break;
		case 'refresh': refreshOrderBook(); break;
	}
}

async function main() {
	let action = '';
	clientId =  await rl.question('clientId : ');
	while (action != 'quit') {
		action = await rl.question('Press the buy/sell as order: order itemid itemcount > ');
		executeOrder(action);
	}
}

main();
