const mongoose = require('mongoose');
const LostReport = require('../../models/LostReport');
const FoundReport = require('../../models/FoundReport');
const Claim = require('../../models/Claim');
const { LOST_STATUS, FOUND_STATUS, CLAIM_STATUS } = require('../../constants');

const getStudentCampusAnalytics = async () => {
  const totalLost = await LostReport.countDocuments();
  const totalFound = await FoundReport.countDocuments();

  const totalRecoveredLost = await LostReport.countDocuments({
    status: LOST_STATUS.RECOVERED
  });

  const totalReturnedFound = await FoundReport.countDocuments({
    status: FOUND_STATUS.RETURNED
  });

  // Recovery rate is calculated using recovered Lost reports.
  const totalRecovered = totalRecoveredLost;

  const recoveryRate =
    totalLost > 0
      ? parseFloat(((totalRecovered / totalLost) * 100).toFixed(2))
      : 0;

  // Category breakdown for Lost and Found
  const lostByCategory = await LostReport.aggregate([
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 }
      }
    },
    {
      $sort: {
        count: -1
      }
    }
  ]);

  const foundByCategory = await FoundReport.aggregate([
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 }
      }
    },
    {
      $sort: {
        count: -1
      }
    }
  ]);

  // Location / Area breakdown
  const lostByArea = await LostReport.aggregate([
    {
      $group: {
        _id: '$location.area',
        count: { $sum: 1 }
      }
    },
    {
      $sort: {
        count: -1
      }
    },
    {
      $limit: 10
    }
  ]);

  const foundByArea = await FoundReport.aggregate([
    {
      $group: {
        _id: '$location.area',
        count: { $sum: 1 }
      }
    },
    {
      $sort: {
        count: -1
      }
    },
    {
      $limit: 10
    }
  ]);

  // Monthly Lost vs Found trends (Last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const monthlyLost = await LostReport.aggregate([
    {
      $match: {
        createdAt: {
          $gte: sixMonthsAgo
        }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        count: { $sum: 1 }
      }
    },
    {
      $sort: {
        '_id.year': 1,
        '_id.month': 1
      }
    }
  ]);

  const monthlyFound = await FoundReport.aggregate([
    {
      $match: {
        createdAt: {
          $gte: sixMonthsAgo
        }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        count: { $sum: 1 }
      }
    },
    {
      $sort: {
        '_id.year': 1,
        '_id.month': 1
      }
    }
  ]);

  // Hostel-wise Lost vs Found breakdown
  const hostelLost = await LostReport.aggregate([
    {
      $lookup: {
        from: 'hostels',
        localField: 'hostelId',
        foreignField: '_id',
        as: 'hostel'
      }
    },
    {
      $unwind: '$hostel'
    },
    {
      $group: {
        _id: '$hostel.name',
        lostCount: { $sum: 1 }
      }
    }
  ]);

  return {
    summary: {
      totalLost,
      totalFound,
      totalRecovered,
      recoveryRate
    },

    categoryBreakdown: {
      lost: lostByCategory,
      found: foundByCategory
    },

    locationBreakdown: {
      lost: lostByArea,
      found: foundByArea
    },

    monthlyTrends: {
      lost: monthlyLost,
      found: monthlyFound
    },

    hostelBreakdown: hostelLost
  };
};

