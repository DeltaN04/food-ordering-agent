import dotenv from "dotenv";
import { runOrder } from "./agent";
import { listPlatforms } from "./registry";

dotenv.config();

function arg(name: string, fallback?: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  if (i >= 0 && process.argv[i + 1]) return process.argv[i + 1];
  return fallback;
}

async function main() {
  const cmd = process.argv[2];
  if (cmd === "platforms") {
    console.log(listPlatforms());
    return;
  }
  if (cmd !== "order") {
    console.log(`Usage:
  npm run order -- --platform swiggy --restaurant "McDonald's" --dish "McAloo Tikki Burger + Coke Combo" --size medium --qty 1 --address Casual --payment upi
  npm run order -- --platform zomato ... (adapter stub — see src/platforms/zomato.ts)`);
    return;
  }
  const platform = arg("platform");
  const restaurant = arg("restaurant");
  const dish = arg("dish");
  if (!platform || !restaurant || !dish) throw new Error("--platform, --restaurant and --dish are required");
  await runOrder(
    {
      platform,
      restaurantQuery: restaurant,
      dishQuery: dish,
      size: arg("size"),
      qty: Number(arg("qty", "1")),
      addressLabel: arg("address"),
      payment: (arg("payment", "upi") as "upi"),
      stopBeforePay: true,
    },
    (p) => console.log(`[${p.stage}] ${p.detail}`)
  );
}

main().catch((e) => {
  console.error("FAILED:", e.message);
  process.exit(1);
});
