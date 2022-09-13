const Blockchain = require('../../Blockchain/Blockchain');
const axios = require('axios');

describe('Integration tests', () => {

  const blockchain = new Blockchain();

  test('transaction', () => {
    axios
        .post(
            'http://localhost:3000/transaction',
            {
              amount: 80,
              sender: 'OINA90SDNF90N',
              recipient: '90ANSD9F0N9009N'
            }
        ).then(function (res) {
          expect(res).toEqual(1);
        });
  });

});