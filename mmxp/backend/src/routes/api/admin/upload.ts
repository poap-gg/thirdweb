import { Router } from 'express';
import type { Request, Response } from 'express';
import multer from 'multer';
import { requireAuth, getActingUser } from '../../../middleware/auth';
import { store } from '../../../lib/store';
import type { StoreUser } from '../../../lib/store';
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

function assertAdmin(req: Request, res: Response): StoreUser | null {
  const userId = getActingUser(req.session.authId);
  if (!userId) {
    sendUnauthorized(res);
    return null;
  }
  const user = store.users.findById(userId);
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
      const admin = assertAdmin(req, res);
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

      // Create the event record
      let event = store.events.save({
        name: eventName,
        eventDate: eventDate ? new Date(eventDate) : null,
        csvFilename: req.file.originalname,
        uploadedBy: admin.id,
        attendeeCount: 0,
      });

      let newUsers = 0;
      let returningUsers = 0;
      let checkedInCount = 0;

      const emailPromises: Promise<void>[] = [];

      for (const attendee of attendees) {
        let user = store.users.findByEmail(attendee.email);
        const isNew = !user;

        if (!user) {
          user = store.users.save({
            email: attendee.email,
            name: attendee.name,
            points: 0,
            isAdmin: false,
          });
          newUsers++;
        } else {
          returningUsers++;
        }

        // Upsert attendance (idempotent on re-upload)
        let attendance = store.attendances.findByUserAndEvent(user.id, event.id);

        if (!attendance) {
          attendance = store.attendances.save({
            userId: user.id,
            eventId: event.id,
            checkedIn: attendee.checkedIn,
            pointsAwarded: 0,
          });
        }

        // Award 1 point per verified check-in (only once per event)
        if (attendee.checkedIn && !attendance.checkedIn) {
          attendance = store.attendances.save({ ...attendance, checkedIn: true, pointsAwarded: 1 });
          user = store.users.save({ ...user, points: user.points + 1 });
          checkedInCount++;
          await invalidateCachedUser(user.id);
        } else if (attendee.checkedIn) {
          checkedInCount++;
        }

        // Send email asynchronously (skipped in dev since magic-link returns URL directly)
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
      event = store.events.save({ ...event, attendeeCount: attendees.length });

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
