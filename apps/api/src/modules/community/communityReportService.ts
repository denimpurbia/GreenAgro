import { CommunityReportModel, ReportCategory } from '../../models/CommunityReport';

/** Round coordinates to ~500m precision to preserve citizen reporter privacy */
function roundToApprox500m(val: number): number {
  return Math.round(val * 200) / 200;
}

export interface CreateReportDTO {
  category: ReportCategory;
  description: string;
  lat: number;
  lng: number;
  district?: string;
  photoUrl?: string;
  isAnonymous?: boolean;
  reporterId?: string;
}

export class CommunityReportService {
  /** Create a citizen report with privacy protection (rounded public coordinates) */
  public static async createReport(data: CreateReportDTO): Promise<any> {
    const {
      category,
      description,
      lat,
      lng,
      district = 'udaipur',
      photoUrl,
      isAnonymous = true,
      reporterId,
    } = data;

    // Public coords are rounded to ~500 meters
    const publicLat = roundToApprox500m(lat);
    const publicLng = roundToApprox500m(lng);

    const report = await CommunityReportModel.create({
      category,
      description,
      preciseLocation: {
        type: 'Point',
        coordinates: [lng, lat],
      },
      publicLocation: {
        type: 'Point',
        coordinates: [publicLng, publicLat],
      },
      district,
      photoUrl,
      isAnonymous: Boolean(isAnonymous),
      // Store reporterId so the authenticated farmer can check their own submission status in /api/reports/my,
      // while never exposing it on public endpoints or when isAnonymous is true.
      reporterId: reporterId || undefined,
      status: 'pending', // Requires verification before appearing on public map
      submittedAt: new Date(),
    });

    return {
      id: report._id,
      category: report.category,
      status: report.status,
      district: report.district,
      submittedAt: report.submittedAt,
      message: 'Report submitted successfully. It will appear publicly once verified by a Government / Organization moderator.',
    };
  }

  /**
   * Get public reports: only verified, coordinates rounded (~500m), reporter identities never exposed.
   */
  public static async getPublicVerifiedReports(district?: string): Promise<any[]> {
    const query: any = { status: 'verified' };
    if (district && district !== 'all') {
      query.district = district;
    }

    const reports = await CommunityReportModel.find(query)
      .select('category description publicLocation district photoUrl submittedAt moderatedAt status')
      .sort({ submittedAt: -1 })
      .limit(50)
      .lean();

    return reports.map((r) => ({
      id: r._id,
      category: r.category,
      description: r.description,
      location: {
        lat: r.publicLocation?.coordinates?.[1] ?? 0,
        lng: r.publicLocation?.coordinates?.[0] ?? 0,
      },
      district: r.district,
      photoUrl: r.photoUrl,
      status: r.status,
      submittedAt: r.submittedAt,
      moderatedAt: r.moderatedAt,
    }));
  }

  /**
   * Get reports submitted by the currently authenticated farmer/user so they can track status.
   */
  public static async getMyReports(reporterId: string): Promise<any[]> {
    if (!reporterId) return [];
    const reports = await CommunityReportModel.find({ reporterId })
      .sort({ submittedAt: -1 })
      .limit(50)
      .lean();

    return reports.map((r) => ({
      id: r._id,
      category: r.category,
      description: r.description,
      district: r.district,
      photoUrl: r.photoUrl,
      isAnonymous: r.isAnonymous,
      status: r.status,
      rejectionReason: r.rejectionReason,
      moderatedAt: r.moderatedAt,
      submittedAt: r.submittedAt,
      location: {
        lat: r.publicLocation?.coordinates?.[1] ?? 0,
        lng: r.publicLocation?.coordinates?.[0] ?? 0,
      },
    }));
  }

  /**
   * Get all reports for moderation (authorized Government / Organization moderators only).
   * Includes preciseLocation for field inspection, while masking reporterId if isAnonymous is true.
   */
  public static async getAllReportsForModerator(statusFilter?: string): Promise<any[]> {
    const query: any = {};
    if (statusFilter && ['pending', 'verified', 'rejected'].includes(statusFilter)) {
      query.status = statusFilter;
    }
    const docs = await CommunityReportModel.find(query).sort({ submittedAt: -1 }).limit(100).lean();
    return docs.map((r) => ({
      _id: r._id,
      id: r._id,
      category: r.category,
      description: r.description,
      district: r.district,
      photoUrl: r.photoUrl,
      isAnonymous: r.isAnonymous,
      reporterId: r.isAnonymous ? undefined : r.reporterId,
      preciseLocation: {
        lat: r.preciseLocation?.coordinates?.[1] ?? 0,
        lng: r.preciseLocation?.coordinates?.[0] ?? 0,
      },
      publicLocation: {
        lat: r.publicLocation?.coordinates?.[1] ?? 0,
        lng: r.publicLocation?.coordinates?.[0] ?? 0,
      },
      status: r.status,
      moderatedBy: r.moderatedBy,
      moderatedAt: r.moderatedAt,
      rejectionReason: r.rejectionReason,
      submittedAt: r.submittedAt,
    }));
  }

  /**
   * Moderate report (verify or reject) — restricted to verified govt_org moderators.
   */
  public static async moderateReport(
    reportId: string,
    status: 'verified' | 'rejected',
    moderatedBy: string,
    notesOrRejectionReason?: string
  ): Promise<any> {
    const updated = await CommunityReportModel.findByIdAndUpdate(
      reportId,
      {
        $set: {
          status,
          moderatedBy,
          moderatedAt: new Date(),
          rejectionReason: notesOrRejectionReason?.trim() || undefined,
        },
      },
      { new: true }
    );
    return updated;
  }
}
