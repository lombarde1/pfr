import axios from 'axios';

class UtmifyService {
  constructor() {
    this.apiToken = '33N6gEl24sqy7juqxyk1dKOzvuQvkLaNJ8aT';
    this.baseUrl = 'https://api.utmify.com.br/api-credentials/orders';
    this.trackingUrl = 'https://tracking.utmify.com.br/tracking/v1/events';
    this.pixelId = '68410d8f35b494dc5f043550';
  }

  // Método para enviar evento de InitiateCheckout quando PIX é gerado
  async sendInitiateCheckoutEvent(user, amount, trackingParams = {}) {
    try {
      const payload = {
        type: "InitiateCheckout",
        lead: {
          pixelId: this.pixelId,
          _id: this._generateLeadId(),
          metaPixelIds: ["750651513952927"],
          geolocation: {
            country: "BR",
            city: "",
            state: "",
            zipcode: ""
          },
          userAgent: trackingParams.user_agent || "UTMify-Backend/1.0",
          ip: trackingParams.ip || "unknown",
          fbp: null,
          updatedAt: new Date().toISOString(),
          icTextMatch: null,
          icCSSMatch: null,
          icURLMatch: null,
          leadTextMatch: null,
          addToCartTextMatch: null,
          ipConfiguration: "IPV6_OR_IPV4",
          parameters: this._buildParametersString(trackingParams)
        },
        event: {
          sourceUrl: trackingParams.referrer || "https://peakbet.site/",
          pageTitle: "Peakbet - Depósito PIX",
          value: amount,
          currency: "BRL",
          content_type: "pix_deposit"
        }
      };

      console.log('Enviando evento InitiateCheckout para UTMify:', JSON.stringify(payload, null, 2));

      const response = await axios.post(this.trackingUrl, payload, {
        headers: {
          'accept': '*/*',
          'accept-language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
          'content-type': 'application/json',
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'cross-site',
          'Referer': 'https://peakbet.site/',
          'Referrer-Policy': 'strict-origin-when-cross-origin'
        }
      });

      console.log('Resposta UTMify InitiateCheckout:', response.data);
      return response.data;
    } catch (error) {
      console.error('Erro ao enviar InitiateCheckout para UTMify:', error.response?.data || error.message);
      throw error;
    }
  }

  // Gerar ID hexadecimal de 24 caracteres (similar ao MongoDB ObjectId)
  _generateLeadId() {
    const chars = '0123456789abcdef';
    let result = '';
    for (let i = 0; i < 24; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
  }

  // Construir string de parâmetros UTM
  _buildParametersString(trackingParams) {
    const params = new URLSearchParams();
    
    if (trackingParams.utm_source) params.append('utm_source', trackingParams.utm_source);
    if (trackingParams.utm_medium) params.append('utm_medium', trackingParams.utm_medium);
    if (trackingParams.utm_campaign) params.append('utm_campaign', trackingParams.utm_campaign);
    if (trackingParams.utm_content) params.append('utm_content', trackingParams.utm_content);
    if (trackingParams.utm_term) params.append('utm_term', trackingParams.utm_term);
    if (trackingParams.src) params.append('src', trackingParams.src);
    if (trackingParams.sck) params.append('sck', trackingParams.sck);
    if (trackingParams.fbclid) params.append('fbclid', trackingParams.fbclid);
    if (trackingParams.gclid) params.append('gclid', trackingParams.gclid);

    const paramString = params.toString();
    return paramString ? `?${paramString}` : '';
  }

  // Método existente para enviar ordem (Purchase) quando pagamento é confirmado
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