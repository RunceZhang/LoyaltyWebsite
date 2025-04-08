const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Event controller for handling event-related operations
 */
const eventController = {
  /**
   * Create a new event (manager or higher role required)
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware function
   */
  createEvent: async (req, res, next) => {
    try {
      const { name, description, location, startTime, endTime, capacity, points } = req.body;
      
      // Validate required fields
      if (!name || !description || !location || !startTime || !endTime || !points) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      // Validate date formats and logic
      const start = new Date(startTime);
      const end = new Date(endTime);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({ error: 'Invalid date format' });
      }
      
      if (start >= end) {
        return res.status(400).json({ error: 'End time must be after start time' });
      }
      
      // Validate capacity
      if (capacity !== null && capacity !== undefined && (isNaN(capacity) || capacity <= 0)) {
        return res.status(400).json({ error: 'Capacity must be a positive number or null' });
      }
      
      // Validate points
      if (!Number.isInteger(points) || points <= 0) {
        return res.status(400).json({ error: 'Points must be a positive integer' });
      }
      
      // Create the event
      const event = await prisma.event.create({
        data: {
          name,
          description,
          location,
          startTime: start,
          endTime: end,
          capacity,
          points,
          pointsRemain: points,
          published: false
        }
      });
      
      // Return the created event
      res.status(201).json({
        id: event.id,
        name: event.name,
        description: event.description,
        location: event.location,
        startTime: event.startTime.toISOString(),
        endTime: event.endTime.toISOString(),
        capacity: event.capacity,
        pointsRemain: event.pointsRemain,
        pointsAwarded: event.pointsAwarded,
        published: event.published,
        organizers: [],
        guests: []
      });
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * List events with pagination and filtering
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware function
   */
  listEvents: async (req, res, next) => {
    try {
      const { 
        name, 
        location, 
        started, 
        ended, 
        showFull, 
        published,
        page = 1, 
        limit = 10 
      } = req.query;
      
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const isManager = req.user.role === 'manager' || req.user.role === 'superuser';
      
      // Basic validation
      if (started !== undefined && ended !== undefined) {
        return res.status(400).json({ error: 'Cannot specify both started and ended' });
      }
      
      // Build filter conditions
      const where = {};
      
      // For regular users, only show published events
      if (!isManager) {
        where.published = true;
      } else if (published !== undefined) {
        where.published = published === 'true';
      }
      
      if (name) {
        where.name = { contains: name };
      }
      
      if (location) {
        where.location = { contains: location };
      }
      
      const now = new Date();
      
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
      
      // By default, don't show full events unless showFull is true
      if (showFull !== 'true') {
        // To determine if an event is full, we need to check capacity and guest count
        // This is more complex with Prisma, so we'll filter after fetching
      }
      
      // Get count of filtered events
      const count = await prisma.event.count({ where });
      
      // Get events with pagination
      const events = await prisma.event.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { startTime: 'asc' },
        include: {
          guests: {
            include: {
              user: {
                select: {
                  id: true,
                  utorid: true,
                  name: true
                }
              }
            }
          },
          organizers: {
            include: {
              user: {
                select: {
                  id: true,
                  utorid: true,
                  name: true
                }
              }
            }
          }
        }
      });
      
      // Filter out full events if showFull !== 'true'
      const filteredEvents = events.filter(event => {
        if (showFull === 'true') return true;
        return event.capacity === null || event.guests.length < event.capacity;
      });
      
      // Format the response based on user role
      const results = filteredEvents.map(event => {
        const numGuests = event.guests.length;
        
        // Basic event info for all users
        const eventData = {
          id: event.id,
          name: event.name,
          location: event.location,
          startTime: event.startTime.toISOString(),
          endTime: event.endTime.toISOString(),
          capacity: event.capacity,
          numGuests
        };
        
        // Additional fields for managers
        if (isManager) {
          eventData.pointsRemain = event.pointsRemain;
          eventData.pointsAwarded = event.pointsAwarded;
          eventData.published = event.published;
        }
        
        return eventData;
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
   * Get a specific event by ID
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware function
   */
  getEventById: async (req, res, next) => {
    try {
      const { eventId } = req.params;
      const userId = req.auth.userId;
      const isManager = req.user.role === 'manager' || req.user.role === 'superuser';
      
      // Find the event
      const event = await prisma.event.findUnique({
        where: { id: parseInt(eventId) },
        include: {
          organizers: {
            include: {
              user: {
                select: {
                  id: true,
                  utorid: true,
                  name: true
                }
              }
            }
          },
          guests: {
            include: {
              user: {
                select: {
                  id: true,
                  utorid: true,
                  name: true
                }
              }
            }
          }
        }
      });
      
      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }
      
      // Check if event is published or user has access
      if (!event.published) {
        // For unpublished events, only managers can see them
        if (!isManager) {
          // Also check if user is an organizer
          const isOrganizer = event.organizers.some(o => o.userId === userId);
          if (!isOrganizer) {
            return res.status(404).json({ error: 'Event not found' });
          }
        }
      }
      
      // Format organizers data
      const organizers = event.organizers.map(o => ({
        id: o.user.id,
        utorid: o.user.utorid,
        name: o.user.name
      }));
      
      // Format response based on user role
      const response = {
        id: event.id,
        name: event.name,
        description: event.description,
        location: event.location,
        startTime: event.startTime.toISOString(),
        endTime: event.endTime.toISOString(),
        capacity: event.capacity,
        organizers,
        numGuests: event.guests.length
      };
      
      // Additional fields for managers or organizers
      const isOrganizer = event.organizers.some(o => o.userId === userId);
      if (isManager || isOrganizer) {
        response.pointsRemain = event.pointsRemain;
        response.pointsAwarded = event.pointsAwarded;
        response.published = event.published;
        response.guests = event.guests.map(g => ({
          id: g.user.id,
          utorid: g.user.utorid,
          name: g.user.name
        }));
      }
      
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Update an event (manager or event organizer required)
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware function
   */
  updateEvent: async (req, res, next) => {
    try {
      const { eventId } = req.params;
      const { 
        name, 
        description, 
        location, 
        startTime, 
        endTime, 
        capacity, 
        points,
        published 
      } = req.body;
      
      const isManager = req.user.role === 'manager' || req.user.role === 'superuser';
      
      // Find the event
      const event = await prisma.event.findUnique({
        where: { id: parseInt(eventId) },
        include: {
          organizers: true,
          guests: true
        }
      });
      
      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }
      
      // Check if user is an organizer (managers bypass this check)
      if (!isManager) {
        const isOrganizer = event.organizers.some(o => o.userId === req.auth.userId);
        if (!isOrganizer) {
          return res.status(403).json({ error: 'Only organizers can update this event' });
        }
      }
      
      // Validate date changes
      const now = new Date();
      const originalStartTime = new Date(event.startTime);
      const originalEndTime = new Date(event.endTime);
      
      // Check if event has already started
      const hasStarted = originalStartTime <= now;
      // Check if event has already ended
      const hasEnded = originalEndTime <= now;
      
      // Build update data object
      const updateData = {};
      
      // Validate and add fields to update
      if (name !== undefined) {
        if (hasStarted) {
          return res.status(400).json({ error: 'Cannot update name after event has started' });
        }
        updateData.name = name;
      }
      
      if (description !== undefined) {
        if (hasStarted) {
          return res.status(400).json({ error: 'Cannot update description after event has started' });
        }
        updateData.description = description;
      }
      
      if (location !== undefined) {
        if (hasStarted) {
          return res.status(400).json({ error: 'Cannot update location after event has started' });
        }
        updateData.location = location;
      }
      
      if (startTime !== undefined) {
        if (hasStarted) {
          return res.status(400).json({ error: 'Cannot update start time after event has started' });
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
          return res.status(400).json({ error: 'Cannot update end time after event has ended' });
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
      
      if (capacity !== undefined) {
        if (hasStarted) {
          return res.status(400).json({ error: 'Cannot update capacity after event has started' });
        }
        
        if (capacity !== null && (isNaN(capacity) || capacity <= 0)) {
          return res.status(400).json({ error: 'Capacity must be a positive number or null' });
        }
        
        // Check if reducing capacity would exceed the number of current guests
        if (capacity !== null && event.guests.length > capacity) {
          return res.status(400).json({ error: 'Cannot reduce capacity below current number of guests' });
        }
        
        updateData.capacity = capacity;
      }
      
      // Only managers can update points or publish status
      if (isManager) {
        if (points !== undefined) {
          if (!Number.isInteger(points) || points <= 0) {
            return res.status(400).json({ error: 'Points must be a positive integer' });
          }
          
          // Calculate new remaining points
          const pointsDifference = points - event.points;
          const newPointsRemain = event.pointsRemain + pointsDifference;
          
          // Ensure remaining points don't go negative
          if (newPointsRemain < 0) {
            return res.status(400).json({ error: 'Cannot reduce total points below already awarded points' });
          }
          
          updateData.points = points;
          updateData.pointsRemain = newPointsRemain;
        }
        
        if (published !== undefined) {
          // Can only publish an event, not unpublish it
          if (published === true && !event.published) {
            updateData.published = true;
          } else if (published !== true && published !== false) {
            return res.status(400).json({ error: 'Published must be a boolean' });
          } else if (published === false && event.published) {
            return res.status(400).json({ error: 'Cannot unpublish an event' });
          }
        }
      } else if (points !== undefined || published !== undefined) {
        return res.status(403).json({ error: 'Only managers can update points or publish status' });
      }
      
      // Only update if there are changes
      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ error: 'No valid fields to update' });
      }
      
      // Update the event
      const updatedEvent = await prisma.event.update({
        where: { id: parseInt(eventId) },
        data: updateData
      });
      
      // Format the response (only include updated fields + id, name, location)
      const response = {
        id: updatedEvent.id,
        name: updatedEvent.name,
        location: updatedEvent.location
      };
      
      // Add updated fields to response
      if (description !== undefined) response.description = updatedEvent.description;
      if (startTime !== undefined) response.startTime = updatedEvent.startTime.toISOString();
      if (endTime !== undefined) response.endTime = updatedEvent.endTime.toISOString();
      if (capacity !== undefined) response.capacity = updatedEvent.capacity;
      if (points !== undefined) response.points = updatedEvent.points;
      if (published !== undefined) response.published = updatedEvent.published;
      
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Delete an event (manager only)
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware function
   */
  deleteEvent: async (req, res, next) => {
    try {
      const { eventId } = req.params;
      
      // Find the event
      const event = await prisma.event.findUnique({
        where: { id: parseInt(eventId) }
      });
      
      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }
      
      // Check if the event has been published
      if (event.published) {
        return res.status(400).json({ error: 'Cannot delete a published event' });
      }
      
      // Delete the event
      await prisma.$transaction([
        // Delete organizers
        prisma.eventOrganizer.deleteMany({
          where: { eventId: parseInt(eventId) }
        }),
        // Delete guests
        prisma.eventGuest.deleteMany({
          where: { eventId: parseInt(eventId) }
        }),
        // Delete the event
        prisma.event.delete({
          where: { id: parseInt(eventId) }
        })
      ]);
      
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Add an organizer to an event (manager only)
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware function
   */
  addOrganizer: async (req, res, next) => {
    try {
      const { eventId } = req.params;
      const { utorid } = req.body;
      
      if (!utorid) {
        return res.status(400).json({ error: 'utorid is required' });
      }
      
      // Find the event
      const event = await prisma.event.findUnique({
        where: { id: parseInt(eventId) },
        include: {
          organizers: {
            include: {
              user: true
            }
          }
        }
      });
      
      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }
      
      // Check if event has ended
      if (new Date(event.endTime) <= new Date()) {
        return res.status(410).json({ error: 'Event has ended' });
      }
      
      // Find the user to add as organizer
      const user = await prisma.user.findUnique({
        where: { utorid }
      });
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Check if user is already an organizer
      const isAlreadyOrganizer = event.organizers.some(o => o.user.utorid === utorid);
      if (isAlreadyOrganizer) {
        return res.status(400).json({ error: 'User is already an organizer for this event' });
      }
      
      // Check if user is a guest
      const isGuest = await prisma.eventGuest.findFirst({
        where: {
          eventId: parseInt(eventId),
          userId: user.id
        }
      });
      
      if (isGuest) {
        return res.status(400).json({ error: 'User is registered as a guest for this event' });
      }
      
      // Add user as organizer
      await prisma.eventOrganizer.create({
        data: {
          eventId: parseInt(eventId),
          userId: user.id
        }
      });
      
      // Get updated organizers list
      const updatedEvent = await prisma.event.findUnique({
        where: { id: parseInt(eventId) },
        include: {
          organizers: {
            include: {
              user: {
                select: {
                  id: true,
                  utorid: true,
                  name: true
                }
              }
            }
          }
        }
      });
      
      // Format response
      const organizers = updatedEvent.organizers.map(o => ({
        id: o.user.id,
        utorid: o.user.utorid,
        name: o.user.name
      }));
      
      res.status(201).json({
        id: event.id,
        name: event.name,
        location: event.location,
        organizers
      });
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Remove an organizer from an event (manager only)
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware function
   */
  removeOrganizer: async (req, res, next) => {
    try {
      const { eventId, userId } = req.params;
      
      // Find the organizer
      const organizer = await prisma.eventOrganizer.findFirst({
        where: {
          eventId: parseInt(eventId),
          userId: parseInt(userId)
        }
      });
      
      if (!organizer) {
        return res.status(404).json({ error: 'Organizer not found for this event' });
      }
      
      // Remove the organizer
      await prisma.eventOrganizer.delete({
        where: {
          id: organizer.id
        }
      });
      
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Add a guest to an event (manager or organizer)
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware function
   */
  addGuest: async (req, res, next) => {
    try {
      const { eventId } = req.params;
      const { utorid } = req.body;
      
      if (!utorid) {
        return res.status(400).json({ error: 'utorid is required' });
      }
      
      // Find the event
      const event = await prisma.event.findUnique({
        where: { id: parseInt(eventId) },
        include: {
          guests: true,
          organizers: true
        }
      });
      
      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }
      
      // For organizers (non-managers), check if event is published
      const isManager = req.user.role === 'manager' || req.user.role === 'superuser';
      if (!isManager && !event.published) {
        return res.status(404).json({ error: 'Event not found or not visible to organizer' });
      }
      
      // Check if event has ended
      if (new Date(event.endTime) <= new Date()) {
        return res.status(410).json({ error: 'Event has ended' });
      }
      
      // Check if event is full
      if (event.capacity !== null && event.guests.length >= event.capacity) {
        return res.status(410).json({ error: 'Event is full' });
      }
      
      // Find the user to add as guest
      const user = await prisma.user.findUnique({
        where: { utorid }
      });
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Check if user is already a guest
      const isAlreadyGuest = event.guests.some(g => g.userId === user.id);
      if (isAlreadyGuest) {
        return res.status(400).json({ error: 'User is already a guest for this event' });
      }
      
      // Check if user is an organizer
      const isOrganizer = event.organizers.some(o => o.userId === user.id);
      if (isOrganizer) {
        return res.status(400).json({ error: 'User is registered as an organizer for this event' });
      }
      
      // Add user as guest
      await prisma.eventGuest.create({
        data: {
          eventId: parseInt(eventId),
          userId: user.id
        }
      });
      
      // Get updated guest count
      const updatedEvent = await prisma.event.findUnique({
        where: { id: parseInt(eventId) },
        include: {
          guests: {
            include: {
              user: {
                select: {
                  id: true,
                  utorid: true,
                  name: true
                }
              }
            }
          }
        }
      });
      
      res.status(201).json({
        id: event.id,
        name: event.name,
        location: event.location,
        guestAdded: {
          id: user.id,
          utorid: user.utorid,
          name: user.name
        },
        numGuests: updatedEvent.guests.length
      });
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Remove a guest from an event (manager only)
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware function
   */
  removeGuest: async (req, res, next) => {
    try {
      const { eventId, userId } = req.params;
      
      // Find the guest
      const guest = await prisma.eventGuest.findFirst({
        where: {
          eventId: parseInt(eventId),
          userId: parseInt(userId)
        }
      });
      
      if (!guest) {
        return res.status(404).json({ error: 'Guest not found for this event' });
      }
      
      // Remove the guest
      await prisma.eventGuest.delete({
        where: {
          id: guest.id
        }
      });
      
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Add current user as a guest to an event
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware function
   */
  addCurrentUserAsGuest: async (req, res, next) => {
    try {
      const { eventId } = req.params;
      const userId = req.auth.userId;
      
      // Find the event
      const event = await prisma.event.findUnique({
        where: { 
          id: parseInt(eventId),
          published: true  // Must be published for regular users to join
        },
        include: {
          guests: true,
          organizers: true
        }
      });
      
      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }
      
      // Check if event has ended
      if (new Date(event.endTime) <= new Date()) {
        return res.status(410).json({ error: 'Event has ended' });
      }
      
      // Check if event is full
      if (event.capacity !== null && event.guests.length >= event.capacity) {
        return res.status(410).json({ error: 'Event is full' });
      }
      
      // Get the user
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Check if user is already a guest
      const isAlreadyGuest = event.guests.some(g => g.userId === userId);
      if (isAlreadyGuest) {
        return res.status(400).json({ error: 'User is already on the guest list' });
      }
      
      // Check if user is an organizer
      const isOrganizer = event.organizers.some(o => o.userId === userId);
      if (isOrganizer) {
        return res.status(400).json({ error: 'Organizers cannot be guests' });
      }
      
      // Add current user as guest
      await prisma.eventGuest.create({
        data: {
          eventId: parseInt(eventId),
          userId
        }
      });
      
      // Get updated guest count
      const updatedEvent = await prisma.event.findUnique({
        where: { id: parseInt(eventId) },
        include: {
          guests: true
        }
      });
      
      res.status(201).json({
        id: event.id,
        name: event.name,
        location: event.location,
        guestAdded: {
          id: user.id,
          utorid: user.utorid,
          name: user.name
        },
        numGuests: updatedEvent.guests.length
      });
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Remove current user as a guest from an event
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware function
   */
  removeCurrentUserAsGuest: async (req, res, next) => {
    try {
      const { eventId } = req.params;
      const userId = req.auth.userId;
      
      // Find the event
      const event = await prisma.event.findUnique({
        where: { id: parseInt(eventId) }
      });
      
      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }
      
      // Check if event has ended
      if (new Date(event.endTime) <= new Date()) {
        return res.status(410).json({ error: 'Event has ended' });
      }
      
      // Find the guest entry
      const guest = await prisma.eventGuest.findFirst({
        where: {
          eventId: parseInt(eventId),
          userId
        }
      });
      
      if (!guest) {
        return res.status(404).json({ error: 'User did not RSVP to this event' });
      }
      
      // Remove the user as a guest
      await prisma.eventGuest.delete({
        where: {
          id: guest.id
        }
      });
      
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Create an event transaction (award points to guests)
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware function
   */
  createEventTransaction: async (req, res, next) => {
    try {
      const { eventId } = req.params;
      const { type, utorid, amount, remark = "" } = req.body;
      const creatorId = req.auth.userId;
      
      // Validate type
      if (type !== 'event') {
        return res.status(400).json({ error: 'Transaction type must be "event"' });
      }
      
      // Validate amount
      if (!amount || !Number.isInteger(amount) || amount <= 0) {
        return res.status(400).json({ error: 'Amount must be a positive integer' });
      }
      
      // Find the event
      const event = await prisma.event.findUnique({
        where: { id: parseInt(eventId) },
        include: {
          guests: {
            include: {
              user: true
            }
          },
          organizers: true
        }
      });
      
      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }
      
      // Check if user is an organizer
      const isManager = req.user.role === 'manager' || req.user.role === 'superuser';
      const isOrganizer = event.organizers.some(o => o.userId === creatorId);
      
      if (!isManager && !isOrganizer) {
        return res.status(403).json({ error: 'Only organizers or managers can award points' });
      }
      
      // Get the creator
      const creator = await prisma.user.findUnique({
        where: { id: creatorId }
      });
      
      // Different logic based on whether utorid is provided or not
      if (utorid) {
        // Award points to a specific guest
        
        // Find the guest
        const guest = event.guests.find(g => g.user.utorid === utorid);
        
        if (!guest) {
          return res.status(400).json({ error: 'User is not on the guest list' });
        }
        
        // Check if there are enough remaining points
        if (amount > event.pointsRemain) {
          return res.status(400).json({ error: 'Not enough remaining points' });
        }
        
        // Create the transaction
        const transaction = await prisma.transaction.create({
          data: {
            type,
            amount,
            userId: guest.userId,
            eventId: parseInt(eventId),
            remark,
            createdById: creatorId,
            relatedId: parseInt(eventId)
          }
        });
        
        // Update the user's points
        await prisma.user.update({
          where: { id: guest.userId },
          data: {
            points: {
              increment: amount
            }
          }
        });
        
        // Update the event's remaining points and awarded points
        await prisma.event.update({
          where: { id: parseInt(eventId) },
          data: {
            pointsRemain: {
              decrement: amount
            },
            pointsAwarded: {
              increment: amount
            }
          }
        });
        
        // Return the transaction
        res.status(201).json({
          id: transaction.id,
          recipient: utorid,
          awarded: amount,
          type,
          relatedId: parseInt(eventId),
          remark,
          createdBy: creator.utorid
        });
      } else {
        // Award points to all guests
        
        // Calculate total points needed
        const guestCount = event.guests.length;
        const totalPointsNeeded = amount * guestCount;
        
        // Check if there are enough remaining points
        if (totalPointsNeeded > event.pointsRemain) {
          return res.status(400).json({ error: 'Not enough remaining points for all guests' });
        }
        
        // Create a transaction for each guest
        const transactions = [];
        
        for (const guest of event.guests) {
          const transaction = await prisma.transaction.create({
            data: {
              type,
              amount,
              userId: guest.userId,
              eventId: parseInt(eventId),
              remark,
              createdById: creatorId,
              relatedId: parseInt(eventId)
            }
          });
          
          // Update the user's points
          await prisma.user.update({
            where: { id: guest.userId },
            data: {
              points: {
                increment: amount
              }
            }
          });
          
          transactions.push({
            id: transaction.id,
            recipient: guest.user.utorid,
            awarded: amount,
            type,
            relatedId: parseInt(eventId),
            remark,
            createdBy: creator.utorid
          });
        }
        
        // Update the event's remaining points and awarded points
        await prisma.event.update({
          where: { id: parseInt(eventId) },
          data: {
            pointsRemain: {
              decrement: totalPointsNeeded
            },
            pointsAwarded: {
              increment: totalPointsNeeded
            }
          }
        });
        
        // Return the transactions
        res.status(201).json(transactions);
      }
    } catch (error) {
      next(error);
    }
  }
};

module.exports = eventController;