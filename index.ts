import { Browser } from "puppeteer";

const puppeteer = require("puppeteer");

const url = "https://books.toscrape.com/";

interface Element {
  innerText: string;
}

const main = async () => {
  const browser: Browser = await puppeteer.launch({ headless: false }); // Launch browser

  const page = await browser.newPage(); // Create new page

  await page.goto(url); // Go to the main page

  const bookData = await page.evaluate(async () => {
    const bookPods = Array.from(document.querySelectorAll(".product_pod"));

    const scrapedData = await Promise.all(
      bookPods.map(async (book: any) => {
        const title = book.querySelector("h3 a").getAttribute("title");
        const price = book.querySelector(".price_color").innerText;
        const imgSrc =
          "https://books.toscrape.com/" +
          book.querySelector("img")?.getAttribute("src");
        const status = book.querySelector(".availability").innerText;
        const rating = book.querySelector(".star-rating").classList[1];
        const bookUrl = book.querySelector("h3 a").getAttribute("href");

        // Navigate to the book details page
        // const bookDetailsPage = await page.goto(bookUrl, {
        //   waitUntil: "networkidle0",
        // });

        // Extract description using page.evaluate within the loop
        const description = await page.evaluate(async () => {
          // Modify this selector to target the description element on the book details page
          const descriptionElement = document.querySelector(".product_page p");
          const descriptionText =
            descriptionElement && (descriptionElement as HTMLElement).innerText;
          return descriptionText ? descriptionText.trim() : "";
        });

        return {
          title,
          price,
          imgSrc,
          status,
          rating,
          bookUrl,
          description,
        };
      }),
    );

    return scrapedData;
  });

  console.log(bookData);

  await browser.close();
};
(async () => await main())(); // Immediately invoke the async function
