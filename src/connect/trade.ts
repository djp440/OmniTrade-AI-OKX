import { okxExchange } from './exchange.js';
import logger from '../util/logger.js';

/**
 * 市价开仓
 * @param symbol 交易对，如 BTC-USDT-SWAP
 * @param side 买卖方向，buy 或 sell
 * @param size 开仓数量 (张)
 */
export async function openMarketOrder(symbol: string, side: 'buy' | 'sell', size: string) {
    logger.info(`开始市价开仓: ${symbol} ${side} ${size}`);
    try {
        const params = {
            instId: symbol,
            tdMode: 'cross', // 全仓
            side: side,
            ordType: 'market',
            sz: size
        };
        const result = await okxExchange.placeOrder(params);
        logger.info(`市价开仓成功: ${JSON.stringify(result)}`);
        return result;
    } catch (error) {
        logger.error(`市价开仓失败:`, error);
        throw error;
    }
}

/**
 * 市价开仓同时附带止盈止损
 * @param symbol 交易对
 * @param side 买卖方向
 * @param size 开仓数量
 * @param slTriggerPx 止损触发价
 * @param tpTriggerPx 止盈触发价 (可选)
 */
export async function openMarketOrderWithTPSL(
    symbol: string,
    side: 'buy' | 'sell',
    size: string,
    slTriggerPx: string,
    tpTriggerPx?: string
) {
    logger.info(`开始市价开仓(带止盈止损): ${symbol} ${side} ${size}, SL: ${slTriggerPx}, TP: ${tpTriggerPx}`);
    try {
        const attachAlgoOrds: any[] = [];

        // 构建止损止盈参数 (使用单个对象，OCO模式)
        const algoOrder: any = {
            tpSlMode: 'last' // 使用最新成交价触发
        };

        if (slTriggerPx) {
            algoOrder.slTriggerPx = slTriggerPx;
            algoOrder.slOrdPx = '-1'; // -1 代表市价止损
        }

        if (tpTriggerPx) {
            algoOrder.tpTriggerPx = tpTriggerPx;
            algoOrder.tpOrdPx = '-1'; // -1 代表市价止盈
        }

        attachAlgoOrds.push(algoOrder);

        const params = {
            instId: symbol,
            tdMode: 'cross',
            side: side,
            ordType: 'market',
            sz: size,
            attachAlgoOrds: attachAlgoOrds
        };

        // logger.info(`下单参数: ${JSON.stringify(params)}`);

        const result = await okxExchange.placeOrder(params);
        logger.info(`市价开仓(带止盈止损)成功: ${JSON.stringify(result)}`);
        return result;
    } catch (error) {
        logger.error(`市价开仓(带止盈止损)失败:`, error);
        throw error;
    }
}

/**
 * 一键市价平仓
 * @param symbol 交易对
 */
export async function closeAllPositions(symbol: string) {
    logger.info(`开始市价全平: ${symbol}`);
    try {
        // 全仓模式下的市价全平
        const params = {
            instId: symbol,
            mgnMode: 'cross',
            // net 模式下不需要 posSide
        };
        const result = await okxExchange.closePosition(params);
        logger.info(`市价全平成功: ${JSON.stringify(result)}`);
        return result;
    } catch (error) {
        logger.error(`市价全平失败:`, error);
        throw error;
    }
}

/**
 * 修改持仓止损价格
 * @param symbol 交易对
 * @param newStopLossPrice 新的止损触发价格
 */
export async function updateStopLoss(symbol: string, newStopLossPrice: string) {
    logger.info(`开始修改止损: ${symbol} -> ${newStopLossPrice}`);
    try {
        // 1. 获取该交易对所有未完成的策略委托
        const algoOrders = await okxExchange.getPendingAlgoOrders(symbol, 'oco'); // 尝试获取 OCO 订单
        const conditionalOrders = await okxExchange.getPendingAlgoOrders(symbol, 'conditional'); // 尝试获取单向止损订单

        // 合并列表
        const allOrders = [...algoOrders, ...conditionalOrders];

        if (allOrders.length === 0) {
            logger.warn(`未找到交易对 ${symbol} 的未完成策略委托，无法修改止损`);
            return null;
        }

        // 2. 筛选出带有止损的订单
        // 注意：OKX 返回的字段中，如果有止损，通常会有 slTriggerPx
        const slOrders = allOrders.filter((order: any) => order.slTriggerPx && parseFloat(order.slTriggerPx) > 0);

        if (slOrders.length === 0) {
            logger.warn(`未找到交易对 ${symbol} 的止损订单`);
            return null;
        }

        const results = [];

        // 3. 修改止损价格
        for (const order of slOrders) {
            logger.info(`找到止损订单: algoId=${order.algoId}, 当前止损=${order.slTriggerPx}`);

            const params = {
                instId: symbol,
                algoId: order.algoId,
                newSlTriggerPx: newStopLossPrice,
                // 如果是 OCO 订单，可能需要保持 TP 不变，但 API 允许只传需要修改的字段
                // 如果是条件单，也是一样
            };

            // 如果原订单是 OCO 且有止盈，可能需要检查是否需要传 newTpTriggerPx? 
            // OKX 文档: 可选参数，不传则不修改。

            const result = await okxExchange.amendAlgoOrder(params);
            logger.info(`修改止损成功: ${JSON.stringify(result)}`);
            results.push(result);
        }

        return results;
    } catch (error) {
        logger.error(`修改止损失败:`, error);
        throw error;
    }
}
