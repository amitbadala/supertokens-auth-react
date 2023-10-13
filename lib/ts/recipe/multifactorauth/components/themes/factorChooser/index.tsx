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

import { hasFontDefined } from "../../../../../styles/styles";
import UserContextWrapper from "../../../../../usercontext/userContextWrapper";
import { ThemeBase } from "../../../../emailpassword/components/themes/themeBase";
import { useSessionContext } from "../../../../session";

import type { FactorChooserThemeProps } from "../../../types";

export function FactorChooserTheme(props: FactorChooserThemeProps): JSX.Element {
    const sessionContext = useSessionContext();

    if (sessionContext.loading === false && sessionContext.doesSessionExist === true) {
        return <pre>{JSON.stringify({ props, sessionContext }, null, 2)}</pre>;
    }

    // Otherwise, return an empty screen, waiting for the feature component to redirection to complete.
    return <></>;
}

function FactorChooserThemeWrapper(props: FactorChooserThemeProps): JSX.Element {
    const hasFont = hasFontDefined(props.config.rootStyle);

    return (
        <UserContextWrapper userContext={props.userContext}>
            <ThemeBase
                loadDefaultFont={!hasFont}
                userStyles={[props.config.rootStyle, props.config.factorChooserScreen.style]}>
                <FactorChooserTheme {...props} />
            </ThemeBase>
        </UserContextWrapper>
    );
}

export default FactorChooserThemeWrapper;
