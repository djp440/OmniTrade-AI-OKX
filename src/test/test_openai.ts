import { OpenAIConnector } from '../connect/openai.ts';
import logger from '../util/logger.ts';
import { config } from '../util/config.ts';

/**
 * 测试 OpenAI 连接器功能
 */
async function testOpenAI() {
    try {
        logger.info('开始测试 OpenAI 连接器...');

        // 1. 测试基础聊天功能 (使用 simple_analysis_model)
        logger.info('--- 测试基础聊天 ---');
        const systemPrompt = "你是一个助手";
        const userPrompt = "你好，请回复'连接成功'";
        const chatResponse = await OpenAIConnector.getInstance().chat(
            systemPrompt,
            userPrompt,
            config.llm.simple_analysis_model
        );
        logger.info(`基础聊天回复: ${chatResponse}`);

        // 2. 测试 JSON 聊天功能 (使用 main_model)
        logger.info('--- 测试 JSON 聊天 ---');
        const jsonSystemPrompt = "你是一个返回JSON的助手，请务必只返回JSON格式。";
        const jsonUserPrompt = "请返回一个包含字段 'status' 为 'ok' 的 JSON 对象";
        const jsonResponse = await OpenAIConnector.getInstance().chatWithJson(
            jsonSystemPrompt,
            jsonUserPrompt
        );
        logger.info('JSON 聊天回复: %o', jsonResponse);

        // 3. 测试配置中的模型名称是否正确
        logger.info('--- 检查配置模型 ---');
        logger.info(`视觉模型: ${config.llm.visual_model}`);
        logger.info(`简单分析模型: ${config.llm.simple_analysis_model}`);
        logger.info(`风险分析模型: ${config.llm.risk_analysis_model}`);
        logger.info(`主决策模型: ${config.llm.main_model}`);

        logger.info('OpenAI 连接器测试完成！');
    } catch (error: any) {
        logger.error(`测试过程中出错: ${error.message}`);
        if (error.message.includes('API Key')) {
            logger.warn('注意：请确保在 .env 文件中配置了有效的 llm_api_key');
        }
    }
}

// 执行测试
testOpenAI();
