/* Copyright (c) 2021, VRAI Labs and/or its affiliates. All rights reserved.
 *
 * This software is licensed under the Apache License, Version 2.0 (the
 * "License") as published by the Apache Software Foundation.
 *
 * You may not use this file except in compliance with the License. You may
 * obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 */

/*
 * Imports
 */

import assert from "assert";
import puppeteer from "puppeteer";
import {
    clearBrowserCookiesWithoutAffectingConsole,
    clickForgotPasswordLink,
    getFieldErrors,
    getGeneralError,
    getInputNames,
    getInputTypes,
    getLogoutButton,
    getLabelsText,
    getPlaceholders,
    getUserIdWithAxios,
    getSessionHandleWithAxios,
    getUserIdWithFetch,
    getSessionHandleWithFetch,
    getShowPasswordIcon,
    getSubmitFormButtonLabel,
    getInputAdornmentsSuccess,
    hasMethodBeenCalled,
    setInputValues,
    submitForm,
    submitFormReturnRequestAndResponse,
    toggleShowPasswordIcon,
    toggleSignInSignUp,
    getInputAdornmentsError,
    defaultSignUp,
    getUserIdFromSessionContext,
    getTextInDashboardNoAuth,
    waitForSTElement,
    screenshotOnFailure,
    isGeneralErrorSupported,
    setGeneralErrorToLocalStorage,
    getInvalidClaimsJSON as getInvalidClaims,
    waitForText,
    backendBeforeEach,
} from "../helpers";
import fetch from "isomorphic-fetch";
import { SOMETHING_WENT_WRONG_ERROR } from "../constants";

import { EMAIL_EXISTS_API, SIGN_IN_API, TEST_CLIENT_BASE_URL, TEST_SERVER_BASE_URL, SIGN_OUT_API } from "../constants";

/*
 * Tests.
 */
