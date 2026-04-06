import marketplaceService from '../services/marketplaceService.js';

const handleError = (res, error, defaultMessage) => {
  const status = error.status || 500;
  const message = error.status ? error.message : defaultMessage;
  console.error(defaultMessage, error);
  return res.status(status).json({ error: message });
};

const getListings = async (req, res) => {
  try {
    const result = await marketplaceService.getListings({
      limit: req.query.limit,
      page: req.query.page,
    });
    return res.json(result);
  } catch (error) {
    return handleError(res, error, 'Error fetching market listings');
  }
};

const getWantedItems = async (req, res) => {
  try {
    const result = await marketplaceService.getWantedItems();
    return res.json(result);
  } catch (error) {
    return handleError(res, error, 'Error fetching wanted items');
  }
};

const createListing = async (req, res) => {
  try {
    const result = await marketplaceService.createListing({
      username: req.body.username,
      itemHash: req.body.itemHash,
      wantedItemId: req.body.wantedItemId,
      sellerSignature: req.body.sellerSignature || null,
      sellerSignatureTimestamp: req.body.sellerSignatureTimestamp || req.body.sellerSignatureTs || null,
    });
    return res.status(201).json(result);
  } catch (error) {
    return handleError(res, error, 'Error creating listing');
  }
};

const buyListing = async (req, res) => {
  try {
    const result = await marketplaceService.buyListing({
      listingId: req.body.listingId,
      buyer: req.body.buyer,
      buyerInventoryItemId: req.body.buyerInventoryItemId,
    });
    return res.json(result);
  } catch (error) {
    return handleError(res, error, 'Error buying listing');
  }
};

const cancelListing = async (req, res) => {
  try {
    const result = await marketplaceService.cancelListing({
      listingId: req.body.listingId,
      username: req.body.username,
    });
    return res.json(result);
  } catch (error) {
    return handleError(res, error, 'Error cancelling listing');
  }
};

const updateSignature = async (req, res) => {
  try {
    const result = await marketplaceService.updateSignature({
      listingId: req.body.listingId,
      sellerSignature: req.body.sellerSignature,
      sellerSignatureTimestamp: req.body.sellerSignatureTimestamp,
    });
    return res.json(result);
  } catch (error) {
    return handleError(res, error, 'Error updating signature');
  }
};

export default {
  getListings,
  getWantedItems,
  createListing,
  buyListing,
  cancelListing,
  updateSignature,
};
