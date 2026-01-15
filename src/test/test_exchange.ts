import { okxExchange } from '../connect/exchange.js';
import logger from '../util/logger.js';

async function testExchange() {
    try {
        logger.info('开始测试 OKX 交易所连接...');

        // 1. 测试初始化设置（原生 API 格式：BTC-USDT-SWAP）
        const symbol = 'BTC-USDT-SWAP';
        await okxExchange.initAccountSettings(symbol);

        // 2. 测试获取余额
        const balance = await okxExchange.getBalance('USDT');
        logger.info('账户余额获取成功');
        logger.info(`账户信息: ${balance.toString()}`);
        logger.info(`可用余额: ${balance.getFree()}`);

        // 3. 测试获取持仓信息
        logger.info('正在获取持仓信息...');
        const positions = await okxExchange.getPositions('SWAP', 'ETH-USDT-SWAP');
        logger.info(`获取到 ${positions.length} 条持仓记录`);
        positions.forEach(pos => {
            logger.info(`持仓详情: ${pos.toString()}`);
        });

        logger.info('OKX 交易所连接测试完成！');
    } catch (error: any) {
        logger.error(`测试过程中出错: ${error.message}`);
        // 如果是 API 密钥错误，这是预期的（如果没有配置有效的测试密钥）
        if (error.message.includes('Authentication Error')) {
            logger.warn('注意：由于未提供有效的 API 密钥，身份验证失败是正常的。');
        }
    }
}

testExchange();
