import express from 'express';
import { saveUTMs, getUTMs, cleanupExpiredUTMs } from '../controllers/tracking.controller.js';
import { protect, admin } from '../middleware/auth.middleware.js';

const router = express.Router();

// Rotas públicas para tracking
router.post('/save-utms', saveUTMs);
router.get('/get-utms', getUTMs);

// Rota administrativa para limpeza
router.delete('/cleanup', protect, admin, cleanupExpiredUTMs);

export default router; 