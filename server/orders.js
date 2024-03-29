const crypto = require('crypto');
ordersUtils = {
  createNewOrder: (itemId, quantity, type, clientId) => {
	const timeStamp = Date.now();
    return {
      timeStamp,
	  orderId: crypto.randomUUID(),
      quantity,
      itemId,
      type,
      status: 0,
      clientId,
	  transactions: [
		{ clientId, quantity, timeStamp }
	  ]
    };
  },
};

module.exports = ordersUtils;
