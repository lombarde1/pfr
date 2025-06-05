import axios from 'axios';
import Transaction from '../models/transaction.model.js';
import User from '../models/user.model.js';
import PixCredential from '../models/pixCredential.model.js';
import UtmTracking from '../models/utmTracking.model.js';
import UtmifyService from '../services/utmify.service.js';
import { generatePixQRCode } from '../services/pix.service.js';

// @desc    Gerar QR Code PIX para depósito
// @route   POST /api/pix/generate
// @access  Private
export const generatePixQrCode = async (req, res) => {
  try {
    const { amount, trackingParams } = req.body;
    const userId = req.user.id;

    console.log('Gerando PIX com tracking params:', trackingParams);

    // Validar valor do depósito
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valor inválido'
      });
    }

    // Buscar credenciais PIX ativas
    const activeCredential = await PixCredential.findOne({ isActive: true }).select('+clientSecret');
    if (!activeCredential) {
      return res.status(500).json({
        success: false,
        message: 'Credenciais PIX não configuradas'
      });
    }

    // Extrair IP do cliente
    const clientIP = req.headers['x-forwarded-for']?.split(',')[0] || 
                     req.connection.remoteAddress || 
                     req.socket.remoteAddress ||
                     req.ip;

    // Gerar ID externo único
    const externalId = `PIX_${Date.now()}_${userId}`;

    // Preparar dados de tracking para salvar na transação
    const finalTrackingParams = {
      ...trackingParams,
      ip: clientIP,
      user_agent: req.headers['user-agent'],
      page_url: req.headers['referer']
    };

    // Criar transação pendente com tracking params
    const transaction = await Transaction.create({
      userId,
      type: 'DEPOSIT',
      amount: amount,
      status: 'PENDING',
      paymentMethod: 'PIX',
      externalReference: externalId,
      trackingParams: finalTrackingParams // Salvar UTMs na transação
    });

    console.log('Transação criada com tracking:', transaction.trackingParams);

    // Gerar QR Code PIX
    const pixData = await generatePixQRCode({
      amount,
      description: 'Depósito via PIX',
      externalId,
      credential: activeCredential
    });

    res.status(201).json({
      success: true,
      data: {
        transaction_id: transaction._id,
        external_id: externalId,
        qr_code: pixData.qrCode,
        amount: amount
      }
    });
  } catch (error) {
    console.error('Erro ao gerar QR Code PIX:', error.response ? error.response.data : error.message);
    res.status(500).json({
      success: false,
      message: 'Erro ao gerar QR Code PIX',
      error: error.response ? error.response.data : error.message
    });
  }
};

// @desc    Webhook para notificações de pagamento PIX
// @route   POST /api/pix/webhook
// @access  Public
export const pixWebhook = async (req, res) => {
  try {
    const { requestBody } = req.body;

    console.log('PIX RECEBIDO');
    console.log('Webhook data:', JSON.stringify(requestBody));

    if (!requestBody || requestBody.status !== 'PAID') {
      return res.status(400).json({
        success: false,
        message: 'Dados de webhook inválidos'
      });
    }

    // Encontrar a transação PIX pendente mais recente
    const latestTransaction = await Transaction.findOne({
      type: 'DEPOSIT',
      status: 'PENDING',
      paymentMethod: 'PIX'
    }).sort({ createdAt: -1 });

    if (!latestTransaction) {
      console.log('Nenhuma transação PIX pendente encontrada');
      return res.status(404).json({
        success: false,
        message: 'Nenhuma transação PIX pendente encontrada'
      });
    }

    console.log(`Atualizando transação ${latestTransaction._id}`);

    // Buscar dados do usuário
    const user = await User.findById(latestTransaction.userId);
    if (!user) {
      console.error('Usuário não encontrado para a transação');
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    // Atualizar status da transação
    latestTransaction.status = 'COMPLETED';
    latestTransaction.metadata = {
      pixTransactionId: requestBody.transactionId || 'unknown',
      dateApproval: requestBody.dateApproval || new Date(),
      payerInfo: requestBody.creditParty || {},
      webhookData: requestBody,
      paymentMethod: 'PIX'
    };

    await latestTransaction.save();

    // INTEGRAÇÃO COM UTMIFY - Enviar evento de conversão
    try {
      if (latestTransaction.trackingParams) {
        console.log('Enviando dados para UTMify:', latestTransaction.trackingParams);
        
        await UtmifyService.sendOrder(
          latestTransaction, 
          user, 
          latestTransaction.trackingParams
        );
        
        console.log('Evento enviado para UTMify com sucesso!');
      } else {
        console.log('Nenhum tracking param encontrado na transação');
      }
    } catch (utmifyError) {
      console.error('Erro ao enviar dados para UTMify:', utmifyError);
      // Continua o processamento mesmo se houver erro na UTMify
    }

    // Verificar se o saldo foi atualizado (para debug)
    const updatedUser = await User.findById(latestTransaction.userId);
    console.log(`Saldo do usuário atualizado: ${updatedUser.balance}`);

    res.json({
      success: true,
      message: 'Pagamento processado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao processar webhook PIX:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao processar notificação de pagamento'
    });
  }
};

// @desc    Verificar status do pagamento PIX
// @route   GET /api/pix/status/:external_id
// @access  Private
export const checkPixStatus = async (req, res) => {
  try {
    const { external_id } = req.params;
    const userId = req.user.id;

    // Buscar transação
    const transaction = await Transaction.findOne({
      externalReference: external_id
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transação não encontrada'
      });
    }

    res.json({
      success: true,
      data: {
        status: transaction.status,
        transaction_id: transaction._id,
        external_id: transaction.externalReference,
        amount: transaction.amount,
        created_at: transaction.createdAt,
        updated_at: transaction.updatedAt,
        metadata: transaction.metadata,
        trackingParams: transaction.trackingParams
      }
    });
  } catch (error) {
    console.error('Erro ao verificar status PIX:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao verificar status do pagamento'
    });
  }
};