import { Worker } from 'worker_threads';
import { config } from './util/config.js';
import logger from './util/logger.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { OKXExchange } from './connect/exchange.js';
import { OpenAIConnector } from './connect/openai.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runSelfCheck() {
    logger.info('开始执行自检程序...');

    // 1. 测试交易所连接 (获取余额)
    try {
        logger.info('正在测试交易所连接...');
        const exchange = OKXExchange.getInstance();
        const balance = await exchange.getBalance('USDT');
        logger.info(`交易所连接成功，USDT 余额: ${balance.free} (可用), ${balance.total} (总额)`);
    } catch (error) {
        logger.error('交易所连接测试失败:', error);
        process.exit(1);
    }

    // 2. 测试 LLM 连接 (发送简单消息并限制 max_tokens)
    try {
        logger.info('正在测试 LLM 连接...');
        const llm = OpenAIConnector.getInstance();
        // 使用 simple_analysis_model 进行测试
        const model = config.llm.simple_analysis_model;
        const testPrompt = 'Hello, this is a connection test. Reply "OK" if you receive this.';
        const response = await llm.chat('You are a test assistant.', testPrompt, model, { max_tokens: 10 });
        logger.info(`LLM 连接成功，测试响应: ${response}`);
    } catch (error) {
        logger.error('LLM 连接测试失败:', error);
        process.exit(1);
    }

    logger.info('自检程序通过，准备启动主逻辑...');
}

async function main() {
    await runSelfCheck();

    const symbols = config.trade.symbols;

    if (!symbols || symbols.length === 0) {
        logger.error('未配置交易对 (config.trade.symbols)');
        process.exit(1);
    }

    logger.info(`主程序启动，准备为 ${symbols.length} 个交易对启动策略线程...`);

    for (const symbol of symbols) {
        // 指向 run_strategy.ts 文件
        // 注意：在 TypeScript 环境下直接运行时，我们需要指向 .ts 文件
        // 如果是编译后的环境，这里可能需要调整逻辑指向 .js
        // 鉴于当前是直接开发环境，我们尝试直接指向当前目录结构下的 run_strategy.ts
        const workerPath = path.join(__dirname, 'core', 'run_strategy.ts');

        logger.info(`正在启动 Worker: ${symbol} (Path: ${workerPath})`);

        // 传递 process.execArgv 以确保 worker 能继承 loader (如 ts-node)
        const worker = new Worker(workerPath, {
            workerData: { symbol },
            execArgv: process.execArgv
        });

        worker.on('message', (msg) => {
            logger.info(`[Worker ${symbol}] Message:`, msg);
        });

        worker.on('error', (err) => {
            logger.error(`[Worker ${symbol}] Error:`, err);
        });

        worker.on('exit', (code) => {
            if (code !== 0) {
                logger.error(`[Worker ${symbol}] Stopped with exit code ${code}`);
            } else {
                logger.info(`[Worker ${symbol}] Finished successfully`);
            }
        });
    }
}

main().catch(err => {
    logger.error('主程序启动失败:', err);
});
