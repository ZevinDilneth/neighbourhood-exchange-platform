import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { Message } from '../models/Message';
import { Group } from '../models/Group';
import { TokenPayload } from '../types';
import { Types } from 'mongoose';

interface AuthSocket extends Socket {
  userId?: string;
}

export const setupSocket = (io: Server): void => {
  // Auth middleware for socket connections
  io.use((socket: AuthSocket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) return next(new Error('Authentication required'));

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as TokenPayload;
      socket.userId = decoded.userId;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: AuthSocket) => {
    const userId = socket.userId as string;

    // Join personal room for direct notifications
    socket.join(`user:${userId}`);

    console.log(`🔌 User connected: ${userId}`);

    // Join group chat rooms
    socket.on('join-group', async (groupId: string) => {
      try {
        const group = await Group.findOne({
          _id: groupId,
          'members.user': userId,
          isActive: true,
        });

        if (group) {
          socket.join(`group:${groupId}`);
          socket.emit('joined-group', { groupId });
        } else {
          socket.emit('error', { message: 'Not a member of this group' });
        }
      } catch (err) {
        socket.emit('error', { message: 'Failed to join group' });
      }
    });

    // Leave group room
    socket.on('leave-group', (groupId: string) => {
      socket.leave(`group:${groupId}`);
    });

    // Send group message
    socket.on(
      'send-message',
      async (data: { groupId: string; content: string; type?: string; replyTo?: string }) => {
        try {
          const { groupId, content, type = 'text', replyTo } = data;

          const group = await Group.findOne({
            _id: groupId,
            'members.user': userId,
            isActive: true,
          });

          if (!group) {
            socket.emit('error', { message: 'Not authorized to send messages here' });
            return;
          }

          const message = await Message.create({
            group: groupId,
            sender: new Types.ObjectId(userId),
            content,
            type,
            replyTo: replyTo ? new Types.ObjectId(replyTo) : undefined,
          });

          const populated = await message.populate('sender', 'name avatar');

          // Broadcast to group room
          io.to(`group:${groupId}`).emit('new-message', populated);
        } catch (err) {
          socket.emit('error', { message: 'Failed to send message' });
        }
      }
    );

    // Typing indicator
    socket.on('typing', (data: { groupId: string; isTyping: boolean }) => {
      socket.to(`group:${data.groupId}`).emit('user-typing', {
        userId,
        isTyping: data.isTyping,
      });
    });

    // Add reaction to message
    socket.on('add-reaction', async (data: { messageId: string; emoji: string }) => {
      try {
        const message = await Message.findById(data.messageId);
        if (!message) return;

        const reactionIdx = message.reactions.findIndex((r) => r.emoji === data.emoji);

        if (reactionIdx > -1) {
          const userIdx = message.reactions[reactionIdx].users.findIndex(
            (u) => u.toString() === userId
          );

          if (userIdx > -1) {
            message.reactions[reactionIdx].users.splice(userIdx, 1);
            if (message.reactions[reactionIdx].users.length === 0) {
              message.reactions.splice(reactionIdx, 1);
            }
          } else {
            message.reactions[reactionIdx].users.push(
              new Types.ObjectId(userId) as unknown as typeof message.reactions[0]['users'][0]
            );
          }
        } else {
          message.reactions.push({
            emoji: data.emoji,
            users: [new Types.ObjectId(userId) as unknown as typeof message.reactions[0]['users'][0]],
          });
        }

        await message.save();

        io.to(`group:${message.group.toString()}`).emit('reaction-updated', {
          messageId: data.messageId,
          reactions: message.reactions,
        });
      } catch (err) {
        socket.emit('error', { message: 'Failed to add reaction' });
      }
    });

    socket.on('disconnect', () => {
      console.log(`🔌 User disconnected: ${userId}`);
    });
  });
};