describe("SuperTokens SignIn", function () {
    let browser;
    let page;
    let consoleLogs = [];

    before(async function () {
        await backendBeforeEach();

        await fetch(`${TEST_SERVER_BASE_URL}/startst`, {
            method: "POST",
        }).catch(console.error);

        browser = await puppeteer.launch({
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
            headless: true,
        });
    });

    after(async function () {
        await browser.close();

        await fetch(`${TEST_SERVER_BASE_URL}/after`, {
            method: "POST",
        }).catch(console.error);

        await fetch(`${TEST_SERVER_BASE_URL}/stopst`, {
            method: "POST",
        }).catch(console.error);
    });

    afterEach(function () {
        return screenshotOnFailure(this, browser);
    });

    beforeEach(async function () {
        page = await browser.newPage();
        page.on("console", (consoleObj) => {
            const log = consoleObj.text();
            if (log.startsWith("ST_LOGS")) {
                consoleLogs.push(log);
            }
        });
        consoleLogs = await clearBrowserCookiesWithoutAffectingConsole(page, []);
    });

    describe("SignIn test ", function () {
        it("Should contain email and password fields only", async function () {
            const inputNames = await getInputNames(page);
            assert.deepStrictEqual(inputNames, ["email", "password"]);

            const labelNames = await getLabelsText(page);
            assert.deepStrictEqual(labelNames, ["Your Email", "Password"]);

            const placeholders = await getPlaceholders(page);
            assert.deepStrictEqual(placeholders, ["Your work email", "Password"]);

            const adornments = await getInputAdornmentsSuccess(page);
            assert.strictEqual(adornments.length, 0);
            assert.deepStrictEqual(consoleLogs, []);
        });

        it('Should switch between signup and sign in widget when "Sign Up" is clicked.', async function () {
            await toggleSignInSignUp(page);

            let buttonLabel = await getSubmitFormButtonLabel(page);
            assert.strictEqual(buttonLabel, "SIGN UP");

            await toggleSignInSignUp(page);

            buttonLabel = await getSubmitFormButtonLabel(page);
            assert.strictEqual(buttonLabel, "SIGN IN");
            assert.deepStrictEqual(consoleLogs, []);
        });

        it('Should switch to resetPassword when "Forgot password" is clicked.', async function () {
            await clickForgotPasswordLink(page);
            const buttonLabel = await getSubmitFormButtonLabel(page);
            assert.strictEqual(buttonLabel, "Email me");
            assert.deepStrictEqual(consoleLogs, ["ST_LOGS EMAIL_PASSWORD GET_REDIRECTION_URL RESET_PASSWORD"]);
        });

        it("Should show error messages with incorrect inputs", async function () {
            // Set incorrect values.
            await setInputValues(page, [
                { name: "email", value: "invalid_email" },
                { name: "password", value: "********" },
            ]);

            let adornmentsSuccess = await getInputAdornmentsSuccess(page);
            assert.strictEqual(adornmentsSuccess.length, 0);

            let adornmentsError = await getInputAdornmentsError(page);
            assert.strictEqual(adornmentsError.length, 0);

            await submitForm(page);
            // // Assert.
            let formFieldsErrors = await getFieldErrors(page);
            assert.deepStrictEqual(formFieldsErrors, ["Email is invalid"]);

            // Set values.
            await setInputValues(page, [
                { name: "email", value: "john@gmail.com" },
                { name: "password", value: "********" },
            ]);

            adornmentsSuccess = await getInputAdornmentsSuccess(page);
            assert.strictEqual(adornmentsSuccess.length, 0);

            adornmentsError = await getInputAdornmentsError(page);
            assert.strictEqual(adornmentsError.length, 0);

            // Submit.
            const { request, response } = await submitFormReturnRequestAndResponse(page, SIGN_IN_API);

            assert.strictEqual(request.headers().rid, "emailpassword");
            assert.strictEqual(
                request.postData(),
                '{"formFields":[{"id":"email","value":"john@gmail.com"},{"id":"password","value":"********"}]}'
            );

            assert.strictEqual(response.status, "WRONG_CREDENTIALS_ERROR");

            // Assert wrong credentials
            formFieldsErrors = await getFieldErrors(page);
            assert.deepStrictEqual(formFieldsErrors, []);
            const generalError = await getGeneralError(page);
            assert.strictEqual(generalError, "Incorrect email and password combination");
            assert.deepStrictEqual(consoleLogs, [
                "ST_LOGS EMAIL_PASSWORD OVERRIDE SIGN_IN",
                "ST_LOGS EMAIL_PASSWORD PRE_API_HOOKS EMAIL_PASSWORD_SIGN_IN",
            ]);
        });

        it("should clear errors when switching to signup", async function () {
            await setInputValues(page, [
                { name: "email", value: "john@gmail.com" },
                { name: "password", value: "********" },
            ]);

            await submitForm(page);

            const generalError = await getGeneralError(page);
            assert.strictEqual(generalError, "Incorrect email and password combination");
            await toggleSignInSignUp(page);
            await waitForSTElement(page, "[data-supertokens~=generalError]", true);
        });

        it("Successful Sign In with no required session page", async function () {
            await toggleSignInSignUp(page);
            await defaultSignUp(page);
            consoleLogs = await clearBrowserCookiesWithoutAffectingConsole(page, consoleLogs);
            let cookies = await page.cookies();
            assert.deepStrictEqual(cookies.length, 1);
            assert.deepStrictEqual(cookies[0].name, "st-last-access-token-update");

            await Promise.all([
                page.goto(`${TEST_CLIENT_BASE_URL}/dashboard-no-auth`),
                page.waitForNavigation({ waitUntil: "networkidle0" }),
            ]);

            let text = await getTextInDashboardNoAuth(page);

            assert.strictEqual(text, "Not logged in");

            await Promise.all([
                page.goto(`${TEST_CLIENT_BASE_URL}/auth`),
                page.waitForNavigation({ waitUntil: "networkidle0" }),
            ]);
            // sign in..

            let showPasswordIcon = await getShowPasswordIcon(page);
            assert.strictEqual(showPasswordIcon, null);
            let types = await getInputTypes(page);
            assert.deepStrictEqual(types, ["email", "password"]);

            // Set correct values.
            await setInputValues(page, [
                { name: "email", value: "john.doe@supertokens.io" },
                { name: "password", value: "Str0ngP@ssw0rd" },
            ]);

            showPasswordIcon = await getShowPasswordIcon(page);
            assert.notStrictEqual(showPasswordIcon, null);

            await toggleShowPasswordIcon(page);
            types = await getInputTypes(page);
            assert.deepStrictEqual(types, ["email", "text"]);

            const adornments = await getInputAdornmentsSuccess(page);
            assert.strictEqual(adornments.length, 0);

            // Submit.
            const [{ request, response }, hasEmailExistMethodBeenCalled] = await Promise.all([
                submitFormReturnRequestAndResponse(page, SIGN_IN_API),
                hasMethodBeenCalled(page, EMAIL_EXISTS_API),
                page.waitForNavigation({ waitUntil: "networkidle0" }),
            ]);

            // Verify that email exists API has not been called.
            assert.strictEqual(hasEmailExistMethodBeenCalled, false);

            assert.strictEqual(request.headers().rid, "emailpassword");
            assert.strictEqual(
                request.postData(),
                '{"formFields":[{"id":"email","value":"john.doe@supertokens.io"},{"id":"password","value":"Str0ngP@ssw0rd"}]}'
            );

            assert.strictEqual(response.status, "OK");

            // Verify cookies were set.
            cookies = await page.cookies();
            {
                let cookieNames = cookies.map((c) => c.name);
                assert(cookieNames.filter((i) => i === "st-last-access-token-update").length === 1);
                assert(cookieNames.filter((i) => i === "sFrontToken").length === 1);
                assert(cookieNames.filter((i) => i === "sAccessToken").length === 1);
                assert(cookieNames.length === 3);
            }

            // Redirected to onSuccessFulRedirectUrl
            const onSuccessFulRedirectUrl = "/dashboard";
            let pathname = await page.evaluate(() => window.location.pathname);
            // Session.doesSessionExist returns true, allow to stay on /dashboard
            assert.deepStrictEqual(pathname, onSuccessFulRedirectUrl);

            await Promise.all([
                page.goto(`${TEST_CLIENT_BASE_URL}/dashboard-no-auth`),
                page.waitForNavigation({ waitUntil: "networkidle0" }),
            ]);

            // Test that sessionInfo was fetched successfully using axios and fetch (i.e. Interceptors work)
            const axiosUserId = await getUserIdWithAxios(page);
            const axiosSessionHandle = await getSessionHandleWithAxios(page);

            const fetchUserId = await getUserIdWithFetch(page);
            const fetchSessionHandle = await getSessionHandleWithFetch(page);

            const sessionContextInfo = await getUserIdFromSessionContext(page);

            assert.deepStrictEqual(axiosUserId, fetchUserId);
            assert.deepStrictEqual(axiosSessionHandle, fetchSessionHandle);
            assert.deepStrictEqual(sessionContextInfo, "session context userID: " + fetchUserId);

            const isUUIDRegexp = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
            assert.deepStrictEqual(isUUIDRegexp.test(axiosUserId), true);
            assert.deepStrictEqual(isUUIDRegexp.test(axiosSessionHandle), true);

            // Logout
            const logoutButton = await getLogoutButton(page);
            const [_, logoutAPICalled] = await Promise.all([
                logoutButton.click(),
                hasMethodBeenCalled(page, SIGN_OUT_API, "POST"),
            ]);
            assert(logoutAPICalled);
            await new Promise((r) => setTimeout(r, 3500));
            let text2 = await getTextInDashboardNoAuth(page);
            assert.strictEqual(text2, "Not logged in");
            await Promise.all([
                page.goto(`${TEST_CLIENT_BASE_URL}/auth`),
                page.waitForNavigation({ waitUntil: "networkidle0" }),
            ]);
            pathname = await page.evaluate(() => window.location.pathname);
            assert.deepStrictEqual(pathname, "/auth");
            cookies = await page.cookies();
            assert.deepStrictEqual(cookies.length, 1);
            assert.deepStrictEqual(cookies[0].name, "st-last-access-token-update");
            assert.deepStrictEqual(consoleLogs, [
                "ST_LOGS EMAIL_PASSWORD OVERRIDE DOES_EMAIL_EXIST",
                "ST_LOGS EMAIL_PASSWORD PRE_API_HOOKS EMAIL_EXISTS",
                "ST_LOGS EMAIL_PASSWORD OVERRIDE SIGN_UP",
                "ST_LOGS EMAIL_PASSWORD PRE_API_HOOKS EMAIL_PASSWORD_SIGN_UP",
                "ST_LOGS SESSION ON_HANDLE_EVENT SESSION_CREATED",
                "ST_LOGS SESSION OVERRIDE GET_USER_ID",
                "ST_LOGS SESSION OVERRIDE GET_JWT_PAYLOAD_SECURELY",
                "ST_LOGS EMAIL_PASSWORD ON_HANDLE_EVENT SUCCESS",
                "ST_LOGS EMAIL_PASSWORD GET_REDIRECTION_URL SUCCESS",
                "ST_LOGS SESSION OVERRIDE GET_JWT_PAYLOAD_SECURELY",
                "ST_LOGS SESSION OVERRIDE GET_USER_ID",
                "ST_LOGS SESSION OVERRIDE ADD_FETCH_INTERCEPTORS_AND_RETURN_MODIFIED_FETCH",
                "ST_LOGS SESSION OVERRIDE ADD_AXIOS_INTERCEPTORS",
                "ST_LOGS SESSION OVERRIDE ADD_FETCH_INTERCEPTORS_AND_RETURN_MODIFIED_FETCH",
                "ST_LOGS SESSION OVERRIDE ADD_AXIOS_INTERCEPTORS",
                "ST_LOGS EMAIL_PASSWORD OVERRIDE SIGN_IN",
                "ST_LOGS EMAIL_PASSWORD PRE_API_HOOKS EMAIL_PASSWORD_SIGN_IN",
                "ST_LOGS SESSION ON_HANDLE_EVENT SESSION_CREATED",
                "ST_LOGS SESSION OVERRIDE GET_USER_ID",
                "ST_LOGS SESSION OVERRIDE GET_JWT_PAYLOAD_SECURELY",
                "ST_LOGS EMAIL_PASSWORD ON_HANDLE_EVENT SUCCESS",
                "ST_LOGS EMAIL_PASSWORD GET_REDIRECTION_URL SUCCESS",
                "ST_LOGS SESSION OVERRIDE GET_JWT_PAYLOAD_SECURELY",
                "ST_LOGS SESSION OVERRIDE GET_USER_ID",
                "ST_LOGS SESSION OVERRIDE ADD_FETCH_INTERCEPTORS_AND_RETURN_MODIFIED_FETCH",
                "ST_LOGS SESSION OVERRIDE ADD_AXIOS_INTERCEPTORS",
                "ST_LOGS SESSION OVERRIDE GET_JWT_PAYLOAD_SECURELY",
                "ST_LOGS SESSION OVERRIDE GET_USER_ID",
                "ST_LOGS SESSION OVERRIDE SIGN_OUT",
                "ST_LOGS SESSION PRE_API_HOOKS SIGN_OUT",
                "ST_LOGS SESSION ON_HANDLE_EVENT SIGN_OUT",
                "ST_LOGS SESSION OVERRIDE ADD_FETCH_INTERCEPTORS_AND_RETURN_MODIFIED_FETCH",
                "ST_LOGS SESSION OVERRIDE ADD_AXIOS_INTERCEPTORS",
            ]);
        });

        it("Successful Sign In", async function () {
            consoleLogs = await clearBrowserCookiesWithoutAffectingConsole(page, consoleLogs);

            let cookies = await page.cookies();
            assert.deepStrictEqual(cookies.length, 1);
            assert.deepStrictEqual(cookies[0].name, "st-last-access-token-update");

            await Promise.all([
                page.goto(`${TEST_CLIENT_BASE_URL}/auth`),
                page.waitForNavigation({ waitUntil: "networkidle0" }),
            ]);

            let showPasswordIcon = await getShowPasswordIcon(page);
            assert.strictEqual(showPasswordIcon, null);
            let types = await getInputTypes(page);
            assert.deepStrictEqual(types, ["email", "password"]);

            // Set correct values.
            await setInputValues(page, [
                { name: "email", value: "john.doe@supertokens.io" },
                { name: "password", value: "Str0ngP@ssw0rd" },
            ]);

            showPasswordIcon = await getShowPasswordIcon(page);
            assert.notStrictEqual(showPasswordIcon, null);

            await toggleShowPasswordIcon(page);
            types = await getInputTypes(page);
            assert.deepStrictEqual(types, ["email", "text"]);

            const adornments = await getInputAdornmentsSuccess(page);
            assert.strictEqual(adornments.length, 0);

            // Submit.
            const [{ request, response }, hasEmailExistMethodBeenCalled] = await Promise.all([
                submitFormReturnRequestAndResponse(page, SIGN_IN_API),
                hasMethodBeenCalled(page, EMAIL_EXISTS_API),
                page.waitForNavigation({ waitUntil: "networkidle0" }),
            ]);

            // Verify that email exists API has not been called.
            assert.strictEqual(hasEmailExistMethodBeenCalled, false);

            assert.strictEqual(request.headers().rid, "emailpassword");
            assert.strictEqual(
                request.postData(),
                '{"formFields":[{"id":"email","value":"john.doe@supertokens.io"},{"id":"password","value":"Str0ngP@ssw0rd"}]}'
            );

            assert.strictEqual(response.status, "OK");

            // Verify cookies were set.
            cookies = await page.cookies();
            {
                let cookieNames = cookies.map((c) => c.name);
                assert(cookieNames.filter((i) => i === "st-last-access-token-update").length === 1);
                assert(cookieNames.filter((i) => i === "sFrontToken").length === 1);
                assert(cookieNames.filter((i) => i === "sAccessToken").length === 1);
                assert(cookieNames.length === 3);
            }

            // Redirected to onSuccessFulRedirectUrl
            const onSuccessFulRedirectUrl = "/dashboard";
            let pathname = await page.evaluate(() => window.location.pathname);
            // Session.doesSessionExist returns true, allow to stay on /dashboard
            assert.deepStrictEqual(pathname, onSuccessFulRedirectUrl);

            // Test that sessionInfo was fetched successfully using axios and fetch (i.e. Interceptors work)
            const axiosUserId = await getUserIdWithAxios(page);
            const axiosSessionHandle = await getSessionHandleWithAxios(page);

            const fetchUserId = await getUserIdWithFetch(page);
            const fetchSessionHandle = await getSessionHandleWithFetch(page);

            const sessionContextInfo = await getUserIdFromSessionContext(page);

            assert.deepStrictEqual(axiosUserId, fetchUserId);
            assert.deepStrictEqual(axiosSessionHandle, fetchSessionHandle);
            assert.deepStrictEqual(sessionContextInfo, "session context userID: " + fetchUserId);

            const isUUIDRegexp = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
            assert.deepStrictEqual(isUUIDRegexp.test(axiosUserId), true);
            assert.deepStrictEqual(isUUIDRegexp.test(axiosSessionHandle), true);

            // Logout
            const logoutButton = await getLogoutButton(page);
            await Promise.all([await logoutButton.click(), page.waitForNavigation({ waitUntil: "networkidle0" })]);
            pathname = await page.evaluate(() => window.location.pathname);
            assert.deepStrictEqual(pathname, "/auth");
            cookies = await page.cookies();
            assert.deepStrictEqual(cookies.length, 1);
            assert.deepStrictEqual(cookies[0].name, "st-last-access-token-update");
            assert.deepStrictEqual(consoleLogs, [
                "ST_LOGS SESSION OVERRIDE ADD_FETCH_INTERCEPTORS_AND_RETURN_MODIFIED_FETCH",
                "ST_LOGS SESSION OVERRIDE ADD_AXIOS_INTERCEPTORS",
                "ST_LOGS EMAIL_PASSWORD OVERRIDE SIGN_IN",
                "ST_LOGS EMAIL_PASSWORD PRE_API_HOOKS EMAIL_PASSWORD_SIGN_IN",
                "ST_LOGS SESSION ON_HANDLE_EVENT SESSION_CREATED",
                "ST_LOGS SESSION OVERRIDE GET_USER_ID",
                "ST_LOGS SESSION OVERRIDE GET_JWT_PAYLOAD_SECURELY",
                "ST_LOGS EMAIL_PASSWORD ON_HANDLE_EVENT SUCCESS",
                "ST_LOGS EMAIL_PASSWORD GET_REDIRECTION_URL SUCCESS",
                "ST_LOGS SESSION OVERRIDE GET_JWT_PAYLOAD_SECURELY",
                "ST_LOGS SESSION OVERRIDE GET_USER_ID",
                "ST_LOGS SESSION OVERRIDE SIGN_OUT",
                "ST_LOGS SESSION PRE_API_HOOKS SIGN_OUT",
                "ST_LOGS SESSION ON_HANDLE_EVENT SIGN_OUT",
            ]);
        });

        it("Successful Sign In with redirect to, redirectToPath directly", async function () {
            await assertSignInRedirectTo(
                page,
                `${TEST_CLIENT_BASE_URL}/auth?rid=emailpassword&redirectToPath=%2Fredirect-here`,
                `${TEST_CLIENT_BASE_URL}/redirect-here`
            );

            // test that if we visit auth again, we end up in redirect-heree again with query params kept
            await Promise.all([
                page.goto(
                    `${TEST_CLIENT_BASE_URL}/auth?rid=emailpassword&redirectToPath=%2Fredirect-heree%3Ffoo%3Dbar`
                ),
                page.waitForNavigation({ waitUntil: "networkidle0" }),
            ]);
            const { pathname, search } = await page.evaluate(() => window.location);
            assert.deepStrictEqual(pathname + search, "/redirect-heree?foo=bar");
        });

        it("Successful Sign In with redirect to, redirectToPath directly without trailing slash", async function () {
            await assertSignInRedirectTo(
                page,
                `${TEST_CLIENT_BASE_URL}/auth?rid=emailpassword&redirectToPath=redirect-here`,
                `${TEST_CLIENT_BASE_URL}/redirect-here`
            );
        });

        it("Should redirect back on access denied page's back button is clicked without react-router-dom", async function () {
            await Promise.all([
                page.goto(`${TEST_CLIENT_BASE_URL}/auth`),
                page.waitForNavigation({ waitUntil: "networkidle0" }),
            ]);
            await page.evaluate(() => {
                window.setClaimValidators([window.UserRoleClaim.validators.includes("admin")]);
            });

            // Set correct values.
            await setInputValues(page, [
                { name: "email", value: "john.doe@supertokens.io" },
                { name: "password", value: "Str0ngP@ssw0rd" },
            ]);
            await submitForm(page);
            waitForText(page, "[data-supertokens~=headerTitle]", "Access denied");
            const backBtn = await waitForSTElement(page, "[data-supertokens~=logoutButton]");
            backBtn.click();

            const redirectUrl = await page.evaluate(() => {
                return window.location.pathname + window.location.search;
            });

            assert.deepStrictEqual(redirectUrl, "/dashboard");
        });

        it("Successful Sign In with redirect to, redirectToPath directly", async function () {
            // Use only path, no open redirect.
            await assertSignInRedirectTo(
                page,
                `${TEST_CLIENT_BASE_URL}/auth?rid=emailpassword&redirectToPath=https://attacker.com/path`,
                `${TEST_CLIENT_BASE_URL}/path`
            );
        });

        it("Successful Sign In with redirect to, no reflected XSS with redirectToPath params", async function () {
            // Use only path, no open redirect.
            await assertSignInRedirectTo(
                page,
                `${TEST_CLIENT_BASE_URL}/auth?rid=emailpassword&redirectToPath=javascript:alert(1)`,
                `${TEST_CLIENT_BASE_URL}/javascript:alert(1)`
            );
        });

        it("Successful emailPassword Sign In with redirect to keeping query params", async function () {
            await Promise.all([
                page.goto(`${TEST_CLIENT_BASE_URL}/auth?redirectToPath=%2Fredirect-here%3Ffoo%3Dbar`),
                page.waitForNavigation({ waitUntil: "networkidle0" }),
            ]);

            // Set correct values.
            await setInputValues(page, [
                { name: "email", value: "john.doe@supertokens.io" },
                { name: "password", value: "Str0ngP@ssw0rd" },
            ]);

            // Submit.
            await Promise.all([
                submitFormReturnRequestAndResponse(page, SIGN_IN_API),
                page.waitForNavigation({ waitUntil: "networkidle0" }),
            ]);
            const { pathname, search } = await page.evaluate(() => window.location);
            assert.deepStrictEqual(pathname + search, "/redirect-here?foo=bar");
        });

        describe("Successful Sign In with redirect to, with EmailPasswordAuth", async function () {
            it("First sign in", async function () {
                consoleLogs = await clearBrowserCookiesWithoutAffectingConsole(page, consoleLogs);
                let cookies = await page.cookies();
                assert.deepStrictEqual(cookies.length, 1);
                assert.deepStrictEqual(cookies[0].name, "st-last-access-token-update");

                await Promise.all([
                    page.goto(`${TEST_CLIENT_BASE_URL}/redirect-to-this-custom-path`),
                    page.waitForNavigation({ waitUntil: "networkidle0" }),
                ]);

                // Set correct values.
                await setInputValues(page, [
                    { name: "email", value: "john.doe@supertokens.io" },
                    { name: "password", value: "Str0ngP@ssw0rd" },
                ]);
                // Submit.
                await Promise.all([
                    submitFormReturnRequestAndResponse(page, SIGN_IN_API),
                    page.waitForNavigation({ waitUntil: "networkidle0" }),
                ]);
                const pathname = await page.evaluate(() => window.location.pathname);
                assert.deepStrictEqual(pathname, "/redirect-to-this-custom-path");
                assert.deepStrictEqual(consoleLogs, [
                    "ST_LOGS SESSION OVERRIDE ADD_FETCH_INTERCEPTORS_AND_RETURN_MODIFIED_FETCH",
                    "ST_LOGS SESSION OVERRIDE ADD_AXIOS_INTERCEPTORS",
                    "ST_LOGS SUPERTOKENS GET_REDIRECTION_URL TO_AUTH",
                    "ST_LOGS EMAIL_PASSWORD OVERRIDE SIGN_IN",
                    "ST_LOGS EMAIL_PASSWORD PRE_API_HOOKS EMAIL_PASSWORD_SIGN_IN",
                    "ST_LOGS SESSION ON_HANDLE_EVENT SESSION_CREATED",
                    "ST_LOGS SESSION OVERRIDE GET_USER_ID",
                    "ST_LOGS SESSION OVERRIDE GET_JWT_PAYLOAD_SECURELY",
                    "ST_LOGS EMAIL_PASSWORD ON_HANDLE_EVENT SUCCESS",
                    "ST_LOGS EMAIL_PASSWORD GET_REDIRECTION_URL SUCCESS",
                    "ST_LOGS SESSION OVERRIDE GET_JWT_PAYLOAD_SECURELY",
                    "ST_LOGS SESSION OVERRIDE GET_USER_ID",
                ]);
            });

            it("Test case sensitive redirect", async function () {
                consoleLogs = await clearBrowserCookiesWithoutAffectingConsole(page, consoleLogs);
                let cookies = await page.cookies();
                assert.deepStrictEqual(cookies.length, 1);
                assert.deepStrictEqual(cookies[0].name, "st-last-access-token-update");

                await Promise.all([
                    page.goto(`${TEST_CLIENT_BASE_URL}/CasE/Case-SensItive1-PAth`),
                    page.waitForNavigation({ waitUntil: "networkidle0" }),
                ]);

                // Set correct values.
                await setInputValues(page, [
                    { name: "email", value: "john.doe@supertokens.io" },
                    { name: "password", value: "Str0ngP@ssw0rd" },
                ]);
                // Submit.
                await Promise.all([
                    submitFormReturnRequestAndResponse(page, SIGN_IN_API),
                    page.waitForNavigation({ waitUntil: "networkidle0" }),
                ]);
                const pathname = await page.evaluate(() => window.location.pathname);
                assert.deepStrictEqual(pathname, "/CasE/Case-SensItive1-PAth");
                assert.deepStrictEqual(consoleLogs, [
                    "ST_LOGS SESSION OVERRIDE ADD_FETCH_INTERCEPTORS_AND_RETURN_MODIFIED_FETCH",
                    "ST_LOGS SESSION OVERRIDE ADD_AXIOS_INTERCEPTORS",
                    "ST_LOGS SUPERTOKENS GET_REDIRECTION_URL TO_AUTH",
                    "ST_LOGS EMAIL_PASSWORD OVERRIDE SIGN_IN",
                    "ST_LOGS EMAIL_PASSWORD PRE_API_HOOKS EMAIL_PASSWORD_SIGN_IN",
                    "ST_LOGS SESSION ON_HANDLE_EVENT SESSION_CREATED",
                    "ST_LOGS SESSION OVERRIDE GET_USER_ID",
                    "ST_LOGS SESSION OVERRIDE GET_JWT_PAYLOAD_SECURELY",
                    "ST_LOGS EMAIL_PASSWORD ON_HANDLE_EVENT SUCCESS",
                    "ST_LOGS EMAIL_PASSWORD GET_REDIRECTION_URL SUCCESS",
                    "ST_LOGS SESSION OVERRIDE GET_JWT_PAYLOAD_SECURELY",
                    "ST_LOGS SESSION OVERRIDE GET_USER_ID",
                ]);
            });

            it("Login in again without redirectToPath params, make sure redirectToPath was clean up from session storage", async function () {
                await Promise.all([
                    page.goto(`${TEST_CLIENT_BASE_URL}/auth`),
                    page.waitForNavigation({ waitUntil: "networkidle0" }),
                ]);
                // Login again will not redirect to custom path.

                // Set correct values.
                await setInputValues(page, [
                    { name: "email", value: "john.doe@supertokens.io" },
                    { name: "password", value: "Str0ngP@ssw0rd" },
                ]);

                // Submit.
                await Promise.all([
                    submitFormReturnRequestAndResponse(page, SIGN_IN_API),
                    page.waitForNavigation({ waitUntil: "networkidle0" }),
                ]);

                const pathname = await page.evaluate(() => window.location.pathname);
                assert.deepStrictEqual(pathname, "/dashboard");
            });
        });
    });
});

