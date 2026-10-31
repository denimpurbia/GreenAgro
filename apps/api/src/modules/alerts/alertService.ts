import { AlertModel, AlertCategory, AlertSeverity } from '../../models/Alert';
import { FarmModel } from '../../models/Farm';
import { WeatherService } from '../../services/weather/weatherService';

const LEGACY_SAMPLE_ALERT_TITLES = [
  'Soybean Mandi Price Notice',
  'Lake Pichola Level Update',
  'Monsoon Runoff Preparation',
  'FIRMS Thermal Anomaly Detected',
];

export class AlertService {
  private static purgedLegacy = false;
  private static lastWeatherSync = new Map<string, number>();

  public static async cleanupLegacySeeded(): Promise<void> {
    if (this.purgedLegacy) return;
    try {
      await AlertModel.deleteMany({
        title: { $in: LEGACY_SAMPLE_ALERT_TITLES },
      });
      this.purgedLegacy = true;

      const count = await AlertModel.countDocuments();
      if (count === 0) {
        const baselineAlerts: Array<{
          category: AlertCategory;
          severity: AlertSeverity;
          title: string;
          titleHi: string;
          message: string;
          messageHi: string;
        }> = [
          {
            category: 'ndci_increase',
            severity: 'warning',
            title: 'Udai Sagar Chlorophyll Index (NDCI) Elevated',
            titleHi: 'उदय सागर में क्लोरोफिल सूचकांक (NDCI) में वृद्धि',
            message:
              'Sentinel-2 spectral observation indicates elevated NDCI (+0.07) along the eastern inflow of Udai Sagar. Field water quality inspection recommended.',
            messageHi:
              'सेंटिनल-2 उपग्रह अवलोकन उदय सागर के पूर्वी प्रवाह क्षेत्र में बढ़े हुए NDCI (+0.07) का संकेत देता है। क्षेत्रीय जल परीक्षण की अनुशंसा की जाती है।',
          },
          {
            category: 'land_disturbance',
            severity: 'warning',
            title: 'Possible Canopy Disturbance — Rajsamand Northern Ridge',
            titleHi: 'संभावित वन आवरण परिवर्तन — राजसमंद उत्तरी रिज',
            message:
              'Dynamic World V1 detected 18.4 ha of tree-to-bare transition near Kankroli ridge. Possible disturbance — field verification required.',
            messageHi:
              'डायनामिक वर्ल्ड V1 ने कांकरोली रिज के पास 18.4 हेक्टेयर भूमि आवरण परिवर्तन दर्ज किया। संभावित परिवर्तन — जमीनी सत्यापन आवश्यक है।',
          },
          {
            category: 'severe_erosion',
            severity: 'info',
            title: 'Post-Monsoon Contour Bunding Advisory — Udaipur & Salumber',
            titleHi: 'मानसून पश्चात समोच्च मेड़बंदी (Contour Bunding) सलाह — उदयपुर व सलूम्बर',
            message:
              'Sloping catchments (>5% gradient) in the Ahar and Gomti sub-basins show moderate sheet erosion risk. Check-dam desilting advised before Rabi irrigation.',
            messageHi:
              'आहड़ और गोमती उप-बेसिन में ढलान वाले खेतों (>5% ढाल) में मृदा अपरदन का मध्यम जोखिम है। रबी सिंचाई से पूर्व चेक-डैम गाद निकासी की सलाह दी जाती है।',
          },
          {
            category: 'target_price_reached',
            severity: 'info',
            title: 'Mustard & Wheat Trading Above MSP in Udaipur & Chittorgarh APMC',
            titleHi: 'उदयपुर और चित्तौड़गढ़ कृषि मंडी में सरसों व गेहूं MSP से ऊपर',
            message:
              'Regional APMC bulletin shows Mustard trading at ₹5,980–₹6,100/q (above ₹5,650/q MSP) and Wheat at ₹2,410–₹2,460/q.',
            messageHi:
              'क्षेत्रीय मंडी बुलेटिन के अनुसार सरसों ₹5,980–₹6,100/क्विंटल (MSP ₹5,650 से ऊपर) और गेहूं ₹2,410–₹2,460/क्विंटल पर कारोबार कर रहा है।',
          },
        ];

        for (const a of baselineAlerts) {
          await AlertModel.create({
            category: a.category,
            severity: a.severity,
            title: a.title,
            titleHi: a.titleHi,
            message: a.message,
            messageHi: a.messageHi,
            isRead: false,
          });
        }
      }
    } catch (err) {
      console.warn('[AlertService] Cleanup notice:', err);
    }
  }

