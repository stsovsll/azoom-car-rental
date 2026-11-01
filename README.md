## AZoom Car Rental – ISIT207 Assignment 2

## Demo login details

| Role | Email | Password | Lands on |
|---|---|---|---|
| Customer | `demo@azoom.sg` | `Demo@1234` | My bookings |
| Staff | `staff@azoom.sg` | `Staff@1234` | Staff dashboard |

The login page has **Customer / Staff** tabs and a **Fill in demo details** button. You can also register a new customer account.

### Test credit cards (no real payment is taken)

| Card type | Number | Expiry | CVV |
|---|---|---|---|
| Visa | `4242 4242 4242 4242` | any future date, e.g. `12/29` | any 3 digits |
| Mastercard | `5555 5555 5555 4444` | any future date | any 3 digits |
| Amex | `3782 822463 10005` | any future date | any 4 digits |

Any number that fails the **Luhn check** (for example `4242 4242 4242 4241`) is rejected.

**Debit and prepaid cards are rejected** (credit cards only). These test cards pass the Luhn check but are refused:

| Card type | Number |
|---|---|
| Visa debit | `4000 0566 5566 5556` |
| Mastercard debit | `5200 8282 8282 8210` |
| Mastercard prepaid | `5105 1051 0510 5100` |
