const mongoose = require('mongoose');

const env = require('../config/env');

const User = require('../models/User');
const Hostel = require('../models/Hostel');
const LostReport = require('../models/LostReport');
const FoundReport = require('../models/FoundReport');
const Match = require('../models/Match');
const Claim = require('../models/Claim');
const Notification = require('../models/Notification');

const {
  ROLES,
  CATEGORIES,
  LOST_STATUS,
  FOUND_STATUS,
  MATCH_STATUS,
  CLAIM_STATUS,
  NOTIFICATION_TYPES
} = require('../constants');

const { calculateMatchScore } = require('../services/matching/matchingEngine');


const seedData = async () => {
  try {
    console.log('[Seed] Connecting to MongoDB...');

    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000
    });

    console.log('[Seed] Connected to MongoDB.');

    console.log('[Seed] Clearing existing development data...');

    await User.deleteMany({});
    await Hostel.deleteMany({});
    await LostReport.deleteMany({});
    await FoundReport.deleteMany({});
    await Match.deleteMany({});
    await Claim.deleteMany({});
    await Notification.deleteMany({});


    // =========================================================
    // HOSTELS
    // =========================================================

    console.log('[Seed] Creating 2 Hostels...');

    const hostel1 = await Hostel.create({
      name: 'Shivaji Hostel',
      capacity: 250,
      location: {
        type: 'Point',
        coordinates: [73.8567, 18.5204],
        area: 'West Campus Block A'
      }
    });

    const hostel2 = await Hostel.create({
      name: 'Tagore Hostel',
      capacity: 200,
      location: {
        type: 'Point',
        coordinates: [73.858, 18.522],
        area: 'East Campus Block B'
      }
    });


    // =========================================================
    // RECTORS
    // =========================================================

    console.log('[Seed] Creating Rectors...');

    const rector1 = await User.create({
      name: 'Dr. Suresh Deshmukh',
      email: 'rector.shivaji@fikrnot.edu',
      password: 'Rector123!',
      phone: '9876543210',
      role: ROLES.RECTOR,
      employeeId: 'EMP-SHIV-01',
      designation: 'Senior Hostel Rector',
      department: 'Student Affairs',
      hostelId: hostel1._id,
      emergencyContact: '9876543211'
    });

    const rector2 = await User.create({
      name: 'Prof. Anjali Verma',
      email: 'rector.tagore@fikrnot.edu',
      password: 'Rector123!',
      phone: '9876543220',
      role: ROLES.RECTOR,
      employeeId: 'EMP-TAG-02',
      designation: 'Hostel Rector',
      department: 'Campus Administration',
      hostelId: hostel2._id,
      emergencyContact: '9876543221'
    });

    hostel1.rectorId = rector1._id;
    await hostel1.save();

    hostel2.rectorId = rector2._id;
    await hostel2.save();


    // =========================================================
    // STUDENTS
    // =========================================================

    console.log('[Seed] Creating Students...');

    const student1 = await User.create({
      name: 'Rahul Sharma',
      email: 'rahul.sharma@fikrnot.edu',
      password: 'Student123!',
      phone: '9123456781',
      role: ROLES.STUDENT,
      studentId: 'STU-2024-001',
      course: 'B.Tech',
      department: 'Computer Science',
      year: 3,
      semester: 5,
      hostelId: hostel1._id,
      roomNumber: 'A-204',
      address: 'Pune, Maharashtra',
      parentGuardian: {
        name: 'Ramesh Sharma',
        phone: '9123456700',
        email: 'ramesh@gmail.com'
      },
      emergencyContact: '9123456700'
    });

    const student2 = await User.create({
      name: 'Priya Patel',
      email: 'priya.patel@fikrnot.edu',
      password: 'Student123!',
      phone: '9123456782',
      role: ROLES.STUDENT,
      studentId: 'STU-2024-002',
      course: 'B.Tech',
      department: 'Information Technology',
      year: 2,
      semester: 3,
      hostelId: hostel1._id,
      roomNumber: 'A-108',
      address: 'Ahmedabad, Gujarat',
      parentGuardian: {
        name: 'Kirit Patel',
        phone: '9123456701',
        email: 'kirit@gmail.com'
      },
      emergencyContact: '9123456701'
    });

    const student3 = await User.create({
      name: 'Amit Kumar',
      email: 'amit.kumar@fikrnot.edu',
      password: 'Student123!',
      phone: '9123456783',
      role: ROLES.STUDENT,
      studentId: 'STU-2024-003',
      course: 'M.Tech',
      department: 'Mechanical Engineering',
      year: 1,
      semester: 1,
      hostelId: hostel2._id,
      roomNumber: 'B-305',
      address: 'Patna, Bihar',
      parentGuardian: {
        name: 'Sunil Kumar',
        phone: '9123456702',
        email: 'sunil@gmail.com'
      },
      emergencyContact: '9123456702'
    });

    const student4 = await User.create({
      name: 'Sneha Kulkarni',
      email: 'sneha.kulkarni@fikrnot.edu',
      password: 'Student123!',
      phone: '9123456784',
      role: ROLES.STUDENT,
      studentId: 'STU-2024-004',
      course: 'B.Tech',
      department: 'Electronics',
      year: 4,
      semester: 7,
      hostelId: hostel2._id,
      roomNumber: 'B-102',
      address: 'Nagpur, Maharashtra',
      parentGuardian: {
        name: 'Vijay Kulkarni',
        phone: '9123456703',
        email: 'vijay@gmail.com'
      },
      emergencyContact: '9123456703'
    });


    // =========================================================
    // LOST & FOUND REPORTS
    // =========================================================

    console.log('[Seed] Creating Lost & Found Reports...');

    const lost1 = await LostReport.create({
      reportedBy: student1._id,
      hostelId: hostel1._id,
      category: CATEGORIES.includes('Electronics')
        ? 'Electronics'
        : CATEGORIES[0],
      itemName: 'Dell XPS 15 Laptop',
      brand: 'Dell',
      color: 'Silver',
      description:
        'Silver metal finish, sticker of Octocat on back cover, 15-inch screen.',
      images: [
        {
          url: 'http://localhost:5000/uploads/dell_xps.jpg',
          publicId: 'demo_dell_xps'
        }
      ],
      location: {
        type: 'Point',
        coordinates: [73.8568, 18.5205],
        area: 'Central Library Reading Hall'
      },
      lostAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      status: LOST_STATUS.MATCH_FOUND
    });

    const found1 = await FoundReport.create({
      reportedBy: student2._id,
      hostelId: hostel1._id,
      category: 'Electronics',
      itemName: 'Dell Laptop Silver',
      brand: 'Dell',
      color: 'Silver',
      description:
        'Found a silver Dell laptop left on table 4 in Central Library reading hall.',
      images: [
        {
          url: 'http://localhost:5000/uploads/dell_found.jpg',
          publicId: 'demo_dell_found'
        }
      ],
      location: {
        type: 'Point',
        coordinates: [73.8569, 18.5206],
        area: 'Central Library Reading Hall'
      },
      foundAt: new Date(Date.now() - 20 * 60 * 60 * 1000),
      status: FOUND_STATUS.WITH_RECTOR,
      rectorId: rector1._id,
      receivedAt: new Date(Date.now() - 10 * 60 * 60 * 1000)
    });

    const matchScore1 = calculateMatchScore(lost1, found1);

    const match1 = await Match.create({
      lostReportId: lost1._id,
      foundReportId: found1._id,
      matchScore: matchScore1 >= 70 ? matchScore1 : 85,
      status: MATCH_STATUS.ACTIVE
    });

    const claim1 = await Claim.create({
      foundReportId: found1._id,
      lostReportId: lost1._id,
      claimantId: student1._id,
      evidence:
        'Serial Number: CN-0XPS15-9921. Password to unlock screen is my student ID. Sticker of Octocat on lid.',
      status: CLAIM_STATUS.UNDER_VERIFICATION,
      reviewedBy: rector1._id,
      reviewedAt: new Date(Date.now() - 5 * 60 * 60 * 1000)
    });


    const lost2 = await LostReport.create({
      reportedBy: student3._id,
      hostelId: hostel2._id,
      category: 'ID/Cards',
      itemName: 'College ID Card - Amit Kumar',
      brand: 'Institute ID',
      color: 'Blue/White',
      description:
        'M.Tech Mechanical ID card with blue lanyard.',
      images: [],
      location: {
        type: 'Point',
        coordinates: [73.8581, 18.5221],
        area: 'Hostel Mess Canteen'
      },
      lostAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
      status: LOST_STATUS.RECOVERED
    });

    const found2 = await FoundReport.create({
      reportedBy: student4._id,
      hostelId: hostel2._id,
      category: 'ID/Cards',
      itemName: 'Student ID Card Amit',
      brand: 'Institute ID',
      color: 'Blue',
      description:
        'Found student ID card near mess counter.',
      images: [],
      location: {
        type: 'Point',
        coordinates: [73.8582, 18.5222],
        area: 'Hostel Mess Canteen'
      },
      foundAt: new Date(Date.now() - 40 * 60 * 60 * 1000),
      status: FOUND_STATUS.RETURNED,
      rectorId: rector2._id,
      receivedAt: new Date(Date.now() - 30 * 60 * 60 * 1000)
    });

    const claim2 = await Claim.create({
      foundReportId: found2._id,
      lostReportId: lost2._id,
      claimantId: student3._id,
      evidence:
        'Student ID card bears my name Amit Kumar and photo.',
      status: CLAIM_STATUS.APPROVED,
      reviewedBy: rector2._id,
      reviewedAt: new Date(Date.now() - 25 * 60 * 60 * 1000)
    });


    const lost3 = await LostReport.create({
      reportedBy: student2._id,
      hostelId: hostel1._id,
      category: 'Keys',
      itemName: 'Room Key Ring with Iron Man Keychain',
      brand: '',
      color: 'Red/Metal',
      description:
        'Pair of two keys attached to a red Marvel Iron Man keychain.',
      images: [],
      location: {
        type: 'Point',
        coordinates: [73.8567, 18.5204],
        area: 'Shivaji Hostel Corridor'
      },
      lostAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
      status: LOST_STATUS.ACTIVE
    });

    const found3 = await FoundReport.create({
      reportedBy: student1._id,
      hostelId: hostel1._id,
      category: 'Bags',
      itemName: 'Black Wildcraft Backpack',
      brand: 'Wildcraft',
      color: 'Black',
      description:
        'Black backpack containing notebooks and blue umbrella.',
      images: [],
      location: {
        type: 'Point',
        coordinates: [73.857, 18.521],
        area: 'Food Court Plaza'
      },
      foundAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
      status: FOUND_STATUS.REPORTED
    });


    // =========================================================
    // NOTIFICATIONS
    // =========================================================

    console.log('[Seed] Creating Notifications...');

    await Notification.create({
      userId: student1._id,
      type: NOTIFICATION_TYPES.MATCH_FOUND,
      title: 'Possible Item Match Discovered',
      message: `A possible match (${matchScore1 || 85}% confidence) for your lost item "Dell XPS 15 Laptop" has been found!`,
      relatedId: match1._id
    });

    await Notification.create({
      userId: rector1._id,
      type: NOTIFICATION_TYPES.CLAIM_SUBMITTED,
      title: 'New Ownership Claim Submitted',
      message:
        'Student Rahul Sharma submitted a claim for found item "Dell Laptop Silver".',
      relatedId: claim1._id
    });

    await Notification.create({
      userId: student3._id,
      type: NOTIFICATION_TYPES.RECOVERY_CONFIRMED,
      title: 'Item Recovery Confirmed',
      message:
        'Your item "College ID Card - Amit Kumar" recovery was confirmed.',
      relatedId: claim2._id
    });


    // =========================================================
    // SUCCESS
    // =========================================================

    console.log('==================================================');
    console.log(' FIKRNOT SEED DATA CREATED SUCCESSFULLY!');
    console.log('==================================================');

    console.log('DEMO ACCOUNTS FOR TESTING:');
    console.log('--------------------------------------------------');

    console.log('RECTOR 1 (Shivaji Hostel):');
    console.log('  Email: rector.shivaji@fikrnot.edu');
    console.log('  Password: Rector123!');

    console.log('--------------------------------------------------');

    console.log('RECTOR 2 (Tagore Hostel):');
    console.log('  Email: rector.tagore@fikrnot.edu');
    console.log('  Password: Rector123!');

    console.log('--------------------------------------------------');

    console.log('STUDENT 1 (Rahul Sharma - Shivaji Hostel):');
    console.log('  Email: rahul.sharma@fikrnot.edu');
    console.log('  Password: Student123!');

    console.log('--------------------------------------------------');

    console.log('STUDENT 2 (Priya Patel - Shivaji Hostel):');
    console.log('  Email: priya.patel@fikrnot.edu');
    console.log('  Password: Student123!');

    console.log('--------------------------------------------------');

    console.log('STUDENT 3 (Amit Kumar - Tagore Hostel):');
    console.log('  Email: amit.kumar@fikrnot.edu');
    console.log('  Password: Student123!');

    console.log('==================================================');


    // Close MongoDB connection after seeding
    await mongoose.connection.close();

    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]', error);

    await mongoose.connection.close();

    process.exit(1);
  }
};

seedData();