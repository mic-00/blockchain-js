const sha256 = require("sha256");

function Blockchain() {
  this.node = undefined;
  this.networkNodes = [];
  this.chain = [];
  this.pendingTransactions = [];
  this.createNewBlock(0, '', 'OINA90SDNF90N');
}

/**
 * Creates a new block with pending transactions in the blockchain.
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

  return newBlock;
}

/**
 * Gets the chain's last block.
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
    recipient
  };
  this.pendingTransactions.push(transaction);

  return this.getLastBlock()['index'];
}

/**
 * Generates a fingerprint of the given input using SHA-256 algorithm.
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
      .startsWith('0000'))
    nonce++;

  return nonce;
}

Blockchain.prototype.setNode = function (node) {
  this.node = node;
}

Blockchain.prototype.addNode = function (node) {
  if (!this.networkNodes.find(e => e === node))
    this.networkNodes.push(node);
}

module.exports = Blockchain;