const natural = require('natural');

const LostReport = require('../../models/LostReport');
const FoundReport = require('../../models/FoundReport');
const Match = require('../../models/Match');
const Notification = require('../../models/Notification');

const {
  LOST_STATUS,
  FOUND_STATUS,
  MATCH_STATUS,
  NOTIFICATION_TYPES
} = require('../../constants');

/*
|--------------------------------------------------------------------------
| Jaro-Winkler Similarity
|--------------------------------------------------------------------------
*/

const getJaroWinklerSimilarity = (str1, str2) => {
  if (!str1 || !str2) return 0;

  const s1 = str1.toString().trim().toLowerCase();
  const s2 = str2.toString().trim().toLowerCase();

  if (s1 === s2) return 1.0;

  return natural.JaroWinklerDistance(s1, s2, true);
};

/*
|--------------------------------------------------------------------------
| Haversine Distance
|--------------------------------------------------------------------------
|
| Calculates distance in meters between:
| [longitude, latitude]
|
*/

const calculateDistanceMeters = (coord1, coord2) => {
  if (
    !coord1 ||
    !coord2 ||
    coord1.length < 2 ||
    coord2.length < 2
  ) {
    return null;
  }

  const [lon1, lat1] = coord1;
  const [lon2, lat2] = coord2;

  const R = 6371e3;

  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;

  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) ** 2 +
    Math.cos(phi1) *
      Math.cos(phi2) *
      Math.sin(deltaLambda / 2) ** 2;

  const c =
    2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

/*
|--------------------------------------------------------------------------
| Calculate Match Score
|--------------------------------------------------------------------------
|
| Locked scoring:
|
| Category       → Gate
| Item Name      → 35
| Brand          → 15
| Color          → 10
| Location       → 20
| Time           → 20
|
| Dynamic normalization is used when optional fields are missing.
|
*/

const calculateMatchScore = (lostReport, foundReport) => {
  /*
  |--------------------------------------------------------------------------
  | STEP 1: Category Gate
  |--------------------------------------------------------------------------
  */

  if (lostReport.category !== foundReport.category) {
    return 0;
  }

  /*
  |--------------------------------------------------------------------------
  | STEP 2: Item Name Gate
  |--------------------------------------------------------------------------
  */

  const itemNameSim = getJaroWinklerSimilarity(
    lostReport.itemName,
    foundReport.itemName
  );

  if (itemNameSim < 0.45) {
    return 0;
  }

  let achievedPoints = 0;
  let maxAvailablePoints = 0;

  /*
  |--------------------------------------------------------------------------
  | Item Name = 35
  |--------------------------------------------------------------------------
  */

  maxAvailablePoints += 35;
  achievedPoints += itemNameSim * 35;

  /*
  |--------------------------------------------------------------------------
  | Brand = 15
  |--------------------------------------------------------------------------
  */

  const lostBrand = (lostReport.brand || '').trim();
  const foundBrand = (foundReport.brand || '').trim();

  if (
    lostBrand.length > 0 &&
    foundBrand.length > 0
  ) {
    maxAvailablePoints += 15;

    const brandSim = getJaroWinklerSimilarity(
      lostBrand,
      foundBrand
    );

    achievedPoints += brandSim * 15;
  }

  /*
  |--------------------------------------------------------------------------
  | Color = 10
  |--------------------------------------------------------------------------
  */

  const lostColor = (lostReport.color || '').trim();
  const foundColor = (foundReport.color || '').trim();

  if (
    lostColor.length > 0 &&
    foundColor.length > 0
  ) {
    maxAvailablePoints += 10;

    const colorSim = getJaroWinklerSimilarity(
      lostColor,
      foundColor
    );

    achievedPoints += colorSim * 10;
  }

  /*
  |--------------------------------------------------------------------------
  | Location = 20
  |--------------------------------------------------------------------------
  */

  maxAvailablePoints += 20;

  const areaSim = getJaroWinklerSimilarity(
    lostReport.location?.area || '',
    foundReport.location?.area || ''
  );

  const distanceMeters = calculateDistanceMeters(
    lostReport.location?.coordinates,
    foundReport.location?.coordinates
  );

  const areaScore = areaSim * 20;

  let distanceScore = 0;

  if (distanceMeters !== null) {
    if (distanceMeters <= 500) {
      distanceScore = 20;
    } else if (distanceMeters <= 2000) {
      distanceScore = 12;
    } else if (distanceMeters <= 5000) {
      distanceScore = 5;
    }
  }

  const locationPoints = Math.max(
    areaScore,
    distanceScore
  );

  achievedPoints += locationPoints;

  /*
  |--------------------------------------------------------------------------
  | Time = 20
  |--------------------------------------------------------------------------
  */

  maxAvailablePoints += 20;

  const lostTime = new Date(
    lostReport.lostAt || lostReport.createdAt
  ).getTime();

  const foundTime = new Date(
    foundReport.foundAt || foundReport.createdAt
  ).getTime();

  const diffHours =
    Math.abs(lostTime - foundTime) /
    (1000 * 60 * 60);

  let timePoints = 0;

  if (diffHours <= 24) {
    timePoints = 20;
  } else if (diffHours <= 72) {
    timePoints = 15;
  } else if (diffHours <= 168) {
    timePoints = 10;
  } else if (diffHours <= 336) {
    timePoints = 5;
  }

  achievedPoints += timePoints;

  /*
  |--------------------------------------------------------------------------
  | Dynamic Normalization
  |--------------------------------------------------------------------------
  */

  if (maxAvailablePoints <= 0) {
    return 0;
  }

  const normalizedScore = Math.round(
    (achievedPoints / maxAvailablePoints) * 100
  );

  return Math.min(
    100,
    Math.max(0, normalizedScore)
  );
};

