import {
  ISatelliteProvider,
  SatelliteResponse,
} from '../satelliteProvider';

export class UnconfiguredSatelliteProvider
  implements ISatelliteProvider
{
  public name = 'unconfigured';

  public isConfigured(): boolean {
    return false;
  }

  public async fetchNDVI(
    _lat: number,
    _lon: number
  ): Promise<SatelliteResponse> {
    return {
      status: 'not_configured',

      message:
        'Satellite data is not configured yet.',

      configurationRequired: [
        'Set SATELLITE_PROVIDER=earth-engine in .env',
        'Set GOOGLE_APPLICATION_CREDENTIALS to a valid Google Cloud Service Account JSON file',
        'Set EARTH_ENGINE_PROJECT to your registered Google Earth Engine Cloud Project ID',
      ],
    };
  }
}