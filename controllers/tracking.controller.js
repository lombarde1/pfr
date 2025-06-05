import UtmTracking from '../models/utmTracking.model.js';

// @desc    Salvar parâmetros UTM para um IP específico
// @route   POST /api/tracking/save-utms
// @access  Public
export const saveUTMs = async (req, res) => {
  try {
    console.log('Salvando UTMs...');
    console.log('Body recebido:', req.body);
    console.log('IP do cliente:', req.ip);

    // Extrair IP do header X-Forwarded-For ou usar req.ip como fallback
    const clientIP = req.headers['x-forwarded-for']?.split(',')[0] || 
                     req.connection.remoteAddress || 
                     req.socket.remoteAddress ||
                     req.ip;

    const {
      utm_source,
      utm_medium, 
      utm_campaign,
      utm_content,
      utm_term,
      src,
      sck,
      fbclid,
      gclid,
      user_agent,
      referrer,
      page_url,
      ip // IP pode vir do frontend também
    } = req.body;

    const finalIP = ip || clientIP;

    if (!finalIP) {
      return res.status(400).json({
        success: false,
        error: 'IP não identificado'
      });
    }

    console.log('Salvando UTMs para IP:', finalIP);

    // Dados para salvar/atualizar
    const trackingData = {
      ip: finalIP,
      utm_source: utm_source || null,
      utm_medium: utm_medium || null,
      utm_campaign: utm_campaign || null,
      utm_content: utm_content || null,
      utm_term: utm_term || null,
      src: src || null,
      sck: sck || null,
      fbclid: fbclid || null,
      gclid: gclid || null,
      user_agent: user_agent || req.headers['user-agent'] || null,
      referrer: referrer || req.headers['referer'] || null,
      page_url: page_url || null,
      lastUpdated: new Date(),
      expiresAt: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)) // 30 dias
    };

    // Usar upsert para atualizar se existir ou criar se não existir
    const utmRecord = await UtmTracking.findOneAndUpdate(
      { ip: finalIP },
      trackingData,
      { 
        upsert: true, 
        new: true,
        setDefaultsOnInsert: true
      }
    );

    console.log('UTMs salvos com sucesso:', utmRecord);

    res.json({
      success: true,
      message: 'UTMs salvos com sucesso',
      data: {
        ip: finalIP,
        id: utmRecord._id
      }
    });

  } catch (error) {
    console.error('Erro ao salvar UTMs:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
};

// @desc    Obter parâmetros UTM para um IP específico
// @route   GET /api/tracking/get-utms
// @access  Public  
export const getUTMs = async (req, res) => {
  try {
    console.log('Buscando UTMs...');
    console.log('Query params:', req.query);

    // Extrair IP do query param ou headers
    const clientIP = req.query.ip || 
                     req.headers['x-forwarded-for']?.split(',')[0] || 
                     req.connection.remoteAddress || 
                     req.socket.remoteAddress ||
                     req.ip;

    if (!clientIP) {
      return res.status(400).json({
        success: false,
        error: 'IP não fornecido'
      });
    }

    console.log('Buscando UTMs para IP:', clientIP);

    // Buscar dados de tracking
    const utmData = await UtmTracking.findOne({ ip: clientIP });

    if (!utmData) {
      console.log('Nenhum dado UTM encontrado para o IP:', clientIP);
      return res.json({
        success: true,
        found: false,
        data: null,
        ip: clientIP
      });
    }

    console.log('UTMs encontrados:', utmData);

    // Remover campos internos antes de retornar
    const responseData = {
      utm_source: utmData.utm_source,
      utm_medium: utmData.utm_medium,
      utm_campaign: utmData.utm_campaign,
      utm_content: utmData.utm_content,
      utm_term: utmData.utm_term,
      src: utmData.src,
      sck: utmData.sck,
      fbclid: utmData.fbclid,
      gclid: utmData.gclid,
      ip: utmData.ip,
      user_agent: utmData.user_agent,
      referrer: utmData.referrer,
      page_url: utmData.page_url,
      firstSeen: utmData.firstSeen,
      lastUpdated: utmData.lastUpdated
    };

    res.json({
      success: true,
      found: true,
      data: responseData,
      ip: clientIP
    });

  } catch (error) {
    console.error('Erro ao buscar UTMs:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
};

// @desc    Limpar UTMs expirados (pode ser usado em cron job)
// @route   DELETE /api/tracking/cleanup
// @access  Private (Admin)
export const cleanupExpiredUTMs = async (req, res) => {
  try {
    const result = await UtmTracking.deleteMany({
      expiresAt: { $lt: new Date() }
    });

    res.json({
      success: true,
      message: `${result.deletedCount} registros UTM expirados removidos`
    });

  } catch (error) {
    console.error('Erro ao limpar UTMs expirados:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao limpar dados expirados'
    });
  }
}; 