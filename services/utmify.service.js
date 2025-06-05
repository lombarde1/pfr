import axios from 'axios';

class UtmifyService {
  constructor() {
    this.apiToken = process.env.UTMIFY_API_TOKEN || 'uhR7ob7z8q49Lgs3hK4Xue6s9kX52gVXsvM7';
    this.baseUrl = 'https://api.utmify.com.br/api-credentials/orders';
  }

  async sendOrder(transactionData, user, trackingParams = {}) {
    try {
      const now = new Date();
      const payload = {
        orderId: transactionData._id.toString(),
        platform: "PeakBet",
        paymentMethod: "pix",
        status: this._mapStatus(transactionData.status),
        createdAt: this._formatDate(transactionData.createdAt || now),
        approvedDate: transactionData.status === 'COMPLETED' ? this._formatDate(now) : null,
        refundedAt: null,
        customer: {
          name: user.name,
          email: user.email,
          phone: user.phone || null,
          document: user.cpf || null,
          country: "BR",
          ip: trackingParams.ip || null
        },
        products: [{
          id: transactionData._id.toString(),
          name: "PeakBet Depósito",
          planId: null,
          planName: null,
          quantity: 1,
          priceInCents: Math.round(transactionData.amount * 100)
        }],
        trackingParameters: {
          src: trackingParams.src || null,
          sck: trackingParams.sck || null,
          utm_source: trackingParams.utm_source || null,
          utm_campaign: trackingParams.utm_campaign || null,
          utm_medium: trackingParams.utm_medium || null,
          utm_content: trackingParams.utm_content || null,
          utm_term: trackingParams.utm_term || null
        },
        commission: {
          totalPriceInCents: Math.round(transactionData.amount * 100),
          gatewayFeeInCents: Math.round((transactionData.amount * 0.05) * 100),
          userCommissionInCents: Math.round((transactionData.amount * 0.95) * 100)
        },
        isTest: process.env.NODE_ENV !== 'production'
      };

      console.log('Enviando dados para UTMify:', JSON.stringify(payload, null, 2));

      const response = await axios.post(this.baseUrl, payload, {
        headers: {
          'x-api-token': this.apiToken,
          'Content-Type': 'application/json'
        }
      });

      console.log('Resposta UTMify:', response.data);
      return response.data;
    } catch (error) {
      console.error('Erro ao enviar dados para Utmify:', error.response?.data || error.message);
      throw error;
    }
  }

  _mapStatus(status) {
    const statusMap = {
      'PENDING': 'waiting_payment',
      'COMPLETED': 'paid',
      'FAILED': 'refused',
      'CANCELLED': 'refused'
    };
    return statusMap[status] || 'waiting_payment';
  }

  _formatDate(date) {
    return new Date(date).toISOString().slice(0, 19).replace('T', ' ');
  }
}

export default new UtmifyService(); 