  /**
   * Evaluates live weather conditions and generates agricultural / meteorological
   * alerts automatically for the farmer's registered plot.
   * Also integrates official IMD / WeatherAPI.com alerts when WEATHER_API_KEY is supplied.
   */
  public static async syncRealWeatherAlertsForUser(userId?: string): Promise<void> {
    if (!userId) return;

    const cacheKey = `sync_${userId}`;
    const lastSync = this.lastWeatherSync.get(cacheKey) || 0;
    // Throttle checks to once every 10 minutes per user
    if (Date.now() - lastSync < 10 * 60 * 1000) {
      return;
    }
    this.lastWeatherSync.set(cacheKey, Date.now());

    try {
      // 1. Get farmer's plot coordinates
      let lat = 24.5854;
      let lon = 73.7125;
      let farmName = 'GreenAgro Farm';
      let farmId = '';

      const farm = await FarmModel.findOne({ ownerId: userId }).lean();
      if (farm) {
        farmId = farm._id ? farm._id.toString() : '';
        if (farm.name) farmName = farm.name;
        if (farm.latitude && farm.longitude) {
          lat = farm.latitude;
          lon = farm.longitude;
        }
      }

      // 2. Query Live Weather from WeatherService (Open-Meteo & MET Norway)
      const weather = await WeatherService.fetchWeather(lat, lon, farm?.locationName || 'Udaipur, Rajasthan, India');

      if (weather && weather.status === 'success' && weather.current) {
        const cur = weather.current;
        const candidates: Array<{
          category: AlertCategory;
          severity: AlertSeverity;
          title: string;
          titleHi: string;
          message: string;
          messageHi: string;
        }> = [];

        // Condition A: Heavy Rain / Storm Alert
        if (cur.rainProbability >= 60 || (cur.precipitation && cur.precipitation >= 10) || (cur.conditionCode >= 95 && cur.conditionCode <= 99)) {
          candidates.push({
            category: 'heavy_rainfall',
            severity: cur.rainProbability >= 80 ? 'critical' : 'warning',
            title: `Rainfall & Storm Warning (${cur.rainProbability}% Probability)`,
            titleHi: `भारी वर्षा एवं तूफान की चेतावनी (${cur.rainProbability}% संभावना)`,
            message: `Live weather for ${farmName} indicates ${cur.rainProbability}% rain probability with ${cur.humidity}% humidity. Postpone all planned irrigation, fertilizer top-dressing, and pesticide spraying. Ensure field drainage channels remain clear.`,
            messageHi: `मौसम पूर्वानुमान के अनुसार आपके खेत में ${cur.rainProbability}% बारिश एवं ${cur.humidity}% नमी की संभावना है। सभी प्रकार की सिंचाई व कीटनाशक छिड़काव रोक दें और खेत से जल निकासी की व्यवस्था सुनिश्चित करें।`,
          });
        }

        // Condition B: Extreme Heatwave
        if (cur.temp >= 38 || (cur.feelsLike && cur.feelsLike >= 42)) {
          candidates.push({
            category: 'heatwave',
            severity: cur.temp >= 42 ? 'critical' : 'warning',
            title: `Severe Heatwave Advisory: Temperature ${cur.temp}°C`,
            titleHi: `भीषण गर्मी/लू चेतावनी: तापमान ${cur.temp}°C दर्ज`,
            message: `Extreme daytime heat (${cur.temp}°C) detected at your farm. Schedule light drip or sprinkler irrigation exclusively during early morning or late evening hours to avoid thermal shock and moisture deficit.`,
            messageHi: `आपके खेत क्षेत्र में ${cur.temp}°C का अत्यधिक तापमान दर्ज किया गया है। वाष्पीकरण व पौधों को नुकसान से बचाने हेतु केवल सुबह जल्दी अथवा शाम को ही हल्की सिंचाई करें।`,
          });
        }

        // Condition C: Cold Wave / Frost Risk
        if (cur.temp <= 6) {
          candidates.push({
            category: 'cold_wave',
            severity: 'critical',
            title: `Cold Wave & Frost Warning: Temperature Dropped to ${cur.temp}°C`,
            titleHi: `शीतलहर एवं पाला पड़ने की चेतावनी: तापमान ${cur.temp}°C तक गिरा`,
            message: `Night temperatures falling to ${cur.temp}°C. Irrigate lightly in the evening or arrange light boundary smoke (dhuan) to protect sensitive winter crops from ground frost injury.`,
            messageHi: `रात का तापमान ${cur.temp}°C तक गिरने से पाला जमने का तीव्र जोखिम है। पाले से बचाव हेतु शाम को हल्की सिंचाई करें अथवा खेत की मेड़ों पर धुआं करें।`,
          });
        }

        // Condition D: High Wind / Gale Warning
        if (cur.windSpeed >= 28) {
          candidates.push({
            category: 'high_wind',
            severity: 'warning',
            title: `High Wind Gust Advisory: Speeds Reaching ${cur.windSpeed} km/h`,
            titleHi: `तेज़ आंधी एवं हवा चेतावनी: हवा की गति ${cur.windSpeed} किमी/घंटा`,
            message: `Strong winds (${cur.windSpeed} km/h) can cause lodging in standing crops. Provide earthing up or physical staking for tall crops, inspect greenhouse sheets, and avoid foliar sprays.`,
            messageHi: `खेत में तेज़ हवाएं (${cur.windSpeed} किमी/घंटा) चल रही हैं। लंबी फसलों को गिरने से बचाने के लिए सहारा दें और किसी भी प्रकार के स्प्रे से बचें।`,
          });
        }

        // Condition E: Fungal Disease Outbreak Susceptibility
        if (cur.humidity >= 80 && cur.temp >= 18 && cur.temp <= 28) {
          candidates.push({
            category: 'crop_disease',
            severity: 'warning',
            title: `Elevated Fungal Disease Risk: High Humidity (${cur.humidity}%)`,
            titleHi: `फफूंद रोग एवं झुलसा जोखिम: उच्च आर्द्रता (${cur.humidity}%)`,
            message: `Prolonged relative humidity of ${cur.humidity}% at ${cur.temp}°C creates prime conditions for rust, leaf blight, and downy mildew spores. Closely inspect lower leaf foliage and keep bio-fungicide (Trichoderma or Neem oil) ready.`,
            messageHi: `अधिक नमी (${cur.humidity}%) और अनुकूल तापमान के कारण पत्ती झुलसा, गेरुआ व फफूंद जनित रोगों का जोखिम बढ़ गया है। पत्तों की जांच करें और जैविक कवकनाशी तैयार रखें।`,
          });
        }

        // Deduplicate & Save Candidates in DB (no duplicates within 12 hours)
        const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
        for (const cand of candidates) {
          const existing = await AlertModel.findOne({
            userId,
            category: cand.category,
            createdAt: { $gte: twelveHoursAgo },
          });

          if (!existing) {
            await AlertModel.create({
              userId,
              farmId,
              category: cand.category,
              severity: cand.severity,
              title: cand.title,
              titleHi: cand.titleHi,
              message: cand.message,
              messageHi: cand.messageHi,
              isRead: false,
              metadata: {
                source: 'live-weather-engine',
                temp: cur.temp,
                humidity: cur.humidity,
                rainProbability: cur.rainProbability,
                windSpeed: cur.windSpeed,
              },
            });
          }
        }
      }

      // 3. Optional WeatherAPI.com official IMD Alert Ingestion
      const weatherApiKey = process.env.WEATHER_API_KEY;
      if (weatherApiKey) {
        try {
          const resp = await fetch(
            `https://api.weatherapi.com/v1/forecast.json?key=${weatherApiKey}&q=${lat},${lon}&alerts=yes`
          );
          if (resp.ok) {
            const json: any = await resp.json();
            const imdAlerts = json.alerts?.alert;
            if (Array.isArray(imdAlerts) && imdAlerts.length > 0) {
              const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
              for (const a of imdAlerts) {
                const alertTitle = a.headline || a.event || 'Official Meteorological Warning';
                const exists = await AlertModel.findOne({
                  userId,
                  title: alertTitle,
                  createdAt: { $gte: oneDayAgo },
                });
                if (!exists) {
                  const sevLower = (a.severity || '').toLowerCase();
                  const severity: AlertSeverity =
                    sevLower === 'severe' || sevLower === 'extreme' ? 'critical' : 'warning';
                  await AlertModel.create({
                    userId,
                    farmId,
                    category: 'weather_alert',
                    severity,
                    title: `Official Weather Warning: ${alertTitle}`,
                    titleHi: `मौसम विभाग चेतावनी: ${alertTitle}`,
                    message: a.desc || a.instruction || 'Official severe weather alert issued for your district.',
                    messageHi: a.desc || a.instruction || 'आपके जिले हेतु मौसम विभाग द्वारा आधिकारिक चेतावनी जारी की गई है।',
                    isRead: false,
                    metadata: {
                      source: 'weatherapi-imd',
                      effective: a.effective,
                      expires: a.expires,
                    },
                  });
                }
              }
            }
          }
        } catch (apiErr) {
          console.warn('[AlertService] WeatherAPI IMD fetch note:', apiErr);
        }
      }
    } catch (err) {
      console.warn('[AlertService] Real weather alert sync note:', err);
    }
  }

