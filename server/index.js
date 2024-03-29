// This RPC server will announce itself as `rpc_test`
// in our Grape Bittorrent network
// When it receives requests, it will answer with 'world'

'use strict'

const { PeerRPCServer }  = require('grenache-nodejs-http')
const Link = require('grenache-nodejs-link');
const orderUtil = require('./orders');

const orderbook = [
	{
		clientId: '',
		timeStamp: "",
		quantity: 0,
		itemId: "",
		type: 0, // 0 for buy, 1 for sell
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

			// Unlock it
			o.status = o.status === 1 ? 0 : o.status;
		});

		const orderItem = orderUtil.createNewOrder(
			payload.itemId,
			payload.quantity,
			payload.type,
			payload.clientId);
		// Set status as completed if processed already
		orderItem.status = payload.status ?? orderItem.status;
		orderbook.push(orderItem);
		console.log(orderbook);
		res(payload);
	});
}

function getClientOrders(clientId) {
	return orderbook.filter(o => o.clientId === clientId);
}

service.on('request', async (rid, key, payload, handler) => {
	// execute
	let response = undefined;
	switch (payload.action) {
		case 'refresh': response = getClientOrders(payload.clientId); break;
		case 'order': response = await execute(payload.data); break;
	}


  	console.log(`Response: ${response}`) //  { msg: 'hello' }
  	handler.reply(null, response)
});