/*
|--------------------------------------------------------------------------
| Candidate Time Window
|--------------------------------------------------------------------------
|
| The scoring system gives a maximum useful time range of 14 days
| (336 hours). Reports outside that range are not candidates.
|
*/

const isWithinMatchingTimeWindow = (
  lostReport,
  foundReport
) => {
  const lostTime = new Date(
    lostReport.lostAt || lostReport.createdAt
  ).getTime();

  const foundTime = new Date(
    foundReport.foundAt || foundReport.createdAt
  ).getTime();

  const diffHours =
    Math.abs(lostTime - foundTime) /
    (1000 * 60 * 60);

  return diffHours <= 336;
};

/*
|--------------------------------------------------------------------------
| Run Matching
|--------------------------------------------------------------------------
|
| LOST:
| ACTIVE / MATCH_FOUND
|       ↓
| candidate FOUND reports
|
| FOUND:
| REPORTED / AWAITING_HANDOVER / WITH_RECTOR
|       ↓
| candidate LOST reports
|
| CLAIM_IN_PROGRESS reports are excluded because ownership
| verification is already underway.
|
*/

const runMatchingForReport = async (
  reportType,
  reportId
) => {
  const createdMatches = [];

  /*
  |--------------------------------------------------------------------------
  | LOST → FOUND
  |--------------------------------------------------------------------------
  */

  if (reportType === 'LOST') {
    const lostReport = await LostReport.findById(
      reportId
    );

    if (!lostReport) {
      return [];
    }

    /*
    |--------------------------------------------------------------------------
    | Cancelled / Closed / Claim Processing Protection
    |--------------------------------------------------------------------------
    */

    if (
      lostReport.cancellation?.isCancelled ||
      ![
        LOST_STATUS.ACTIVE,
        LOST_STATUS.MATCH_FOUND
      ].includes(lostReport.status)
    ) {
      return [];
    }

    /*
    |--------------------------------------------------------------------------
    | Candidate Filtering
    |--------------------------------------------------------------------------
    |
    | Same category is filtered in MongoDB.
    | Cancelled reports excluded.
    | Only relevant lifecycle states are considered.
    |
    */

    const candidates = await FoundReport.find({
      category: lostReport.category,

      'cancellation.isCancelled': {
        $ne: true
      },

      status: {
        $in: [
          FOUND_STATUS.REPORTED,
          FOUND_STATUS.AWAITING_HANDOVER,
          FOUND_STATUS.WITH_RECTOR
        ]
      },

      foundAt: {
        $gte: new Date(
          new Date(
            lostReport.lostAt ||
              lostReport.createdAt
          ).getTime() -
            336 * 60 * 60 * 1000
        ),
        $lte: new Date(
          new Date(
            lostReport.lostAt ||
              lostReport.createdAt
          ).getTime() +
            336 * 60 * 60 * 1000
        )
      }
    });

    for (const foundReport of candidates) {
      if (
        !isWithinMatchingTimeWindow(
          lostReport,
          foundReport
        )
      ) {
        continue;
      }

      const score = calculateMatchScore(
        lostReport,
        foundReport
      );

      /*
      |--------------------------------------------------------------------------
      | Match Threshold >= 70
      |--------------------------------------------------------------------------
      */

      if (score >= 70) {
        const match = await createOrUpdateMatch(
          lostReport,
          foundReport,
          score
        );

        if (match) {
          createdMatches.push(match);
        }
      }
    }
  }

  /*
  |--------------------------------------------------------------------------
  | FOUND → LOST
  |--------------------------------------------------------------------------
  */

  else if (reportType === 'FOUND') {
    const foundReport = await FoundReport.findById(
      reportId
    );

    if (!foundReport) {
      return [];
    }

    /*
    |--------------------------------------------------------------------------
    | Cancelled / Closed / Claim Processing Protection
    |--------------------------------------------------------------------------
    */

    if (
      foundReport.cancellation?.isCancelled ||
      ![
        FOUND_STATUS.REPORTED,
        FOUND_STATUS.AWAITING_HANDOVER,
        FOUND_STATUS.WITH_RECTOR
      ].includes(foundReport.status)
    ) {
      return [];
    }

    /*
    |--------------------------------------------------------------------------
    | Candidate Filtering
    |--------------------------------------------------------------------------
    */

    const candidates = await LostReport.find({
      category: foundReport.category,

      'cancellation.isCancelled': {
        $ne: true
      },

      status: {
        $in: [
          LOST_STATUS.ACTIVE,
          LOST_STATUS.MATCH_FOUND
        ]
      },

      lostAt: {
        $gte: new Date(
          new Date(
            foundReport.foundAt ||
              foundReport.createdAt
          ).getTime() -
            336 * 60 * 60 * 1000
        ),
        $lte: new Date(
          new Date(
            foundReport.foundAt ||
              foundReport.createdAt
          ).getTime() +
            336 * 60 * 60 * 1000
        )
      }
    });

    for (const lostReport of candidates) {
      if (
        !isWithinMatchingTimeWindow(
          lostReport,
          foundReport
        )
      ) {
        continue;
      }

      const score = calculateMatchScore(
        lostReport,
        foundReport
      );

      if (score >= 70) {
        const match = await createOrUpdateMatch(
          lostReport,
          foundReport,
          score
        );

        if (match) {
          createdMatches.push(match);
        }
      }
    }
  }

  return createdMatches;
};

