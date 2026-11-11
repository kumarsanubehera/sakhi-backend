import { connectDb } from '../config/db.js';
import { addDays } from '../common/utils/helpers.js';
import { Role } from '../modules/roles/role.model.js';
import { User } from '../modules/users/user.model.js';
import { Location } from '../modules/locations/location.model.js';
import { Mother } from '../modules/mothers/mother.model.js';
import { Pregnancy } from '../modules/pregnancies/pregnancy.model.js';
import { Visit } from '../modules/visits/visit.model.js';
import { Observation } from '../modules/observations/observation.model.js';
import { CommunityPost } from '../modules/community/community.model.js';
import { Announcement } from '../modules/announcements/announcement.model.js';
import { applyScreening } from '../modules/risk-screening/risk.controller.js';
const ROLES = [
  { name: 'admin', label: 'Administrator', permissions: ['*'] },
  { name: 'asha', label: 'ASHA', permissions: ['mothers:write', 'visits:write', 'observations:write', 'referrals:write', 'sync'] },
  { name: 'anm', label: 'ANM', permissions: ['mothers:write', 'visits:write', 'observations:write', 'referrals:write', 'sync'] },
  { name: 'medical_officer', label: 'Medical officer', permissions: ['mothers:read', 'referrals:manage', 'announcements:write', 'dashboard'] },
  { name: 'mother', label: 'Mother', permissions: ['profile:read', 'community:read', 'announcements:read'] },
];
async function ensureLocation(data) {
  const existing = await Location.findOne({ code: data.code });
  if (existing) return existing;
  return Location.create(data);
}
async function ensureUser(data) {
  const existing = await User.findOne({ phone: data.phone });
  if (existing) return existing;
  return User.create(data);
}
async function seed() {
  await connectDb();
  for (const role of ROLES) {
    await Role.updateOne({ name: role.name }, role, { upsert: true });
  }
  const state = await ensureLocation({ name: 'Madhya Pradesh', code: 'MP', type: 'state' });
  const district = await ensureLocation({ name: 'Sehore', code: 'MP-SEHORE', type: 'district', parent: state.id });
  const block = await ensureLocation({ name: 'Ashta', code: 'MP-ASHTA', type: 'block', parent: district.id });
  const village = await ensureLocation({ name: 'Bijlon', code: 'MP-BIJLON', type: 'village', parent: block.id });
  const facility = await ensureLocation({
    name: 'Ashta PHC',
    code: 'MP-ASHTA-PHC',
    type: 'facility',
    facilityType: 'phc',
    parent: block.id,
  });

  const admin = await ensureUser({ name: 'Sakhi Admin', phone: '9999999999', password: 'Admin@123', role: 'admin' });
  const asha = await ensureUser({
    name: 'Geeta ASHA',
    phone: '9876543210',
    password: 'Asha@123',
    role: 'asha',
    location: village.id,
  });
  await ensureUser({
    name: 'Sunita ANM',
    phone: '9898989898',
    password: 'Anm@123',
    role: 'anm',
    location: block.id,
  });
  await ensureUser({
    name: 'Dr. Verma',
    phone: '9765432109',
    password: 'Doctor@123',
    role: 'medical_officer',
    location: district.id,
  });
  const motherUser = await ensureUser({
    name: 'Radha Bai',
    phone: '9123456789',
    password: 'Mother@123',
    role: 'mother',
    location: village.id,
  });
  let mother = await Mother.findOne({ phone: '9123456789' });
  if (!mother) {
    mother = await Mother.create({
      registrationNo: 'SKH-DEMO-0001',
      name: 'Radha Bai',
      age: 24,
      phone: '9123456789',
      husbandOrGuardian: 'Ramesh',
      address: 'Ward 3, Bijlon',
      village: village.id,
      block: block.id,
      district: district.id,
      facility: facility.id,
      assignedAsha: asha.id,
      userAccount: motherUser.id,
      bloodGroup: 'B+',
      createdBy: admin.id,
    });
  }
  let pregnancy = await Pregnancy.findOne({ mother: mother.id, status: 'ongoing' });
  if (!pregnancy) {
    const lmp = addDays(new Date(), -20 * 7);
    pregnancy = await Pregnancy.create({
      mother: mother.id,
      lmp,
      edd: addDays(lmp, 280),
      gravida: 2,
      para: 1,
      livingChildren: 1,
      createdBy: asha.id,
    });
    const weeks = [12, 20, 26, 30, 34, 36, 38, 40];
    const visits = await Visit.insertMany(weeks.map((week, index) => ({
      mother: mother.id,
      pregnancy: pregnancy.id,
      assignedTo: asha.id,
      visitType: 'anc',
      visitNumber: index + 1,
      scheduledAt: addDays(lmp, week * 7),
      status: week === 12 ? 'completed' : 'scheduled',
      conductedAt: week === 12 ? addDays(lmp, week * 7) : null,
      conductedBy: week === 12 ? asha.id : null,
      place: 'Village health day',
    })));
    const firstVisit = visits[0];
    const observation = await Observation.create({
      mother: mother.id,
      pregnancy: pregnancy.id,
      visit: firstVisit.id,
      weightKg: 54,
      bpSystolic: 118,
      bpDiastolic: 76,
      hemoglobin: 9.8,
      fetalMovements: 'normal',
      urineAlbumin: 'nil',
      urineSugar: 'nil',
      dangerSigns: [],
      recordedBy: asha.id,
    });
    await applyScreening({ mother, pregnancy, observation });
    await Pregnancy.findByIdAndUpdate(pregnancy.id, { ancCompletedCount: 1 });
  }
  const post = await CommunityPost.findOne({ title: 'Iron tablets this week' });
  if (!post) {
    await CommunityPost.create({
      title: 'Iron tablets this week',
      body: 'Take one iron and folic acid tablet daily after food. Come to the Anganwadi if you feel dizzy.',
      category: 'nutrition',
      author: asha.id,
      location: village.id,
    });
  }
  const announcement = await Announcement.findOne({ title: 'Village health and nutrition day' });
  if (!announcement) {
    await Announcement.create({
      title: 'Village health and nutrition day',
      body: 'VHND at the Anganwadi this Thursday. Bring Mother and Child Protection cards.',
      audience: ['asha', 'anm', 'mother'],
      location: village.id,
      createdBy: admin.id,
    });
  }
  console.log('Seed complete');
  console.log('Admin login: 9999999999 / Admin@123');
  console.log('ASHA login:  9876543210 / Asha@123');
}
seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
