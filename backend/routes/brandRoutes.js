const express = require('express');
const router = express.Router();
const {
  getBrands,
  getBrandById,
  createBrand,
  updateBrand,
  deleteBrand,
} = require('../controllers/brandController');
const { protect, admin } = require('../middleware/authMiddleware');

// Route: /api/brands
router.route('/')
  .get(getBrands)
  .post(protect, admin, createBrand);

// Route: /api/brands/:id
router.route('/:id')
  .get(getBrandById)
  .put(protect, admin, updateBrand)
  .delete(protect, admin, deleteBrand);

module.exports = router;