/*
|--------------------------------------------------------------------------
| Create / Update Match
|--------------------------------------------------------------------------
*/

const createOrUpdateMatch = async (
  lostReport,
  foundReport,
  score
) => {
  let match = await Match.findOne({
    lostReportId: lostReport._id,
    foundReportId: foundReport._id
  });

  /*
  |--------------------------------------------------------------------------
  | Existing Match
  |--------------------------------------------------------------------------
  */

  if (match) {
    /*
    |--------------------------------------------------------------------------
    | Do not revive INVALIDATED / RESOLVED matches.
    |--------------------------------------------------------------------------
    */

    if (
      [
        MATCH_STATUS.INVALIDATED,
        MATCH_STATUS.RESOLVED
      ].includes(match.status)
    ) {
      return null;
    }

    match.matchScore = score;

    await match.save();

    return match;
  }

  /*
  |--------------------------------------------------------------------------
  | Create New Active Match
  |--------------------------------------------------------------------------
  */

  match = await Match.create({
    lostReportId: lostReport._id,
    foundReportId: foundReport._id,
    matchScore: score,
    status: MATCH_STATUS.ACTIVE
  });

  /*
  |--------------------------------------------------------------------------
  | Lost Report Lifecycle
  |--------------------------------------------------------------------------
  |
  | ACTIVE → MATCH_FOUND
  |
  */

  if (lostReport.status === LOST_STATUS.ACTIVE) {
    lostReport.status = LOST_STATUS.MATCH_FOUND;
    await lostReport.save();
  }

  /*
  |--------------------------------------------------------------------------
  | Notify Lost Report Owner
  |--------------------------------------------------------------------------
  */

  await Notification.create({
    userId: lostReport.reportedBy,
    type: NOTIFICATION_TYPES.MATCH_FOUND,
    title: 'Possible Item Match Discovered',
    message: `A possible match (${score}% confidence) for your lost item "${lostReport.itemName}" has been found!`,
    relatedId: match._id
  });

  /*
  |--------------------------------------------------------------------------
  | Notify Found Report Owner
  |--------------------------------------------------------------------------
  */

  await Notification.create({
    userId: foundReport.reportedBy,
    type: NOTIFICATION_TYPES.MATCH_FOUND,
    title: 'Possible Match Discovered',
    message: `Your found item report "${foundReport.itemName}" matches a reported lost item (${score}% score).`,
    relatedId: match._id
  });

  return match;
};

module.exports = {
  getJaroWinklerSimilarity,
  calculateDistanceMeters,
  calculateMatchScore,
  runMatchingForReport
};