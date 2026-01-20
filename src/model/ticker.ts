/**
 * 行情数据接口，对应 OKX API 返回的数据结构
 * 参考: https://www.okx.com/docs-v5/zh/#market-data-get-ticker
 */
export interface ITickerData {
    instId: string;   // 产品ID
    last: string;     // 最新成交价
    lastSz: string;   // 最新成交的数量
    askPx: string;    // 卖一价
    askSz: string;    // 卖一价的挂单数
    bidPx: string;    // 买一价
    bidSz: string;    // 买一价的挂单数
    open24h: string;  // 24小时开盘价
    high24h: string;  // 24小时最高价
    low24h: string;   // 24小时最低价
    volCcy24h: string;// 24小时成交量（以币为单位）
    vol24h: string;   // 24小时成交量（以张为单位）
    ts: string;       // 数据产生时间
    sodUtc0: string;  // UTC 0 时开盘价
    sodUtc8: string;  // UTC+8 时开盘价
}
