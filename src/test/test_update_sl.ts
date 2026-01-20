import {
  openMarketOrderWithTPSL,
  updateStopLoss,
  closeAllPositions,
} from "../connect/trade.ts";
import { okxExchange } from "../connect/exchange.ts";
import logger from "../util/logger.ts";

async function testUpdateSL() {
  const symbol = "ETH-USDT-SWAP"; // Use ETH for test
  logger.info(`Starting SL Update Test for ${symbol}`);

  try {
    // 1. Get current price
    const tickerData = await okxExchange.request(
      "GET",
      "/api/v5/market/ticker",
      { instId: symbol },
    );
    if (!tickerData || tickerData.length === 0) {
      throw new Error("Failed to get ticker");
    }
    const lastPrice = parseFloat(tickerData[0].last);
    logger.info(`Current Price: ${lastPrice}`);

    // 2. Open Market Order with TP/SL
    // Buy Long
    // SL = -1%, TP = +2%
    const slPrice = (lastPrice * 0.99).toFixed(2);
    const tpPrice = (lastPrice * 1.02).toFixed(2);

    logger.info(`Placing Order with SL: ${slPrice}, TP: ${tpPrice}`);
    // Size '1' contract is usually very small (e.g. 0.01 ETH or 10 USD depending on contract)
    await openMarketOrderWithTPSL(symbol, "buy", "1", slPrice, tpPrice);

    logger.info("Order placed. Waiting 5s...");
    await new Promise(r => setTimeout(r, 5000));

    // 3. Update SL
    // New SL = -0.5%
    const newSlPrice = (lastPrice * 0.995).toFixed(2);
    logger.info(`Updating SL to: ${newSlPrice}`);

    const updateResult = await updateStopLoss(symbol, newSlPrice);
    if (updateResult) {
      logger.info(`Update Result: ${JSON.stringify(updateResult)}`);
    } else {
      logger.warn("Update returned null (no SL found?)");
    }

    logger.info("SL Updated. Waiting 5s to verify...");
    await new Promise(r => setTimeout(r, 5000));

    // 4. Verify
    const ocoOrders = await okxExchange.getPendingAlgoOrders(symbol, "oco");
    const condOrders = await okxExchange.getPendingAlgoOrders(
      symbol,
      "conditional",
    );
    const pending = [...ocoOrders, ...condOrders];

    // Find order with slTriggerPx
    const slOrder = pending.find(
      (o: any) => o.slTriggerPx && parseFloat(o.slTriggerPx) > 0,
    );

    if (slOrder) {
      logger.info(`Current Pending SL Price: ${slOrder.slTriggerPx}`);
      // Compare with small epsilon or exact string
      if (
        Math.abs(parseFloat(slOrder.slTriggerPx) - parseFloat(newSlPrice)) <
        0.0001
      ) {
        logger.info("VERIFICATION SUCCESS: SL Price matches new price.");
      } else {
        logger.error(
          `VERIFICATION FAILED: Expected ${newSlPrice}, got ${slOrder.slTriggerPx}`,
        );
      }
    } else {
      logger.warn("No pending SL order found after update.");
    }

    // 5. Clean up
    logger.info("Closing all positions...");
    await closeAllPositions(symbol);
    logger.info("Test Complete.");
  } catch (e) {
    logger.error("Test Failed:", e);
    // Attempt cleanup in case of error
    try {
      await closeAllPositions(symbol);
    } catch (e2) {}
  }
}

testUpdateSL();
