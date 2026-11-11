import { AppError, makeRegistrationNo, motherScope } from '../../common/utils/helpers.js';
import { requireLocation } from '../locations/location.model.js';
import { Mother, withMotherRefs } from './mother.model.js';
async function uniqueRegistrationNo() {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const registrationNo = makeRegistrationNo();
    const exists = await Mother.exists({ registrationNo });
    if (!exists) return registrationNo;
  }
  throw new AppError('Could not generate a registration number', 500);
}
async function assertPlaces(input) {
  await requireLocation(input.village, 'village');
  await requireLocation(input.block, 'block');
  await requireLocation(input.district, 'district');
  await requireLocation(input.facility, 'facility');
}
export async function create(input, actor) {
  await assertPlaces(input);
  const data = { ...input, createdBy: actor.id };
  if (actor.role === 'asha') data.assignedAsha = actor.id;
  if (!data.registrationNo) data.registrationNo = await uniqueRegistrationNo();
  const mother = await Mother.create(data);
  return withMotherRefs(Mother.findById(mother.id));
}
export async function update(id, input, actor) {
  const mother = await findInScope(id, actor);
  await assertPlaces(input);
  if (actor.role === 'asha') delete input.assignedAsha;
  Object.assign(mother, input);
  await mother.save();
  return withMotherRefs(Mother.findById(mother.id));
}
export async function findInScope(id, actor) {
  const mother = await Mother.findOne({ _id: id, ...motherScope(actor) });
  if (!mother) throw new AppError('Mother not found', 404);
  return mother;
}
export async function idsInScope(actor) {
  if (actor.role === 'admin') return null;
  return Mother.find(motherScope(actor)).distinct('_id');
}
export function scopeFilter(actor) {
  return motherScope(actor);
}
export function forMothers(motherIds, motherId) {
  if (motherId) {
    const allowed = !motherIds || motherIds.some((id) => String(id) === String(motherId));
    return allowed ? { mother: motherId } : { mother: { $in: [] } };
  }
  if (motherIds) return { mother: { $in: motherIds } };
  return {};
}