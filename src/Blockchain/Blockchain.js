const sha256 = require("sha256");
const { v4: uuidv4 } = require('uuid');

function Blockchain() {
  this.node = undefined;
  this.networkNodes = [];
  this.chain = [];
  this.pendingTransactions = [];
  this.createNewBlock(0, '', 'OINA90SDNF90N');
}

/**
 * Creates a new block with pending transactions in the blockchain.
 *
 * @param {number} nonce
 * @param {string} previousBlockHash
 * @param {string} hash
 * @returns {object}
 */
Blockchain.prototype.createNewBlock = function (nonce, previousBlockHash, hash) {
  const newBlock = {
    index: this.chain.length + 1,
    timestamp: Date.now(),
    transactions: this.pendingTransactions,
    nonce,
    hash,
    previousBlockHash
  };
  this.pendingTransactions = [];
  this.chain.push(newBlock);

  return this.chain;
}

/**
 * Gets the chain's last block.
 *
 * @returns {object}
 */
Blockchain.prototype.getLastBlock = function () {
  return this.chain[this.chain.length - 1];
}

/**
 *
 * @param {number} amount
 * @param sender
 * @param recipient
 * @returns {object}
 */
Blockchain.prototype.createNewTransaction = function (amount, sender, recipient) {
  const transaction = {
    amount,
    sender,
    recipient,
    transactionId: uuidv4().split('-').join('')
  };
  this.pendingTransactions.push(transaction);

  return this.pendingTransactions;
}

/**
 * Generates a fingerprint of the given input using SHA-256 algorithm.
 *
 * @param {string} previousBlockHash
 * @param {object} currentBlockData
 * @param {number} nonce
 * @returns {string}
 */
Blockchain.prototype.hashBlock = function (previousBlockHash, currentBlockData, nonce) {
  return sha256(previousBlockHash + nonce.toString() + JSON.stringify(currentBlockData));
}

/**
 *
 * @param {string} previousBlockHash
 * @param {object} currentBlockData
 * @returns {number}
 */
Blockchain.prototype.proofOfWork = function (previousBlockHash, currentBlockData) {
  let nonce = 0;
  while (!this
      .hashBlock(previousBlockHash, currentBlockData, nonce)
      .startsWith('0000')
  )
    nonce++;

  return nonce;
}

/**
 * Sets the local node.
 *
 * @param node
 */
Blockchain.prototype.setNode = function (node) {
  this.node = node;
  return node;
}

/**
 * Memorizes a new remote node.
 *
 * @param node
 */
Blockchain.prototype.addNode = function (node) {
  if (
      !this.networkNodes.find(e => e === node)
      && node !== this.node
  ) {
    this.networkNodes.push(node);
    return this.networkNodes;
  }
  return null;
}

/**
 * Deletes a remote node.
 *
 * @param node
 */
Blockchain.prototype.deleteNode = function (node) {
  const index = this.networkNodes.findIndex((n) => n === node);
  if (index !== -1) {
    this.networkNodes.splice(index, 1);
    return this.networkNodes;
  }
  return null;
}

Blockchain.prototype.isChainValid = function (blockchain) {
  for (let i = 1; i < blockchain.length; ++i) {
    const currentBlock = blockchain[i];
    const prevBlock = blockchain[i - 1];
    const blockHash = this.hashBlock(
        prevBlock.hash,
        {
          transactions: currentBlock.transactions,
          index: currentBlock.index,
          nonce: currentBlock.nonce
        },
        currentBlock.nonce
    );
    if (
        currentBlock.previousBlockHash !== prevBlock.hash
        || !blockHash.startsWith('0000')
    )
      return false;
  }
  const genesisBlock = blockchain[0];
  return (
      genesisBlock.nonce === 0
      && genesisBlock.previousBlockHash === ''
      && genesisBlock.hash === 'OINA90SDNF90N'
      && genesisBlock.transactions.length === 0
  );
}

Blockchain.prototype.getBlock = function (blockHash) {
  return this.chain.find((block) => block.hash === blockHash);
};

Blockchain.prototype.getTransaction = function (transactionId) {
  this.chain.forEach((block) => {
    const element = block.transactions
        .find((transaction) => transaction.transactionId === transactionId);
    if (element)
      return element;
  });
  return null;
}

module.exports = Blockchain;