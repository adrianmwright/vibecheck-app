# Social sign-in activation

App-side Google/Apple OAuth, PKCE callback processing, private account state and venue return navigation are implemented. Both providers were disabled in the project's public Auth settings on 15 October 2026. They remain explicitly unavailable in the UI until configured. This is not a completed end-to-end social-login integration yet.

## Google first

1. In your Google Cloud project, configure the Google Auth Platform consent screen (app name, support email, audience and basic identity scopes). Add approved test users if using testing mode.
2. Create an OAuth client of type Web application.
3. Authorized JavaScript origin: `https://vibecheck-adrian-preview.adrianmwright.chatgpt.site`
4. Authorized redirect URI: `https://koirkuoxosuhpvfukdkl.supabase.co/auth/v1/callback`
5. In Supabase, open the `vibecheck-dev` project > Authentication > URL Configuration. Set Site URL to `https://vibecheck-adrian-preview.adrianmwright.chatgpt.site`. Add the exact redirect URL `https://vibecheck-adrian-preview.adrianmwright.chatgpt.site/?auth=callback`.
6. In Authentication > Sign In / Providers > Google, enter the Google client ID and secret, then enable Google. Store secrets there only, never in source code or chat.
7. Open the live app in Safari/Chrome, refresh, open the menu and sign-in panel. Google should become enabled. Test consent, successful return, cancellation, sign-out, reload and an authenticated rating. Check that returning to a shared venue restores that venue.

Official guide: https://supabase.com/docs/guides/auth/social-login/auth-google

## Apple

Requires the appropriate Apple Developer account and Sign in with Apple configuration (App ID, web Services ID, signing key and associated return URL). Configure these following the official guide, set the same Supabase callback above, then enable the Apple provider only after the URL configuration is complete. Keep the private signing key and provider secret out of the repository and browser. Web OAuth client-secret renewal is required periodically; native iOS sign-in will need a separate platform integration during packaging.

Official guide: https://supabase.com/docs/guides/auth/social-login/auth-apple

## Current boundaries

- The Sites connection cannot create Google/Apple developer registrations or edit Supabase Auth provider/redirect configuration. Those owner-account setup steps remain outstanding.
- The hosted preview remains owner-private. Enabling app login does not give other people access through that outer hosting gate.
- Email signup remains available for existing test accounts. Wider signup needs SMTP configuration; social login does not fix email delivery.
- No new member feature restrictions have been applied beyond the agreed guest trial. Saved favourites, badges and alerts are future work.
- This browser login flow is preparation for the MVP. Native packaging must use native-compatible sign-in/deep links and secure session storage, with its own end-to-end testing.

## iPhone release path

Keep the Supabase backend and package the existing interface into a Capacitor iOS project, with web assets bundled in the app. Add native location/share/sign-in handling and app links. Build/sign using a Mac and Xcode, then distribute a beta through TestFlight. Complete privacy disclosures, account deletion, support/reporting, icon/screenshots and mobile testing before App Store submission. A website wrapper alone is not a guarantee of App Store acceptance.

References: https://capacitorjs.com/docs/ios, https://capacitorjs.com/docs/getting-started and https://developer.apple.com/app-store/review/guidelines/.

## Email password recovery

Forgot password sends `resetPasswordForEmail` to the existing exact `/?auth=callback` redirect above. The SDK captures PASSWORD_RECOVERY before initial session resolution and opens the new-password form; saving calls authenticated `updateUser`. Existing signed-in members can also use Menu > Change password. Neither action requires knowing the old password. New passwords require at least eight characters and matching confirmation; the server remains authoritative.

Verify Supabase Site URL and redirect allowlist (step 5) before email testing. PKCE requires requesting and opening the latest email link in the same browser/device with its storage intact. Expired or reused links need a fresh request. The app does not reveal whether an email address exists. Default email delivery limits still apply. Code-level checks cover SDK routing, recovery event detection, validation and errors; a real email roundtrip and iPhone interaction test remain required.
