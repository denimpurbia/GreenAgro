import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserModel, IUser } from '../../models/User';
import { FarmModel, IFarm } from '../../models/Farm';
import { isConnectedToDb } from '../../database';
import { config } from '../../config';

export interface CleanUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'farmer' | 'expert' | 'government' | 'agronomist' | 'researcher' | 'cooperative';
  location: string;
  language: 'en' | 'hi';
  avatarUrl: string;
  preferences: {
    weatherAlerts: boolean;
    diseaseAlerts: boolean;
    weeklyReports: boolean;
    marketUpdates: boolean;
  };
}

export interface CleanFarm {
  id: string;
  ownerId: string;
  name: string;
  locationName: string;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
  areaAcres: number;
  primaryCrop: string;
  cropVariety: string;
  sowingDate: string;
  growthStage: string;
  soilType: string;
  irrigationMethod: string;
  boundary: Array<{ lat: number; lng: number }>;
}

// ─────────────────────────────────────────────────────────────────────────────
// In-Memory Store
// Only active when USE_IN_MEMORY_DB=true.
// Starts completely empty — NO hardcoded users, NO demo data, NO fake accounts.
// Reaches here only in local dev when explicitly opted-in.
// When USE_IN_MEMORY_DB=false, the server refuses to start if Atlas is down
// (see database.ts), so these maps are never reached in production.
// ─────────────────────────────────────────────────────────────────────────────
const memoryUsers = new Map<string, CleanUser & { passwordHash: string }>();
const memoryFarms = new Map<string, CleanFarm>();

/**
 * Guard: throws if the server is running without a DB and NOT in dev in-memory mode.
 * This prevents auth from silently returning null/empty in degraded state.
 */
function requireDb(operation: string): void {
  if (!isConnectedToDb && !config.useInMemoryDb) {
    throw new Error(
      `Database unavailable. Cannot perform "${operation}". ` +
      'Check MongoDB Atlas connection and server startup logs.'
    );
  }
}

