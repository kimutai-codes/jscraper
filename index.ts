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

    // Function to extract details from each card
    const extractCardDetails = async () => {
      // Loop over each column
      for (let i = 0; i < 3; i++) {
        // Scroll to the next column
        await page.evaluate((i) => {
          const nextColumn = document.querySelector(
            `.masonry-column:nth-child(${i + 1})`,
          );
          if (nextColumn) {
            nextColumn.scrollIntoView();
          }
        }, i);

        // Wait for the column to load more cards
        await new Promise((resolve) => setTimeout(resolve, 2000)); // Adjust timeout as needed

        // Extracting card links from the current column
        const cardLinks = await page.$$eval(
          `.masonry-column:nth-child(${i + 1}) a.b-list-advert-base`,
          (links) => links.map((link) => link.href),
        );

        // Looping through each card link in the current column
        for (const link of cardLinks) {
          const cardPage = await browser.newPage();
          await cardPage.goto(link);

          try {
            // Wait for the card details to load
            await cardPage.waitForSelector(
              ".b-list-advert__gallery__item .js-advert-list-item",
            );

            // Clicking the card link to navigate to the details page
            await cardPage.click(
              ".b-list-advert__gallery__item .js-advert-list-item",
            );

            // Wait for the contact information button to appear
            await cardPage.waitForSelector("a.qa-show-contact");

            // Click the "Show contact" button
            await cardPage.click("a.qa-show-contact");

            // Wait for the phone number to appear
            await cardPage.waitForSelector('a.qa-show-contact[href^="tel:"]');

            // Extract the phone number using page.evaluate()
            const phoneNumber = await cardPage.evaluate(() => {
              const phoneNumberElement = document.querySelector(
                'a.qa-show-contact[href^="tel:"]',
              );
              return phoneNumberElement?.textContent?.trim() || ""; // Optional chaining used here
            });

            // Scraping seller name
            const sellerName = await cardPage.$eval(
              "div.b-seller-block__name",
              (element) => element.textContent?.trim() || "",
            );

            // Log phone number and seller name
            console.log("Phone Number:", phoneNumber);
            console.log("Seller Name:", sellerName);
          } catch (error) {
            console.error("Error occurred during scraping:", error);
          } finally {
            await cardPage.close(); // Close cardPage after processing
          }
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
    await extractCardDetails();
  } catch (error) {
    console.error("Error occurred during scraping process:", error);
  } finally {
    await browser.close();
  }
})();
