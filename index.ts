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
    // console.log("Navigation start.");
    // await page.screenshot({ path: "debug.png" });
    // await page.waitForNavigation({ timeout: 120000 });
    // await page.screenshot({ path: "debug01.png" });

    // Infinite scroll to load all items
    await autoScroll(page);

    // Scrape data
    const items = await page.evaluate(() => {
      const data: { name: string; contactInfo: string }[] = [];
      const listItems = document.querySelectorAll(
        // ".b-list-advert__item-wrapper.b-list-advert__item-wrapper--base",
        ".b-advert-listing.js-advert-listing.qa-advert-listing",
      );
      listItems.forEach((item) => {
        const nameElement = item.querySelector(".b-seller-block__name");
        const contactButton = item.querySelector(".b-show-contact-content");
        if (nameElement && contactButton) {
          const name = (nameElement as HTMLElement).innerText.trim();
          (contactButton as HTMLElement).click();
          let contactInfo = "";
          const contactInfoElement = document.querySelector(
            ".b-show-contact-content",
          );
          if (contactInfoElement) {
            contactInfo = (contactInfoElement as HTMLElement).innerText.trim();
          } else {
            const contactPopover = item.querySelector(
              ".b-show-contacts-popover__list",
            );
            if (contactPopover) {
              const phones = contactPopover.querySelectorAll(
                ".b-show-contacts-popover-item__phone.h-flex-1-0.h-mr-15 .adsads",
              );
              phones.forEach((phone) => {
                contactInfo += (phone as HTMLElement).innerText.trim() + "\n";
              });
            }
          }
          data.push({ name, contactInfo });
        }
      });
      return data;
    });
    // Execute the function to click link elements and navigate to child pages
  } catch (error) {
    console.error("Error occurred during scraping process:", error);
  } finally {
    await browser.close();
  }
})();
// Function to perform infinite scroll
async function autoScroll(page: any) {
  await page.evaluate(async () => {
    await new Promise<void>((resolve) => {
      let totalHeight = 0;
      const distance = 100;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;
        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  });
}
