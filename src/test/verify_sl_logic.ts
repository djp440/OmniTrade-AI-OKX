
import { OKXExchange } from '../connect/exchange.ts';
import { trade } from '../core/trade_functions.ts';
import { LLMAnalysisResult } from '../model/llm_result.ts';
import logger from '../util/logger.ts';

// Mock logger to avoid cluttering output
logger.info = () => { };
logger.warn = (msg) => console.log('LOG WARN:', msg);
logger.error = (msg) => console.log('LOG ERROR:', msg);

async function runTest() {
    const exchange = OKXExchange.getInstance();
    const requestCalls: any[] = [];

    // Mock request method by overwriting the instance method
    // We need to cast to any to allow overwriting if it's protected/private or readonly in types, 
    // but in JS runtime it's fine.
    (exchange as any).request = async (method: string, path: string, params: any) => {
        requestCalls.push({ method, path, params });

        // Mock Ticker Response
        if (path === '/api/v5/market/ticker') {
            return [{
                instId: params.instId,
                last: '50000', // Current Price
                lastSz: '1', askPx: '50001', askSz: '1', bidPx: '49999', bidSz: '1',
                open24h: '50000', high24h: '51000', low24h: '49000',
                volCcy24h: '1000', vol24h: '1000', ts: Date.now().toString(),
                sodUtc0: '50000', sodUtc8: '50000'
            }];
        }
        
        // Mock Order Response
        if (path === '/api/v5/trade/order') {
            return { ordId: '12345', clOrdId: 'test_order' };
        }

        return [];
    };

    console.log('--- Test 1: Long with Invalid Stop Loss (SL >= Price) ---');
    // Case 1: Long with SL >= Price (Invalid)
    // Price = 50000, SL = 51000
    const resultInvalidLong = new LLMAnalysisResult({
        action: 'ENTRY_LONG',
        quantity: 0.01,
        stop_loss: 51000, // Corrected key
        reason: 'Test'     // Corrected key
    } as any);

    await trade('BTC-USDT-SWAP', resultInvalidLong);

    // Verify last call
    const lastCallLong = requestCalls[requestCalls.length - 1];
    if (lastCallLong && lastCallLong.path === '/api/v5/trade/order') {
        const hasAlgo = !!lastCallLong.params.attachAlgoOrds;
        console.log(`Order placed without TP/SL? ${!hasAlgo}`);
        if (hasAlgo) {
            console.error('FAILED: Algo orders attached when SL was invalid!');
        } else {
            console.log('PASSED: SL ignored as expected.');
        }
    } else {
        console.error('FAILED: No order placed.');
    }


    console.log('\n--- Test 2: Short with Invalid Stop Loss (SL <= Price) ---');
    // Case 2: Short with SL <= Price (Invalid)
    // Price = 50000, SL = 49000
    const resultInvalidShort = new LLMAnalysisResult({
        action: 'ENTRY_SHORT',
        quantity: 0.01,
        stop_loss: 49000, // Corrected key
        reason: 'Test'     // Corrected key
    } as any);

    await trade('BTC-USDT-SWAP', resultInvalidShort);

    // Verify last call
    const lastCallShort = requestCalls[requestCalls.length - 1];
    if (lastCallShort && lastCallShort.path === '/api/v5/trade/order') {
        const hasAlgo = !!lastCallShort.params.attachAlgoOrds;
        console.log(`Order placed without TP/SL? ${!hasAlgo}`);
        if (hasAlgo) {
            console.error('FAILED: Algo orders attached when SL was invalid!');
        } else {
            console.log('PASSED: SL ignored as expected.');
        }
    } else {
        console.error('FAILED: No order placed.');
    }
}

runTest().catch(console.error);