export class UserFarmService {
  public static signToken(user: CleanUser): string {
    return jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      config.jwtSecret,
      { expiresIn: '7d' }
    );
  }

  public static verifyToken(token: string): { id: string; email: string; role: string } | null {
    try {
      return jwt.verify(token, config.jwtSecret) as any;
    } catch {
      return null;
    }
  }

  public static async findUserByEmail(email: string): Promise<(CleanUser & { passwordHash?: string }) | null> {
    requireDb('findUserByEmail');
    const cleanEmail = email.toLowerCase().trim();

    if (isConnectedToDb) {
      try {
        const found = await UserModel.findOne({ email: cleanEmail }).select('+password');
        if (found) {
          return {
            id: found._id.toString(),
            name: found.name,
            email: found.email,
            phone: found.phone || '',
            role: found.role,
            location: found.location,
            language: found.language,
            avatarUrl: found.avatarUrl,
            preferences: found.preferences,
            passwordHash: found.password,
          };
        }
        return null;
      } catch (err) {
        console.error('MongoDB findUserByEmail error:', err);
        throw err;
      }
    }

    // USE_IN_MEMORY_DB=true path (local dev only)
    const memUser = memoryUsers.get(cleanEmail);
    return memUser ? { ...memUser } : null;
  }

  public static async findUserById(id: string): Promise<CleanUser | null> {
    requireDb('findUserById');

    if (isConnectedToDb) {
      try {
        const found = await UserModel.findById(id);
        if (found) {
          return {
            id: found._id.toString(),
            name: found.name,
            email: found.email,
            phone: found.phone || '',
            role: found.role,
            location: found.location,
            language: found.language,
            avatarUrl: found.avatarUrl,
            preferences: found.preferences,
          };
        }
        return null;
      } catch (err) {
        console.error('MongoDB findUserById error:', err);
        throw err;
      }
    }

    // USE_IN_MEMORY_DB=true path (local dev only)
    for (const u of memoryUsers.values()) {
      if (u.id === id) {
        const { passwordHash: _, ...rest } = u;
        return rest;
      }
    }
    return null;
  }

  public static async createUser(data: {
    name: string;
    email: string;
    password?: string;
    phone?: string;
    role?: 'farmer' | 'agronomist' | 'researcher' | 'cooperative';
    location?: string;
  }): Promise<CleanUser> {
    requireDb('createUser');
    const cleanEmail = data.email.toLowerCase().trim();
    const passwordHash = data.password ? await bcrypt.hash(data.password, 10) : '';

    if (isConnectedToDb) {
      try {
        const userDoc = new UserModel({
          name: data.name.trim(),
          email: cleanEmail,
          password: passwordHash,
          phone: data.phone?.trim() || '',
          role: data.role || 'farmer',
          location: data.location || '',
          language: 'en',
          avatarUrl: '/images/farmer-hero.jpg',
          preferences: {
            weatherAlerts: true,
            diseaseAlerts: true,
            weeklyReports: true,
            marketUpdates: false,
          },
        });
        await userDoc.save();

        return {
          id: userDoc._id.toString(),
          name: userDoc.name,
          email: userDoc.email,
          phone: userDoc.phone || '',
          role: userDoc.role,
          location: userDoc.location,
          language: userDoc.language,
          avatarUrl: userDoc.avatarUrl,
          preferences: userDoc.preferences,
        };
      } catch (err: any) {
        console.error('MongoDB createUser error:', err);
        throw err;
      }
    }

    // USE_IN_MEMORY_DB=true path (local dev only — empty store, no demo data)
    const id = `usr-${Date.now()}`;
    const cleanUser: CleanUser = {
      id,
      name: data.name.trim(),
      email: cleanEmail,
      phone: data.phone?.trim() || '',
      role: data.role || 'farmer',
      location: data.location || '',
      language: 'en',
      avatarUrl: '/images/farmer-hero.jpg',
      preferences: {
        weatherAlerts: true,
        diseaseAlerts: true,
        weeklyReports: true,
        marketUpdates: false,
      },
    };

    memoryUsers.set(cleanEmail, { ...cleanUser, passwordHash });
    return cleanUser;
  }

  public static async createFarm(
    ownerId: string,
    farmData: {
      name: string;
      locationName?: string;
      state?: string;
      country?: string;
      latitude?: number;
      longitude?: number;
      areaAcres?: number;
      primaryCrop?: string;
      cropVariety?: string;
      soilType?: string;
      irrigationMethod?: string;
      boundary?: Array<{ lat: number; lng: number }>;
    }
  ): Promise<CleanFarm> {
    requireDb('createFarm');

    if (isConnectedToDb) {
      try {
        const farmDoc = new FarmModel({
          ownerId,
          name: farmData.name.trim(),
          locationName: farmData.locationName?.trim() || '',
          state: farmData.state || '',
          country: farmData.country || '',
          latitude: Number(farmData.latitude ?? 0),
          longitude: Number(farmData.longitude ?? 0),
          areaAcres: Number(farmData.areaAcres ?? 0),
          primaryCrop: farmData.primaryCrop?.trim() || '',
          cropVariety: farmData.cropVariety?.trim() || '',
          soilType: farmData.soilType?.trim() || '',
          irrigationMethod: farmData.irrigationMethod?.trim() || '',
          boundary: farmData.boundary || [],
        });
        await farmDoc.save();

        return {
          id: farmDoc._id.toString(),
          ownerId: farmDoc.ownerId,
          name: farmDoc.name,
          locationName: farmDoc.locationName,
          state: farmDoc.state,
          country: farmDoc.country,
          latitude: farmDoc.latitude,
          longitude: farmDoc.longitude,
          areaAcres: farmDoc.areaAcres,
          primaryCrop: farmDoc.primaryCrop,
          cropVariety: farmDoc.cropVariety,
          sowingDate: farmDoc.sowingDate || '',
          growthStage: farmDoc.growthStage || '',
          soilType: farmDoc.soilType,
          irrigationMethod: farmDoc.irrigationMethod,
          boundary: farmDoc.boundary || [],
        };
      } catch (err) {
        console.error('MongoDB createFarm error:', err);
        throw err;
      }
    }

    // USE_IN_MEMORY_DB=true path (local dev only)
    const newId = `farm-${Date.now()}`;
    const clean: CleanFarm = {
      id: newId,
      ownerId,
      name: farmData.name.trim(),
      locationName: farmData.locationName?.trim() || '',
      state: farmData.state || '',
      country: farmData.country || '',
      latitude: Number(farmData.latitude ?? 0),
      longitude: Number(farmData.longitude ?? 0),
      areaAcres: Number(farmData.areaAcres ?? 0),
      primaryCrop: farmData.primaryCrop?.trim() || '',
      cropVariety: farmData.cropVariety?.trim() || '',
      sowingDate: '',
      growthStage: '',
      soilType: farmData.soilType?.trim() || '',
      irrigationMethod: farmData.irrigationMethod?.trim() || '',
      boundary: farmData.boundary || [],
    };
    memoryFarms.set(ownerId, clean);
    return clean;
  }

  public static async getFarmByOwnerId(ownerId: string): Promise<CleanFarm | null> {
    requireDb('getFarmByOwnerId');

    if (isConnectedToDb) {
      try {
        const found = await FarmModel.findOne({ ownerId });
        if (found) {
          return {
            id: found._id.toString(),
            ownerId: found.ownerId,
            name: found.name,
            locationName: found.locationName,
            state: found.state,
            country: found.country,
            latitude: found.latitude,
            longitude: found.longitude,
            areaAcres: found.areaAcres,
            primaryCrop: found.primaryCrop,
            cropVariety: found.cropVariety,
            sowingDate: found.sowingDate,
            growthStage: found.growthStage,
            soilType: found.soilType,
            irrigationMethod: found.irrigationMethod,
            boundary: found.boundary || [],
          };
        }
        return null;
      } catch (err) {
        console.error('MongoDB getFarmByOwnerId error:', err);
        throw err;
      }
    }

    // USE_IN_MEMORY_DB=true path (local dev only)
    return memoryFarms.get(ownerId) || null;
  }

  public static async updateFarm(
    ownerId: string,
    farmData: Partial<CleanFarm>
  ): Promise<CleanFarm> {
    requireDb('updateFarm');

    if (isConnectedToDb) {
      try {
        const updated = await FarmModel.findOneAndUpdate(
          { ownerId },
          { $set: farmData },
          { new: true, upsert: true }
        );
        return {
          id: updated._id.toString(),
          ownerId: updated.ownerId,
          name: updated.name,
          locationName: updated.locationName,
          state: updated.state,
          country: updated.country,
          latitude: updated.latitude,
          longitude: updated.longitude,
          areaAcres: updated.areaAcres,
          primaryCrop: updated.primaryCrop,
          cropVariety: updated.cropVariety,
          sowingDate: updated.sowingDate,
          growthStage: updated.growthStage,
          soilType: updated.soilType,
          irrigationMethod: updated.irrigationMethod,
          boundary: updated.boundary || [],
        };
      } catch (err) {
        console.error('MongoDB updateFarm error:', err);
        throw err;
      }
    }

    // USE_IN_MEMORY_DB=true path (local dev only)
    const current = memoryFarms.get(ownerId) || {
      id: `farm-${Date.now()}`,
      ownerId,
      name: 'My Farm',
      locationName: '',
      state: '',
      country: '',
      latitude: 0,
      longitude: 0,
      areaAcres: 0,
      primaryCrop: '',
      cropVariety: '',
      sowingDate: '',
      growthStage: '',
      soilType: '',
      irrigationMethod: '',
      boundary: [],
    };

    const merged = { ...current, ...farmData };
    memoryFarms.set(ownerId, merged);
    return merged;
  }
}
