const LostReport = require('../models/LostReport');
const FoundReport = require('../models/FoundReport');

const migrateLocationIndexes = async () => {
  for (const Model of [LostReport, FoundReport]) {
    const indexes = await Model.collection.indexes();
    const locationIndexes = indexes.filter(
      (index) => index.key?.location === '2dsphere'
    );
    const desiredPartialFilter = { 'location.coordinates': { $exists: true } };
    const desiredExists = locationIndexes.some(
      (index) => JSON.stringify(index.partialFilterExpression) === JSON.stringify(desiredPartialFilter)
    );

    if (!desiredExists) {
      for (const index of locationIndexes) await Model.collection.dropIndex(index.name);
      await Model.collection.createIndex(
        { location: '2dsphere' },
        { name: 'location_2dsphere', partialFilterExpression: desiredPartialFilter }
      );
    }
  }
};

module.exports = migrateLocationIndexes;
