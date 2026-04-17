/**
 * setting.service.js — API calls cho Settings
 * Phụ thuộc: http.js
 */

const SettingService = {
  getAll: () => Http.get('/api/settings'),
  getByGroup: (group) => Http.get(`/api/settings/${group}`),
  updateGroup: (group, data) => Http.put(`/api/settings/${group}`, data),
};
