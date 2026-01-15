/**
 * K线数据结构
 * 参考: https://www.okx.com/docs-v5/zh/#order-book-trading-market-data-get-candlesticks
 */
export interface ICandleData {
    ts: string;    // 开始时间，Unix时间戳的毫秒数格式
    o: string;     // 开盘价格
    h: string;     // 最高价格
    l: string;     // 最低价格
    c: string;     // 收盘价格
    vol: string;   // 交易量，以张为单位
    volCcy: string;// 交易量，以币为单位
    volCcyQuote: string; // 交易量，以计价货币为单位
    confirm: string; // K线状态，0代表K线未完结，1代表K线已完结
}

/**
 * K线类
 */
export class Candle {
    public readonly ts: number;
    public readonly open: number;
    public readonly high: number;
    public readonly low: number;
    public readonly close: number;
    public readonly vol: number;
    public readonly volCcy: number;
    public readonly volCcyQuote: number;
    public readonly confirm: boolean;

    /**
     * @param data OKX API 返回的原始数组数据 [ts, o, h, l, c, vol, volCcy, volCcyQuote, confirm]
     */
    constructor(data: string[]) {
        if (!data || data.length < 9) {
            throw new Error('Invalid candle data format');
        }
        
        this.ts = Number(data[0]);
        this.open = Number(data[1]);
        this.high = Number(data[2]);
        this.low = Number(data[3]);
        this.close = Number(data[4]);
        this.vol = Number(data[5]);
        this.volCcy = Number(data[6]);
        this.volCcyQuote = Number(data[7]);
        this.confirm = data[8] === '1';
    }

    /**
     * 获取格式化的时间字符串
     */
    getTimeString(): string {
        return new Date(this.ts).toISOString();
    }

    /**
     * 格式化输出
     */
    toString(): string {
        return `Candle[${this.getTimeString()}]: O=${this.open}, H=${this.high}, L=${this.low}, C=${this.close}, Vol=${this.vol}`;
    }
}
