import * as React from "react";
import "./App.css";
import SuperTokens, { SuperTokensWrapper } from "../../../";
import { getSuperTokensRoutesForReactRouterDom } from "../../../ui";
import EmailPassword, {
    EmailPasswordComponentsOverrideProvider,
    GetRedirectionURLContext as EmailPasswordGetRedirectionURLContext,
    OnHandleEventContext as EmailPasswordOnHandleEventContext,
    PreAPIHookContext as EmailPasswordPreAPIHookContext,
} from "../../../recipe/emailpassword";
import Session, { SessionAuth } from "../../../recipe/session";
import Multitenancy, { AllowedDomainsClaim } from "../../../recipe/multitenancy";
import ThirdParty, {
    GetRedirectionURLContext as ThirdPartyGetRedirectionURLContext,
    OnHandleEventContext as ThirdPartyOnHandleEventContext,
    PreAPIHookContext as ThirdPartyPreAPIHookContext,
    ThirdpartyComponentsOverrideProvider,
} from "../../../recipe/thirdparty";
import ThirdPartyEmailPassword, {
    GetRedirectionURLContext as ThirdPartyEmailPasswordGetRedirectionURLContext,
    OnHandleEventContext as ThirdPartyEmailPasswordOnHandleEventContext,
    PreAPIHookContext as ThirdPartyEmailPasswordPreAPIHookContext,
    ThirdpartyEmailPasswordComponentsOverrideProvider,
} from "../../../recipe/thirdpartyemailpassword";
import Home from "./Home";
import { Routes, BrowserRouter as Router, Route } from "react-router-dom";
import Footer from "./Footer";
import HeliumTheme from "./Themes/Helium";
import HydrogenTheme from "./Themes/Hydrogen";
import DarkTheme from "./Themes/Dark";
import Passwordless from "../../../recipe/passwordless";
import { PasswordlessFlowType } from "supertokens-web-js/recipe/passwordless/types";
import ThirdPartyPasswordless from "../../../recipe/thirdpartypasswordless";
import { PermissionClaim, UserRoleClaim } from "../../../recipe/userroles";
import { ThirdPartyPreBuiltUI } from "../../../recipe/thirdparty/prebuiltui";
import { ThirdPartyEmailPasswordPreBuiltUI } from "../../../recipe/thirdpartyemailpassword/prebuiltui";
import { EmailPasswordPreBuiltUI } from "../../../recipe/emailpassword/prebuiltui";
import { AccessDeniedScreen } from "../../../recipe/session/prebuiltui";
import EmailVerification from "../../../recipe/emailverification";

/*
 * This application is used with the purpose of illustrating Supertokens with typescript.
 * It is also used internally for deploy previews, hence a lot of code you will see
 * in this file is not directly linked to initialising SuperTokens in a typescript environement.
 */

export function getApiDomain() {
    const apiPort = process.env.REACT_APP_API_PORT || 8082;
    const apiUrl = process.env.REACT_APP_API_URL || `http://localhost:${apiPort}`;
    return apiUrl;
}

export function getWebsiteDomain() {
    const websitePort = process.env.REACT_APP_WEBSITE_PORT || 3002;
    const websiteUrl = process.env.REACT_APP_WEBSITE_URL || `http://localhost:${websitePort}`;
    return websiteUrl;
}

const ridParams = getQueryParams("rid");
if (ridParams !== null) {
    window.localStorage.setItem("rid", ridParams);
}

const mode = getQueryParams("mode");

if (mode !== null) {
    window.localStorage.setItem("mode", mode);
}

const themeQueryParams = getQueryParams("theme");
if (themeQueryParams !== null) {
    window.localStorage.setItem("useTheme", themeQueryParams);
}

const theme = getTheme();

const rid = window.localStorage.getItem("rid") || "emailpassword";

const recipeList = getRecipeList();

SuperTokens.init({
    appInfo: {
        appName: "SuperTokens Demo App",
        apiDomain: getApiDomain(),
        websiteDomain: window.location.origin,
    },
    async getRedirectionURL(context) {
        if (context.action === "TO_AUTH") {
            return "/auth";
        }
        return undefined;
    },
    recipeList,
});

