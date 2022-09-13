const Blockchain = require('../Blockchain');
const sha256 = require('sha256');

describe('Unit tests', () => {

  const blockchain = new Blockchain;

  test('Creates a new block', () => {
    const chain = [...blockchain.chain];
    const newBlock = blockchain.createNewBlock(
        123123,
        'OINA90SDNF90N',
        '90ANSD9F0N9009N'
    );
    expect(newBlock.index).toBe(2);
    expect(newBlock.transactions).toHaveLength(0);
    expect(newBlock.nonce).toBe(123123);
    expect(newBlock.previousBlockHash).toBe('OINA90SDNF90N');
    expect(newBlock.hash).toBe('90ANSD9F0N9009N');
    expect(blockchain.chain).toEqual([...chain, newBlock]);
    expect(blockchain.pendingTransactions).toHaveLength(0);
  });

  test('Gets last block', () => {
    const lastBlock = blockchain.createNewBlock(
        123123,
        'OIANSDF0AN09',
        'NJNASDNF09ASDF'
    );
    expect(blockchain.getLastBlock()).toBe(lastBlock);
  });

  test('Creates a new transaction', () => {
    const length = blockchain.pendingTransactions.length;
    const transaction = blockchain.createNewTransaction(
        80,
        'OIANSDF0AN09',
        'NJNASDNF09ASDF'
    );
    const newLength = blockchain.pendingTransactions.length;
    expect(newLength).toBe(length + 1);
    expect(transaction).toBe(3);
  });

  test('Hashes block', () => {
    const block = blockchain.getLastBlock();
    const hash = blockchain.hashBlock(
        'OIANSDF0AN09',
        block,
        123
    );
    expect(hash).toBe(sha256('OIANSDF0AN09' + '123' + JSON.stringify(block)));
  });

  test('Proof of work', () => {
    const block = blockchain.getLastBlock();
    const nonce = blockchain.proofOfWork('OIANSDF0AN09', block);
    expect(sha256('OIANSDF0AN09' + nonce.toString() + JSON.stringify(block))).toMatch(new RegExp('^0000?'));
  })

});