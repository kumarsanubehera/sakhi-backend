import { endOfDay } from '../../common/utils/helpers.js';
import { Mother } from '../mothers/mother.model.js';
import { Pregnancy } from '../pregnancies/pregnancy.model.js';
import { Visit } from '../visits/visit.model.js';
import * as motherService from '../mothers/mother.service.js';
import { complete } from '../../integrations/ai.service.js';
export async function interpret(input, actor) {
  const text = String(input.text || '').trim();
  const normalized = text.toLowerCase();
  const motherIds = await motherService.idsInScope(actor);
  const inScope = motherIds ? { mother: { $in: motherIds } } : {};
  if (normalized.includes('high risk') || text.includes('जोखिम')) {
    const rows = await Pregnancy.find({ ...inScope, status: 'ongoing', riskLevel: 'high' })
      .populate('mother', 'name registrationNo')
      .limit(5);
    return {
      intent: 'high_risk',
      reply: rows.length
        ? `There are ${rows.length} high-risk pregnancies in your list. Open the first one and arrange a referral if she has danger signs.`
        : 'No high-risk pregnancies are on your list right now.',
      data: rows,
    };
  }
  if (normalized.includes('visit') || normalized.includes('due') || text.includes('विजिट')) {
    const rows = await Visit.find({
      ...inScope,
      status: 'scheduled',
      scheduledAt: { $lte: endOfDay() },
    }).populate('mother', 'name registrationNo').sort({ scheduledAt: 1 }).limit(8);
    return {
      intent: 'due_visits',
      reply: rows.length
        ? `${rows.length} visits are due today or overdue.`
        : 'No visits are due today.',
      data: rows,
    };
  }
  if (normalized.includes('dashboard') || normalized.includes('summary') || text.includes('सारांश')) {
    const [mothers, highRisk] = await Promise.all([
      Mother.countDocuments(motherService.scopeFilter(actor)),
      Pregnancy.countDocuments({ ...inScope, status: 'ongoing', riskLevel: 'high' }),
    ]);
    return {
      intent: 'summary',
      reply: `You have ${mothers} mothers registered and ${highRisk} high-risk pregnancies.`,
      data: { mothers, highRisk },
    };
  }
  const aiReply = text ? await complete(text).catch(() => null) : null;
  if (aiReply) return { intent: 'ai', reply: aiReply, data: null };
  return {
    intent: 'unknown',
    reply: 'Ask about high-risk mothers, due visits, or a summary.',
    data: null,
  };
}