import express from 'express';
import {
  getCsrfToken,
  logError,
  executeCode,
  executeTracedCode,
} from '../controllers/apiController.js';
import sqlSimulatorRouter from './sqlSimulator.js';
import streaksHandler from '../../api/streaks.js';
import goalsHandler from '../../api/goals.js';

const router = express.Router();

router.get('/csrf-token', getCsrfToken);
router.post('/log-error', logError);
router.post('/execute', executeCode);
router.post('/execute/traced', executeTracedCode);
router.use('/sql', sqlSimulatorRouter);
router.all('/streaks', (req, res) => streaksHandler(req, res));
router.all('/goals', (req, res) => goalsHandler(req, res));

export default router;
