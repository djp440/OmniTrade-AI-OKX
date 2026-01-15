/**
 * 资产余额接口，定义了 CCXT 返回的基础结构
 */
export interface IBalanceData {
    free: number;    // 可用余额
    used: number;    // 已用余额（冻结）
    total: number;   // 总余额
}

/**
 * 账户余额类，封装了 CCXT 的原始返回数据
 */
export class Balance {
    public readonly free: number;
    public readonly used: number;
    public readonly total: number;
    public readonly timestamp: number;

    /**
     * @param data CCXT 返回的原始余额数据中特定币种的部分或 total/free/used 结构
     */
    constructor(data: any) {
        // 优先尝试从 CCXT 的统一结构中提取，通常传入的是 balance.total['USDT'] 等或整个 balance 对象
        // 如果传入的是 ccxt fetchBalance() 的结果，我们需要处理逻辑
        this.free = Number(data.free || 0);
        this.used = Number(data.used || 0);
        this.total = Number(data.total || 0);
        this.timestamp = Date.now();
    }

    /**
     * 获取可用余额
     */
    getFree(): number {
        return this.free;
    }

    /**
     * 获取已用余额
     */
    getUsed(): number {
        return this.used;
    }

    /**
     * 获取总余额
     */
    getTotal(): number {
        return this.total;
    }

    /**
     * 格式化输出
     */
    toString(): string {
        return `Balance: [Total: ${this.total.toFixed(4)}, Free: ${this.free.toFixed(4)}, Used: ${this.used.toFixed(4)}]`;
    }
}
