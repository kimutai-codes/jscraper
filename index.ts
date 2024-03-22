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
      const listItems = await page.$$(".b-list-advert__item-wrapper");

      for (const listItem of listItems) {
        // Click the list item to navigate to the details page
        await listItem.click();

        try {
          // Wait for the details to load
          await page.waitForSelector(".b-list-advert-base__data__header");

          // Scraping seller name
          const sellerName = await page.$eval(
            ".b-seller-block__name",
            (element) => element.textContent?.trim() || "",
          );

          // Scraping phone number
          const phoneNumber = await page.$eval(
            'a.qa-show-contact[href^="tel:"]',
            (element) => element.textContent?.trim() || "",
          );

          // Log phone number and seller name
          console.log("Seller Name:", sellerName);
          console.log("Phone Number:", phoneNumber);
        } catch (error) {
          console.error("Error occurred during scraping:", error);
        } finally {
          // Navigate back to the main page
          await page.goBack();
          // Wait for navigation
          await page.waitForNavigation();
        }
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
