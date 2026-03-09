const express = require('express');
const router = express.Router();
const {
    getInventory,
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    restockInventoryItem,
} = require('../controllers/inventoryController');

// Base routes: GET all / POST new
router.route('/')
    .get(getInventory)
    .post(addInventoryItem);

// Item routes: PUT edit / DELETE remove
router.route('/:id')
    .put(updateInventoryItem)
    .delete(deleteInventoryItem);

// Restock route: PATCH increment stock
router.patch('/:id/restock', restockInventoryItem);

module.exports = router;