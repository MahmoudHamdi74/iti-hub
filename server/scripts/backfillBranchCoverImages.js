/**
 * Backfill missing branch cover images.
 *
 * For every branch whose coverImage is empty, borrow the coverImage of the
 * "nearest" branch, in order of preference:
 *   1. another branch sharing a location/name token (same city/governorate)
 *   2. another branch of the same type (core/extension)
 *   3. any branch that has a coverImage
 *
 * Usage:
 *   node scripts/backfillBranchCoverImages.js --dry   # print planned changes
 *   node scripts/backfillBranchCoverImages.js         # apply to the DB
 *
 * Connects with DB_URL from server/.env (Atlas by default).
 */
require("dotenv").config();
const mongoose = require("mongoose");
const Branch = require("../models/Branch");

const STOPWORDS = new Set([
  "iti", "branch", "branches", "extension", "core", "the", "of", "in", "at",
  "and", "new", "main", "center", "centre", "campus", "governorate",
]);

function tokens(str) {
  return String(str || "")
    .toLowerCase()
    .split(/[^a-z\u0600-\u06FF]+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
}

function pickNearbyBranch(branch, withImage) {
  const myTokens = new Set([...tokens(branch.name), ...tokens(branch.location)]);

  // 1) Same city/governorate (shared token in name or location)
  const sameArea = withImage.find((b) =>
    [...tokens(b.name), ...tokens(b.location)].some((w) => myTokens.has(w))
  );
  if (sameArea) return { donor: sameArea, reason: "same-area" };

  // 2) Same branch type
  const sameType = withImage.find((b) => b.type === branch.type);
  if (sameType) return { donor: sameType, reason: "same-type" };

  // 3) Any branch with an image
  return { donor: withImage[0], reason: "fallback" };
}

async function main() {
  const dryRun = process.argv.includes("--dry");

  await mongoose.connect(process.env.DB_URL || "mongodb://127.0.0.1:27017/iti-hub");

  const branches = await Branch.find({}).lean();
  const withImage = branches.filter((b) => b.coverImage);
  const missing = branches.filter((b) => !b.coverImage);

  console.log(`Branches: ${branches.length} total, ${withImage.length} with image, ${missing.length} missing`);

  if (missing.length === 0) {
    console.log("Nothing to backfill.");
    await mongoose.disconnect();
    return;
  }

  let updated = 0;
  for (const branch of missing) {
    if (withImage.length === 0) {
      console.log(`- ${branch.name}: no donor available (no branch has an image)`);
      continue;
    }
    const { donor, reason } = pickNearbyBranch(branch, withImage);
    console.log(`- ${branch.name} ← ${donor.name} (${reason})`);

    if (!dryRun) {
      await Branch.updateOne(
        { _id: branch._id },
        { $set: { coverImage: donor.coverImage } }
      );
      updated += 1;
    }
  }

  console.log(dryRun ? "Dry run — nothing written." : `Done — ${updated} branch(es) updated.`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("Backfill failed:", err.message);
  process.exit(1);
});
