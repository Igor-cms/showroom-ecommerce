// Verify MY COFFEES "ADD TO CART" actually adds the coffee: open Diego's
// coffees, click ADD, and confirm the cart drawer shows the line item.
const puppeteer = require("puppeteer-core");
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const DIR = "C:\\Users\\erick\\OneDrive\\Documentos\\lovably-crafted-pixels\\scripts\\";
(async () => {
  const b = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--no-sandbox", "--force-device-scale-factor=1"] });
  const p = await b.newPage();
  await p.setViewport({ width: 1600, height: 900, deviceScaleFactor: 1 });
  await p.goto("http://localhost:8080/producers", { waitUntil: "networkidle2", timeout: 60000 });
  await new Promise((r) => setTimeout(r, 1800));
  await p.evaluate(() => {
    const btn = [...document.querySelectorAll("button")].filter((x) => x.textContent.trim() === "MY COFFEES")[0];
    if (btn) btn.click();
  });
  await new Promise((r) => setTimeout(r, 2500));
  // Click the first "1 | ADD TO CART"
  const clicked = await p.evaluate(() => {
    const btn = [...document.querySelectorAll("button")].find((x) => /ADD TO CART/.test(x.textContent));
    if (!btn) return false;
    btn.click();
    return btn.textContent.trim();
  });
  await new Promise((r) => setTimeout(r, 1200));
  // Read cart state: the drawer should be open and list the item
  const cart = await p.evaluate(() => {
    const drawerText = document.body.innerText;
    const hasSubtotal = /subtotal/i.test(drawerText);
    // count "ADDED" confirmation on the button
    return { hasSubtotal, snippet: drawerText.replace(/\s+/g, " ").slice(0, 500) };
  });
  console.log("add button was:", clicked);
  console.log("cart hasSubtotal:", cart.hasSubtotal);
  await p.screenshot({ path: DIR + "coffee-cart-test.png" });
  await b.close();
  console.log("done");
})().catch((e) => { console.error(e.message); process.exit(1); });
