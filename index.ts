import { Browser } from "puppeteer";

const puppeteer = require("puppeteer");

const url = "https://books.toscrape.com/";

const main = async () => {
  const browser: Browser = await puppeteer.launch({ headless: false });

  const page = await browser.newPage();

  await page.goto(url);

  const bookData = await page.evaluate(() => {
    const bookPods = Array.from(document.querySelectorAll(".product_pod"));

    // TODO: Can we map over the children?
    const data = bookPods.map((book: any) => ({
      title: book.querySelector("h3 a").getAttribute("title"),
      price: book.querySelector(".price_color").innerText,
      //TODO: how about selecting from an parent element? can I use emmet like aliases?
      imgSrc:
        "https://books.toscrape.com/" +
        book.querySelector("img")?.getAttribute("src"),
      status: book.querySelector(".availability").innerText,
      rating: book.querySelector(".star-rating").classList[1],
    }));
    return data;
  });

  await browser.close();
};
main();
