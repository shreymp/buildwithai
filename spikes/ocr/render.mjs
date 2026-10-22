import { chromium } from 'playwright';
const html = `<html><body style="margin:0;background:#ddd"><div id=r style="width:300px;padding:16px;background:#fbfaf5;font:13px 'Courier New',monospace;transform:rotate(1.2deg);filter:blur(0.4px)">
<center>THE COPPER KETTLE<br>412 MAIN ST<br>10/18/2026 7:42 PM</center><br>
2 MARGHERITA PIZZA &nbsp;&nbsp;&nbsp;&nbsp; 31.00<br>1 CAESAR SALAD &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 11.50<br>3 HOUSE LEMONADE &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 13.50<br>1 TIRAMISU &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 8.75<br>
<br>SUBTOTAL &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 64.75<br>TAX 8.25% &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 5.34<br>TOTAL &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 70.09</div></body></html>`;
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' }).catch(async()=>chromium.launch());
const p = await b.newPage(); await p.setContent(html); await p.locator('#r').screenshot({ path: 'receipt.png' }); await b.close();
