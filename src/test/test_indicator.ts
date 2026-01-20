import {
  calculateEMA,
  calculateEMA20,
  calculateATR,
  calculateATRPercentage,
} from "../util/indicator.ts";
import { Candle } from "../model/candle.ts";
import { getCandles } from "../connect/market.ts";
// Test case 1: Simple number array with period 3
const prices = [10, 11, 12, 13, 14];
const period = 3;
console.log("--- Test 1: Number array, period 3 ---");
const ema3 = calculateEMA(prices, period);
console.log("Prices:", prices);
console.log("EMA3 Result:", ema3);
// Expected: [null, null, 11, 12, 13]

// Test case 2: Candle objects
console.log("\n--- Test 2: Candle objects, period 3 ---");
const candles = await getCandles("BTC-USDT-SWAP", "1H", 40);
console.log("Candles length:", candles);
const ema3Candles = calculateEMA(candles, 20);
console.log("EMA3 (Candles) Result:", ema3Candles);

// Test case 3: EMA20 with sufficient data
console.log("\n--- Test 3: EMA20 with 30 data points ---");
const data20 = Array.from({ length: 30 }, (_, i) => i + 1); // 1 to 30
const ema20 = calculateEMA20(data20);
console.log("Data length:", data20.length);
console.log("EMA20 length:", ema20.length);
console.log("EMA20 last value:", ema20[ema20.length - 1]);
console.log(
  "EMA20 first valid index (should be 19):",
  ema20.findIndex(x => x !== null),
);

// Test case 4: ATR and ATR%
console.log("\n--- Test 4: ATR and ATR% ---");
if (candles.length >= 14) {
  const atr = calculateATR(candles, 14);
  const atrp = calculateATRPercentage(candles, 14);

  // 查找第一个非 null 的索引
  const firstValidIdx = atr.findIndex(x => x !== null);
  console.log("First valid index:", firstValidIdx);

  // 如果第一个有效索引不是 null，打印后续几个值
  if (firstValidIdx !== -1) {
    console.log(
      "ATR (from first valid):",
      atr.slice(firstValidIdx, firstValidIdx + 5),
    );
    console.log(
      "ATR% (from first valid):",
      atrp.slice(firstValidIdx, firstValidIdx + 5),
    );

    // 验证 ATR% = (ATR / Close) * 100
    const testIdx = firstValidIdx;
    const expectedATRP = (atr[testIdx]! / candles[testIdx].close) * 100;
    console.log(
      `Validation at index ${testIdx}: Calculated ${atrp[testIdx]}, Expected ${expectedATRP}`,
    );
  } else {
    console.log("All ATR values are null. Data length:", candles.length);
  }
}
