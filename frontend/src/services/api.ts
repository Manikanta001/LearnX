import api from '@/lib/api';

export const problemService = {
  getAll: (params?: { difficulty?: string; topic?: string }) =>
    api.get('/problems', { params }).then((r) => r.data),

  getById: (id: string) =>
    api.get(`/problems/${id}`).then((r) => r.data),
};

export const submissionService = {
  submit: (data: { problemId: string; code: string; language: string }) =>
    api.post('/submissions/submit', data).then((r) => r.data),

  run: (data: { code: string; language: string; input?: string; problemId?: string }) =>
    api.post('/submissions/run', data).then((r) => r.data),

  getUserSubmissions: (problemId?: string) =>
    api.get('/submissions/user', { params: { problemId } }).then((r) => r.data),
};

export const hintService = {
  getHint: (problemId: string) =>
    api.post('/hint', { problemId }).then((r) => r.data),
};

export const aiService = {
  assist: (data: { problemId: string; action: 'hint-steps' | 'explain' | 'optimize'; userCode?: string }) =>
    api.post('/ai/assist', data).then((r) => r.data),
};

export const interviewService = {
  start: () => api.get('/interview/start').then((r) => r.data),
};

export const dailyService = {
  get: () => api.get('/daily').then((r) => r.data),
};

export const leaderboardService = {
  get: (sortBy: string = 'solved') =>
    api.get(`/leaderboard?sortBy=${sortBy}`).then((r) => r.data),
};

export const bookmarkService = {
  toggle: (problemId: string) =>
    api.post('/bookmarks/toggle', { problemId }).then((r) => r.data),

  getAll: () => api.get('/bookmarks').then((r) => r.data),
};
