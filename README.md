# react-apple-pay
Fully-functional implementation of Apple Pay using both the ApplePay JS SDK, and the PaymentRequest API as a fallback.

# NOTE
This does not work or build yet. I'm working on it but it's a free-time endeavor for me.

# STEPS

1. Create a merchant ID in Apple Pay
2. Generate a CSR from your payment processor (assuming they provide decryption)
3. Use this CSR to generate your payment processing certificate
4. Generate a CSR on your local machine
5. Use this CSR to generate a merchant ID certificate
6. Install the certificate
7. Export the certificate as .p12/pfx with both the private and public keys
8. Split into private and public keys in PEM format
9. These are the files you'll place in /certs
10. Create a domain validation file
11. Download this file and place it in the public/.well-known folder
12. Deploy the code and verify your domain (Must be HTTPS to work)
13. You should now be ready to use Apple Pay
14. Testing should be done in Safari on a Mac or iPhone