describe("SuperTokens SignIn => Server Error", function () {
    let browser;
    let page;
    let consoleLogs;

    before(async function () {
        browser = await puppeteer.launch({
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
            headless: true,
        });
    });

    after(async function () {
        await browser.close();
    });

    beforeEach(async function () {
        page = await browser.newPage();
        consoleLogs = await clearBrowserCookiesWithoutAffectingConsole(page, []);
        page.on("console", (consoleObj) => {
            const log = consoleObj.text();
            if (log.startsWith("ST_LOGS")) {
                consoleLogs.push(log);
            }
        });

        await page.evaluate(() => localStorage.removeItem("SHOW_GENERAL_ERROR"));
        await page.evaluate(() => localStorage.removeItem("TRANSLATED_GENERAL_ERROR"));
    });

    it("Server Error shows Something went wrong network error", async function () {
        await setInputValues(page, [
            { name: "email", value: "john.doe@supertokens.io" },
            { name: "password", value: "Str0ngP@ssw0rd" },
        ]);

        await submitForm(page);

        await page.waitForResponse((response) => {
            return response.url() === SIGN_IN_API && response.status() === 500;
        });

        // Assert server Error
        const generalError = await getGeneralError(page);
        assert.strictEqual(generalError, SOMETHING_WENT_WRONG_ERROR);
        assert.deepStrictEqual(consoleLogs, [
            "ST_LOGS EMAIL_PASSWORD OVERRIDE SIGN_IN",
            "ST_LOGS EMAIL_PASSWORD PRE_API_HOOKS EMAIL_PASSWORD_SIGN_IN",
        ]);
    });

    it("shows translated general error", async function () {
        if (!(await isGeneralErrorSupported())) {
            this.skip();
        }

        await setGeneralErrorToLocalStorage("EMAIL_PASSWORD", "EMAIL_PASSWORD_SIGN_IN", page);
        await page.evaluate(() =>
            localStorage.setItem("TRANSLATED_GENERAL_ERROR", "EMAIL_PASSWORD_SIGN_UP_FOOTER_TOS")
        );

        await setInputValues(page, [
            { name: "email", value: "john.doe@supertokens.io" },
            { name: "password", value: "Str0ngP@ssw0rd" },
        ]);

        await submitForm(page);

        // Assert server Error
        const generalError = await getGeneralError(page);
        assert.strictEqual(generalError, "Terms of Service");
    });

    it("shows raw message for non-translation key general error", async function () {
        if (!(await isGeneralErrorSupported())) {
            this.skip();
        }

        await setGeneralErrorToLocalStorage("EMAIL_PASSWORD", "EMAIL_PASSWORD_SIGN_IN", page);

        await setInputValues(page, [
            { name: "email", value: "john.doe@supertokens.io" },
            { name: "password", value: "Str0ngP@ssw0rd" },
        ]);

        await submitForm(page);

        // Assert server Error
        const generalError = await getGeneralError(page);
        assert.strictEqual(generalError, "general error from API sign in");
    });

    it("shows translated field error", async function () {
        await setInputValues(page, [
            { name: "email", value: "john.doe@supertokens.io" },
            { name: "password", value: "Str0ngP@ssw0rd" },
        ]);

        await page.setRequestInterception(true);
        const requestHandler = (request) => {
            if (request.method() === "POST" && request.url() === SIGN_IN_API) {
                request.respond({
                    status: 200,
                    contentType: "application/json",
                    headers: {
                        "access-control-allow-origin": TEST_CLIENT_BASE_URL,
                        "access-control-allow-credentials": "true",
                    },
                    body: JSON.stringify({
                        status: "FIELD_ERROR",
                        formFields: [
                            {
                                id: "email",
                                error: "EMAIL_PASSWORD_SIGN_UP_FOOTER_TOS",
                            },
                        ],
                    }),
                });
                page.off("request", requestHandler);
                page.setRequestInterception(false);
            } else {
                request.continue();
            }
        };
        page.on("request", requestHandler);

        await submitForm(page);

        await waitForSTElement(page, "[data-supertokens~='inputErrorMessage']");
        // Assert server Error
        let formFieldsErrors = await getFieldErrors(page);
        assert.deepStrictEqual(formFieldsErrors, ["Terms of Service"]);
    });

    it("shows raw message for non-translation key field error", async function () {
        await setInputValues(page, [
            { name: "email", value: "john.doe@supertokens.io" },
            { name: "password", value: "Str0ngP@ssw0rd" },
        ]);

        await page.setRequestInterception(true);
        const requestHandler = (request) => {
            if (request.method() === "POST" && request.url() === SIGN_IN_API) {
                request.respond({
                    status: 200,
                    contentType: "application/json",
                    headers: {
                        "access-control-allow-origin": TEST_CLIENT_BASE_URL,
                        "access-control-allow-credentials": "true",
                    },
                    body: JSON.stringify({
                        status: "FIELD_ERROR",
                        formFields: [
                            {
                                id: "email",
                                error: "Test message!!!!",
                            },
                        ],
                    }),
                });
                page.off("request", requestHandler);
                page.setRequestInterception(false);
            } else {
                request.continue();
            }
        };
        page.on("request", requestHandler);

        await submitForm(page);

        // Assert server Error
        await waitForSTElement(page, "[data-supertokens~='inputErrorMessage']");
        let formFieldsErrors = await getFieldErrors(page);
        assert.deepStrictEqual(formFieldsErrors, ["Test message!!!!"]);
    });
});

async function assertSignInRedirectTo(page, startUrl, finalUrl) {
    await clearBrowserCookiesWithoutAffectingConsole(page, []);
    await Promise.all([page.goto(startUrl), page.waitForNavigation({ waitUntil: "networkidle0" })]);

    // Set correct values.
    await setInputValues(page, [
        { name: "email", value: "john.doe@supertokens.io" },
        { name: "password", value: "Str0ngP@ssw0rd" },
    ]);

    // Submit.
    await Promise.all([
        submitFormReturnRequestAndResponse(page, SIGN_IN_API),
        page.waitForNavigation({ waitUntil: "networkidle0" }),
    ]);

    let href = await page.evaluate(() => window.location.href);
    assert.deepStrictEqual(href, finalUrl);
}
