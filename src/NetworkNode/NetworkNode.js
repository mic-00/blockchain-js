const Blockchain = require('../Blockchain/Blockchain');
const bodyParser = require('body-parser');
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');

function NetworkNode() {
  this.blockchain = new Blockchain();
  this.address = uuidv4();
  this.app = express();

  this.app.use(bodyParser.json());
  this.app.use(bodyParser.urlencoded({ extended: false }));

  this.app.get('/', (req, res) => {
    res.sendStatus(200);
  });

  this.app.get('/blockchain', (req, res) => {
    res.send(this.blockchain);
  });

  this.app.post('/transaction', (req, res) => {
    const transactions = this.blockchain.createNewTransaction(
        req.body.amount,
        req.body.sender,
        req.body.recipient
    );
    res.json(transactions);
  });

  this.app.post('/receive-new-block', (req,res) => {
    const newBlock = req.body;
    const lastBlock = this.blockchain.getLastBlock();
    const correctHash = lastBlock.hash === newBlock.previousBlockHash;
    const correctIndex = lastBlock.index + 1 === newBlock.index;
    console.log(lastBlock.index, newBlock.index);
    console.log(correctHash, correctIndex);
    if (correctHash && correctIndex) {
      const index = this.blockchain.createNewBlock(
          newBlock.nonce,
          newBlock.previousBlockHash,
          newBlock.hash
      );
      res.json(index);
    }
  });

  this.app.post('/transaction/broadcast', (req, res) => {
    this.deleteNodesUnavailable();
    const transactions = this.blockchain.createNewTransaction(
        req.body.amount,
        req.body.sender,
        req.body.recipient
    );
    const promises = this.blockchain.networkNodes.map((n) =>
        axios.post(
            `http://localhost:${n}/transaction`,
            req.body
        )
    );
    Promise.all(promises);
    res.json(transactions);
  });

  this.app.get('/mine', (req, res) => {
    this.deleteNodesUnavailable();
    const lastBlock = this.blockchain.getLastBlock();
    const previousBlockHash = lastBlock.hash;
    const currentBlockData = {
      pendingTransactions: this.blockchain.pendingTransactions,
      index: lastBlock.index + 1
    };
    const nonce = this.blockchain.proofOfWork(previousBlockHash, currentBlockData);
    const hash = this.blockchain.hashBlock(previousBlockHash, currentBlockData, nonce);
    const index = this.blockchain.createNewBlock(nonce, previousBlockHash, hash);
    const promises = this.blockchain.networkNodes.map((n) => {
      axios.post(
          `http://localhost:${n}/receive-new-block`,
          { nonce, previousBlockHash, hash, index }
      );
    });
    Promise
        .all(promises)
        .then(() => {
          axios
              .post(
                  `http://localhost:${this.blockchain.node}/transaction/broadcast`,
                  {
                    amount: 12.5,
                    sender: "",
                    recipient: this.address
                  }
              );
        });
    res.json(index);
  });

  this.app.post('/register-and-broadcast-node', (req, res) => {
    this.deleteNodesUnavailable();
    const node = req.body.node;
    axios
        .get(`http://localhost:${node}`)
        .then(() => {
          const promises = this.blockchain.networkNodes.map((n) =>
              axios.post(
                  `http://localhost:${n}/register-node`,
                  { node }
              ));
          Promise
              .all(promises)
              .then(() => {
                axios
                    .post(
                        `http://localhost:${node}/register-nodes-bulk`,
                        {
                          blockchain: this.blockchain,
                          nodes: [...this.blockchain.networkNodes, this.blockchain.node]
                        })
                    .then(() => {
                      this.blockchain.addNode(node);
                      res.json(this.blockchain.networkNodes);
                    });
              });
        });
  });

  this.app.post('/register-node', (req, res) => {
    const node = req.body.node;
    const nodes = this.blockchain.addNode(node);
    res.json(nodes);
  });

  this.app.post('/register-nodes-bulk', (req, res) => {
    this.blockchain.chain = req.body.blockchain.chain;
    this.blockchain.pendingTransactions = req.body.blockchain.pendingTransactions;
    this.blockchain.networkNodes = [];
    req.body.nodes.forEach((n) => {
      this.blockchain.addNode(n);
    });
    res.json(this.blockchain.networkNodes);
  });

  this.app.post('/delete-node', (req, res) => {
    const node = req.body.node;
    const nodes = this.blockchain.deleteNode(node);
    res.json(nodes);
  });

  this.app.get('/consensus', (req, res) => {
    const promises = this.blockchain.networkNodes.map((n) =>
      axios.get(`http://localhost:${n}/blockchain`)
    );
    Promise
        .all(promises)
        .then((blockchains) => {
          let maxChainLength = this.blockchain.chain.length;
          let newLongestChain = null;
          let newPendingTransactions = null;
          blockchains.forEach((blockchain) => {
            if (blockchain.chain.length > maxChainLength) {
              maxChainLength = blockchain.chain.length;
              newLongestChain = blockchain.chain;
              newPendingTransactions = blockchain.pendingTransactions;
            }
          });
          if (!newLongestChain || (newLongestChain && !this.blockchain.isChainValid(newLongestChain))) {
            res.json(this.blockchain.chain);
          } else {
            this.blockchain.chain = newLongestChain;
            this.blockchain.pendingTransactions = newPendingTransactions;
            res.json(this.blockchain.chain);
          }
        });
  });

  this.app.get('/block/:blockHash', (req, res) => {
    const blockHash = req.params.blockHash;
    const block = this.blockchain.getBlock(blockHash);
    res.json(block);
  });

  this.app.get('/transaction/:transactionId', (req, res) => {

  });

  this.app.get('/address/:address', (req, res) => {

  });
}

/**
 * Sets dynamically an available node.
 *
 * @param i
 */
NetworkNode.prototype.setNode = function (i = 3000) {
  axios
      .get(`http://localhost:${i}`)
      .then(() => { this.setNode(++i); })
      .catch(() => {
        console.log(`Listening on port ${i}...`);
        this.blockchain.setNode(i);
        this.app.listen(i);
      });
}

/**
 *
 */
NetworkNode.prototype.deleteNodesUnavailable = function () {
  this.blockchain.networkNodes.forEach((n, i) => {
    axios
        .get(`http://localhost:${n}`)
        .catch(() => {
          const nodes = [...this.blockchain.networkNodes];
          nodes.splice(i, 1);
          this.blockchain.deleteNode(n);
          const promises = nodes.map((node) => {
            axios.post(
                `http://localhost:${node}/delete-node`,
                { node }
            );
          });
          Promise.all(promises);
        });
  });
}

module.exports = NetworkNode;