import axios from 'axios';

const testPixWebhook = async () => {
  try {
    const response = await axios.post('http://localhost:3000/api/pix/webhook', {
      requestBody: {
        status: 'PAID',
        transactionId: '682be2f2ed1e9dfe6bbac9ce',
        dateApproval: new Date().toISOString(),
        creditParty: {
          name: 'João da Silva',
          cpf: '12345678900',
          bank: '260 - Nubank',
          agency: '0001',
          account: '123456-7'
        },
        amount: 100.00,
        description: 'Depósito de teste'
      }
    });

    console.log('✅ Webhook responded with:', response.data);
  } catch (error) {
    if (error.response) {
      console.error('❌ Webhook error response:', error.response.data);
    } else {
      console.error('❌ Error sending webhook request:', error.message);
    }
  }
};

testPixWebhook();