function App() {
    return (
        <SuperTokensWrapper>
            <EmailPasswordComponentsOverrideProvider
                components={{
                    EmailPasswordSignIn_Override: ({ DefaultComponent, ...props }) => {
                        return (
                            <div>
                                <DefaultComponent {...props} />
                            </div>
                        );
                    },
                    EmailPasswordSignInHeader_Override: ({ DefaultComponent, ...props }) => {
                        return (
                            <div>
                                <DefaultComponent {...props} />
                            </div>
                        );
                    },
                    EmailPasswordSubmitNewPassword_Override: ({ DefaultComponent, ...props }) => {
                        return (
                            <div>
                                <DefaultComponent {...props} />
                            </div>
                        );
                    },
                }}>
                <ThirdpartyComponentsOverrideProvider
                    components={{
                        ThirdPartySignInAndUpCallbackTheme_Override: ({ DefaultComponent }) => {
                            return (
                                <div>
                                    <DefaultComponent />
                                </div>
                            );
                        },
                    }}>
                    <ThirdpartyEmailPasswordComponentsOverrideProvider
                        components={{
                            ThirdPartySignInAndUpProvidersForm_Override: ({ DefaultComponent, ...props }) => {
                                return (
                                    <div>
                                        <DefaultComponent {...props} />
                                    </div>
                                );
                            },
                            EmailPasswordResetPasswordEmail_Override: ({ DefaultComponent, ...props }) => {
                                return (
                                    <div>
                                        <DefaultComponent {...props} />
                                    </div>
                                );
                            },
                        }}>
                        <div className="App">
                            <Router>
                                <div className="fill">
                                    <Routes>
                                        {getSuperTokensRoutesForReactRouterDom(require("react-router-dom"), [
                                            ThirdPartyPreBuiltUI,
                                            ThirdPartyEmailPasswordPreBuiltUI,
                                            EmailPasswordPreBuiltUI,
                                        ])}
                                        <Route
                                            path="/"
                                            element={
                                                <SessionAuth
                                                    doRedirection={true}
                                                    requireAuth={true}
                                                    overrideGlobalClaimValidators={(o) => [
                                                        ...o,
                                                        UserRoleClaim.validators.includes("admin"),
                                                        PermissionClaim.validators.excludesAll([
                                                            "delete_user",
                                                            "delete_post",
                                                        ]),
                                                        AllowedDomainsClaim.validators.hasAccessToCurrentDomain(),
                                                        Multitenancy.AllowedDomainsClaim.validators.includes(
                                                            "asdf.com"
                                                        ),
                                                    ]}
                                                    accessDeniedScreen={({ validationError }) => (
                                                        <div>{JSON.stringify(validationError)}</div>
                                                    )}>
                                                    <Home />
                                                </SessionAuth>
                                            }
                                        />
                                        <Route
                                            path="/redirect-to-this-custom-path"
                                            element={
                                                <SessionAuth requireAuth={true}>
                                                    <Home />
                                                </SessionAuth>
                                            }
                                        />
                                        <Route
                                            path="/no-redirection-sign-in"
                                            element={
                                                <EmailPasswordPreBuiltUI.SignInAndUp redirectOnSessionExists={false} />
                                            }
                                        />
                                        <Route
                                            path="/no-redirection-sign-in-with-children"
                                            element={
                                                <EmailPasswordPreBuiltUI.SignInAndUp redirectOnSessionExists={false}>
                                                    <Home />
                                                </EmailPasswordPreBuiltUI.SignInAndUp>
                                            }
                                        />
                                    </Routes>
                                </div>
                                <div className="footer">
                                    <Footer />
                                </div>
                            </Router>
                        </div>
                    </ThirdpartyEmailPasswordComponentsOverrideProvider>
                </ThirdpartyComponentsOverrideProvider>
            </EmailPasswordComponentsOverrideProvider>
        </SuperTokensWrapper>
    );
}

export default App;

