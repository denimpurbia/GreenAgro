import { config } from '../../config';
import { ISatelliteProvider, SatelliteResponse } from './satelliteProvider';
import { UnconfiguredSatelliteProvider } from './providers/unconfiguredProvider';
import { EarthEngineSatelliteProvider } from './providers/earthEngineProvider';
import { DemoSatelliteProvider } from './providers/demoProvider';

export class SatelliteService {
  private static getProvider(): ISatelliteProvider {
    const providerName = config.satelliteProvider.toLowerCase().trim();

    if (providerName === 'earth-engine') {
      return new EarthEngineSatelliteProvider();
    }

    if (providerName === 'demo' && process.env.NODE_ENV !== 'production') {
      return new DemoSatelliteProvider();
    }

    return new UnconfiguredSatelliteProvider();
  }

  public static async fetchNDVI(lat: number, lon: number): Promise<SatelliteResponse> {
    const provider = this.getProvider();
    return provider.fetchNDVI(lat, lon);
  }
}
