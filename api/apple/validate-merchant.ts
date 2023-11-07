import { NextApiRequest, NextApiResponse } from 'next';
import https from 'https';
import fetch from 'node-fetch';
import { APPLE_PAY_DISPLAY_NAME } from 'constants/apple-pay';

// TODO: you need to install raw-loader to load these as strings inline
import cert from 'certs/merchant-id.cert.pem';
import key from 'certs/merchant-id.key.pem';
import { isError } from 'helpers/errors';

async function validateMerchant(req: NextApiRequest, res: NextApiResponse) {
  const { url } = req.body;

  try {
    const sslAgent = new https.Agent({
      cert,
      key,
      keepAlive: true,
      passphrase: 'your_cert_passphrase',
    });

    const merchantSessionResponse = await fetch(url, {
      method: 'POST',
      agent: sslAgent,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ // TODO: configure your domain and merchant id in env file
        merchantIdentifier: process.env['APPLE_MERCHANT_ID'],
        displayName: APPLE_PAY_DISPLAY_NAME,
        initiative: 'web',
        initiativeContext: process.env['APPLE_PAY_DOMAIN'],
        domainName: process.env['APPLE_PAY_DOMAIN'],
      }),
    });
    return res.json(await merchantSessionResponse.json());
  } catch (error) {
    const errorMessage = isError(error) ? error.message : '';
    return res.status(500).json({
      error: errorMessage,
    });
  }
}

export default validateMerchant;
