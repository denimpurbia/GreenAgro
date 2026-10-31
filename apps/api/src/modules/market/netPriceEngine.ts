/**
 * Fair Market Access — Net Price Calculation Engine
 *
 * Formula: Net Price = Modal Mandi Price − Transport Cost − Mandi Fee
 *
 * Ranks mandis by NET return to the farmer, not just the headline modal price.
 */

export interface MandiQuote {
  mandiCode: string;
  mandiName: string;
  district: string;
  distanceKm: number;
  modalPrice: number; // Rs/quintal
  minPrice: number;
  maxPrice: number;
  priceDate: string;
  isStale?: boolean;
}

export interface NetPriceCalculationInput {
  quotes: MandiQuote[];
  transportCostPerKmPerQuintal?: number; // default Rs 1.8 / km / quintal
  fixedMandiFeePercent?: number; // default 1.6% APMC user fee
  mspPrice?: number;
}

export interface RankedMandiQuote extends MandiQuote {
  transportCost: number;
  mandiFee: number;
  netPrice: number;
  differenceFromMsp?: number;
  isAboveMsp?: boolean;
  rank: number;
}

export class NetPriceEngine {
  public static rank(input: NetPriceCalculationInput): RankedMandiQuote[] {
    const {
      quotes,
      transportCostPerKmPerQuintal = 1.8,
      fixedMandiFeePercent = 1.6,
      mspPrice,
    } = input;

    const calculated: Array<Omit<RankedMandiQuote, 'rank'>> = quotes.map((q) => {
      const transportCost = Math.round(q.distanceKm * transportCostPerKmPerQuintal);
      const mandiFee = Math.round((q.modalPrice * fixedMandiFeePercent) / 100);
      const netPrice = Math.max(0, q.modalPrice - transportCost - mandiFee);

      const item: Omit<RankedMandiQuote, 'rank'> = {
        ...q,
        transportCost,
        mandiFee,
        netPrice,
      };

      if (typeof mspPrice === 'number' && mspPrice > 0) {
        item.differenceFromMsp = netPrice - mspPrice;
        item.isAboveMsp = netPrice >= mspPrice;
      }

      return item;
    });

    // Rank strictly by netPrice descending (highest net income in pocket)
    calculated.sort((a, b) => b.netPrice - a.netPrice);

    return calculated.slice(0, 10).map((item, idx) => ({
      ...item,
      rank: idx + 1,
    }));
  }
}

