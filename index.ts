import puppeteer from "puppeteer";
require("dotenv").config();

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // Navigate to the page with infinite scroll
    await page.goto(`${process.env.LINK}`, {
      timeout: 120000,
    });

    // Function to click the button to change layout
    // Wait for the parent div element to appear
    await page.waitForSelector(
      ".b-advert-listing.js-advert-listing.qa-advert-listing",
    );

    // Handle login popup
    await page.waitForSelector('a[href="/login.html"]');
    await page.click('a[href="/login.html"]');

    // Wait for the login popup to appear
    await page.waitForSelector(".b-auth-popup");

    // Click the "Sign in via email or phone" button
    await page.click(
      ".h-width-100p.h-bold.fw-button.qa-fw-button.fw-button--type-success.fw-button--size-large",
    );

    // Wait for the email or phone input field to appear
    await page.waitForSelector(".qa-login-field");

    // Fill in the email or phone input field
    await page.type(".qa-login-field", `${process.env.NAME}`);

    // Fill in the password input field
    await page.type(".qa-password-field", `${process.env.PASSWORD}`);

    // Click the "SIGN IN" button
    await page.click(".qa-login-submit");

    // Wait for login to complete
    //FIX:
    // console.log('Navigation start.');
    // await page.waitForNavigation({ timeout: 120000 });

    // Click the second child SVG element within the parent div
    await page.evaluate(() => {
      const parentDiv = document.querySelector(
        ".b-adverts-listing-change-view",
      );
      if (parentDiv) {
        const svgElements = parentDiv.querySelectorAll("svg");
        if (svgElements.length >= 2) {
          svgElements[1].dispatchEvent(new MouseEvent("click"));
        } else {
          console.error(
            "There are not enough SVG elements under the parent div.",
          );
        }
      } else {
        console.error("Parent div element not found.");
      }
    });

    // scroll page so we can srape all at once
    autoScroll(page);

    // Scrape data
    //Await target elements to load
    await page.waitForSelector(
      ".b-list-advert__item-wrapper.b-list-advert__item-wrapper--base",
    );

    const listData = await page.evaluate(async () => {
      //get an array of all items
      const items = Array.from(
        document.querySelectorAll(
          ".b-list-advert__item-wrapper.b-list-advert__item-wrapper--base",
        ),
      );

      //loop over the items while scrping the data
      return Promise.all(
        items.map(async (item) => {
          const adUrl =
            `${process.env.BASE_URL}` +
            item
              .querySelector(
                ".b-list-advert-base.qa-advert-list-item.b-list-advert-base--vip.b-list-advert-base--list",
              )
              ?.getAttribute("href");
          return { adUrl };
        }),
      );
    });
    console.log("list items :", listData);

    //TODO: Execute the function to click link elements and navigate to child pages
  } catch (error) {
    console.error("Error occurred during scraping process:", error);
  } finally {
    await browser.close();
  }
})();

// Function to perform infinite scroll
async function autoScroll(page: any) {
  try {
    await page.evaluate(async () => {
      const screenHeight = window.innerHeight;
      const distance = screenHeight;

      let totalHeight = 0;
      let previousHeight = 0;
      let isLoading = false; // Flag to track loading state

      const scrollInterval = setInterval(async () => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        // Check for loading indicator (replace with your specific selector)
        isLoading = !!document.querySelector(".loading-spinner");

        if (Math.abs(previousHeight - scrollHeight) < 10 || isLoading) {
          clearInterval(scrollInterval);
          return;
        }

        previousHeight = scrollHeight;

        // Wait for content to load after scrolling (adjust timeout)
        await new Promise((resolve) => setTimeout(resolve, 500));
      }, 100);
    });
  } catch (error) {
    console.error("Error occurred during auto-scrolling:", error);
    // Implement further error handling here
  }
}
