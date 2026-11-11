import { endOfDay, motherScope, startOfDay } from '../../common/utils/helpers.js';
import { asyncHandler } from '../../common/utils/helpers.js';
import { ok } from '../../common/utils/response.js';
import { Mother } from '../mothers/mother.model.js';
import * as motherService from '../mothers/mother.service.js';
import { Pregnancy } from '../pregnancies/pregnancy.model.js';
import { Visit } from '../visits/visit.model.js';
import { Referral } from '../referrals/referral.model.js';
import { Notification } from '../notifications/notification.model.js';
export const summary = asyncHandler(async (req, res) => {
  const mothersFilter = motherScope(req.user);
  const motherIds = await motherService.idsInScope(req.user);
  const inScope = motherIds ? { mother: { $in: motherIds } } : {};
  const todayStart = startOfDay();
  const todayEnd = endOfDay();
  const [
    mothers,
    activePregnancies,
    highRisk,
    dueToday,
    missedVisits,
    openReferrals,
    anc4,
    unreadNotifications,
  ] = await Promise.all([
    Mother.countDocuments(mothersFilter),
    Pregnancy.countDocuments({ ...inScope, status: 'ongoing' }),
    Pregnancy.countDocuments({ ...inScope, status: 'ongoing', riskLevel: 'high' }),
    Visit.countDocuments({
      ...inScope,
      status: 'scheduled',
      scheduledAt: { $gte: todayStart, $lte: todayEnd },
    }),
    Visit.countDocuments({
      ...inScope,
      $or: [
        { status: 'missed' },
        { status: 'scheduled', scheduledAt: { $lt: todayStart } },
      ],
    }),
    Referral.countDocuments({ ...inScope, status: { $in: ['pending', 'accepted'] } }),
    Pregnancy.countDocuments({ ...inScope, status: 'ongoing', ancCompletedCount: { $gte: 4 } }),
    Notification.countDocuments({ user: req.user.id, readAt: null }),
  ]);
  return ok(res, {
    mothers,
    activePregnancies,
    highRisk,
    dueToday,
    missedVisits,
    openReferrals,
    anc4,
    anc4CoveragePercent: activePregnancies ? Math.round((anc4 / activePregnancies) * 100) : 0,
    unreadNotifications,
  });
});