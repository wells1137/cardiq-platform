import { seedDatabase } from "./sportsDataService";

console.log("Starting seed process...");
seedDatabase().then((res) => {
  console.log("Seed successful:", res);
  process.exit(0);
}).catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
