const Branch = require('../models/Branch');

const ignored = new Set(['iti', 'branch', 'branches', 'extension', 'core', 'the', 'new', 'main', 'center', 'centre', 'campus', 'governorate', 'فرع', 'معهد', 'تكنولوجيا', 'المعلومات']);
const tokens = value => String(value || '').toLowerCase().split(/[^a-z\u0600-\u06ff]+/).filter(word => word.length > 2 && !ignored.has(word));

// Resolve from all branches, not just the current search result/page. No DB
// mutation is needed, and direct branch URLs receive the same fallback.
async function addBranchCovers(branches) {
  if (!branches.some(branch => !branch.coverImage)) return branches;
  const donors = await Branch.find({ coverImage: { $type: 'string', $ne: '' } })
    .select('name location type coverImage').sort({ name: 1 }).lean();
  return branches.map(branch => {
    if (branch.coverImage) return branch;
    const area = new Set([...tokens(branch.name), ...tokens(branch.location)]);
    const donor = donors.find(candidate => [...tokens(candidate.name), ...tokens(candidate.location)].some(word => area.has(word)))
      || donors.find(candidate => candidate.type === branch.type) || donors[0];
    return { ...branch, coverImage: donor?.coverImage || '' };
  });
}

module.exports = { addBranchCovers };