const getRectorHostelAnalytics = async (rectorHostelId) => {
  if (!rectorHostelId) {
    const error = new Error(
      'Rector is not assigned to any hostel.'
    );
    error.statusCode = 400;
    throw error;
  }

  const hostelIdObj = new mongoose.Types.ObjectId(rectorHostelId);

  const totalLost = await LostReport.countDocuments({
    hostelId: hostelIdObj
  });

  const totalFound = await FoundReport.countDocuments({
    hostelId: hostelIdObj
  });

  const totalRecoveredLost = await LostReport.countDocuments({
    hostelId: hostelIdObj,
    status: LOST_STATUS.RECOVERED
  });

  const totalReturnedFound = await FoundReport.countDocuments({
    hostelId: hostelIdObj,
    status: FOUND_STATUS.RETURNED
  });

  /*
   * Recovery rate is based on Lost reports.
   *
   * Lost report:
   * ACTIVE -> MATCH_FOUND -> CLAIM_IN_PROGRESS
   * -> RECOVERED -> CLOSED
   *
   * Found report:
   * WITH_RECTOR -> CLAIM_IN_PROGRESS
   * -> RETURNED -> CLOSED
   *
   * Lost and Found are separate entities, so we should not
   * add their recovered counts together.
   */
  const totalRecovered = totalRecoveredLost;

  const recoveryRate =
    totalLost > 0
      ? parseFloat(((totalRecovered / totalLost) * 100).toFixed(2))
      : 0;

  // Pending claims for this hostel's found items
  const pendingClaims = await Claim.aggregate([
    {
      $lookup: {
        from: 'foundreports',
        localField: 'foundReportId',
        foreignField: '_id',
        as: 'foundReport'
      }
    },
    {
      $unwind: '$foundReport'
    },
    {
      $match: {
        'foundReport.hostelId': hostelIdObj,
        status: {
          $in: [
            CLAIM_STATUS.SUBMITTED,
            CLAIM_STATUS.UNDER_VERIFICATION
          ]
        }
      }
    },
    {
      $count: 'count'
    }
  ]);

  const pendingClaimsCount =
    pendingClaims[0] ? pendingClaims[0].count : 0;

  // Unresolved reports
  const unresolvedLost = await LostReport.countDocuments({
    hostelId: hostelIdObj,
    status: {
      $in: [
        LOST_STATUS.ACTIVE,
        LOST_STATUS.MATCH_FOUND
      ]
    }
  });

  const unresolvedFound = await FoundReport.countDocuments({
    hostelId: hostelIdObj,
    status: {
      $in: [
        FOUND_STATUS.REPORTED,
        FOUND_STATUS.AWAITING_HANDOVER,
        FOUND_STATUS.WITH_RECTOR
      ]
    }
  });

  // Category breakdown for assigned hostel
  const categoryBreakdown = await FoundReport.aggregate([
    {
      $match: {
        hostelId: hostelIdObj
      }
    },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 }
      }
    },
    {
      $sort: {
        count: -1
      }
    }
  ]);

  // Location breakdown for assigned hostel
  const locationBreakdown = await FoundReport.aggregate([
    {
      $match: {
        hostelId: hostelIdObj
      }
    },
    {
      $group: {
        _id: '$location.area',
        count: { $sum: 1 }
      }
    },
    {
      $sort: {
        count: -1
      }
    }
  ]);

  // Monthly trend for assigned hostel
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(
    sixMonthsAgo.getMonth() - 6
  );

  const monthlyLost = await LostReport.aggregate([
    {
      $match: {
        hostelId: hostelIdObj,
        createdAt: {
          $gte: sixMonthsAgo
        }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        count: { $sum: 1 }
      }
    },
    {
      $sort: {
        '_id.year': 1,
        '_id.month': 1
      }
    }
  ]);

  const monthlyFound = await FoundReport.aggregate([
    {
      $match: {
        hostelId: hostelIdObj,
        createdAt: {
          $gte: sixMonthsAgo
        }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        count: { $sum: 1 }
      }
    },
    {
      $sort: {
        '_id.year': 1,
        '_id.month': 1
      }
    }
  ]);

  // Recent activity in assigned hostel
  const recentLost = await LostReport.find({
    hostelId: hostelIdObj
  })
    .sort({
      createdAt: -1
    })
    .limit(5)
    .populate(
      'reportedBy',
      'name studentId'
    );

  const recentFound = await FoundReport.find({
    hostelId: hostelIdObj
  })
    .sort({
      createdAt: -1
    })
    .limit(5)
    .populate(
      'reportedBy',
      'name studentId'
    );

  return {
    summary: {
      totalLost,
      totalFound,
      totalRecovered,
      pendingClaims: pendingClaimsCount,
      unresolved:
        unresolvedLost + unresolvedFound,
      recoveryRate
    },

    categoryBreakdown,

    locationBreakdown,

    monthlyTrends: {
      lost: monthlyLost,
      found: monthlyFound
    },

    recentActivity: {
      lost: recentLost,
      found: recentFound
    }
  };
};

module.exports = {
  getStudentCampusAnalytics,
  getRectorHostelAnalytics
};