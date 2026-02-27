# Specification

## Summary
**Goal:** Fix the Request Money form submission so that users authenticated via email/password or phone OTP can successfully submit money requests without being blocked by an Internet Identity principal check.

**Planned changes:**
- Update `backend/main.mo` `submitMoneyRequest` function to accept an additional `email` parameter; when a non-empty email is provided, look up the profile by email in the `profiles` HashMap and use that profile's identifier as the requester instead of requiring an Internet Identity caller principal
- Preserve the existing Internet Identity caller path when the caller is an authenticated II principal
- Update the `requestMoney` mutation in `frontend/src/hooks/useQueries.ts` to pass the user's email (read from sessionStorage keys `emailAuth` or `userSession`) as an argument to `submitMoneyRequest`
- Update `frontend/src/pages/RequestMoney.tsx` to retrieve the email from sessionStorage and pass it in the backend call; pass an empty string if the user is authenticated via Internet Identity
- Ensure any backend error (including canister-stopped errors) surfaces a visible error message and re-enables the submit button instead of spinning indefinitely

**User-visible outcome:** Users logged in via email/password or phone OTP can successfully submit money requests — the submit button completes normally, shows a success confirmation, and no Internet Identity popup appears.
