# Integração UTMify - Sistema de Tracking Completo

## Visão Geral

Esta implementação adiciona tracking completo de UTMs na plataforma PeakBet, permitindo rastrear todo o funil desde o Facebook Ads até a conversão final. A integração com UTMify permite marcar eventos de compra no Facebook.

## Fluxo Completo

```
Facebook Ads → Pressel → Grupo Telegram → Plataforma → Depósito PIX → Conversão UTMify
```

## Componentes Implementados

### Backend

1. **Models:**
   - `utmTracking.model.js` - Armazena UTMs por IP
   - `transaction.model.js` - Atualizado com campos de tracking

2. **Services:**
   - `utmify.service.js` - Integração com API UTMify

3. **Controllers:**
   - `tracking.controller.js` - Gerencia salvamento/recuperação de UTMs
   - `pix.controller.js` - Atualizado para incluir tracking

4. **Routes:**
   - `tracking.routes.js` - Endpoints para UTM management

### Frontend

1. **Libraries:**
   - `utmTracking.ts` - Serviço para gerenciar UTMs
   - `transactions.ts` - Atualizado para incluir tracking params

2. **Hooks:**
   - `useUTMTracking.ts` - Hook React para UTM management
   - `useDepositForm.ts` - Atualizado para incluir UTMs

3. **App.tsx** - Inicialização do tracking

### Pressel

1. **UTM Capture Script** - Captura automática de UTMs da URL
2. **Backend Integration** - Salva UTMs por IP
3. **Lead Tracking** - Marca evento de lead no Facebook

## Endpoints da API

### Tracking UTMs

```
POST /api/tracking/save-utms
GET /api/tracking/get-utms?ip={ip}
DELETE /api/tracking/cleanup (Admin)
```

### PIX com Tracking

```
POST /api/pix/generate
Body: {
  amount: number,
  trackingParams: {
    utm_source: string,
    utm_medium: string,
    utm_campaign: string,
    utm_content: string,
    utm_term: string,
    src: string,
    sck: string,
    fbclid: string,
    gclid: string,
    ip: string
  }
}
```

## Configuração

### Variáveis de Ambiente

```env
UTMIFY_API_TOKEN=8uQ4ZJcEhKnO2ZWmkdynb4DO4QQYPPWVQxFI
```

### URLs de Backend

Atualize o URL do backend na pressel:
```javascript
// pressel/index.html linha ~67
const response = await fetch('https://SEU_BACKEND_URL/api/tracking/save-utms', {
```

## Como Testar

### 1. Testar Captura de UTMs na Pressel

```
https://sua-pressel.com/?utm_source=facebook&utm_campaign=test&utm_medium=cpc
```

Verificar no console do navegador se os UTMs foram salvos.

### 2. Testar Recuperação de UTMs no Frontend

1. Abra a plataforma
2. Verifique no console se UTMs foram carregados
3. Verifique se a URL foi atualizada com parâmetros

### 3. Testar Depósito com Tracking

1. Gere um PIX
2. Verifique logs do backend para tracking params
3. Complete o pagamento
4. Verifique se evento foi enviado para UTMify

### 4. Verificar na UTMify

1. Acesse dashboard UTMify
2. Verifique se o evento de conversão foi registrado
3. Confirme dados de tracking

## Logs Importantes

```javascript
// No console da pressel
console.log('Salvando UTMs:', payload);

// No console do frontend
console.log('UTMs carregados do backend:', utmParams);
console.log('Enviando tracking data com PIX:', trackingData);

// No backend
console.log('Gerando PIX com tracking params:', trackingParams);
console.log('Enviando dados para UTMify:', latestTransaction.trackingParams);
```

## Troubleshooting

### UTMs não estão sendo salvos na pressel
- Verificar URL do backend
- Verificar CORS configuration
- Verificar se MongoDB está conectado

### UTMs não estão sendo carregados no frontend
- Verificar se serviço de IP está funcionando
- Verificar se backend está retornando dados
- Verificar logs do console

### Evento não está sendo enviado para UTMify
- Verificar token UTMify
- Verificar se transação tem trackingParams
- Verificar logs do webhook PIX

## Estrutura de Dados

### UTM Tracking Model
```javascript
{
  ip: String,
  utm_source: String,
  utm_medium: String,
  utm_campaign: String,
  utm_content: String,
  utm_term: String,
  src: String,
  sck: String,
  fbclid: String,
  gclid: String,
  user_agent: String,
  referrer: String,
  page_url: String,
  expiresAt: Date (30 dias TTL)
}
```

### Transaction with Tracking
```javascript
{
  // ... campos existentes
  trackingParams: {
    utm_source: String,
    utm_medium: String,
    utm_campaign: String,
    utm_content: String,
    utm_term: String,
    src: String,
    sck: String,
    fbclid: String,
    gclid: String,
    ip: String,
    user_agent: String,
    page_url: String,
    referrer: String
  }
}
```

## Próximos Passos

1. **Monitoramento**: Implementar dashboard para visualizar tracking
2. **Analytics**: Adicionar métricas de conversão
3. **A/B Testing**: Usar UTMs para testar variações
4. **Attribution**: Implementar modelos de atribuição avançados
5. **Retention**: Tracking de usuários recorrentes

## Suporte

Para dúvidas sobre a implementação, verificar:
1. Logs do backend (`console.log`)
2. Logs do frontend (DevTools)
3. Status dos serviços externos (UTMify, IP service)
4. Configuração de CORS e variáveis de ambiente 