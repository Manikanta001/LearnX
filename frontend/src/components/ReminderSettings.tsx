import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface ReminderSettings {
  reminderEnabled: boolean;
  email: string;
}

export default function ReminderSettings() {
  const [settings, setSettings] = useState<ReminderSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');

  useEffect(() => {
    fetchReminders();
  }, []);

  const fetchReminders = async () => {
    try {
      const res = await api.get('/reminder/preference');
      setSettings(res.data);
    } catch (err) {
      console.error('Failed to fetch reminder settings:', err);
      setMessageType('error');
      setMessage('Failed to load reminder settings');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleReminder = async () => {
    if (!settings) return;

    setUpdating(true);
    setMessage('');
    try {
      const res = await api.put('/reminder/preference', {
        reminderEnabled: !settings.reminderEnabled,
      });

      setSettings({
        ...settings,
        reminderEnabled: !settings.reminderEnabled,
      });

      setMessageType('success');
      setMessage(res.data.message);
    } catch (err: any) {
      setMessageType('error');
      setMessage(err.response?.data?.error || 'Failed to update reminder settings');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!settings) {
    return (
      <Card className="border-red-500/20 bg-red-500/5">
        <CardContent className="p-4">
          <p className="text-sm text-red-600">Failed to load reminder settings</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          <div>
            <CardTitle>Daily Reminders</CardTitle>
            <CardDescription>Get notified about unsolved problems each day</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="rounded-lg border bg-muted/50 p-4">
          <p className="text-sm font-medium text-foreground mb-2">Email: {settings.email}</p>
          <p className="text-xs text-muted-foreground mb-4">
            {settings.reminderEnabled
              ? '✅ You will receive daily reminders at 9:00 AM UTC if you haven\'t solved the daily problem.'
              : '❌ Daily reminders are currently disabled'}
          </p>

          <Button
            onClick={handleToggleReminder}
            disabled={updating}
            variant={settings.reminderEnabled ? 'destructive' : 'default'}
          >
            {updating && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {settings.reminderEnabled ? 'Disable Reminders' : 'Enable Reminders'}
          </Button>
        </div>

        {message && (
          <div
            className={`rounded-lg border p-3 flex items-start gap-2 ${
              messageType === 'success'
                ? 'border-emerald-500/20 bg-emerald-500/5'
                : 'border-red-500/20 bg-red-500/5'
            }`}
          >
            {messageType === 'success' ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            )}
            <p
              className={`text-sm ${
                messageType === 'success' ? 'text-emerald-700' : 'text-red-700'
              }`}
            >
              {message}
            </p>
          </div>
        )}

        <div className="rounded-lg bg-blue-500/5 border border-blue-500/20 p-3">
          <p className="text-xs text-blue-700">
            <strong>💡 Tip:</strong> Enable reminders to maintain your solving streak and get daily practice problems delivered to your inbox!
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
