const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Promotion controller for handling promotion-related operations
 */
const promotionController = {
  /**
   * Create a new promotion (manager or higher role required)
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware function
   */
  createPromotion: async (req, res, next) => {
    try {
      const { name, description, type, startTime, endTime, minSpending, rate, points } = req.body;
      
      // Validate required fields
      if (!name || !description || !type || !startTime || !endTime) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      // Validate promotion type
      if (type !== 'automatic' && type !== 'one-time') {
        return res.status(400).json({ error: 'Type must be either "automatic" or "one-time"' });
      }
      
      // Validate date formats and logic
      const start = new Date(startTime);
      const end = new Date(endTime);
      const now = new Date();
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({ error: 'Invalid date format' });
      }
      
      if (start < now) {
        return res.status(400).json({ error: 'Start time cannot be in the past' });
      }
      
      if (start >= end) {
        return res.status(400).json({ error: 'End time must be after start time' });
      }
      
      // Validate minSpending, rate, and points based on type
      if (minSpending !== undefined && minSpending !== null && (isNaN(minSpending) || minSpending <= 0)) {
        return res.status(400).json({ error: 'Minimum spending must be a positive number' });
      }
      
      if (rate !== undefined && rate !== null && (isNaN(rate) || rate <= 0)) {
        return res.status(400).json({ error: 'Rate must be a positive number' });
      }
      
      if (points !== undefined && points !== null && (!Number.isInteger(points) || points <= 0)) {
        return res.status(400).json({ error: 'Points must be a positive integer' });
      }

      const isOneTime = type === 'one-time';
      
      // Create the promotion
      const promotion = await prisma.promotion.create({
        data: {
          name,
          description,
          type,
          startTime: start,
          endTime: end,
          minSpending,
          rate,
          points,
          isOneTime,
          isActive: true
        }
      });
      
      // Return the created promotion
      res.status(201).json({
        id: promotion.id,
        name: promotion.name,
        description: promotion.description,
        type: promotion.type,
        startTime: promotion.startTime.toISOString(),
        endTime: promotion.endTime.toISOString(),
        minSpending: promotion.minSpending,
        rate: promotion.rate,
        points: promotion.points
      });
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * List promotions with pagination and filtering
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware function
   */
  listPromotions: async (req, res, next) => {
    try {
      const { 
        name, 
        type, 
        started, 
        ended, 
        page = 1, 
        limit = 10 
      } = req.query;
      
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const isManager = req.user.role === 'manager' || req.user.role === 'superuser';
      const userId = req.auth.userId;
      
      // Basic validation
      if (started !== undefined && ended !== undefined) {
        return res.status(400).json({ error: 'Cannot specify both started and ended' });
      }
      
      // Build filter conditions
      const now = new Date();
      const where = {};
      
      // Regular users can only see active promotions they haven't used
      if (!isManager) {
        where.startTime = { lte: now };
        where.endTime = { gte: now };
        where.isActive = true;
        
        // For one-time promotions, exclude ones the user has already used
        where.OR = [
          { type: 'automatic' },
          {
            type: 'one-time',
            isOneTime: true,
            usages: {
              none: {
                userId
              }
            }
          }
        ];
      } else {
        // Manager view - apply filters
        if (started !== undefined) {
          if (started === 'true') {
            where.startTime = { lte: now };
          } else {
            where.startTime = { gt: now };
          }
        }
        
        if (ended !== undefined) {
          if (ended === 'true') {
            where.endTime = { lte: now };
          } else {
            where.endTime = { gt: now };
          }
        }
      }
      
      if (name) {
        where.name = { contains: name };
      }
      
      if (type) {
        where.type = type;
      }
      
      // Get count of filtered promotions
      const count = await prisma.promotion.count({ where });
      
      // Get promotions with pagination
      const promotions = await prisma.promotion.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { startTime: 'asc' }
      });
      
      // Format the response based on user role
      const results = promotions.map(promotion => {
        // Basic promotion info for all users
        const promotionData = {
          id: promotion.id,
          name: promotion.name,
          type: promotion.type,
          minSpending: promotion.minSpending,
          rate: promotion.rate,
          points: promotion.points
        };
        
        // Regular users don't see start time
        if (isManager) {
          promotionData.startTime = promotion.startTime.toISOString();
        }
        
        // All users see end time
        promotionData.endTime = promotion.endTime.toISOString();
        
        return promotionData;
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
   * Get a specific promotion by ID
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware function
   */
  getPromotionById: async (req, res, next) => {
    try {
      const { promotionId } = req.params;
      const isManager = req.user.role === 'manager' || req.user.role === 'superuser';
      const userId = req.auth.userId;
      
      // Find the promotion
      const promotion = await prisma.promotion.findUnique({
        where: { id: parseInt(promotionId) },
        include: {
          usages: {
            where: { userId }
          }
        }
      });
      
      if (!promotion) {
        return res.status(404).json({ error: 'Promotion not found' });
      }
      
      const now = new Date();
      const isInDateRange = promotion.startTime <= now && promotion.endTime >= now;
      
      // For regular users, only show active promotions they haven't used
      if (!isManager) {
        if (!promotion.isActive || !isInDateRange) {
          return res.status(404).json({ error: 'Promotion not found or inactive' });
        }
        
        // For one-time promotions, check if the user has already used it
        if (promotion.type === 'one-time' && promotion.usages.length > 0) {
          return res.status(404).json({ error: 'Promotion not found or already used' });
        }
        
        // Format response for regular users (no start time)
        return res.status(200).json({
          id: promotion.id,
          name: promotion.name,
          description: promotion.description,
          type: promotion.type,
          endTime: promotion.endTime.toISOString(),
          minSpending: promotion.minSpending,
          rate: promotion.rate,
          points: promotion.points
        });
      }
      
      // Format full response for managers
      res.status(200).json({
        id: promotion.id,
        name: promotion.name,
        description: promotion.description,
        type: promotion.type,
        startTime: promotion.startTime.toISOString(),
        endTime: promotion.endTime.toISOString(),
        minSpending: promotion.minSpending,
        rate: promotion.rate,
        points: promotion.points,
        isActive: promotion.isActive
      });
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Update a promotion (manager only)
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware function
   */
  updatePromotion: async (req, res, next) => {
    try {
      const { promotionId } = req.params;
      const { 
        name, 
        description, 
        type, 
        startTime, 
        endTime, 
        minSpending, 
        rate, 
        points,
        isActive
      } = req.body;
      
      // Find the promotion
      const promotion = await prisma.promotion.findUnique({
        where: { id: parseInt(promotionId) }
      });
      
      if (!promotion) {
        return res.status(404).json({ error: 'Promotion not found' });
      }
      
      // Validate date changes
      const now = new Date();
      const originalStartTime = new Date(promotion.startTime);
      const originalEndTime = new Date(promotion.endTime);
      
      // Check if promotion has already started
      const hasStarted = originalStartTime <= now;
      // Check if promotion has already ended
      const hasEnded = originalEndTime <= now;
      
      // Build update data object
      const updateData = {};
      
      // Validate and add fields to update
      if (name !== undefined) {
        if (hasStarted) {
          return res.status(400).json({ error: 'Cannot update name after promotion has started' });
        }
        updateData.name = name;
      }
      
      if (description !== undefined) {
        if (hasStarted) {
          return res.status(400).json({ error: 'Cannot update description after promotion has started' });
        }
        updateData.description = description;
      }
      
      if (type !== undefined) {
        if (hasStarted) {
          return res.status(400).json({ error: 'Cannot update type after promotion has started' });
        }
        if (type !== 'automatic' && type !== 'one-time') {
          return res.status(400).json({ error: 'Type must be either "automatic" or "one-time"' });
        }
        updateData.type = type;
      }
      
      if (startTime !== undefined) {
        if (hasStarted) {
          return res.status(400).json({ error: 'Cannot update start time after promotion has started' });
        }
        
        const newStartTime = new Date(startTime);
        if (isNaN(newStartTime.getTime())) {
          return res.status(400).json({ error: 'Invalid start time format' });
        }
        
        if (newStartTime < now) {
          return res.status(400).json({ error: 'Start time cannot be in the past' });
        }
        
        // If end time is not being updated, check against original end time
        const endTimeToCheck = endTime ? new Date(endTime) : originalEndTime;
        if (newStartTime >= endTimeToCheck) {
          return res.status(400).json({ error: 'Start time must be before end time' });
        }
        
        updateData.startTime = newStartTime;
      }
      
      if (endTime !== undefined) {
        if (hasEnded) {
          return res.status(400).json({ error: 'Cannot update end time after promotion has ended' });
        }
        
        const newEndTime = new Date(endTime);
        if (isNaN(newEndTime.getTime())) {
          return res.status(400).json({ error: 'Invalid end time format' });
        }
        
        if (newEndTime < now) {
          return res.status(400).json({ error: 'End time cannot be in the past' });
        }
        
        // If start time is not being updated, check against original start time
        const startTimeToCheck = startTime ? new Date(startTime) : originalStartTime;
        if (startTimeToCheck >= newEndTime) {
          return res.status(400).json({ error: 'End time must be after start time' });
        }
        
        updateData.endTime = newEndTime;
      }
      
      if (minSpending !== undefined) {
        if (hasStarted) {
          return res.status(400).json({ error: 'Cannot update minimum spending after promotion has started' });
        }
        
        if (minSpending !== null && (isNaN(minSpending) || minSpending <= 0)) {
          return res.status(400).json({ error: 'Minimum spending must be a positive number' });
        }
        
        updateData.minSpending = minSpending;
      }
      
      if (rate !== undefined) {
        if (hasStarted) {
          return res.status(400).json({ error: 'Cannot update rate after promotion has started' });
        }
        
        if (rate !== null && (isNaN(rate) || rate <= 0)) {
          return res.status(400).json({ error: 'Rate must be a positive number' });
        }
        
        updateData.rate = rate;
      }
      
      if (points !== undefined) {
        if (hasStarted) {
          return res.status(400).json({ error: 'Cannot update points after promotion has started' });
        }
        
        if (points !== null && (!Number.isInteger(points) || points <= 0)) {
          return res.status(400).json({ error: 'Points must be a positive integer' });
        }
        
        updateData.points = points;
      }

      if (isActive !== undefined) {
        updateData.isActive = isActive;
      }
      
      // Only update if there are changes
      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ error: 'No valid fields to update' });
      }
      
      // Update the promotion
      const updatedPromotion = await prisma.promotion.update({
        where: { id: parseInt(promotionId) },
        data: updateData
      });
      
      // Format the response (only include updated fields + id, name, type)
      const response = {
        id: updatedPromotion.id,
        name: updatedPromotion.name,
        type: updatedPromotion.type
      };
      
      // Add updated fields to response
      if (description !== undefined) response.description = updatedPromotion.description;
      if (startTime !== undefined) response.startTime = updatedPromotion.startTime.toISOString();
      if (endTime !== undefined) response.endTime = updatedPromotion.endTime.toISOString();
      if (minSpending !== undefined) response.minSpending = updatedPromotion.minSpending;
      if (rate !== undefined) response.rate = updatedPromotion.rate;
      if (points !== undefined) response.points = updatedPromotion.points;
      if (isActive !== undefined) response.isActive = updatedPromotion.isActive;
      
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Delete a promotion (manager only)
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware function
   */
  deletePromotion: async (req, res, next) => {
    try {
      const { promotionId } = req.params;
      
      // Find the promotion
      const promotion = await prisma.promotion.findUnique({
        where: { id: parseInt(promotionId) }
      });
      
      if (!promotion) {
        return res.status(404).json({ error: 'Promotion not found' });
      }
      
      // Check if the promotion has already started
      if (promotion.startTime <= new Date()) {
        return res.status(403).json({ error: 'Cannot delete a promotion that has already started' });
      }
      
      // Delete the promotion
      await prisma.$transaction([
        // Delete usage records
        prisma.promotionUsage.deleteMany({
          where: { promotionId: parseInt(promotionId) }
        }),
        // Delete transaction links
        prisma.transactionPromotion.deleteMany({
          where: { promotionId: parseInt(promotionId) }
        }),
        // Delete the promotion
        prisma.promotion.delete({
          where: { id: parseInt(promotionId) }
        })
      ]);
      
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
};

module.exports = promotionController;