import { Candle } from "../model/candle.js";

/**
 * 计算指数移动平均线 (EMA)
 * Formula: EMA_today = (Price_today * K) + (EMA_yesterday * (1 - K))
 * K = 2 / (N + 1)
 *
 * @param data 数值数组或K线数组
 * @param period 周期，默认为20
 * @returns EMA数组，长度与输入数组相同。由于EMA需要累积计算，数据越长越准确。
 *          前 period-1 个数据通常作为预热，计算出的EMA可能不准确或为null/0。
 *          此处实现：前 period-1 个点返回 null (为了保持数组长度一致)，第 period 个点使用 SMA 作为初始值。
 */
export function calculateEMA(
  data: (number | Candle)[],
  period: number = 20,
): (number | null)[] {
  if (!data || data.length < period) {
    // 数据长度不足以计算
    return new Array(data.length).fill(null);
  }

  const prices: number[] = data.map(item => {
    if (typeof item === "number") {
      return item;
    } else {
      return item.close;
    }
  });

  // 检测是否为 K 线数据且时间为倒序 (最新 -> 最旧)
  let isReversed = false;
  if (
    data.length > 1 &&
    typeof data[0] !== "number" &&
    typeof data[data.length - 1] !== "number"
  ) {
    const first = data[0] as Candle;
    const last = data[data.length - 1] as Candle;
    if (first.ts > last.ts) {
      isReversed = true;
      // 反转价格数组，使其按时间正序排列 (旧 -> 新)，以便正确计算 EMA
      prices.reverse();
    }
  }

  const emaValues: (number | null)[] = new Array(prices.length).fill(null);
  const k = 2 / (period + 1);

  // 1. 计算第一个 EMA 值 (通常使用前 N 个周期的 SMA 作为起始 EMA)
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += prices[i];
  }
  const initialSMA = sum / period;
  emaValues[period - 1] = initialSMA;

  // 2. 计算后续的 EMA 值
  for (let i = period; i < prices.length; i++) {
    const price = prices[i];
    const prevEMA = emaValues[i - 1]!;

    // EMA = Price(t) * k + EMA(y) * (1 - k)
    const ema = price * k + prevEMA * (1 - k);
    emaValues[i] = ema;
  }

  // 如果之前反转了数据，计算完成后需要将结果反转回来，确保与输入数组一一对应
  if (isReversed) {
    emaValues.reverse();
  }

  return emaValues;
}

/**
 * 专门用于计算 EMA20 的辅助函数
 * @param data K线数据或价格数组
 * @returns EMA20 数组
 */
export function calculateEMA20(data: (number | Candle)[]): (number | null)[] {
  return calculateEMA(data, 20);
}

/**
 * 计算平均真实波幅 (ATR)
 * Formula:
 * TR = max(High - Low, abs(High - Close_prev), abs(Low - Close_prev))
 * ATR = Wilder's Smoothing of TR
 *
 * @param data K线数据数组
 * @param period 周期，默认为14
 * @returns ATR数值数组，长度与输入相同
 */
export function calculateATR(
  data: Candle[],
  period: number = 14,
): (number | null)[] {
  if (!data || data.length < period) {
    return new Array(data.length).fill(null);
  }

  // 处理排序
  let sortedData = [...data];
  let isReversed = false;
  if (data.length > 1 && data[0].ts > data[data.length - 1].ts) {
    isReversed = true;
    sortedData.reverse();
  }

  const trValues: number[] = new Array(sortedData.length).fill(0);

  // 1. 计算 TR (True Range)
  // 第一个 TR 只能是 High - Low
  trValues[0] = sortedData[0].high - sortedData[0].low;
  for (let i = 1; i < sortedData.length; i++) {
    const high = sortedData[i].high;
    const low = sortedData[i].low;
    const prevClose = sortedData[i - 1].close;

    trValues[i] = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose),
    );
  }

  const atrValues: (number | null)[] = new Array(sortedData.length).fill(null);

  // 2. 第一个 ATR 是前 period 个 TR 的平均值 (SMA)
  let sumTR = 0;
  for (let i = 0; i < period; i++) {
    sumTR += trValues[i];
  }
  let currentATR = sumTR / period;
  atrValues[period - 1] = currentATR;

  // 3. 后续 ATR 使用 Wilder's Smoothing
  // ATR_t = (ATR_prev * (period - 1) + TR_t) / period
  for (let i = period; i < sortedData.length; i++) {
    currentATR = (currentATR * (period - 1) + trValues[i]) / period;
    atrValues[i] = currentATR;
  }

  if (isReversed) {
    atrValues.reverse();
  }

  return atrValues;
}

/**
 * 计算以相对收盘价百分比表示的 ATR (ATR %)
 * Formula: (ATR / Close) * 100
 *
 * @param data K线数据数组
 * @param period 周期，默认为14
 * @returns ATR百分比数组 (0-100 之间)
 */
export function calculateATRPercentage(
  data: Candle[],
  period: number = 14,
): (number | null)[] {
  const atrValues = calculateATR(data, period);

  return atrValues.map((atr, index) => {
    if (atr === null) return null;
    const close = data[index].close;
    if (close === 0) return 0;
    return (atr / close) * 100;
  });
}
