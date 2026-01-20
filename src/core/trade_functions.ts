import logger, { LogColor } from "../util/logger.ts";
import { LLMAnalysisResult } from "../model/llm_result.ts";
import {
  openMarketOrder,
  openMarketOrderWithTPSL,
  closeAllPositions,
  updateStopLoss
} from "../connect/trade.ts";
import { getTicker } from "../connect/market.ts";

export async function trade(symbol: string, decisionResult: LLMAnalysisResult) {
  // logger.info(`[${symbol}] 交易决策：${decisionResult.toString()}`, {
  //   color: LogColor.Green,
  // });

  const { action, quantity, stopLoss } = decisionResult;

  try {
    // 获取当前最新价格，用于校验止损合理性
    const ticker = await getTicker(symbol);
    const currentPrice = ticker ? parseFloat(ticker.last) : 0;

    switch (action) {
      case "ENTRY_LONG":
        if (quantity && quantity > 0) {
          if (stopLoss) {
            // 做多时，止损必须小于当前价格
            if (currentPrice > 0 && stopLoss >= currentPrice) {
              logger.warn(`[${symbol}] 做多止损价格(${stopLoss})必须小于当前价格(${currentPrice})，忽略止损直接下单`);
              await openMarketOrder(symbol, "buy", quantity.toString());
            } else {
              await openMarketOrderWithTPSL(
                symbol,
                "buy",
                quantity.toString(),
                stopLoss.toString(),
              );
            }
          } else {
            await openMarketOrder(symbol, "buy", quantity.toString());
          }
        } else {
          logger.warn(`[${symbol}] 建议开多但未提供有效数量`);
        }
        break;

      case "ENTRY_SHORT":
        if (quantity && quantity > 0) {
          if (stopLoss) {
            // 做空时，止损必须大于当前价格
            if (currentPrice > 0 && stopLoss <= currentPrice) {
              logger.warn(`[${symbol}] 做空止损价格(${stopLoss})必须大于当前价格(${currentPrice})，忽略止损直接下单`);
              await openMarketOrder(symbol, "sell", quantity.toString());
            } else {
              await openMarketOrderWithTPSL(
                symbol,
                "sell",
                quantity.toString(),
                stopLoss.toString(),
              );
            }
          } else {
            await openMarketOrder(symbol, "sell", quantity.toString());
          }
        } else {
          logger.warn(`[${symbol}] 建议开空但未提供有效数量`);
        }
        break;

      case "EXIT_LONG":
        await closeAllPositions(symbol);
        break;

      case "EXIT_SHORT":
        await closeAllPositions(symbol);
        break;

      case "UPDATE_STOP_LOSS":
        if (stopLoss) {
          // 这里的校验比较复杂，因为不知道当前持仓方向，暂时跳过校验
          // 或者可以先查询持仓再校验，但 UPDATE_STOP_LOSS 逻辑中可能已经包含
          await updateStopLoss(symbol, stopLoss.toString());
        } else {
          logger.warn(`[${symbol}] 建议更新止损但未提供有效止损价格`);
        }
        break;

      case "NO_OP":
        logger.info(`[${symbol}] 保持观望`);
        break;

      default:
        logger.warn(`[${symbol}] 未知动作: ${action}`);
        break;
    }
  } catch (error) {
    logger.error(`[${symbol}] 交易执行失败:`, error);
    // 不抛出错误，以免中断整个轮询流程，但记录错误
  }
}
