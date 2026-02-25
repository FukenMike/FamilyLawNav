// canonical list of states for pack generation.  This array is intentionally
// static so the builder does not rely on runtime parsing of TypeScript files,
// ensuring a clean `npm ci` install will succeed.  Include DC if supported.
exports.PACK_OUTPUT_DIR = "public/packs";

exports.STATES = [
  "AK","AL","AR","AZ","CA","CO","CT","DE","FL","GA",
  "HI","IA","ID","IL","IN","KS","KY","LA","MA","MD",
  "ME","MI","MN","MO","MS","MT","NC","ND","NE","NH",
  "NJ","NM","NV","NY","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VA","VT","WA","WI","WV","WY",
  "DC" // optional
];

// seeds may still be managed in source files; no global mapping needed here.
