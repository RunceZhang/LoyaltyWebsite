const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const config = require('../config/config');

/**
 * Transaction controller for handling transaction operations
 */
const transactionController = {
  /**
   * Create a new transaction (purchase or adjustment)
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware function
   */
  createTransaction: async (req, res, next) => {
    try {
      const { utorid, type, spent, amount, relatedId, promotionIds = [], remark } = req.body;
      
      // Validate required fields
      if (!utorid || !type) {
        return res.status(400).json({ error: 'utorid and type are required' });
      }
      
      // Find the user by utorid
      const user = await prisma.user.findUnique({
        where: { utorid }
      });
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Get the creator (logged in user)
      const creator = await prisma.user.findUnique({
        where: { id: req.auth.userId }
      });
      
      if (!creator) {
        return res.status(404).json({ error: 'Creator not found' });
      }
      
      // Handle different transaction types
      if (type === 'purchase') {
        // Purchase transaction - Cashier or higher role required
        if (!spent || spent <= 0) {
          return res.status(400).json({ error: 'spent must be a positive number' });
        }
        
        // Check if promotions are valid
        if (promotionIds && promotionIds.length > 0) {
          // Verify all promotions exist and are valid
          const promotions = await prisma.promotion.findMany({
            where: {
              id: { in: promotionIds },
              isActive: true,
              startDate: { lte: new Date() },
              endTime: { gte: new Date() }
            },
            include: {
              usages: {
                where: { userId: user.id }
              }
            }
          });
          
          // Check if all provided promotion IDs exist and are valid
          if (promotions.length !== promotionIds.length) {
            return res.status(400).json({ error: 'One or more promotions are invalid or expired' });
          }
          
          // Check for one-time promotions that have already been used
          const usedPromotions = promotions.filter(p => p.isOneTime && p.usages.length > 0);
          if (usedPromotions.length > 0) {
            return res.status(400).json({ error: 'One or more one-time promotions have already been used' });
          }
          
          // Check minimum spending requirements
          const invalidSpendingPromotions = promotions.filter(p => p.minSpending !== null && spent < p.minSpending);
          if (invalidSpendingPromotions.length > 0) {
            return res.status(400).json({ error: 'One or more promotions require higher minimum spending' });
          }
        }
        
        // Calculate points earned - base rate is 1 point per 25 cents
        const basePoints = Math.round(spent * 4); // 1 point per $0.25 = 4 points per $1
        let totalPoints = basePoints;
        
        // Apply promotions if any
        if (promotionIds && promotionIds.length > 0) {
          const promotions = await prisma.promotion.findMany({
            where: { id: { in: promotionIds } }
          });
          
          for (const promotion of promotions) {
            if (promotion.rate) {
              // Rate-based promotion (multiplier)
              totalPoints = Math.round(totalPoints * promotion.rate);
            } else if (promotion.points) {
              // Fixed points promotion (bonus points)
              totalPoints += promotion.points;
            }
            
            // Mark one-time promotions as used
            if (promotion.isOneTime) {
              await prisma.promotionUsage.create({
                data: {
                  userId: user.id,
                  promotionId: promotion.id
                }
              });
            }
          }
        }
        
        // Create transaction in database
        const transaction = await prisma.transaction.create({
          data: {
            userId: user.id,
            type,
            amount: totalPoints,
            spent,
            remark,
            createdById: creator.id,
            suspicious: creator.suspicious // Transaction inherits suspicious flag from cashier
          }
        });
        
        // Link promotions to the transaction
        if (promotionIds && promotionIds.length > 0) {
          for (const promotionId of promotionIds) {
            await prisma.transactionPromotion.create({
              data: {
                transactionId: transaction.id,
                promotionId
              }
            });
          }
        }
        
        // Add points to user's balance if cashier is not suspicious
        if (!creator.suspicious) {
          await prisma.user.update({
            where: { id: user.id },
            data: { points: user.points + totalPoints }
          });
        }
        
        // Format response
        const response = {
          id: transaction.id,
          utorid: user.utorid,
          type: transaction.type,
          spent: transaction.spent,
          earned: transaction.amount,
          remark: transaction.remark || "",
          promotionIds,
          createdBy: creator.utorid
        };
        
        return res.status(201).json(response);
      } 
      else if (type === 'adjustment') {
        // Adjustment transaction - Manager or higher role required
        if (creator.role !== 'manager' && creator.role !== 'superuser') {
          return res.status(403).json({ error: 'Only managers or superusers can create adjustment transactions' });
        }
        
        if (!amount) {
          return res.status(400).json({ error: 'amount is required for adjustment transactions' });
        }
        
        if (!relatedId) {
          return res.status(400).json({ error: 'relatedId is required for adjustment transactions' });
        }
        
        // Verify related transaction exists
        const relatedTransaction = await prisma.transaction.findUnique({
          where: { id: relatedId }
        });
        
        if (!relatedTransaction) {
          return res.status(404).json({ error: 'Related transaction not found' });
        }
        
        // Create adjustment transaction
        const transaction = await prisma.transaction.create({
          data: {
            userId: user.id,
            type,
            amount,
            relatedId,
            remark,
            createdById: creator.id
          }
        });
        
        // Link promotions to the transaction if provided
        if (promotionIds && promotionIds.length > 0) {
          for (const promotionId of promotionIds) {
            await prisma.transactionPromotion.create({
              data: {
                transactionId: transaction.id,
                promotionId
              }
            });
          }
        }
        
        // Update user's point balance
        await prisma.user.update({
          where: { id: user.id },
          data: { points: user.points + amount }
        });
        
        // Format response
        const response = {
          id: transaction.id,
          utorid: user.utorid,
          amount: transaction.amount,
          type: transaction.type,
          relatedId: transaction.relatedId,
          remark: transaction.remark || "",
          promotionIds,
          createdBy: creator.utorid
        };
        
        return res.status(201).json(response);
      }
      else {
        return res.status(400).json({ error: 'Invalid transaction type' });
      }
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Get a list of transactions
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware function
   */
  listTransactions: async (req, res, next) => {
    try {
      const { 
        name, 
        createdBy, 
        suspicious, 
        promotionId, 
        type, 
        relatedId, 
        amount, 
        operator, 
        page = 1, 
        limit = 10 
      } = req.query;
      
      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      // Build filter conditions
      const where = {};
      
      if (name) {
        // Find users matching the name
        const users = await prisma.user.findMany({
          where: {
            OR: [
              { utorid: { contains: name } },
              { name: { contains: name } }
            ]
          },
          select: { id: true }
        });
        
        where.userId = { in: users.map(u => u.id) };
      }
      
      if (createdBy) {
        // Find creator by utorid
        const creator = await prisma.user.findUnique({
          where: { utorid: createdBy }
        });
        
        if (creator) {
          where.createdById = creator.id;
        } else {
          // If creator doesn't exist, return empty results
          return res.status(200).json({
            count: 0,
            results: []
          });
        }
      }
      
      if (suspicious !== undefined) {
        where.suspicious = suspicious === 'true';
      }
      
      if (promotionId) {
        where.appliedPromotions = {
          some: {
            promotionId: parseInt(promotionId)
          }
        };
      }
      
      if (type) {
        where.type = type;
        
        if (relatedId && ['adjustment', 'transfer', 'redemption', 'event'].includes(type)) {
          where.relatedId = parseInt(relatedId);
        }
      }
      
      if (amount && operator) {
        if (operator === 'gte') {
          where.amount = { gte: parseInt(amount) };
        } else if (operator === 'lte') {
          where.amount = { lte: parseInt(amount) };
        }
      }
      
      // Get count of filtered transactions
      const count = await prisma.transaction.count({ where });
      
      // Get transactions with pagination
      const transactions = await prisma.transaction.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          user: true,
          createdBy: true,
          appliedPromotions: {
            include: { promotion: true }
          },
          processedBy: true,
          recipient: true,
          sender: true
        }
      });
      
      // Format the response
      const results = transactions.map(tx => {
        const promotionIds = tx.appliedPromotions.map(ap => ap.promotionId);
        
        const result = {
          id: tx.id,
          utorid: tx.user.utorid,
          amount: tx.amount,
          type: tx.type,
          promotionIds,
          suspicious: tx.suspicious,
          remark: tx.remark || "",
          createdBy: tx.createdBy.utorid
        };
        
        // Add type-specific fields
        if (tx.type === 'purchase') {
          result.spent = tx.spent;
        } else if (tx.type === 'redemption') {
          result.redeemed = tx.redeemed;
          result.relatedId = tx.processedById;
        } else if (tx.type === 'adjustment' || tx.type === 'event') {
          result.relatedId = tx.relatedId;
        } else if (tx.type === 'transfer') {
          if (tx.senderId) {
            // This is an outgoing transfer (negative points)
            result.relatedId = tx.recipientId;
          } else if (tx.recipientId) {
            // This is an incoming transfer (positive points)
            result.relatedId = tx.senderId;
          }
        }
        
        return result;
      });
      
      res.status(200).json({
        count,
        results
      });
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Get a transaction by ID
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware function
   */
  getTransactionById: async (req, res, next) => {
    try {
      const { transactionId } = req.params;
      
      const transaction = await prisma.transaction.findUnique({
        where: { id: parseInt(transactionId) },
        include: {
          user: true,
          createdBy: true,
          appliedPromotions: {
            include: { promotion: true }
          },
          processedBy: true
        }
      });
      
      if (!transaction) {
        return res.status(404).json({ error: 'Transaction not found' });
      }
      
      const promotionIds = transaction.appliedPromotions.map(ap => ap.promotionId);
      
      // Format the response based on transaction type
      const response = {
        id: transaction.id,
        utorid: transaction.user.utorid,
        type: transaction.type,
        amount: transaction.amount,
        promotionIds,
        suspicious: transaction.suspicious,
        remark: transaction.remark || "",
        createdBy: transaction.createdBy.utorid
      };
      
      // Add type-specific fields
      if (transaction.type === 'purchase') {
        response.spent = transaction.spent;
      }
      
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Update the suspicious status of a transaction
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware function
   */
  updateSuspiciousStatus: async (req, res, next) => {
    try {
      const { transactionId } = req.params;
      const { suspicious } = req.body;
      
      if (suspicious === undefined) {
        return res.status(400).json({ error: 'suspicious field is required' });
      }
      
      const transaction = await prisma.transaction.findUnique({
        where: { id: parseInt(transactionId) },
        include: { user: true }
      });
      
      if (!transaction) {
        return res.status(404).json({ error: 'Transaction not found' });
      }
      
      // Check if the status is actually changing
      if (transaction.suspicious === suspicious) {
        // No change needed
        return res.status(200).json({
          id: transaction.id,
          utorid: transaction.user.utorid,
          type: transaction.type,
          spent: transaction.spent,
          amount: transaction.amount,
          promotionIds: [], // Need to fetch these if required
          suspicious,
          remark: transaction.remark || "",
          createdBy: transaction.createdBy
        });
      }
      
      // Update the transaction's suspicious status
      const updatedTransaction = await prisma.transaction.update({
        where: { id: parseInt(transactionId) },
        data: { suspicious },
        include: { 
          user: true,
          createdBy: true,
          appliedPromotions: true
        }
      });
      
      // Get all promotion IDs
      const appliedPromotions = await prisma.transactionPromotion.findMany({
        where: { transactionId: parseInt(transactionId) }
      });
      const promotionIds = appliedPromotions.map(ap => ap.promotionId);
      
      // If marking as suspicious, deduct points
      // If marking as not suspicious, add points
      if (transaction.type === 'purchase') {
        const pointsDifference = suspicious ? -transaction.amount : transaction.amount;
        
        await prisma.user.update({
          where: { id: transaction.userId },
          data: { points: { increment: pointsDifference } }
        });
      }
      
      res.status(200).json({
        id: updatedTransaction.id,
        utorid: updatedTransaction.user.utorid,
        type: updatedTransaction.type,
        spent: updatedTransaction.spent,
        amount: updatedTransaction.amount,
        promotionIds,
        suspicious: updatedTransaction.suspicious,
        remark: updatedTransaction.remark || "",
        createdBy: updatedTransaction.createdBy.utorid
      });
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Mark a redemption transaction as processed
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware function
   */
  markRedemptionProcessed: async (req, res, next) => {
    try {
      const { transactionId } = req.params;
      const { processed } = req.body;
      
      if (processed !== true) {
        return res.status(400).json({ error: 'processed must be true' });
      }
      
      const transaction = await prisma.transaction.findUnique({
        where: { id: parseInt(transactionId) },
        include: { user: true }
      });
      
      if (!transaction) {
        return res.status(404).json({ error: 'Transaction not found' });
      }
      
      // Verify transaction is a redemption
      if (transaction.type !== 'redemption') {
        return res.status(400).json({ error: 'Transaction is not a redemption' });
      }
      
      // Check if already processed
      if (transaction.processed) {
        return res.status(400).json({ error: 'Transaction has already been processed' });
      }
      
      // Get the cashier
      const cashier = await prisma.user.findUnique({
        where: { id: req.auth.userId }
      });
      
      // Update the transaction
      const updatedTransaction = await prisma.transaction.update({
        where: { id: parseInt(transactionId) },
        data: { 
          processed: true,
          processedById: cashier.id,
          redeemed: transaction.amount
        },
        include: { 
          user: true,
          createdBy: true,
          processedBy: true
        }
      });
      
      // Deduct points from user's balance
      await prisma.user.update({
        where: { id: transaction.userId },
        data: { points: { decrement: Math.abs(transaction.amount) } }
      });
      
      res.status(200).json({
        id: updatedTransaction.id, 
        utorid: updatedTransaction.user.utorid,
        type: updatedTransaction.type,
        processedBy: cashier.utorid,
        redeemed: Math.abs(transaction.amount),
        remark: updatedTransaction.remark || "",
        createdBy: updatedTransaction.createdBy.utorid
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = transactionController;