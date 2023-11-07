# react-apple-pay
Fully-functional implementation of Apple Pay using both the ApplePay JS SDK, and the PaymentRequest API as a fallback.

# NOTE
This does not work or build yet. I'm working on it but it's a free-time endeavor for me.

# How to read this code
You'll want to look mainly at ApplePayButton.tsx. This component pulls in the services for both ApplePayJS SDK, and the Payment Request API.

These services are very similar, other than the types they use when handling callbacks / initializing the payments. There's not a whole lot more 
to it than handling callbacks and updating the data shown on the payment sheet. The setup on Apple is the most challenging part really, and 
the random errors you'll encounter with no expanation. However, I know that the configuration given here works, so hopefully I can save you 
the trouble.

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