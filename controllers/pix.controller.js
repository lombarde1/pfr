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

    // Enviar evento PIX Gerado para UTMify quando PIX é criado
    try {
      const user = await User.findById(userId);
      if (user && finalTrackingParams) {
        await UtmifyService.sendPixGeneratedEvent(transaction, user, finalTrackingParams);
        console.log('Evento PIX Gerado enviado para UTMify com sucesso!');
      }
    } catch (utmifyError) {
      console.error('Erro ao enviar PIX Gerado para UTMify:', utmifyError);
      // Não bloqueia o fluxo do PIX se houver erro no tracking
    }

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

    // INTEGRAÇÃO COM UTMIFY - Com sistema de fallback robusto
    let utmifySuccess = false;
    let utmifyAttempts = 0;
    const maxUtmifyAttempts = 3;

    while (!utmifySuccess && utmifyAttempts < maxUtmifyAttempts) {
      try {
        utmifyAttempts++;
        console.log(`Tentativa ${utmifyAttempts} de envio para UTMify`);

        // Verificar se temos tracking params ou buscar fallback
        let trackingParams = latestTransaction.trackingParams;
        
        if (!trackingParams || Object.keys(trackingParams).length === 0) {
          console.log('Nenhum tracking param na transação, buscando por IP...');
          
          // FALLBACK 1: Buscar UTMs por IP do usuário se não tiver na transação
          const clientIP = req.headers['x-forwarded-for']?.split(',')[0] || 
                           req.connection.remoteAddress || 
                           req.socket.remoteAddress ||
                           req.ip;

          if (clientIP) {
            const utmData = await UtmTracking.findOne({ ip: clientIP });
            if (utmData) {
              trackingParams = {
                utm_source: utmData.utm_source,
                utm_medium: utmData.utm_medium,
                utm_campaign: utmData.utm_campaign,
                utm_content: utmData.utm_content,
                utm_term: utmData.utm_term,
                src: utmData.src,
                sck: utmData.sck,
                fbclid: utmData.fbclid,
                gclid: utmData.gclid,
                ip: clientIP,
                user_agent: utmData.user_agent,
                page_url: utmData.page_url,
                referrer: utmData.referrer
              };
              console.log('UTMs encontrados por IP:', trackingParams);
            }
          }
        }

        // FALLBACK 2: UTMs mínimos se ainda não tiver dados
        if (!trackingParams || Object.keys(trackingParams).length === 0) {
          console.log('Criando tracking params padrão...');
          trackingParams = {
            utm_source: 'direct',
            utm_medium: 'organic',
            utm_campaign: 'peakbet_default',
            ip: req.headers['x-forwarded-for']?.split(',')[0] || 'unknown',
            user_agent: req.headers['user-agent'] || 'unknown',
            page_url: 'https://peakbet.site',
            referrer: 'direct'
          };
        }

        console.log('Enviando dados para UTMify:', trackingParams);
        
        // Tentar enviar para UTMify com timeout
        const utmifyPromise = UtmifyService.sendOrder(
          latestTransaction, 
          user, 
          trackingParams
        );

        // Adicionar timeout de 10 segundos
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Timeout UTMify')), 10000);
        });

        await Promise.race([utmifyPromise, timeoutPromise]);
        
        utmifySuccess = true;
        console.log('Evento enviado para UTMify com sucesso!');
        
        // Salvar que o tracking foi enviado com sucesso
        latestTransaction.metadata.utmifySuccess = true;
        latestTransaction.metadata.utmifyAttempts = utmifyAttempts;
        await latestTransaction.save();
        
      } catch (utmifyError) {
        console.error(`Erro na tentativa ${utmifyAttempts} para UTMify:`, utmifyError);
        
        // Se for a última tentativa, salvar o erro mas continuar processamento
        if (utmifyAttempts >= maxUtmifyAttempts) {
          console.error('Todas as tentativas de envio para UTMify falharam');
          latestTransaction.metadata.utmifySuccess = false;
          latestTransaction.metadata.utmifyError = utmifyError.message;
          latestTransaction.metadata.utmifyAttempts = utmifyAttempts;
          await latestTransaction.save();
          
          // FALLBACK 3: Agendar retry assíncrono (implementar se necessário)
          // scheduleUtmifyRetry(latestTransaction._id, user, trackingParams);
        } else {
          // Aguardar 2 segundos antes da próxima tentativa
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }

    // Verificar se o saldo foi atualizado (para debug)
    const updatedUser = await User.findById(latestTransaction.userId);
    console.log(`Saldo do usuário atualizado: ${updatedUser.balance}`);

    res.json({
      success: true,
      message: 'Pagamento processado com sucesso',
      utmifyStatus: utmifySuccess ? 'sent' : 'failed'
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