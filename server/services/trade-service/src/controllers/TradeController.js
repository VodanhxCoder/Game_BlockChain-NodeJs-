import tradeService from '../services/tradeService.js';

const handleError = (res, error, fallbackMessage) => {
  if (error.status) {
    const payload = { error: error.message };
    if (error.details) {
      payload.details = error.details;
    }
    return res.status(error.status).json(payload);
  }

  console.error(fallbackMessage, error);
  return res.status(500).json({ error: fallbackMessage });
};

const prepareTrade = async (req, res) => {
  try {
    const result = await tradeService.prepareTrade(req.body);
    return res.json(result);
  } catch (error) {
    return handleError(res, error, 'Failed to prepare trade');
  }
};

const confirmTrade = async (req, res) => {
  try {
    const result = await tradeService.confirmTrade(req.body);
    return res.json(result);
  } catch (error) {
    return handleError(res, error, 'Failed to confirm trade');
  }
};

const executeTrade = async (req, res) => {
  try {
    const result = await tradeService.executeTrade(req.body);
    return res.json(result);
  } catch (error) {
    return handleError(res, error, 'Failed to execute trade');
  }
};

export default {
  prepareTrade,
  confirmTrade,
  executeTrade,
};