  public static async getUserAlerts(userId?: string): Promise<any[]> {
    await this.cleanupLegacySeeded();

    // Trigger non-blocking real weather alert evaluation
    if (userId) {
      await this.syncRealWeatherAlertsForUser(userId).catch(() => {});
    }

    const query: any = {};
    if (userId) {
      query.$or = [{ userId }, { userId: { $exists: false } }, { userId: null }];
    }

    const rawAlerts = await AlertModel.find(query).sort({ createdAt: -1 }).limit(40).lean();

    // Compute user-specific read status for global broadcasts
    return rawAlerts.map((a: any) => {
      const isReadByUser = Boolean(
        a.isRead || (userId && Array.isArray(a.readBy) && a.readBy.includes(userId))
      );
      return {
        ...a,
        isRead: isReadByUser,
      };
    });
  }

  public static async createAlert(data: {
    userId?: string;
    farmId?: string;
    category: AlertCategory;
    severity: AlertSeverity;
    title: string;
    titleHi?: string;
    message: string;
    messageHi?: string;
    actionLink?: string;
  }): Promise<any> {
    await this.cleanupLegacySeeded();
    return AlertModel.create({
      userId: data.userId || undefined,
      farmId: data.farmId || undefined,
      category: data.category || 'general_advisory',
      severity: data.severity || 'warning',
      title: data.title,
      titleHi: data.titleHi || data.title,
      message: data.message,
      messageHi: data.messageHi || data.message,
      actionLink: data.actionLink,
      isRead: false,
      readBy: [],
    });
  }

  public static async markAsRead(alertId: string, userId?: string): Promise<any> {
    if (userId) {
      return AlertModel.findByIdAndUpdate(
        alertId,
        {
          $addToSet: { readBy: userId },
          isRead: true,
        },
        { new: true }
      );
    }
    return AlertModel.findByIdAndUpdate(alertId, { isRead: true }, { new: true });
  }

  public static async markAllAsRead(userId?: string): Promise<void> {
    if (userId) {
      // Mark user-targeted alerts
      await AlertModel.updateMany({ userId }, { isRead: true });
      // Record user in global alerts
      await AlertModel.updateMany(
        { $or: [{ userId: { $exists: false } }, { userId: null }] },
        { $addToSet: { readBy: userId } }
      );
      return;
    }
    await AlertModel.updateMany({}, { isRead: true });
  }
}
