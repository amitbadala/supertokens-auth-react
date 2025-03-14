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

import type { LinkClickedScreen } from "./components/themes/linkClickedScreen";
import type { CloseTabScreen } from "./components/themes/signInUp/closeTabScreen";
import type { EmailForm } from "./components/themes/signInUp/emailForm";
import type { EmailOrPhoneForm } from "./components/themes/signInUp/emailOrPhoneForm";
import type { LinkSent } from "./components/themes/signInUp/linkSent";
import type { PhoneForm } from "./components/themes/signInUp/phoneForm";
import type { SignInUpFooter } from "./components/themes/signInUp/signInUpFooter";
import type { SignInUpHeader } from "./components/themes/signInUp/signInUpHeader";
import type { UserInputCodeForm } from "./components/themes/signInUp/userInputCodeForm";
import type { UserInputCodeFormFooter } from "./components/themes/signInUp/userInputCodeFormFooter";
import type { UserInputCodeFormHeader } from "./components/themes/signInUp/userInputCodeFormHeader";
import type { ComponentOverride } from "../../components/componentOverride/componentOverride";
import type { FeatureBaseConfig, NormalisedBaseConfig, WebJSRecipeInterface } from "../../types";
import type {
    GetRedirectionURLContext as AuthRecipeModuleGetRedirectionURLContext,
    OnHandleEventContext as AuthRecipeModuleOnHandleEventContext,
    Config as AuthRecipeModuleConfig,
    NormalisedConfig as NormalisedAuthRecipeModuleConfig,
    UserInput as AuthRecipeModuleUserInput,
} from "../authRecipe/types";
import type { Dispatch } from "react";
import type WebJSRecipe from "supertokens-web-js/recipe/passwordless";
import type { RecipeInterface } from "supertokens-web-js/recipe/passwordless";
import type { User } from "supertokens-web-js/types";

export type PreAndPostAPIHookAction =
    | "PASSWORDLESS_CREATE_CODE"
    | "PASSWORDLESS_CONSUME_CODE"
    | "PASSWORDLESS_RESEND_CODE"
    | "EMAIL_EXISTS"
    | "PHONE_NUMBER_EXISTS";

export type PreAPIHookContext = {
    /*
     * Pre API Hook action.
     */
    action: PreAndPostAPIHookAction;

    /*
     * Request object containing query params, body, headers.
     */
    requestInit: RequestInit;

    /*
     * URL
     */
    url: string;
};

export type GetRedirectionURLContext = AuthRecipeModuleGetRedirectionURLContext;

export type OnHandleEventContext =
    | {
          action: "SUCCESS";
          isNewRecipeUser: boolean;
          user: User;
      }
    | {
          action: "PASSWORDLESS_RESTART_FLOW";
      }
    | {
          action: "PASSWORDLESS_CODE_SENT";
          isResend: boolean;
      }
    | AuthRecipeModuleOnHandleEventContext;

export type PasswordlessNormalisedBaseConfig = {
    disableDefaultUI?: boolean;
} & NormalisedBaseConfig;

export type NormalisedConfig = {
    validateEmailAddress: (email: string) => Promise<string | undefined> | string | undefined;
    validatePhoneNumber: (phoneNumber: string) => Promise<string | undefined> | string | undefined;

    signInUpFeature: {
        resendEmailOrSMSGapInSeconds: number;
        defaultCountry?: string;
        guessInternationPhoneNumberFromInputPhoneNumber: (
            inputPhoneNumber: string,
            defaultCountryFromConfig?: string
        ) => Promise<string | undefined> | string | undefined;

        privacyPolicyLink?: string;
        termsOfServiceLink?: string;

        emailOrPhoneFormStyle: string;
        userInputCodeFormStyle: string;
        linkSentScreenStyle: string;
        closeTabScreenStyle: string;

        disableDefaultUI?: boolean;
    };
    linkClickedScreenFeature: PasswordlessNormalisedBaseConfig;

    contactMethod: "PHONE" | "EMAIL" | "EMAIL_OR_PHONE";

    override: {
        functions: (originalImplementation: RecipeInterface) => RecipeInterface;
    };
} & NormalisedAuthRecipeModuleConfig<GetRedirectionURLContext, PreAndPostAPIHookAction, OnHandleEventContext>;

