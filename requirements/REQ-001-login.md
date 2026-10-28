# REQ-001 — Customer login

As a registered customer, I want to log in with my email and password so that I can browse products and manage my cart.

## Acceptance criteria

- **AC-001.1** — A customer with valid credentials lands on the product catalog ("Products").
- **AC-001.2** — Invalid credentials show "Email or password is incorrect." and the customer stays on the login page.
- **AC-001.3** — A locked account shows "This account is locked. Contact support." and cannot log in.
- **AC-001.4** — Email and password are required: an empty email shows "Email is required."; an empty password shows "Password is required."
- **AC-001.5** — Opening the catalog without a session redirects to the login page with "Please log in to continue."
- **AC-001.6** — Logging out returns the customer to the login page, and the catalog is no longer accessible without logging in again.

## Test data

| Account | Email | Password |
| --- | --- | --- |
| Active | qa.user@example.com | Passw0rd! |
| Locked | locked.user@example.com | Passw0rd! |
