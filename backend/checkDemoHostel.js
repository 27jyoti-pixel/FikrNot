
require('dotenv').config();
const mongoose = require('mongoose');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;

  const collections = (await db.listCollections().toArray())
    .map(c => c.name);

    console.log('Collections:', collections);

  const hostelCollection = collections.find(
    name => name.toLowerCase() === 'hostels'
  );

  if (!hostelCollection) throw new Error('Hostels collection not found');

  const hostel = await db.collection(hostelCollection)
    .findOne({ name: 'Indira Bhawan B' });

  if (!hostel) {
    console.log('HOSTEL NOT FOUND');
    return;
  }

  console.log('Hostel:', hostel.name);
  console.log('Active:', hostel.isActive);
  console.log('Hostel ID:', String(hostel._id));

  console.log('Rector ID:', hostel.rectorId ? String(hostel.rectorId) : 'NONE');
console.log('Rector assigned:', Boolean(hostel.rectorId));

  
for (const name of ['users', 'lostreports', 'foundreports', 'claims']) {
  if (!collections.includes(name)) continue;

  const query = name === 'users'
    ? { hostelId: hostel._id }
    : {
        $or: [
          { hostelId: hostel._id },
          { hostel: hostel._id }
        ]
      };

  const count = await db.collection(name).countDocuments(query);
  console.log(name + ' linked records:', count);
}

}

main()
  .catch(err => console.log('CHECK FAILED:', err.message))
  .finally(() => mongoose.disconnect());
