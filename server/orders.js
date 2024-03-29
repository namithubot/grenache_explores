const crypto = require('crypto');
ordersUtils = {
  createNewOrder: (itemId, quantity, type, cliedId) => {
    return {
      timeStamp: Date.now(),
	  orderId: crypto.randomUUID(),
      quantity,
      itemId,
      type,
      status: 0,
      cliedId,
    };
  },
};

module.exports = ordersUtils;
