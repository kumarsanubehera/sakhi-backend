import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import { connectDb } from './config/db.js';
import { errorMiddleware } from './common/middleware/errorMiddleware.js';
import { authMiddleware } from './common/middleware/authMiddleware.js';
import { allowRoles } from './common/guards/roleGuard.js';
import { STAFF_ROLES, asyncHandler } from './common/utils/helpers.js';
import { ok } from './common/utils/response.js';
import authRoutes from './modules/auth/auth.routes.js';
import userRoutes from './modules/users/user.routes.js';
import locationRoutes from './modules/locations/location.routes.js';
import motherRoutes from './modules/mothers/mother.routes.js';
import pregnancyRoutes from './modules/pregnancies/pregnancy.routes.js';
import visitRoutes from './modules/visits/visit.routes.js';
import observationRoutes from './modules/observations/observation.routes.js';
import riskRoutes from './modules/risk-screening/risk.routes.js';
import referralRoutes from './modules/referrals/referral.routes.js';
import documentRoutes from './modules/documents/document.routes.js';
import communityRoutes from './modules/community/community.routes.js';
import announcementRoutes from './modules/announcements/announcement.routes.js';
import { summary } from './modules/dashboard/dashboard.controller.js';
import * as notifications from './modules/notifications/notification.service.js';
import * as syncService from './modules/sync/sync.service.js';
import * as voiceService from './modules/voice-assistant/voice.service.js';
import { startCleanupJob } from './jobs/cleanup.job.js';
import { startNotificationJob } from './jobs/notification.job.js';
const app = express();
const staff = allowRoles(...STAFF_ROLES);
app.use(helmet());
app.use(cors());
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '1mb' }));
app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'Sakhi API is running' });
});
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/mothers', motherRoutes);
app.use('/api/pregnancies', pregnancyRoutes);
app.use('/api/visits', visitRoutes);
app.use('/api/observations', observationRoutes);
app.use('/api/risk', riskRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/announcements', announcementRoutes);
app.get('/api/dashboard/summary', authMiddleware, summary);
app.get('/api/notifications', authMiddleware, asyncHandler(async (req, res) => {
  return ok(res, await notifications.listFor(req.user.id));
}));
app.patch('/api/notifications/:id/read', authMiddleware, asyncHandler(async (req, res) => {
  return ok(res, await notifications.markRead(req.params.id, req.user.id), 'Marked as read');
}));
app.post('/api/notifications/read-all', authMiddleware, asyncHandler(async (req, res) => {
  await notifications.markAllRead(req.user.id);
  return ok(res, null, 'All notifications marked as read');
}));
app.post('/api/sync/push', authMiddleware, staff, asyncHandler(async (req, res) => {
  return ok(res, await syncService.pushChanges(req.body.changes, req.user));
}));
app.get('/api/sync/pull', authMiddleware, staff, asyncHandler(async (req, res) => {
  return ok(res, await syncService.pullChanges(req.query.since, req.user));
}));
app.post('/api/voice/interpret', authMiddleware, asyncHandler(async (req, res) => {
  const text = typeof req.body?.text === 'string' ? req.body.text : '';
  return ok(res, await voiceService.interpret({ text }, req.user));
}));
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});
app.use(errorMiddleware);
const connection = await connectDb();
app.listen(env.port, () => {
  console.log(`Sakhi API listening on port ${env.port}`);
  startCleanupJob();
  startNotificationJob();
});
connection.on('error', (error) => {
  console.error('MongoDB connection error', error);
});