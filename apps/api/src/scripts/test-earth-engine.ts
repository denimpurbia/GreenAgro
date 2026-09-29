import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import ee from '@google/earthengine';

const projectId = process.env.EARTH_ENGINE_PROJECT;
const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

if (!projectId) {
  throw new Error('EARTH_ENGINE_PROJECT is missing in .env');
}

if (!credentialsPath) {
  throw new Error('GOOGLE_APPLICATION_CREDENTIALS is missing in .env');
}

const resolvedCredentialsPath = path.resolve(
  process.cwd(),
  credentialsPath
);

if (!fs.existsSync(resolvedCredentialsPath)) {
  throw new Error(
    `Earth Engine credentials file not found: ${resolvedCredentialsPath}`
  );
}

const privateKey = JSON.parse(
  fs.readFileSync(resolvedCredentialsPath, 'utf8')
);

console.log('🌍 Testing Google Earth Engine...');
console.log(`Project: ${projectId}`);
console.log(`Credentials file: ${path.basename(resolvedCredentialsPath)}`);

ee.data.authenticateViaPrivateKey(
  privateKey,
  () => {
    console.log('✅ Service account authentication successful.');

    ee.initialize(
      null,
      null,
      () => {
        console.log('✅ Earth Engine initialization successful.');

        const image = ee.Image('USGS/SRTMGL1_003');

        image.getInfo((result: unknown, error: unknown) => {
          if (error) {
            console.error('❌ Earth Engine API request failed:');
            console.error(error);
            process.exit(1);
          }

          console.log('✅ Earth Engine API request successful.');
          console.log('🎉 Earth Engine connection is working!');
          console.log(
            'Image metadata received:',
            JSON.stringify(result).slice(0, 500)
          );

          process.exit(0);
        });
      },
      (error: unknown) => {
        console.error('❌ Earth Engine initialization failed:');
        console.error(error);
        process.exit(1);
      },
      null,
      projectId
    );
  },
  (error: unknown) => {
    console.error('❌ Service account authentication failed:');
    console.error(error);
    process.exit(1);
  }
);