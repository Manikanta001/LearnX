import { useState, useEffect } from 'react';
import api from '@/lib/api';

export function useProblems() {
  const [problems, setProblems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProblems = async () => {
      try {
        const res = await api.get('/problems');
        setProblems(res.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProblems();
  }, []);

  return { problems, loading, error };
}

export function useProblem(id: string) {
  const [problem, setProblem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProblem = async () => {
      try {
        const res = await api.get(`/problems/${id}`);
        setProblem(res.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProblem();
  }, [id]);

  return { problem, loading, error };
}
