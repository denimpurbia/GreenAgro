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
