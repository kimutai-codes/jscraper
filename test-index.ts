import { Browser, Page } from "puppeteer";

const puppeteer = require("puppeteer");

const url = "https://books.toscrape.com/";

interface BookData {
  title: string;
  price: string;
  imgSrc: string;
  status: string;
  rating: string;
  bookUrl: string;
  description: string;
}

const main = async () => {
  const browser: Browser = await puppeteer.launch({ headless: false }); // Launch browser
  const page: Page = await browser.newPage(); // Create new page

  await page.goto(url); // Go to the main page

  await page.exposeFunction("fetchBookDescription", fetchBookDescription); // Expose the function

  const bookData = await page.evaluate(async () => {
    const bookPods = Array.from(document.querySelectorAll(".product_pod"));

    return Promise.all(
      bookPods.map(async (book: any) => {
        const title = book.querySelector("h3 a").getAttribute("title");
        const price = book.querySelector(".price_color").innerText;
        const imgSrc =
          "https://books.toscrape.com/" +
          (book.querySelector("img")?.getAttribute("src") || "");
        const status = book.querySelector(".availability").innerText;
        const rating = book.querySelector(".star-rating").classList[1];
        const bookUrl =
          "https://books.toscrape.com/" +
          book.querySelector("h3 a").getAttribute("href");

        // Navigate to the book details page
        const description = await fetchBookDescription(bookUrl); // Directly call the function without using window

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
  });

  console.log(bookData);

  await browser.close();
};

const fetchBookDescription = async (bookUrl: string): Promise<string> => {
  let description = "";
  const browser = await puppeteer.launch(); // Launch browser
  const page = await browser.newPage(); // Create new page
  try {
    await page.goto(bookUrl, { waitUntil: "networkidle0" });
    description = await page.evaluate(() => {
      const descriptionElement = document.querySelector(
        "#product_description p",
      );
      return descriptionElement?.textContent?.trim() || "";
    });
  } catch (error) {
    console.error("Error fetching description:", error);
  } finally {
    await browser.close(); // Close browser instance
  }
  return description;
};

main();
