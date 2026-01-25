
import { UserProfile, ProfileStatus, EmploymentStatus, RiskAttitude } from '../types';

const BASE_URL = 'https://holly-and-morty-api.redstone-c46110a3.uksouth.azurecontainerapps.io';

const ensureArray = (data: any): UserProfile[] => {
  if (!data) return [];
  // If the response is the direct array
  if (Array.isArray(data)) return data;
  // If the response is wrapped in { "profiles": [...] } as per sample
  if (data && data.profiles && Array.isArray(data.profiles)) {
    return data.profiles;
  }
  // If it's a single profile object (has user_id)
  if (data && typeof data === 'object' && data.user_id) {
    return [data as UserProfile];
  }
  return [];
};

export const apiService = {
  async getProfile(userId: string): Promise<UserProfile | null> {
    try {
      const encodedId = encodeURIComponent(userId);
      const response = await fetch(`${BASE_URL}/profiles/${encodedId}`);
      if (response.status === 404) return null;
      if (!response.ok) throw new Error('Failed to fetch profile');
      const data = await response.json();
      return Array.isArray(data) ? (data.length > 0 ? data[0] : null) : data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw error; 
    }
  },

  async getAllProfiles(limit: number = 100, offset: number = 0): Promise<UserProfile[]> {
    const response = await fetch(`${BASE_URL}/profiles/?limit=${limit}&offset=${offset}`);
    if (!response.ok) throw new Error('Failed to fetch profiles');
    const data = await response.json();
    return ensureArray(data);
  },

  async createProfile(data: { user_id: string; first_name: string; last_name: string }): Promise<UserProfile> {
    const response = await fetch(`${BASE_URL}/profiles/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: data.user_id,
        id: data.user_id,
        first_name: data.first_name,
        last_name: data.last_name,
        status: 'new'
      }),
    });
    if (!response.ok) throw new Error('Failed to create profile');
    return await response.json();
  },

  async updateProfile(userId: string, profile: UserProfile): Promise<UserProfile> {
    const encodedId = encodeURIComponent(userId);
    const response = await fetch(`${BASE_URL}/profiles/${encodedId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    });
    if (!response.ok) throw new Error('Failed to update profile');
    return await response.json();
  },

  async searchByName(name: string): Promise<UserProfile[]> {
    const response = await fetch(`${BASE_URL}/profiles/search/by-name?name=${encodeURIComponent(name)}`);
    if (!response.ok) return [];
    const data = await response.json();
    return ensureArray(data);
  },

  async searchByStatus(status: ProfileStatus): Promise<UserProfile[]> {
    const response = await fetch(`${BASE_URL}/profiles/search/by-status?status=${status}`);
    if (!response.ok) return [];
    const data = await response.json();
    return ensureArray(data);
  },

  async searchByEmployment(status: EmploymentStatus): Promise<UserProfile[]> {
    const response = await fetch(`${BASE_URL}/profiles/search/by-employment?employment_status=${status}`);
    if (!response.ok) return [];
    const data = await response.json();
    return ensureArray(data);
  },

  async searchByNetWorth(min: number, max: number): Promise<UserProfile[]> {
    const response = await fetch(`${BASE_URL}/profiles/search/by-net-worth-range?min_net_worth=${min}&max_net_worth=${max}`);
    if (!response.ok) return [];
    const data = await response.json();
    return ensureArray(data);
  },

  async searchByRisk(risk: RiskAttitude): Promise<UserProfile[]> {
    const response = await fetch(`${BASE_URL}/profiles/search/by-risk-attitude?risk_attitude=${risk}`);
    if (!response.ok) return [];
    const data = await response.json();
    return ensureArray(data);
  },

  async searchByIncome(min: number, max: number): Promise<UserProfile[]> {
    const response = await fetch(`${BASE_URL}/profiles/search/by-income-range?min_income=${min}&max_income=${max}`);
    if (!response.ok) return [];
    const data = await response.json();
    return ensureArray(data);
  },

  async initiateCall(userId: string): Promise<void> {
    const response = await fetch(`${BASE_URL}/calls/outbound`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to_number: userId }),
    });
    if (!response.ok) throw new Error('Failed to initiate outbound call');
  },

  async getConversations(userId: string): Promise<any[]> {
    const encodedId = encodeURIComponent(userId);
    const response = await fetch(`${BASE_URL}/conversations/user/${encodedId}`);
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data) ? data : [data];
  }
};
