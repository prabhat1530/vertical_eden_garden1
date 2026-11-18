require('dotenv').config();
const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Slot = require('../models/Slot');
const { SLOT_CAPACITY, toISTDateString } = require('../config/slots');

// ─────────────────────────────────────────────
// One-time migration: create Slot records for bookings made before slot-based
// booking existed, so new customers can't book on top of them.
//
//   node scripts/backfill-slots.js           → dry run (prints, writes nothing)
//   node scripts/backfill-slots.js --apply   → writes the Slot records
//
// Only upcoming confirmed/completed bookings claim a slot. Old unpaid
// "pending" bookings were abandoned checkouts and are left alone.
// Safe to run more than once ($addToSet never adds the same booking twice).
// ─────────────────────────────────────────────

const APPLY = process.argv.includes('--apply');

(async () => {
    await mongoose.connect(process.env.MONGO_URI);
    await Slot.init();

    const today = toISTDateString(new Date());
    const bookings = await Booking.find({
        status: { $in: ['confirmed', 'completed'] },
        preferredDate: { $gte: today },
    }).sort({ preferredDate: 1 }).lean();

    // Group bookings by slot.
    const groups = new Map();
    for (const b of bookings) {
        const key = `${b.preferredDate}|${b.preferredTime}`;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(b);
    }

    console.log(`\n${APPLY ? 'APPLYING' : 'DRY RUN'} — ${bookings.length} upcoming paid booking(s) in ${groups.size} slot(s)\n`);

    let overbooked = 0;
    for (const [key, list] of groups) {
        const [date, time] = key.split('|');
        const flag = list.length > SLOT_CAPACITY ? '  ⚠️  ALREADY DOUBLE-BOOKED' : '';
        if (flag) overbooked += 1;
        console.log(`${date}  ${time.padEnd(18)} ${list.length} booking(s)${flag}`);
        if (flag) list.forEach((b) => console.log(`      - ${b._id}  ${b.serviceName}`));

        if (APPLY) {
            await Slot.updateOne(
                { date, time },
                {
                    $setOnInsert: { capacity: SLOT_CAPACITY },
                    $addToSet: { bookings: { $each: list.map((b) => b._id) } },
                },
                { upsert: true }
            );
            // Recount from the bookings array so bookedCount is exact.
            await Slot.updateOne({ date, time }, [{ $set: { bookedCount: { $size: '$bookings' } } }]);
        }
    }

    console.log(`\n${overbooked} slot(s) were already double-booked before this change — please contact those customers.`);
    if (!APPLY) console.log('Nothing was written. Re-run with --apply to save.\n');

    await mongoose.disconnect();
})().catch(async (err) => {
    console.error('❌ Backfill failed:', err.message);
    await mongoose.disconnect();
    process.exit(1);
});
