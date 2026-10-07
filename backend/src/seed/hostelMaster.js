const mongoose = require('mongoose');

const env = require('../config/env');
const Hostel = require('../models/Hostel');

const HOSTEL_NAMES = [
  'Indira Bhawan A',
  'Indira Bhawan B',
  'Indira Bhawan C',
  'Sarojini A',
  'Sarojini B',
  'Sarojini C',
  'Teresa A',
  'Teresa B',
  'Teresa C',
  'Shakuntala A',
  'Shakuntala B',
  'Shakuntala C',
  'Rani Laxmi Bai A',
  'Kalpana A',
  'Kalpana B',
  'Janki Bhawan',
  'Marie Curie',
  'Tagore A',
  'Tagore B',
  'Tagore C',
  'Sardar Bhawan A',
  'Atal A',
  'Atal B',
  'Attul C',
  'Sardar Bhawan B',
  'Albert Einstein',
  'Azad A',
  'Azad B',
  'Abraham A',
  'Abraham B',
  'Shastri Bhawan A',
  'Shastri Bhawan B'
];

// Keep the original demo records and their ObjectIds for existing users and
// workflows, but remove their legacy names from the active master list.
const LEGACY_DEMO_HOSTELS = ['Shivaji Hostel', 'Tagore Hostel'];

const seedHostelMaster = async () => {
  await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });

  let inserted = 0;
  for (const name of HOSTEL_NAMES) {
    const result = await Hostel.updateOne(
      { name },
      {
        $set: { isActive: true },
        $setOnInsert: {
          name,
          // Development placeholders only; replace with approved campus data.
          capacity: 1,
          location: {
            type: 'Point',
            coordinates: [0, 0],
            area: `Unassigned development location (${name})`
          }
        }
      },
      { upsert: true, runValidators: true }
    );
    inserted += result.upsertedCount || 0;
  }

  await Hostel.updateMany(
    { name: { $in: LEGACY_DEMO_HOSTELS } },
    { $set: { isActive: false } }
  );

  const records = await Hostel.find({ name: { $in: HOSTEL_NAMES } })
    .select('_id name')
    .sort({ name: 1 })
    .lean();
  console.log(`[Hostel master] Inserted ${inserted}; verified ${records.length}/32 records.`);
  if (records.length !== HOSTEL_NAMES.length) {
    throw new Error(`Expected ${HOSTEL_NAMES.length} distinct hostels, found ${records.length}.`);
  }
};

seedHostelMaster()
  .catch((error) => {
    console.error('[Hostel master] Failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
