## Running
Running is simple, run grenache following the nodejs-blockchain markdown file.
Run server
```cd server && npm i && node index,js```
Run client
```cd client && npm i && node index.js```
Note: There is no persistent storage.

## Completed part
- Basic matching algorithm.
- Each client has its own records which show their order history.
- Server is maintaining a global record of all the orders.
- Client has to refresh to get latest status of their orders.
- Basic async functions with pseudo locking mechanism on the array.

## Drawbacks
- Client server architecture, where server has to maintain the books
- Ideally clients will keep their data and server can facilitate peer to peer communication. This can be done with a ws implementation where server will broadcast the order and clients will then sync to complete their order.
The mechanism can follow as: Client submits order -> server broadcasts -> group of clients reply with their availability -> server then do the matching on these pools instead of the global source of truth -> each clients update their order book.
- Multithreading: There is simple asynchronous behavior, however with the above implementation, it would make sense to use worker threads to complete the orders as well. In that case, we could use mutex or async lock or object.freeze to update the pools.
- Corner cases like MAX_TRANSACTION amount, status enum, itemId verification can also be placed.
- I have added the transaction records, but not tested them. They are commented for now.
- Another better way of doing this is keep all the RPC server and client at the same place. All the peers will be listening to `rpc_test` or `buy` and `sell` and offer transaction based on that. Flow will be ClientServer Requests -> Another Peer2 Replies -> Complete Transaction and Reply back from the ClientServer (Peer1) or Peer2
- The above can easily be done by merging the code already written as it implements a simple locking mechanism to avoid race conditions in such cases. We would need to add a case to avoid selling and buying to self which can be done by checking clientId. This is WIP in clientserver.js
