/**
 * 持仓信息接口，定义了 OKX V5 返回的基础结构
 */
export interface IPositionData {
    instId: string;      // 产品 ID，如 BTC-USDT-SWAP
    posSide: string;     // 持仓方向，net（单向持仓）、long（双向持仓多头）、short（双向持仓空头）
    pos: string;         // 持仓数量
    availPos: string;    // 可平仓数量
    avgPx: string;       // 开仓均价
    upl: string;         // 未实现盈亏
    uplRatio: string;    // 未实现盈亏率
    lever: string;       // 杠杆倍数
    mgnMode: string;     // 保证金模式：isolated（逐仓）、cross（全仓）
    liqPx: string;       // 预估爆仓价
    markPx: string;      // 标记价格
    margin: string;      // 保证金余额
    mgnRatio: string;    // 保证金率
}

/**
 * 持仓信息类，封装了 OKX 的原始持仓数据
 */
export class Position {
    public readonly instId: string;
    public readonly posSide: string;
    public readonly quantity: number;
    public readonly availableQuantity: number;
    public readonly entryPrice: number;
    public readonly unrealizedPnl: number;
    public readonly unrealizedPnlRatio: number;
    public readonly leverage: number;
    public readonly marginMode: string;
    public readonly liquidationPrice: number;
    public readonly markPrice: number;
    public readonly margin: number;
    public readonly marginRatio: number;
    public readonly timestamp: number;

    /**
     * @param data OKX /api/v5/account/positions 返回的原始数据项
     */
    constructor(data: any) {
        this.instId = data.instId;
        this.posSide = data.posSide;
        this.quantity = parseFloat(data.pos || '0');
        this.availableQuantity = parseFloat(data.availPos || '0');
        this.entryPrice = parseFloat(data.avgPx || '0');
        this.unrealizedPnl = parseFloat(data.upl || '0');
        this.unrealizedPnlRatio = parseFloat(data.uplRatio || '0');
        this.leverage = parseFloat(data.lever || '0');
        this.marginMode = data.mgnMode;
        this.liquidationPrice = parseFloat(data.liqPx || '0');
        this.markPrice = parseFloat(data.markPx || '0');
        this.margin = parseFloat(data.margin || '0');
        this.marginRatio = parseFloat(data.mgnRatio || '0');
        this.timestamp = Date.now();
    }

    /**
     * 是否持有仓位
     */
    hasPosition(): boolean {
        return Math.abs(this.quantity) > 0;
    }

    /**
     * 获取持仓方向描述
     */
    getSideText(): string {
        if (this.posSide === 'net') {
            return this.quantity > 0 ? '多头 (单向)' : (this.quantity < 0 ? '空头 (单向)' : '无持仓');
        }
        return this.posSide === 'long' ? '多头' : '空头';
    }

    /**
     * 格式化输出
     */
    toString(): string {
        return `Position: [${this.instId} ${this.getSideText()}] 数量: ${this.quantity}, 均价: ${this.entryPrice}, 盈亏: ${this.unrealizedPnl} (${(this.unrealizedPnlRatio * 100).toFixed(2)}%), 保证金率: ${(this.marginRatio * 100).toFixed(2)}%`;
    }
}
