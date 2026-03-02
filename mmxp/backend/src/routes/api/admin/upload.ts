import { Router } from 'express';
import type { Request, Response } from 'express';
import multer from 'multer';
import { requireAuth, getActingUser } from '../../../middleware/auth';
import { AppDataSource } from '../../../config/database';
import { User } from '../../../entities/User';
import { Event } from '../../../entities/Event';
import { Attendance } from '../../../entities/Attendance';
import { parseLumaCsv } from '../../../lib/csv';
import { createMagicLink } from '../../../lib/auth';
import { sendWelcomeEmail, sendMagicLinkEmail } from '../../../lib/email';
import { encodeId } from '../../../lib/hashids';
import { invalidateCachedUser, invalidateCachedLeaderboard } from '../../../lib/cache';
import {
  sendSuccess,
  sendUnauthorized,
  sendMissingField,
  sendInternalError,
  sendValidationError,
} from '../../../lib/response';
import type { UploadResult } from '../../../shared-types';

const router = Router();

// Keep CSV files in memory (they're small)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
});

async function assertAdmin(req: Request, res: Response): Promise<User | null> {
  const userId = getActingUser(req.session.authId);
  if (!userId) {
    sendUnauthorized(res);
    return null;
  }
  const user = await AppDataSource.getRepository(User).findOne({ where: { id: userId } });
  if (!user || !user.isAdmin) {
    sendUnauthorized(res, 'Admin access required');
    return null;
  }
  return user;
}

/**
 * POST /api/admin/upload
 * Multipart form fields:
 *   - file: CSV file
 *   - eventName: string
 *   - eventDate?: ISO date string
 */
router.post(
  '/',
  requireAuth,
  upload.single('file'),
  async (req: Request, res: Response) => {
    try {
      const admin = await assertAdmin(req, res);
      if (!admin) return;

      if (!req.file) {
        sendMissingField(res, 'file');
        return;
      }

      const { eventName, eventDate } = req.body as {
        eventName?: string;
        eventDate?: string;
      };

      if (!eventName) {
        sendMissingField(res, 'eventName');
        return;
      }

      const csvContent = req.file.buffer.toString('utf-8');
      const attendees = parseLumaCsv(csvContent);

      if (!attendees.length) {
        sendValidationError(res, 'CSV contained no valid attendee rows');
        return;
      }

      const userRepo = AppDataSource.getRepository(User);
      const eventRepo = AppDataSource.getRepository(Event);
      const attendRepo = AppDataSource.getRepository(Attendance);

      // Create the event record
      const event = eventRepo.create({
        name: eventName,
        eventDate: eventDate ? new Date(eventDate) : null,
        csvFilename: req.file.originalname,
        uploadedBy: admin.id,
        attendeeCount: 0,
      });
      await eventRepo.save(event);

      let newUsers = 0;
      let returningUsers = 0;
      let checkedInCount = 0;

      const emailPromises: Promise<void>[] = [];

      for (const attendee of attendees) {
        let user = await userRepo.findOne({ where: { email: attendee.email } });
        const isNew = !user;

        if (!user) {
          user = userRepo.create({
            email: attendee.email,
            name: attendee.name,
            points: 0,
            isAdmin: false,
          });
          await userRepo.save(user);
          newUsers++;
        } else {
          returningUsers++;
        }

        // Upsert attendance (idempotent on re-upload)
        let attendance = await attendRepo.findOne({
          where: { userId: user.id, eventId: event.id },
        });

        if (!attendance) {
          attendance = attendRepo.create({
            userId: user.id,
            eventId: event.id,
            checkedIn: attendee.checkedIn,
            pointsAwarded: 0,
          });
        }

        // Award 1 point per verified check-in (only once per event)
        if (attendee.checkedIn && !attendance.checkedIn) {
          attendance.checkedIn = true;
          attendance.pointsAwarded = 1;
          user.points += 1;
          await userRepo.save(user);
          checkedInCount++;
          await invalidateCachedUser(user.id);
        } else if (attendee.checkedIn) {
          checkedInCount++;
        }

        await attendRepo.save(attendance);

        // Send email asynchronously
        const capturedUser = user;
        const capturedIsNew = isNew;
        emailPromises.push(
          createMagicLink(capturedUser.id, capturedUser.email).then((magicUrl) => {
            if (capturedIsNew) {
              return sendWelcomeEmail({
                to: capturedUser.email,
                name: capturedUser.name,
                magicLinkUrl: magicUrl,
              });
            } else {
              return sendMagicLinkEmail({
                to: capturedUser.email,
                name: capturedUser.name,
                magicLinkUrl: magicUrl,
              });
            }
          })
        );
      }

      // Update event attendee count
      event.attendeeCount = attendees.length;
      await eventRepo.save(event);

      // Invalidate leaderboard cache
      await invalidateCachedLeaderboard();

      // Fire emails in background — don't block the response
      Promise.allSettled(emailPromises).then((results) => {
        const failed = results.filter((r) => r.status === 'rejected');
        if (failed.length) {
          console.error(`[MMXP] ${failed.length} email(s) failed to send after upload`);
        }
      });

      const result: UploadResult = {
        eventId: encodeId(event.id),
        eventName: event.name,
        totalRows: attendees.length,
        checkedIn: checkedInCount,
        newUsers,
        returningUsers,
      };

      sendSuccess(res, result, 201);
    } catch (err) {
      sendInternalError(res, err);
    }
  }
);

export default router;
