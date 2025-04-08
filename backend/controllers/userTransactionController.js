const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const config = require('../config/config');

/**
 * User Transaction controller for handling user-specific transaction operations
 */
const userTransactionController = {
  /**
   * Get a list of transactions for the currently logged-in user
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware function
   */
  getUserTransactions: async (req, res, next) => {
    try {
      const userId = req.auth.userId;
      const { 
        type, 
        relatedId, 
        promotionId, 
        amount, 
        operator, 
        page = 1, 
        limit = 10 
      } = req.query;
      
      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      // Build filter conditions
      const where = {
        OR: [
          { userId },
          { senderId: userId },
          { recipientId: userId }
        ]
      };
      
      if (type) {
        where.type = type;
        
        if (relatedId && ['adjustment', 'transfer', 'redemption', 'event'].includes(type)) {
          where.relatedId = parseInt(relatedId);
        }
      }
      
      if (promotionId) {
        where.appliedPromotions = {
          some: {
            promotionId: parseInt(promotionId)
          }
        };
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
          type: tx.type,
          amount: tx.amount,
          promotionIds,
          remark: tx.remark || "",
          createdBy: tx.createdBy.utorid
        };
        
        // Add type-specific fields
        if (tx.type === 'purchase') {
          result.spent = tx.spent;
        } else if (tx.type === 'redemption') {
          if (tx.processed) {
            result.relatedId = tx.processedById;
          } else {
            result.relatedId = null;
          }
        } else if (tx.type === 'adjustment' || tx.type === 'event') {
          result.relatedId = tx.relatedId;
        } else if (tx.type === 'transfer') {
          // For outgoing transfers, relatedId = recipientId
          // For incoming transfers, relatedId = senderId
          if (tx.senderId === userId) {
            result.relatedId = tx.recipientId;
          } else {
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
   * Create a redemption transaction for the currently logged-in user
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware function
   */
  createUserRedemption: async (req, res, next) => {
    try {
      const userId = req.auth.userId;
      const { type, amount, remark } = req.body;
      
      // Validate type
      if (type !== 'redemption') {
        return res.status(400).json({ error: 'type must be "redemption"' });
      }
      
      // Validate amount
      if (!amount || !Number.isInteger(amount) || amount <= 0) {
        return res.status(400).json({ error: 'amount must be a positive integer' });
      }
      
      // Get the user
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Check if user is verified
      if (!user.verified) {
        return res.status(403).json({ error: 'User is not verified' });
      }
      
      // Check if user has enough points
      if (user.points < amount) {
        return res.status(400).json({ error: 'Insufficient points balance' });
      }
      
      // Create the redemption transaction
      // Note: For redemptions, we store the amount as a positive value
      // but it represents points to be deducted once processed
      const transaction = await prisma.transaction.create({
        data: {
          userId,
          type,
          amount,
          remark,
          createdById: userId,
          processed: false,
          processedById: null
        }
      });
      
      // Format the response
      const response = {
        id: transaction.id,
        utorid: user.utorid,
        type: transaction.type,
        processedBy: null,
        amount: transaction.amount,
        remark: transaction.remark || "",
        createdBy: user.utorid
      };
      
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Create a transfer transaction from the current user to another user
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware function
   */
  createTransfer: async (req, res, next) => {
    try {
      const senderId = req.auth.userId;
      const { userId: recipientIdParam } = req.params;
      const { type, amount, remark } = req.body;
      
      const recipientId = parseInt(recipientIdParam);
      
      // Validate type
      if (type !== 'transfer') {
        return res.status(400).json({ error: 'type must be "transfer"' });
      }
      
      // Validate amount
      if (!amount || !Number.isInteger(amount) || amount <= 0) {
        return res.status(400).json({ error: 'amount must be a positive integer' });
      }
      
      // Get the sender
      const sender = await prisma.user.findUnique({
        where: { id: senderId }
      });
      
      if (!sender) {
        return res.status(404).json({ error: 'Sender not found' });
      }
      
      // Check if sender is verified
      if (!sender.verified) {
        return res.status(403).json({ error: 'Sender is not verified' });
      }
      
      // Check if sender has enough points
      if (sender.points < amount) {
        return res.status(400).json({ error: 'Insufficient points balance' });
      }
      
      // Get the recipient
      const recipient = await prisma.user.findUnique({
        where: { id: recipientId }
      });
      
      if (!recipient) {
        return res.status(404).json({ error: 'Recipient not found' });
      }
      
      // Start a transaction to ensure atomicity
      const [senderTransaction, recipientTransaction] = await prisma.$transaction([
        // Create the sender's transaction (negative amount)
        prisma.transaction.create({
          data: {
            userId: senderId,
            type,
            amount: -amount,  // Negative for sender
            remark,
            createdById: senderId,
            senderId,
            recipientId
          }
        }),
        
        // Create the recipient's transaction (positive amount)
        prisma.transaction.create({
          data: {
            userId: recipientId,
            type,
            amount,  // Positive for recipient
            remark,
            createdById: senderId,
            senderId,
            recipientId
          }
        }),
        
        // Update sender's points balance
        prisma.user.update({
          where: { id: senderId },
          data: { points: { decrement: amount } }
        }),
        
        // Update recipient's points balance
        prisma.user.update({
          where: { id: recipientId },
          data: { points: { increment: amount } }
        })
      ]);
      
      // Format the response
      const response = {
        id: senderTransaction.id,
        sender: sender.utorid,
        recipient: recipient.utorid,
        type: 'transfer',
        sent: amount,
        remark: remark || "",
        createdBy: sender.utorid
      };
      
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }
};

module.exports = userTransactionController;