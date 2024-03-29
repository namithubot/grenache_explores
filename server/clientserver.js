// This RPC server will announce itself as `rpc_test`
// in our Grape Bittorrent network
// When it receives requests, it will answer with 'world'

'use strict'

const { PeerRPCServer }  = require('grenache-nodejs-http')
const Link = require('grenache-nodejs-link');
const orderUtil = require('./orders');

const orderbook = [
	// Sample data
	{
		clientId: '',
		timeStamp: "",
		quantity: 0,
		itemId: "",
		type: 0, // 0 for buy, 1 for sell
		transactions: []
	}
];

const link = new Link({
  grape: 'http://127.0.0.1:30001'
})
link.start()

const peer = new PeerRPCServer(link, {
  timeout: 300000
})
peer.init()

const port = 1024 + Math.floor(Math.random() * 1000)
const service = peer.transport('server')
service.listen(port)

setInterval(function () {
  link.announce('rpc_test', service.port, {})
}, 1000);

async function execute(payload) {
	return new Promise((res, rej) => {
			const matchedOrders = (orderbook || [])
		.filter(o => o.clientId !== payload.clientId
			&& o.itemId === payload?.itemId
			&& o.type !== payload.type // buy for sell, sell for buy
			&& o.status === 0
			&& o.quantity > 0);
		const transactions = [];
		matchedOrders.forEach(o => {
			if (payload.status == 2 || o.status !== 0) {
				return;
			}

			// Mark processing, a pseudo lock
			// TODO: make sure that this assignment happens
			// only in single instance
			o.status = 1;
			if (o.quantity > payload.quantity) {
				o.quantity -= payload.quantity;
				payload.quantity = 0;
				// 2 is "processed"
				payload.status = 2;
			} else {
				payload.quantity -= o.quantity;
				o.quantity = 0;
				// Marking status as completed for this order
				o.status = 2;
			}

			// const timeStamp = Date.now();

			// o.transactions.push(
			// 	{ clientId: payload.clientId,
			// 	  quantity: Math.floor(o.quantity - payload.quantity),
			// 	  timeStamp
			// 	}
			// );

			// transactions.push({
			// 	clientId: o.clientId,
			// 	quantity: Math.floor(payload.quantity - o.quantity),
			// 	timeStamp
			// });

			// Unlock it
			o.status = o.status === 1 ? 0 : o.status;
		});

		const orderItem = orderUtil.createNewOrder(
			payload.itemId,
			payload.quantity,
			payload.type,
			payload.clientId);
		// Update the transactions
		// if (transactions.length) {
		// 	orderItem.transactions = transactions;
		// }
		// // Set status as completed if processed already
		// orderItem.status = payload.status ?? orderItem.status;
		//orderbook.push(orderItem);
		console.log(orderbook);
		res(payload);
	});
}

function getClientOrders(clientId) {
	return orderbook.filter(o => o.clientId === clientId);
}

function isSelf() {
	// Implement to check the clientId
	// matching this peer, return true in that scenario
	return payload.clientId === clientId;
}

service.on('request', async (rid, key, payload, handler) => {
	// execute
	if (isSelf(payload.clientId)) {
		return;
	}

	let response = undefined;
	switch (payload.action) {
		case 'refresh': response = getClientOrders(payload.clientId); break;
		case 'order': response = await execute(payload.data); break;
	}


  	console.log(`Response: ${response}`) //  { msg: 'hello' }
  	handler.reply(null, response)
});

// This client will as the DHT for a service called `rpc_test`
// and then establishes a P2P connection it.
// It will then send { msg: 'hello' } to the RPC server

'use strict'

const { PeerRPCClient }  = require('grenache-nodejs-http')
const Link = require('grenache-nodejs-link');
const readline = require('node:readline/promises');
const { stdin: input, stdout: output } = require('node:process');

const rl = readline.createInterface({ input, output });

const peerClient = new PeerRPCClient(link, {})
peerClient.init()

let clientId = '';

function submitNewOrder(itemId, quantity, type) {
	if (quantity < 1) {
		console.error('Quantity should be at least 1');
		return;
	}
	
	peerClient.request('rpc_test', { data : {itemId, quantity, type, clientId }, action: 'order' }, { timeout: 10000 }, (err, data) => {
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
	peerClient.request('rpc_test', { action: 'refresh' }, { timeout: 10000 }, (err, data) => {
		if (err) {
			console.error(err)
			process.exit(-1)
		}
		console.log(data);
		orderbook = data;
    });

}

function executeOrder(action) {
	if (action === 'quit') {
		return;
	}

	const [ type, itemId, quantity ] = action.split(' ');
	switch(type) {
		case 'sell':
		case 'buy': submitNewOrder(itemId, parseInt(quantity), type); break;
		case 'print': console.log(orderbook); break;
		//case 'refresh': refreshOrderBook(); break;
		case 'quit': process.exit(0);
		default: console.log('Did not recognize that');
	}
}

async function main() {
	let action = '';
	clientId =  await rl.question('clientId : ');
	while (action != 'quit') {
		action = await rl.question('Press the buy/sell as order or quit: order itemid itemcount > ');
		executeOrder(action);
	}
}

main();

