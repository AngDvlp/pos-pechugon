/**
 * Utility functions for POS Offline Inventory Management
 */

/**
 * Calculates the effective/displayable integer stock of any product.
 * Resolves combos recursively and computes derived/fractional stocks based on base units.
 * 
 * @param {Object} product The product to get stock for.
 * @param {Array} allProducts The full list of products in the catalog.
 * @returns {number} The integer count of sellable units or the decimal base stock.
 */
export const getEffectiveStock = (product, allProducts) => {
  if (product.isCombo) {
    if (!product.components || product.components.length === 0) return 0;
    return Math.min(...product.components.map(comp => {
      const p = allProducts.find(prod => prod.sku === comp.sku);
      if (!p) return 0;
      return Math.floor(getEffectiveStock(p, allProducts) / comp.quantity);
    }));
  }
  
  if (product.baseProductSku) {
    const baseP = allProducts.find(prod => prod.sku === product.baseProductSku);
    if (!baseP) return 0;
    // Return floor of (base stock / equivalence) to represent sellable integer units
    return Math.floor(baseP.stock / product.baseEquivalence);
  }
  
  return product.stock;
};

/**
 * Recursively and proportionally adjusts the stock of a product or combo.
 * 
 * @param {Array} products The current array of products.
 * @param {string} sku The target SKU to adjust.
 * @param {number} quantityChange The change in quantity (positive to add, negative to deduct).
 * @returns {Array} The updated array of products.
 */
export const adjustProductStock = (products, sku, quantityChange) => {
  const product = products.find(p => p.sku === sku);
  if (!product) return products;

  if (product.isCombo) {
    let updatedProducts = [...products];
    for (const comp of product.components) {
      updatedProducts = adjustProductStock(
        updatedProducts,
        comp.sku,
        comp.quantity * quantityChange
      );
    }
    return updatedProducts;
  }

  if (product.baseProductSku) {
    const change = quantityChange * product.baseEquivalence;
    return products.map(p => {
      if (p.sku === product.baseProductSku) {
        return {
          ...p,
          // Use Math.max(0, ...) to prevent negative stocks, rounding to 3 decimal places to avoid float precision issues
          stock: Math.max(0, Math.round((p.stock + change) * 1000) / 1000)
        };
      }
      return p;
    });
  }

  return products.map(p => {
    if (p.sku === sku) {
      const newStockVal = Math.max(0, Math.round((p.stock + quantityChange) * 1000) / 1000);
      
      if (sku === 'C-003' || sku === 'C-004') {
        let batches = p.saladBatches ? p.saladBatches.map(b => ({ ...b })) : [];
        if (batches.length === 0 && p.stock > 0) {
          batches = [{ quantity: p.stock, age: 0 }];
        }
        
        if (quantityChange < 0) {
          let remainingToDeduct = Math.abs(quantityChange);
          // Sort by age descending (oldest first)
          batches.sort((a, b) => b.age - a.age);
          
          for (let i = 0; i < batches.length; i++) {
            if (remainingToDeduct <= 0) break;
            if (batches[i].quantity >= remainingToDeduct) {
              batches[i].quantity = Math.round((batches[i].quantity - remainingToDeduct) * 1000) / 1000;
              remainingToDeduct = 0;
            } else {
              remainingToDeduct = Math.round((remainingToDeduct - batches[i].quantity) * 1000) / 1000;
              batches[i].quantity = 0;
            }
          }
          batches = batches.filter(b => b.quantity > 0);
        } else if (quantityChange > 0) {
          const idx0 = batches.findIndex(b => b.age === 0);
          if (idx0 >= 0) {
            batches[idx0].quantity = Math.round((batches[idx0].quantity + quantityChange) * 1000) / 1000;
          } else {
            batches.push({ quantity: quantityChange, age: 0 });
          }
        }
        
        const calculatedStock = batches.reduce((sum, b) => sum + b.quantity, 0);
        return {
          ...p,
          saladBatches: batches,
          stock: Math.round(calculatedStock * 1000) / 1000
        };
      }
      
      return {
        ...p,
        stock: newStockVal
      };
    }
    return p;
  });
};