export type Config = UserInput &
    AuthRecipeModuleConfig<GetRedirectionURLContext, PreAndPostAPIHookAction, OnHandleEventContext>;

export type PasswordlessFeatureBaseConfig = {
    disableDefaultUI?: boolean;
} & FeatureBaseConfig;

export type SignInUpFeatureConfigInput = {
    disableDefaultUI?: boolean;
    resendEmailOrSMSGapInSeconds?: number;

    /*
     * Privacy policy link for the sign-up form.
     */
    privacyPolicyLink?: string;
    /*
     * Terms and conditions link for the sign-up form.
     */
    termsOfServiceLink?: string;

    emailOrPhoneFormStyle?: string;
    userInputCodeFormStyle?: string;
    linkSentScreenStyle?: string;
    closeTabScreenStyle?: string;
};

export type UserInput = (
    | {
          contactMethod: "EMAIL";

          validateEmailAddress?: (email: string) => Promise<string | undefined> | string | undefined;

          signInUpFeature?: SignInUpFeatureConfigInput;
      }
    | {
          contactMethod: "PHONE";

          validatePhoneNumber?: (phoneNumber: string) => Promise<string | undefined> | string | undefined;

          signInUpFeature?: SignInUpFeatureConfigInput & {
              /*
               * Must be a two-letter ISO country code (e.g.: "US")
               */
              defaultCountry?: string;
          };
      }
    | {
          contactMethod: "EMAIL_OR_PHONE";

          validateEmailAddress?: (email: string) => Promise<string | undefined> | string | undefined;
          validatePhoneNumber?: (phoneNumber: string) => Promise<string | undefined> | string | undefined;

          signInUpFeature?: SignInUpFeatureConfigInput & {
              /*
               * Must be a two-letter ISO country code (e.g.: "US")
               */
              defaultCountry?: string;

              guessInternationPhoneNumberFromInputPhoneNumber?: (
                  inputPhoneNumber: string,
                  defaultCountryFromConfig?: string
              ) => Promise<string | undefined> | string | undefined;
          };
      }
) & {
    override?: {
        functions?: (originalImplementation: RecipeInterface) => RecipeInterface;
    };
    linkClickedScreenFeature?: PasswordlessFeatureBaseConfig;
} & AuthRecipeModuleUserInput<GetRedirectionURLContext, PreAndPostAPIHookAction, OnHandleEventContext>;

export type SignInUpProps = {
    recipeImplementation: RecipeImplementation;
    config: NormalisedConfig;
    onSuccess?: (result: { createdNewRecipeUser: boolean; user: User }) => void;
    dispatch: Dispatch<PasswordlessSignInUpAction>;
    featureState: {
        loginAttemptInfo?: LoginAttemptInfo;
        loaded: boolean;
        successInAnotherTab: boolean;
        error: string | undefined;
    };
    userContext?: any;
};
export type LoginAttemptInfo = {
    deviceId: string;
    preAuthSessionId: string;
    contactInfo: string;
    contactMethod: "EMAIL" | "PHONE";
    lastResend: number;
    redirectToPath?: string;
    flowType: "USER_INPUT_CODE" | "MAGIC_LINK" | "USER_INPUT_CODE_AND_MAGIC_LINK";
};

/**
 * When calling getLoginAttemptInfo/setLoginAttemptInfo from web-js we use generics to get
 * access to properties in local storage that web-js does not set by default.
 * This allows us to strongly type the response while keeping it dynamic.
 *
 * In the context of auth-react this type indicates all the additional properties we need.
 */
export type AdditionalLoginAttemptInfoProperties = {
    contactInfo: string;
    contactMethod: "EMAIL" | "PHONE";
    lastResend: number;
    redirectToPath?: string;
};

export type RecipeImplementation = WebJSRecipeInterface<typeof WebJSRecipe>;

