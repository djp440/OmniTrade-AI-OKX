import { okxExchange } from '../connect/exchange.js';
import logger from '../util/logger.js';

async function testSystemTime() {
    try {
        logger.info('开始测试获取 OKX 系统时间...');
        
        const serverTime = await okxExchange.getSystemTime();
        const localTime = Date.now();
        
        logger.info(`OKX 系统时间: ${serverTime} (${new Date(serverTime).toISOString()})`);
        logger.info(`本地系统时间: ${localTime} (${new Date(localTime).toISOString()})`);
        
        const diff = Math.abs(serverTime - localTime);
        logger.info(`时间差: ${diff} 毫秒`);
        
        if (diff > 5000) {
            logger.warn('警告: 本地时间与服务器时间偏差较大 (>5s)');
        } else {
            logger.info('时间同步正常');
        }
        
    } catch (error) {
        logger.error(`测试失败: ${error instanceof Error ? error.message : String(error)}`);
    }
}

testSystemTime();