function getQueryParams(param: string): string | null {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

export type Theme = {
    colors: Record<string, string>;
    style: Record<string, any>;
};
function getTheme(): {
    colors: Record<string, string>;
    style?: string;
} {
    let theme = {
        colors: {},
        style: "",
    };

    const themeParams = window.localStorage.getItem("useTheme");

    if (themeParams === "dark") {
        window.document.body.style.backgroundColor = "#1a1a1a";
        return DarkTheme;
    }

    if (themeParams === "helium") {
        // return HeliumTheme;
    }

    if (themeParams === "hydrogen") {
        // return HydrogenTheme;
    }

    return theme;
}

function getRecipeList() {
    return [
        getEmailPasswordConfigs(),
        getThirdPartyConfigs(),
        getThirdPartyEmailPasswordConfigs(),
        Session.init(),
        Session.init({
            autoAddCredentials: true,
            isInIframe: true,
            sessionExpiredStatusCode: 401,
            sessionTokenFrontendDomain: "",
            sessionTokenBackendDomain: "",
            onHandleEvent: (context) => {
                if (context.action === "REFRESH_SESSION") {
                } else if (context.action === "SIGN_OUT") {
                } else if (context.action === "API_INVALID_CLAIM") {
                } else if (context.action === "UNAUTHORISED") {
                    if (context.sessionExpiredOrRevoked) {
                    }
                } else if (context.action === "ACCESS_TOKEN_PAYLOAD_UPDATED") {
                }
            },
            preAPIHook: async (context) => {
                if (context.action === "REFRESH_SESSION") {
                } else if (context.action === "SIGN_OUT") {
                }
                return context;
            },
            override: {
                functions: (oI) => {
                    return {
                        addAxiosInterceptors: (instance) => {
                            return oI.addAxiosInterceptors(instance);
                        },
                        addXMLHttpRequestInterceptor: (input) => {
                            return oI.addXMLHttpRequestInterceptor(input);
                        },
                        addFetchInterceptorsAndReturnModifiedFetch: (f) => {
                            return oI.addFetchInterceptorsAndReturnModifiedFetch(f);
                        },
                        doesSessionExist: (input) => {
                            return oI.doesSessionExist(input);
                        },
                        getAccessTokenPayloadSecurely: (input) => {
                            return oI.getAccessTokenPayloadSecurely(input);
                        },
                        getUserId: (config) => {
                            return oI.getUserId(config);
                        },
                        signOut: (config) => {
                            return oI.signOut(config);
                        },
                        getGlobalClaimValidators: (input) => {
                            return oI.getGlobalClaimValidators(input);
                        },
                        getInvalidClaimsFromResponse: (input) => {
                            return oI.getInvalidClaimsFromResponse(input);
                        },
                        validateClaims: (input) => {
                            return oI.validateClaims(input);
                        },
                        shouldDoInterceptionBasedOnUrl: (...input) => {
                            return oI.shouldDoInterceptionBasedOnUrl(...input);
                        },
                    };
                },
            },
        }),
    ];
}

function getEmailPasswordConfigs() {
    return EmailPassword.init({
        resetPasswordUsingTokenFeature: {
            enterEmailForm: {
                style: theme.style,
            },
            submitNewPasswordForm: {
                style: theme.style,
            },
        },
        signInAndUpFeature: {
            signInForm: {
                style: theme.style,
            },
            signUpForm: {
                style: theme.style,
                privacyPolicyLink: "https://supertokens.io/legal/privacy-policy",
                termsOfServiceLink: "https://supertokens.io/legal/terms-and-conditions",
                formFields: [
                    {
                        id: "email",
                        label: "Your Email",
                        placeholder: "Your work email",
                    },
                    {
                        id: "name",
                        label: "Full name",
                        placeholder: "First name and last name",
                    },
                    {
                        id: "age",
                        label: "Your age",
                        placeholder: "How old are you?",
                        validate: async (value) => {
                            if (parseInt(value) > 18) {
                                return undefined;
                            }

                            return "You must be over 18 to register";
                        },
                    },
                    {
                        id: "country",
                        label: "Your Country",
                        placeholder: "Where do you live?",
                        optional: true,
                    },
                ],
            },
        },

        onHandleEvent(context: EmailPasswordOnHandleEventContext) {
            if (context.action === "SUCCESS") {
                if (context.isNewRecipeUser && context.user.loginMethods.length === 1) {
                    // new primary user
                } else {
                    // only a recipe user was created
                }
            }
        },

        async preAPIHook(context: EmailPasswordPreAPIHookContext) {
            return context;
        },

        async getRedirectionURL(context: EmailPasswordGetRedirectionURLContext) {
            if (context.action === "SUCCESS") {
                if (context.isNewRecipeUser && context.user.loginMethods.length === 1) {
                    // new primary user
                } else {
                    // only a recipe user was created
                }
            }
            return undefined;
        },
        override: {
            functions: (oI) => {
                return {
                    ...oI,
                    doesEmailExist: (input) => {
                        return oI.doesEmailExist(input);
                    },
                    sendPasswordResetEmail: (input) => {
                        return oI.sendPasswordResetEmail(input);
                    },
                    signIn: (input) => {
                        return oI.signIn(input);
                    },
                    signUp: (input) => {
                        return oI.signUp(input);
                    },
                    submitNewPassword: (input) => {
                        return oI.submitNewPassword(input);
                    },
                };
            },
        },
    });
}
function getThirdPartyConfigs() {
    return ThirdParty.init({
        onHandleEvent(context: ThirdPartyOnHandleEventContext) {},

        async preAPIHook(context: ThirdPartyPreAPIHookContext) {
            return context;
        },

        async getRedirectionURL(context: ThirdPartyGetRedirectionURLContext) {
            return undefined;
        },
        signInAndUpFeature: {
            style: theme.style,
            privacyPolicyLink: "https://supertokens.io/legal/privacy-policy",
            termsOfServiceLink: "https://supertokens.io/legal/terms-and-conditions",
            providers: [
                ThirdParty.Github.init(),
                ThirdParty.Google.init({
                    id: "some client ID",
                    buttonComponent: ({ name }) => <span>ASDF {name}</span>,
                }),
                ThirdParty.Facebook.init(),
                ThirdParty.Apple.init(),
                {
                    id: "custom",
                    name: "Custom",
                    buttonComponent: <span>ASDF Custom</span>,
                },
                {
                    id: "custom-2",
                    name: "Custom-2",
                    logo: <svg></svg>,
                    buttonComponent: <span>ASDF Custom</span>,
                },
            ],
        },
        oAuthCallbackScreen: {
            style: theme.style,
        },
        override: {
            functions: (oI) => {
                return {
                    ...oI,
                };
            },
        },
    });
}

function getThirdPartyEmailPasswordConfigs() {
    return ThirdPartyEmailPassword.init({
        onHandleEvent(context: ThirdPartyEmailPasswordOnHandleEventContext) {},

        async preAPIHook(context: ThirdPartyEmailPasswordPreAPIHookContext) {
            return context;
        },

        async getRedirectionURL(context: ThirdPartyEmailPasswordGetRedirectionURLContext) {
            return undefined;
        },
        signInAndUpFeature: {
            style: theme.style,
            signUpForm: {
                privacyPolicyLink: "https://supertokens.io/legal/privacy-policy",
                termsOfServiceLink: "https://supertokens.io/legal/terms-and-conditions",
            },
            providers: [
                ThirdPartyEmailPassword.Github.init(),
                ThirdPartyEmailPassword.Google.init(),
                ThirdPartyEmailPassword.Facebook.init(),
                ThirdPartyEmailPassword.Apple.init(),
                {
                    id: "custom",
                    name: "Custom",
                    logo: <svg></svg>,
                },
                {
                    id: "custom-2",
                    name: "Custom-2",
                },
            ],
        },
        oAuthCallbackScreen: {
            style: theme.style,
        },
    });
}

Passwordless.init({
    contactMethod: "EMAIL",
    preAPIHook: async (context) => {
        let url = context.url;

        // is the fetch config object that contains the header, body etc..
        let requestInit = context.requestInit;

        let action = context.action;
        if (action === "EMAIL_EXISTS") {
        } else if (action === "PASSWORDLESS_CONSUME_CODE") {
        } else if (action === "PASSWORDLESS_CREATE_CODE") {
        } else if (action === "PASSWORDLESS_RESEND_CODE") {
        } else if (action === "PHONE_NUMBER_EXISTS") {
        }

        // events such as sign out are in the
        // session recipe pre API hook (See the info box below)
        return {
            requestInit,
            url,
        };
    },
    onHandleEvent: (context) => {
        if (context.action === "PASSWORDLESS_CODE_SENT") {
        } else if (context.action === "PASSWORDLESS_RESTART_FLOW") {
        } else if (context.action === "SESSION_ALREADY_EXISTS") {
            // called when a user visits the login / sign up page with a valid session
            // in this case, they are usually redirected to the main app
        } else if (context.action === "SUCCESS") {
            let user = context.user;
            if (context.isNewRecipeUser) {
                // sign up success
            } else {
                // sign in success
            }
        }
    },
    getRedirectionURL: async (context) => {
        // return undefined to let the default behaviour play out
        return undefined;
    },
});

function SomeComponent(props: any) {
    return (
        <SessionAuth>
            <div></div>
            <div></div>
        </SessionAuth>
    );
}

/**
 * Recipe Index Functions
 */

// Email password
EmailPassword.doesEmailExist({
    email: "",
    options: {
        preAPIHook: undefined,
    },
    userContext: undefined,
});
// @ts-expect-error
EmailPassword.doesEmailExist();
// @ts-expect-error
EmailPassword.doesEmailExist(undefined);

EmailPassword.getResetPasswordTokenFromURL({
    userContext: undefined,
});
EmailPassword.getResetPasswordTokenFromURL(undefined);
EmailPassword.getResetPasswordTokenFromURL();

EmailPassword.sendPasswordResetEmail({
    userContext: undefined,
    options: {
        preAPIHook: undefined,
    },
    formFields: [
        {
            id: "",
            value: "",
        },
    ],
});
//@ts-expect-error
EmailPassword.sendPasswordResetEmail(undefined);
//@ts-expect-error
EmailPassword.sendPasswordResetEmail();

EmailPassword.signIn({
    userContext: undefined,
    options: {
        preAPIHook: undefined,
    },
    formFields: [
        {
            id: "",
            value: "",
        },
    ],
});
// @ts-expect-error
EmailPassword.signIn(undefined);
// @ts-expect-error
EmailPassword.signIn();

EmailPassword.signOut({
    userContext: undefined,
});
EmailPassword.signOut(undefined);
EmailPassword.signOut();

EmailPassword.signUp({
    userContext: undefined,
    options: {
        preAPIHook: undefined,
    },
    formFields: [
        {
            id: "",
            value: "",
        },
    ],
});
// @ts-expect-error
EmailPassword.signUp(undefined);
// @ts-expect-error
EmailPassword.signUp();

EmailPassword.submitNewPassword({
    userContext: undefined,
    options: {
        preAPIHook: undefined,
    },
    formFields: [
        {
            id: "",
            value: "",
        },
    ],
});
// @ts-expect-error
EmailPassword.submitNewPassword(undefined);
// @ts-expect-error
EmailPassword.submitNewPassword();

// Passwordless
Passwordless.clearLoginAttemptInfo({
    userContext: undefined,
});
Passwordless.clearLoginAttemptInfo(undefined);
Passwordless.clearLoginAttemptInfo();

Passwordless.consumeCode({
    userInputCode: "",
    options: {
        preAPIHook: undefined,
    },
    userContext: undefined,
});
Passwordless.consumeCode({
    userContext: undefined,
    options: {
        preAPIHook: undefined,
    },
});
Passwordless.consumeCode(undefined);
Passwordless.consumeCode();

Passwordless.createCode({
    email: "",
    options: {
        preAPIHook: undefined,
    },
    userContext: undefined,
});
Passwordless.createCode({
    phoneNumber: "",
    options: {
        preAPIHook: undefined,
    },
    userContext: undefined,
});
Passwordless.createCode({
    email: "",
    phoneNumber: "",
    options: {
        preAPIHook: undefined,
    },
    userContext: undefined,
});
// @ts-expect-error
Passwordless.createCode(undefined);
// @ts-expect-error
Passwordless.createCode();

Passwordless.doesEmailExist({
    email: "",
    userContext: undefined,
    options: {
        preAPIHook: undefined,
    },
});
// @ts-expect-error
Passwordless.doesEmailExist(undefined);
// @ts-expect-error
Passwordless.doesEmailExist();

Passwordless.doesPhoneNumberExist({
    phoneNumber: "",
    userContext: undefined,
    options: {
        preAPIHook: undefined,
    },
});
// @ts-expect-error
Passwordless.doesPhoneNumberExist(undefined);
// @ts-expect-error
Passwordless.doesPhoneNumberExist();

Passwordless.getLinkCodeFromURL({
    userContext: undefined,
});
Passwordless.getLinkCodeFromURL(undefined);
Passwordless.getLinkCodeFromURL();

async function getLoginAttemptInfo() {
    // @ts-expect-error
    const incorrectCustomType:
        | {
              deviceId: string;
              preAuthSessionId: string;
              flowType: PasswordlessFlowType;
              customData: string;
          }
        | undefined = await Passwordless.getLoginAttemptInfo<{
        customData: number;
    }>({
        userContext: undefined,
    });

    const correctCustomType:
        | {
              deviceId: string;
              preAuthSessionId: string;
              flowType: PasswordlessFlowType;
              customData: string;
          }
        | undefined = await Passwordless.getLoginAttemptInfo<{
        customData: string;
    }>(undefined);

    const defaultType:
        | {
              deviceId: string;
              preAuthSessionId: string;
              flowType: PasswordlessFlowType;
          }
        | undefined = await Passwordless.getLoginAttemptInfo();
}

Passwordless.getPreAuthSessionIdFromURL({
    userContext: undefined,
});
Passwordless.getPreAuthSessionIdFromURL(undefined);
Passwordless.getPreAuthSessionIdFromURL();

Passwordless.resendCode({
    userContext: undefined,
    options: {
        preAPIHook: undefined,
    },
});
Passwordless.resendCode(undefined);
Passwordless.resendCode();

Passwordless.setLoginAttemptInfo({
    attemptInfo: {
        deviceId: "",
        preAuthSessionId: "",
        flowType: "USER_INPUT_CODE",
    },
    userContext: undefined,
});
Passwordless.setLoginAttemptInfo({
    attemptInfo: {
        deviceId: "",
        preAuthSessionId: "",
        flowType: "MAGIC_LINK",
    },
    userContext: undefined,
});
Passwordless.setLoginAttemptInfo({
    attemptInfo: {
        deviceId: "",
        preAuthSessionId: "",
        flowType: "USER_INPUT_CODE_AND_MAGIC_LINK",
    },
    userContext: undefined,
});
Passwordless.setLoginAttemptInfo<{
    customData: string;
}>({
    // @ts-expect-error
    attemptInfo: {
        deviceId: "",
        preAuthSessionId: "",
        flowType: "USER_INPUT_CODE_AND_MAGIC_LINK",
    },
    userContext: undefined,
});
Passwordless.setLoginAttemptInfo<{
    customData: string;
}>({
    attemptInfo: {
        deviceId: "",
        preAuthSessionId: "",
        flowType: "USER_INPUT_CODE_AND_MAGIC_LINK",
        // @ts-expect-error
        customData: 123,
    },
    userContext: undefined,
});
Passwordless.setLoginAttemptInfo<{
    customData: string;
}>({
    attemptInfo: {
        deviceId: "",
        preAuthSessionId: "",
        flowType: "USER_INPUT_CODE_AND_MAGIC_LINK",
        customData: "",
    },
    userContext: undefined,
});
// @ts-expect-error
Passwordless.setLoginAttemptInfo(undefined);
// @ts-expect-error
Passwordless.setLoginAttemptInfo();

Passwordless.signOut({
    userContext: undefined,
});
Passwordless.signOut(undefined);
Passwordless.signOut();

// Third party
// @ts-expect-error
ThirdParty.getAuthorisationURLFromBackend(undefined);
// @ts-expect-error
ThirdParty.getAuthorisationURLFromBackend();

ThirdParty.getAuthorisationURLWithQueryParamsAndSetState({
    thirdPartyId: "",
    frontendRedirectURI: "",
    redirectURIOnProviderDashboard: undefined,
    userContext: undefined,
    options: {
        preAPIHook: undefined,
    },
});
// @ts-expect-error
ThirdParty.getAuthorisationURLWithQueryParamsAndSetState(undefined);
// @ts-expect-error
ThirdParty.getAuthorisationURLWithQueryParamsAndSetState();

ThirdParty.signInAndUp({
    userContext: undefined,
    options: {
        preAPIHook: undefined,
    },
});
ThirdParty.signInAndUp(undefined);
ThirdParty.signInAndUp();

ThirdParty.signOut({
    userContext: undefined,
});
ThirdParty.signOut(undefined);
ThirdParty.signOut();

// TPEP
ThirdPartyEmailPassword.doesEmailExist({
    email: "",
    options: {
        preAPIHook: undefined,
    },
    userContext: undefined,
});
// @ts-expect-error
ThirdPartyEmailPassword.doesEmailExist(undefined);
// @ts-expect-error
ThirdPartyEmailPassword.doesEmailExist();

ThirdPartyEmailPassword.emailPasswordSignIn({
    userContext: undefined,
    options: {
        preAPIHook: undefined,
    },
    formFields: [
        {
            id: "",
            value: "",
        },
    ],
});
// @ts-expect-error
ThirdPartyEmailPassword.emailPasswordSignIn(undefined);
// @ts-expect-error
ThirdPartyEmailPassword.emailPasswordSignIn();

ThirdPartyEmailPassword.emailPasswordSignUp({
    userContext: undefined,
    options: {
        preAPIHook: undefined,
    },
    formFields: [
        {
            id: "",
            value: "",
        },
    ],
});
// @ts-expect-error
ThirdPartyEmailPassword.emailPasswordSignUp(undefined);
// @ts-expect-error
ThirdPartyEmailPassword.emailPasswordSignUp();

// @ts-expect-error
ThirdPartyEmailPassword.getAuthorisationURLFromBackend(undefined);
// @ts-expect-error
ThirdPartyEmailPassword.getAuthorisationURLFromBackend();

ThirdPartyEmailPassword.getAuthorisationURLWithQueryParamsAndSetState({
    thirdPartyId: "",
    frontendRedirectURI: "",
    redirectURIOnProviderDashboard: undefined,
    userContext: undefined,
    options: {
        preAPIHook: undefined,
    },
});
// @ts-expect-error
ThirdPartyEmailPassword.getAuthorisationURLWithQueryParamsAndSetState(undefined);
// @ts-expect-error
ThirdPartyEmailPassword.getAuthorisationURLWithQueryParamsAndSetState();

ThirdPartyEmailPassword.getResetPasswordTokenFromURL({
    userContext: undefined,
});
ThirdPartyEmailPassword.getResetPasswordTokenFromURL(undefined);
ThirdPartyEmailPassword.getResetPasswordTokenFromURL();

ThirdPartyEmailPassword.sendPasswordResetEmail({
    userContext: undefined,
    options: {
        preAPIHook: undefined,
    },
    formFields: [
        {
            id: "",
            value: "",
        },
    ],
});
// @ts-expect-error
ThirdPartyEmailPassword.sendPasswordResetEmail(undefined);
// @ts-expect-error
ThirdPartyEmailPassword.sendPasswordResetEmail();

ThirdPartyEmailPassword.signOut({
    userContext: undefined,
});
ThirdPartyEmailPassword.signOut(undefined);
ThirdPartyEmailPassword.signOut();

ThirdPartyEmailPassword.submitNewPassword({
    userContext: undefined,
    options: {
        preAPIHook: undefined,
    },
    formFields: [
        {
            id: "",
            value: "",
        },
    ],
});
// @ts-expect-error
ThirdPartyEmailPassword.submitNewPassword(undefined);
// @ts-expect-error
ThirdPartyEmailPassword.submitNewPassword();

ThirdPartyEmailPassword.thirdPartySignInAndUp({
    userContext: undefined,
    options: {
        preAPIHook: undefined,
    },
});
ThirdPartyEmailPassword.thirdPartySignInAndUp(undefined);
ThirdPartyEmailPassword.thirdPartySignInAndUp();

// TPP
ThirdPartyPasswordless.clearPasswordlessLoginAttemptInfo({
    userContext: undefined,
});
ThirdPartyPasswordless.clearPasswordlessLoginAttemptInfo(undefined);
ThirdPartyPasswordless.clearPasswordlessLoginAttemptInfo();

ThirdPartyPasswordless.consumePasswordlessCode({
    userContext: undefined,
    options: {
        preAPIHook: undefined,
    },
    userInputCode: "",
});
ThirdPartyPasswordless.consumePasswordlessCode({
    userContext: undefined,
    options: {
        preAPIHook: undefined,
    },
});

ThirdPartyPasswordless.createPasswordlessCode({
    email: "",
    options: {
        preAPIHook: undefined,
    },
    userContext: undefined,
});
ThirdPartyPasswordless.createPasswordlessCode({
    phoneNumber: "",
    options: {
        preAPIHook: undefined,
    },
    userContext: undefined,
});
ThirdPartyPasswordless.createPasswordlessCode({
    email: "",
    phoneNumber: "",
    options: {
        preAPIHook: undefined,
    },
    userContext: undefined,
});

ThirdPartyPasswordless.doesPasswordlessUserEmailExist({
    userContext: undefined,
    options: {
        preAPIHook: undefined,
    },
    email: "",
});

ThirdPartyPasswordless.doesPasswordlessUserPhoneNumberExist({
    userContext: undefined,
    phoneNumber: "",
    options: {
        preAPIHook: undefined,
    },
});

ThirdPartyPasswordless.getPasswordlessLinkCodeFromURL({
    userContext: undefined,
});
ThirdPartyPasswordless.getPasswordlessLinkCodeFromURL(undefined);
ThirdPartyPasswordless.getPasswordlessLinkCodeFromURL();

ThirdPartyPasswordless.getPasswordlessPreAuthSessionIdFromURL({
    userContext: undefined,
});
ThirdPartyPasswordless.getPasswordlessPreAuthSessionIdFromURL(undefined);
ThirdPartyPasswordless.getPasswordlessPreAuthSessionIdFromURL();

ThirdPartyPasswordless.getThirdPartyAuthorisationURLWithQueryParamsAndSetState({
    thirdPartyId: "",
    frontendRedirectURI: "",
    redirectURIOnProviderDashboard: undefined,
    userContext: undefined,
    options: {
        preAPIHook: undefined,
    },
});
ThirdPartyPasswordless.getThirdPartyAuthorisationURLWithQueryParamsAndSetState({
    thirdPartyId: "",
    frontendRedirectURI: "",
    redirectURIOnProviderDashboard: undefined,
    userContext: undefined,
    options: {
        preAPIHook: undefined,
    },
});

ThirdPartyPasswordless.resendPasswordlessCode({
    userContext: undefined,
    options: {
        preAPIHook: undefined,
    },
});
ThirdPartyPasswordless.resendPasswordlessCode(undefined);
ThirdPartyPasswordless.resendPasswordlessCode();

ThirdPartyPasswordless.setPasswordlessLoginAttemptInfo({
    attemptInfo: {
        deviceId: "",
        preAuthSessionId: "",
        flowType: "USER_INPUT_CODE",
    },
    userContext: undefined,
});
ThirdPartyPasswordless.setPasswordlessLoginAttemptInfo({
    attemptInfo: {
        deviceId: "",
        preAuthSessionId: "",
        flowType: "MAGIC_LINK",
    },
    userContext: undefined,
});
ThirdPartyPasswordless.setPasswordlessLoginAttemptInfo({
    attemptInfo: {
        deviceId: "",
        preAuthSessionId: "",
        flowType: "USER_INPUT_CODE_AND_MAGIC_LINK",
    },
    userContext: undefined,
});
ThirdPartyPasswordless.setPasswordlessLoginAttemptInfo<{
    customData: string;
}>({
    // @ts-expect-error
    attemptInfo: {
        deviceId: "",
        preAuthSessionId: "",
        flowType: "USER_INPUT_CODE_AND_MAGIC_LINK",
    },
    userContext: undefined,
});
ThirdPartyPasswordless.setPasswordlessLoginAttemptInfo<{
    customData: string;
}>({
    attemptInfo: {
        deviceId: "",
        preAuthSessionId: "",
        flowType: "USER_INPUT_CODE_AND_MAGIC_LINK",
        // @ts-expect-error
        customData: 123,
    },
    userContext: undefined,
});
ThirdPartyPasswordless.setPasswordlessLoginAttemptInfo<{
    customData: string;
}>({
    attemptInfo: {
        deviceId: "",
        preAuthSessionId: "",
        flowType: "USER_INPUT_CODE_AND_MAGIC_LINK",
        customData: "",
    },
    userContext: undefined,
});
// @ts-expect-error
ThirdPartyPasswordless.setPasswordlessLoginAttemptInfo(undefined);
// @ts-expect-error
ThirdPartyPasswordless.setPasswordlessLoginAttemptInfo();

ThirdPartyPasswordless.signOut({
    userContext: undefined,
});
ThirdPartyPasswordless.signOut(undefined);
ThirdPartyPasswordless.signOut();

ThirdPartyPasswordless.thirdPartySignInAndUp({
    userContext: undefined,
    options: {
        preAPIHook: undefined,
    },
});
ThirdPartyPasswordless.thirdPartySignInAndUp(undefined);
ThirdPartyPasswordless.thirdPartySignInAndUp();

Session.addAxiosInterceptors({});

Session.validateClaims({
    overrideGlobalClaimValidators: () => {
        return [];
    },
});

Session.getClaimValue({ claim: UserRoleClaim }).then((v) => {});

Session.init({
    override: {
        functions: (oI) => {
            return {
                ...oI,
                getGlobalClaimValidators: (input) => [
                    ...input.claimValidatorsAddedByOtherRecipes,
                    UserRoleClaim.validators.includes("admin"),
                ],
            };
        },
    },
});

Session.init({
    override: {
        functions: (oI) => {
            return {
                ...oI,
                getGlobalClaimValidators: (input) => {
                    return [
                        ...input.claimValidatorsAddedByOtherRecipes,
                        {
                            ...UserRoleClaim.validators.includes("admin"),
                            showAccessDeniedOnFailure: false, // if you want to handle the validation errors in you components
                            onFailureRedirection: () => "/not-an-admin", // if you want to redirect to a specific path
                        },
                    ];
                },
            };
        },
    },
});

const AdminRoute: React.FC = (props) => {
    return (
        <SessionAuth
            accessDeniedScreen={AccessDeniedScreen}
            overrideGlobalClaimValidators={(globalValidators) => [
                ...globalValidators,
                {
                    ...UserRoleClaim.validators.includes("admin"),
                    showAccessDeniedOnFailure: false, // if you want to handle the validation errors in you components
                    onFailureRedirection: () => "/not-an-admin", // if you want to redirect to a specific path
                },
            ]}>
            {props.children}
        </SessionAuth>
    );
};
EmailVerification.init();
EmailVerification.init(undefined);
EmailVerification.init({});

Multitenancy.init();

Multitenancy.init({
    override: {
        functions: (oI) => ({
            ...oI,
            getTenantId: () => "...",
            getLoginMethods: async (input) => {
                try {
                    return oI.getLoginMethods(input);
                } catch (err) {
                    if (err.message === "AppId or tenantId not found") {
                        // redirect the user here.
                    }
                    throw err;
                }
            },
        }),
    },
});
