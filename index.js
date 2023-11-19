import puppeteer from 'puppeteer';
import ProductModel from './ProductModel.js';
import fs from 'fs';

let searchFor = 'iphone 11';
let searchForFriendly = searchFor.trim().replaceAll(' ', '%20');
const products = [];
(async () => {
  // Launch the browser and open a new blank page
  const browser = await puppeteer.launch({
    headless: false,
    userDataDir: "./tmp"
  });
  const page = await browser.newPage();

  // Navigate the page to a URL
  await page.goto(`https://allegro.pl/listing?string=${searchForFriendly}`);
  //decline cookies
  var elements = await page.$x('//*[@id="opbox-gdpr-consents-modal"]/div/div[2]/div/div[2]/button[2]')
  if (elements.length > 0)
    await elements[0].click(); 

  //read product data
  let articlesHandles = await page.$$('article');
  for(const articleHandle of articlesHandles) {
    try {
      const product = new ProductModel(
        await page.evaluate(el => el.querySelector("h2 > a").textContent , articleHandle),
        await page.evaluate(el => el.querySelector("div > div > span > div").textContent , articleHandle),
        await page.evaluate(el => el.querySelector("a").href , articleHandle),
        await page.evaluate(el => el.querySelector("a > img").getAttribute("src") , articleHandle)
      );
      products.push(product);
    }
    catch {
      console.log("Error reading product!");
    }
  }
  await browser.close();
})().then(() => {
  const data = JSON.stringify(products, null, 2);

  // Write the JSON string to a file
  fs.writeFile('products.json', data, err => {
    if (err) {
      throw err;
    }
    console.log('JSON data is saved.');
  });
});