import puppeteer from "puppeteer";
require("dotenv").config();

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // Navigate to the page with infinite scroll
    await page.goto(`${process.env.LINK}`, {
      timeout: 60000,
    });

    // Function to click the button to change layout
    // Wait for the parent div element to appear
    await page.waitForSelector(".b-adverts-listing-change-view");

    // Click the second child SVG element within the parent div
    await page
      .evaluate(() => {
        // Find the parent div element
        const parentDiv = document.querySelector(
          ".b-adverts-listing-change-view",
        );

        // Check if parentDiv is not null
        if (parentDiv) {
          // Find all SVG elements within the parent div
          const svgElements = parentDiv.querySelectorAll("svg");

          // Check if there are at least two SVG elements
          if (svgElements.length >= 2) {
            // Click the second SVG element
            svgElements[1].dispatchEvent(new MouseEvent("click"));
          } else {
            console.error(
              "There are not enough SVG elements under the parent div.",
            );
          }
        } else {
          console.error("Parent div element not found.");
        }
      })
      .catch((error) => {
        console.error("Error occurred during scraping process:", error);
      });

    // Function to extract details from each list item
    const extractListItemDetails = async () => {
      // Loop over each list item
      const listItems = await page.$$(
        ".b-advert-listing.js-advert-listing.qa-advert-listing",
      );

      for (const listItem of listItems) {
        // Find the child element within the list item and click it
        await page.evaluate(() => {
          const childElement = document.querySelector(
            ".b-list-advert-base.qa-advert-list-item.b-list-advert-base--vip.b-list-advert-base--list",
          );
          if (childElement) {
            // Simulate a click event on the child element
            const clickEvent = new MouseEvent("click", {
              bubbles: true,
              cancelable: true,
              view: window,
            });
            childElement.dispatchEvent(clickEvent);
          } else {
            console.error("Child element not found.");
          }
        });

        // Wait for navigation to the child page
        await page.waitForNavigation();

        // Now you can perform actions on the child page, such as extracting details

        // Navigate back to the main page
        await page.goBack();
        // Wait for navigation back to the main page
        await page.waitForNavigation();
      }
    };

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
    await page.waitForNavigation();

    // Extract details from the current page
    await extractListItemDetails();
  } catch (error) {
    console.error("Error occurred during scraping process:", error);
  } finally {
    await browser.close();
  }
})();
