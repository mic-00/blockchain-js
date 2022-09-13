const Blockchain = require('../Blockchain/Blockchain');
const bodyParser = require('body-parser');
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');

const address = uuidv4();

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

/**
 * Assigns dynamically an available port.
 * @param p
 */
function getPort(p = 3000) {
  return axios
      .get(`http://localhost:${p}`)
      .then(() => getPort(++p))
      .catch(() => p);
}

const blockchain = new Blockchain();

getPort().then((port) => {
  console.log(`Listening on port ${port}...`);
  blockchain.setNode(port);
  app.listen(port);
})

app.get('/', function (req, res) {
  res.sendStatus(200);
});

app.get('/blockchain', function (req, res) {
  res.send(blockchain);
});

app.post('/transaction', function (req, res) {
  console.log(req.body);
  const index = blockchain.createNewTransaction(
      req.body.amount,
      req.body.sender,
      req.body.recipient
  );
  blockchain.networkNodes.forEach((n) => {
    axios.post(
        `http://localhost:${n}/transaction/broadcast`,
        req.body
    );
  });
  res.json(index);
});

app.post('/transaction/broadcast', function (req, res) {
  console.log(req.body);
  const index = blockchain.createNewTransaction(
      req.body.amount,
      req.body.sender,
      req.body.recipient
  );
  res.json(index);
});

app.get('/mine', function (req, res) {
  const lastBlock = blockchain.getLastBlock();
  const previousBlockHash = lastBlock.hash;
  const currentBlockData = {
    pendingTransactions: blockchain.pendingTransactions,
    index: lastBlock.index + 1
  };
  const nonce = blockchain.proofOfWork(previousBlockHash, currentBlockData);
  const hash = blockchain.hashBlock(previousBlockHash, currentBlockData, nonce);
  /// Reward
  blockchain.createNewTransaction(12.5, '', address);
  const newBlock = blockchain.createNewBlock(nonce, previousBlockHash, hash);
  res.json(newBlock);
});

app.post('/register-and-broadcast-node', function (req, res) {
  const newNode = req.body.node;
  axios
      .get(`http://localhost:${newNode}`)
      .then(() => {
        blockchain.networkNodes.forEach((n) => {
          axios.post(
              `http://localhost:${n}/register-node`,
              { node: newNode }
          );
        });
        axios.post(
            `http://localhost:${newNode}/register-nodes-bulk`,
            { nodes: [...blockchain.networkNodes, blockchain.node] }
        );
        blockchain.addNode(newNode);
        res.json(blockchain.networkNodes);
      });
});

app.post('/register-node', function (req, res) {
  const newNode = req.body.node;
  blockchain.addNode(newNode);
});

app.post('/register-nodes-bulk', function (req, res) {
  req.body.nodes.forEach((n) => {
    blockchain.addNode(n);
  });
});