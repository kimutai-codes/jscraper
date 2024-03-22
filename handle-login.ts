import puppeteer from "puppeteer";
require("dotenv").config();

const browser = await puppeteer.launch({ headless: false });
const page = await browser.newPage();

const handleLogin = async () => {
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
};
export default handleLogin;
