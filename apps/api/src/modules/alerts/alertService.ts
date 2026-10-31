import { AlertModel, AlertCategory, AlertSeverity } from '../../models/Alert';

const LEGACY_SAMPLE_ALERT_TITLES = [
  'Soybean Mandi Price Notice',
  'Lake Pichola Level Update',
  'Monsoon Runoff Preparation',
  'FIRMS Thermal Anomaly Detected',
];

export class AlertService {
  private static purgedLegacy = false;

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

  public static async getUserAlerts(userId?: string): Promise<any[]> {
    await this.cleanupLegacySeeded();
    const query: any = {};
    if (userId) {
      query.$or = [{ userId }, { userId: { $exists: false } }, { userId: null }];
    }
    return AlertModel.find(query).sort({ createdAt: -1 }).limit(30).lean();
  }

  public static async createAlert(data: {
    userId?: string;
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
      userId: data.userId,
      category: data.category,
      severity: data.severity,
      title: data.title,
      titleHi: data.titleHi || data.title,
      message: data.message,
      messageHi: data.messageHi || data.message,
      actionLink: data.actionLink,
      isRead: false,
    });
  }

  public static async markAsRead(alertId: string): Promise<any> {
    return AlertModel.findByIdAndUpdate(alertId, { isRead: true }, { new: true });
  }

  public static async markAllAsRead(userId?: string): Promise<void> {
    const query: any = {};
    if (userId) {
      query.$or = [{ userId }, { userId: { $exists: false } }, { userId: null }];
    }
    await AlertModel.updateMany(query, { isRead: true });
  }
}
