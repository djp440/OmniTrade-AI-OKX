import puppeteer, { Browser } from 'puppeteer';
import logger from './logger.js';

let browserInstance: Browser | null = null;
let launchingPromise: Promise<Browser> | null = null;

export async function getBrowser(): Promise<Browser> {
    if (browserInstance) {
        return browserInstance;
    }

    // 防止并发调用时多次启动
    if (launchingPromise) {
        return launchingPromise;
    }

    logger.info('Launching new Puppeteer browser instance...');
    launchingPromise = puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }).then(browser => {
        browserInstance = browser;
        launchingPromise = null;

        browser.on('disconnected', () => {
            logger.warn('Puppeteer browser disconnected. Clearing instance.');
            browserInstance = null;
        });

        return browser;
    }).catch(err => {
        launchingPromise = null;
        logger.error('Failed to launch puppeteer', err);
        throw err;
    });

    return launchingPromise;
}

export async function closeBrowser() {
    if (browserInstance) {
        await browserInstance.close();
        browserInstance = null;
    }
}