export type SignInUpEmailFormProps = {
    clearError: () => void;
    onError: (error: string) => void;
    error: string | undefined;
    recipeImplementation: RecipeImplementation;
    config: NormalisedConfig;
    onSuccess?: () => void;
};

export type SignInUpPhoneFormProps = {
    clearError: () => void;
    onError: (error: string) => void;
    error: string | undefined;
    recipeImplementation: RecipeImplementation;
    config: NormalisedConfig;
    onSuccess?: () => void;
};

export type SignInUpEmailOrPhoneFormProps = {
    clearError: () => void;
    onError: (error: string) => void;
    error: string | undefined;
    recipeImplementation: RecipeImplementation;
    config: NormalisedConfig;
    onSuccess?: () => void;
};

export type SignInUpUserInputCodeFormProps = {
    clearError: () => void;
    onError: (error: string) => void;
    error: string | undefined;
    recipeImplementation: RecipeImplementation;
    config: NormalisedConfig;
    loginAttemptInfo: LoginAttemptInfo;
    onSuccess?: (result: { createdNewRecipeUser: boolean; user: User }) => void;
};

export type LinkClickedScreenProps = {
    recipeImplementation: RecipeImplementation;
    config: NormalisedConfig;
    requireUserInteraction: boolean;
    consumeCode: () => void;
    onSuccess?: () => void;
};

export type CloseTabScreenProps = {
    recipeImplementation: RecipeImplementation;
    config: NormalisedConfig;
};

export type PasswordlessSignInUpAction =
    | {
          type: "load";
          loginAttemptInfo: LoginAttemptInfo | undefined;
          error: string | undefined;
      }
    | {
          type: "startLogin";
          loginAttemptInfo: LoginAttemptInfo;
      }
    | {
          type: "resendCode";
          timestamp: number;
      }
    | {
          type: "restartFlow";
          error: string | undefined;
      }
    | {
          type: "setError";
          error: string | undefined;
      }
    | {
          type: "successInAnotherTab";
      };

export type SignInUpState = {
    error: string | undefined;
    loaded: boolean;
    loginAttemptInfo: LoginAttemptInfo | undefined;
    successInAnotherTab: boolean;
};

export type SignInUpChildProps = Omit<SignInUpProps, "featureState" | "dispatch">;

export type LinkSentThemeProps = {
    clearError: () => void;
    onError: (error: string) => void;
    error: string | undefined;
    loginAttemptInfo: LoginAttemptInfo;
    recipeImplementation: RecipeImplementation;
    config: NormalisedConfig;
};

export type UserInputCodeFormFooterProps = {
    loginAttemptInfo: LoginAttemptInfo;
    recipeImplementation: RecipeImplementation;
    config: NormalisedConfig;
};

export type UserInputCodeFormHeaderProps = {
    loginAttemptInfo: LoginAttemptInfo;
    recipeImplementation: RecipeImplementation;
    config: NormalisedConfig;
};

export type ComponentOverrideMap = {
    PasswordlessSignInUpHeader_Override?: ComponentOverride<typeof SignInUpHeader>;
    PasswordlessSignInUpFooter_Override?: ComponentOverride<typeof SignInUpFooter>;
    PasswordlessEmailForm_Override?: ComponentOverride<typeof EmailForm>;
    PasswordlessPhoneForm_Override?: ComponentOverride<typeof PhoneForm>;
    PasswordlessEmailOrPhoneForm_Override?: ComponentOverride<typeof EmailOrPhoneForm>;

    PasswordlessUserInputCodeFormHeader_Override?: ComponentOverride<typeof UserInputCodeFormHeader>;
    PasswordlessUserInputCodeFormFooter_Override?: ComponentOverride<typeof UserInputCodeFormFooter>;
    PasswordlessUserInputCodeForm_Override?: ComponentOverride<typeof UserInputCodeForm>;

    PasswordlessLinkSent_Override?: ComponentOverride<typeof LinkSent>;

    PasswordlessLinkClickedScreen_Override?: ComponentOverride<typeof LinkClickedScreen>;
    PasswordlessCloseTabScreen_Override?: ComponentOverride<typeof CloseTabScreen>;
};
