import { NextApiRequest, NextApiResponse } from 'next';
import { isError } from 'helpers/errors';

async function processPayment(req: NextApiRequest, res: NextApiResponse) {
  const {
    applePayToken,
    creditCardBrand,
    billingAddress,
    shippingAddress,
   } = req.body;

  try {
    // TODO: post data to payment processor, typically you will generate your CSR
    // from their website, so that they have the private key to decrypt the payment
    // data. If not, then you will have to make sure you download the private key yourself
    // and use it here to decrypt the payment information.
    return res.json('{}');
  } catch (error) {
    const errorMessage = isError(error) ? error.message : '';
    return res.status(500).json({
      error: errorMessage,
    });
  }
}

export default processPayment;
