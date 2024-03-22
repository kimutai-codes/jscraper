import puppeteer from "puppeteer";
require("dotenv").config();

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log("Navigating to the page...");

    // Navigate to the page with infinite scroll
    await page.goto(`${process.env.LINK}`, {
      timeout: 60000,
    });

    console.log("Page navigation successful.");

    // Function to click the button to change layout
    // Wait for the parent div element to appear
    console.log("Waiting for the layout button...");
    await page.waitForSelector(".b-adverts-listing-change-view");

    console.log("Layout button found.");

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

    console.log("Clicked layout button.");

    // Function to click the link elements in the parent page and navigate to the child page
    console.log("Navigating to child pages...");
    const linkElements = await page.$$(
      ".b-list-advert-base.qa-advert-list-item.b-list-advert-base--vip.b-list-advert-base--list",
    );
    console.log(`Found ${linkElements.length} link elements.`);

    for (const linkElement of linkElements) {
      console.log("Clicking link element...");
      await Promise.all([
        linkElement.click(),
        page.waitForNavigation({ waitUntil: "networkidle0" }),
      ]);

      // Now you can perform actions on the child page, such as extracting details

      console.log("Navigating back to the main page...");
      await page.goBack();
      // Wait for navigation back to the main page
      await page.waitForNavigation({ waitUntil: "networkidle0" });
    }

    console.log("Navigation to child pages successful.");

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
  } catch (error) {
    console.error("Error occurred during scraping process:", error);
  } finally {
    await browser.close();
  }
})();
