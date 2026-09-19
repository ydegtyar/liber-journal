import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { parseBrokerCsv } from '../src/lib/csvParser';

const PORT = 5175;
const APP_URL = `http://localhost:${PORT}/`;
const OUTPUT_DIR = path.resolve(process.cwd(), 'public/assets/info');
const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const DEBUG_PORT = 9333;
const USER_DATA_DIR = '/tmp/chrome-capture-profile-' + Date.now();

// Read and parse sample trades
const sampleCsvPath = path.resolve(process.cwd(), 'sample_data/closed_deals_on_02_09_26.csv');
const sampleCsvContent = fs.readFileSync(sampleCsvPath, 'utf-8');
const parseResult = parseBrokerCsv(sampleCsvContent);

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class CDPClient {
  private ws!: WebSocket;
  private id = 1;
  private callbacks = new Map<number, (res: any) => void>();

  async connect(wsUrl: string) {
    this.ws = new WebSocket(wsUrl);
    await new Promise<void>((resolve, reject) => {
      this.ws.onopen = () => resolve();
      this.ws.onerror = (e) => reject(e);
    });

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data.toString());
        if (data.id && this.callbacks.has(data.id)) {
          const cb = this.callbacks.get(data.id)!;
          this.callbacks.delete(data.id);
          cb(data);
        }
      } catch (err) {
        console.error('WS parse error:', err);
      }
    };
  }

  async send(method: string, params: any = {}): Promise<any> {
    const msgId = this.id++;
    return new Promise((resolve) => {
      this.callbacks.set(msgId, resolve);
      this.ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  async eval(expression: string): Promise<any> {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    return res?.result?.value;
  }

  async screenshot(options: any = {}): Promise<Buffer> {
    const res = await this.send('Page.captureScreenshot', {
      format: 'png',
      ...options,
    });
    return Buffer.from(res.result.data, 'base64');
  }

  close() {
    this.ws.close();
  }
}

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  console.log(`Starting headless Chrome on debug port ${DEBUG_PORT}...`);
  const chromeProcess = spawn(CHROME_PATH, [
    `--remote-debugging-port=${DEBUG_PORT}`,
    '--headless=new',
    `--user-data-dir=${USER_DATA_DIR}`,
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--window-size=1600,1000',
    'about:blank',
  ]);

  try {
    let wsUrl = '';
    for (let i = 0; i < 30; i++) {
      await sleep(300);
      try {
        const res = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/list`);
        const list = await res.json();
        if (list && list.length > 0 && list[0].webSocketDebuggerUrl) {
          wsUrl = list[0].webSocketDebuggerUrl;
          break;
        }
      } catch {
        // wait for chrome to start
      }
    }

    if (!wsUrl) {
      throw new Error('Failed to obtain WebSocket debugger URL from Chrome');
    }

    console.log('Connecting to Chrome CDP:', wsUrl);
    const client = new CDPClient();
    await client.connect(wsUrl);

    await client.send('Page.enable');
    await client.send('Runtime.enable');
    await client.send('Emulation.setDeviceMetricsOverride', {
      width: 1600,
      height: 1000,
      deviceScaleFactor: 2,
      mobile: false,
    });

    console.log(`Navigating to ${APP_URL}...`);
    await client.send('Page.navigate', { url: APP_URL });
    await sleep(2500);

    // Inject trades into IndexedDB
    console.log('Injecting 23 sample trades into IndexedDB...');
    const tradesJson = JSON.stringify(parseResult.trades);
    await client.eval(`
      new Promise((resolve, reject) => {
        const req = indexedDB.open('TradingJournalDB', 1);
        req.onsuccess = (e) => {
          const db = e.target.result;
          const tx = db.transaction(['trades', 'settings'], 'readwrite');
          const tradesStore = tx.objectStore('trades');
          const trades = ${tradesJson};
          tradesStore.clear();
          trades.forEach(t => tradesStore.add(t));
          tx.oncomplete = () => {
            resolve(true);
          };
          tx.onerror = (err) => reject(err);
        };
        req.onerror = (err) => reject(err);
      });
    `);

    // Reload page to populate all hooks with Dexie data
    console.log('Reloading page with populated trades...');
    await client.send('Page.navigate', { url: APP_URL });
    await sleep(2500);

    // Take Full Hero Terminal Screenshot
    console.log('Capturing terminal-hero.png...');
    const heroShot = await client.screenshot();
    fs.writeFileSync(path.join(OUTPUT_DIR, 'terminal-hero.png'), heroShot);

    // Capture Dark Theme terminal
    await client.eval(`
      localStorage.setItem('trading_journal_preferences', JSON.stringify({
        themeMode: 'dark',
        locale: 'en',
        numberFormat: 'locale'
      }));
    `);
    await client.send('Page.navigate', { url: APP_URL });
    await sleep(1500);
    console.log('Capturing terminal-dark.png...');
    const darkShot = await client.screenshot();
    fs.writeFileSync(path.join(OUTPUT_DIR, 'terminal-dark.png'), darkShot);

    // Capture Unicorn Neon Theme terminal
    await client.eval(`
      localStorage.setItem('trading_journal_preferences', JSON.stringify({
        themeMode: 'unicorn',
        locale: 'en',
        numberFormat: 'locale'
      }));
    `);
    await client.send('Page.navigate', { url: APP_URL });
    await sleep(1500);
    console.log('Capturing terminal-unicorn.png...');
    const unicornShot = await client.screenshot();
    fs.writeFileSync(path.join(OUTPUT_DIR, 'terminal-unicorn.png'), unicornShot);

    // Capture Midnight OLED Theme terminal
    await client.eval(`
      localStorage.setItem('trading_journal_preferences', JSON.stringify({
        themeMode: 'midnight',
        locale: 'en',
        numberFormat: 'locale'
      }));
    `);
    await client.send('Page.navigate', { url: APP_URL });
    await sleep(1500);
    console.log('Capturing terminal-midnight.png...');
    const midnightShot = await client.screenshot();
    fs.writeFileSync(path.join(OUTPUT_DIR, 'terminal-midnight.png'), midnightShot);

    // Capture Institutional Light Theme terminal
    await client.eval(`
      localStorage.setItem('trading_journal_preferences', JSON.stringify({
        themeMode: 'light',
        locale: 'en',
        numberFormat: 'locale'
      }));
    `);
    await client.send('Page.navigate', { url: APP_URL });
    await sleep(1500);
    console.log('Capturing terminal-light.png...');
    const lightShot = await client.screenshot();
    fs.writeFileSync(path.join(OUTPUT_DIR, 'terminal-light.png'), lightShot);

    // Switch back to Dark for focused element captures
    await client.eval(`
      localStorage.setItem('trading_journal_preferences', JSON.stringify({
        themeMode: 'dark',
        locale: 'en',
        numberFormat: 'locale'
      }));
    `);
    await client.send('Page.navigate', { url: APP_URL });
    await sleep(1500);

    // Scroll down to Visualizations (Recharts charts)
    console.log('Capturing charts section...');
    await client.eval(`
      const el = document.querySelector('[data-block-id="visualizations"]') || document.querySelector('.recharts-responsive-container')?.closest('section');
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
    `);
    await sleep(1000);
    const chartsShot = await client.screenshot();
    fs.writeFileSync(path.join(OUTPUT_DIR, 'visualizations-showcase.png'), chartsShot);

    // Scroll down to Trades View / Daily Orders Matrix
    console.log('Capturing daily orders matrix...');
    await client.eval(`
      const tabs = document.querySelectorAll('[role="tab"]');
      if (tabs.length >= 2) tabs[1].click();
      const el = document.querySelector('[data-block-id="tradesView"]') || document.querySelector('table');
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
    `);
    await sleep(1000);
    const matrixShot = await client.screenshot();
    fs.writeFileSync(path.join(OUTPUT_DIR, 'daily-matrix.png'), matrixShot);

    // Scroll down to Forecast block and trigger calculation
    console.log('Capturing forecast block...');
    await client.eval(`
      const fcBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('3m') || b.textContent.includes('1m') || b.textContent.includes('+30'));
      if (fcBtn) fcBtn.click();
      const fcBlock = document.querySelector('[data-block-id="forecast"]');
      if (fcBlock) fcBlock.scrollIntoView({ behavior: 'instant', block: 'center' });
    `);
    await sleep(2000);
    const forecastShot = await client.screenshot();
    fs.writeFileSync(path.join(OUTPUT_DIR, 'forecast-scenarios.png'), forecastShot);

    // Now, let's create animation frame sequences for GIFs!
    // GIF 1: Theme Cycling Transition (Dark -> Unicorn -> Midnight -> Light -> Dark)
    console.log('Recording frames for theme-switcher.gif...');
    const themeFramesDir = path.join('/tmp', 'theme-frames-' + Date.now());
    fs.mkdirSync(themeFramesDir, { recursive: true });

    const themes = ['dark', 'unicorn', 'midnight', 'light', 'dark'];
    let frameIdx = 0;
    for (const th of themes) {
      await client.eval(`
        localStorage.setItem('trading_journal_preferences', JSON.stringify({
          themeMode: '${th}',
          locale: 'en',
          numberFormat: 'locale'
        }));
      `);
      await client.send('Page.navigate', { url: APP_URL });
      await sleep(800);
      for (let k = 0; k < 4; k++) {
        const shot = await client.screenshot();
        fs.writeFileSync(
          path.join(themeFramesDir, `frame_${String(frameIdx++).padStart(4, '0')}.png`),
          shot
        );
        await sleep(150);
      }
    }

    console.log('Encoding theme-morph.gif with ffmpeg...');
    await new Promise<void>((resolve, reject) => {
      const ff = spawn('/usr/local/bin/ffmpeg', [
        '-y',
        '-framerate',
        '4',
        '-i',
        path.join(themeFramesDir, 'frame_%04d.png'),
        '-vf',
        'scale=800:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128[p];[s1][p]paletteuse=dither=bayer',
        path.join(OUTPUT_DIR, 'theme-morph.gif'),
      ]);
      ff.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`ffmpeg exited with code ${code}`));
      });
    });

    // GIF 2: Interactive Chart Hover / Equity Curve Scanner
    console.log('Recording frames for equity-curve-interactive.gif...');
    const chartFramesDir = path.join('/tmp', 'chart-frames-' + Date.now());
    fs.mkdirSync(chartFramesDir, { recursive: true });

    await client.eval(`
      localStorage.setItem('trading_journal_preferences', JSON.stringify({
        themeMode: 'unicorn',
        locale: 'en',
        numberFormat: 'locale'
      }));
    `);
    await client.send('Page.navigate', { url: APP_URL });
    await sleep(1500);

    // Position near the chart
    await client.eval(`
      const el = document.querySelector('[data-block-id="visualizations"]') || document.querySelector('.recharts-responsive-container');
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
    `);
    await sleep(800);

    // Move mouse across chart container to trigger Recharts interactive tooltips
    const chartBox = await client.eval(`
      (() => {
        const c = document.querySelector('.recharts-surface') || document.querySelector('.recharts-responsive-container');
        if (!c) return null;
        const r = c.getBoundingClientRect();
        return { x: r.left, y: r.top, width: r.width, height: r.height };
      })()
    `);

    let chartFrameIdx = 0;
    if (chartBox) {
      const steps = 18;
      for (let s = 0; s <= steps; s++) {
        const mouseX = chartBox.x + (chartBox.width * s) / steps;
        const mouseY = chartBox.y + chartBox.height / 2;
        await client.send('Input.dispatchMouseEvent', {
          type: 'mouseMoved',
          x: mouseX,
          y: mouseY,
        });
        await sleep(100);
        const shot = await client.screenshot();
        fs.writeFileSync(
          path.join(chartFramesDir, `frame_${String(chartFrameIdx++).padStart(4, '0')}.png`),
          shot
        );
      }
    }

    if (chartFrameIdx > 0) {
      console.log('Encoding equity-curve-interactive.gif with ffmpeg...');
      await new Promise<void>((resolve, reject) => {
        const ff = spawn('/usr/local/bin/ffmpeg', [
          '-y',
          '-framerate',
          '8',
          '-i',
          path.join(chartFramesDir, 'frame_%04d.png'),
          '-vf',
          'scale=800:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128[p];[s1][p]paletteuse=dither=bayer',
          path.join(OUTPUT_DIR, 'equity-curve-interactive.gif'),
        ]);
        ff.on('close', (code) => {
          if (code === 0) resolve();
          else reject(new Error(`ffmpeg exited with code ${code}`));
        });
      });
    }

    client.close();
    console.log('Capture finished successfully! All assets written to:', OUTPUT_DIR);
  } finally {
    chromeProcess.kill('SIGTERM');
  }
}

main().catch((err) => {
  console.error('Fatal capture error:', err);
  process.exit(1);
});
