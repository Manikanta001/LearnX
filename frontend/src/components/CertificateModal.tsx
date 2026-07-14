import { X, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface CertBadge {
  id: string;
  label: string;
  desc: string;
  emoji: string;
  gradient: string;
}

interface CertificateModalProps {
  badge: CertBadge;
  userName: string;
  onClose: () => void;
}

function escapeHtml(str: string) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export default function CertificateModal({ badge, userName, onClose }: CertificateModalProps) {
  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const handlePrint = () => {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Certificate – ${escapeHtml(badge.label)}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400&family=Inter:wght@400;600&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', sans-serif;
      background: #fff;
      display: flex; align-items: center; justify-content: center;
      min-height: 100vh; padding: 20px;
    }
    .outer {
      width: 820px; padding: 5px;
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 40%, #ec4899 100%);
      border-radius: 20px;
      box-shadow: 0 25px 80px rgba(99,102,241,0.5);
    }
    .cert {
      background: linear-gradient(145deg, #0f172a 0%, #1e293b 60%, #0f172a 100%);
      border-radius: 16px;
      padding: 56px 64px;
      position: relative;
      overflow: hidden;
      min-height: 520px;
      display: flex; flex-direction: column; align-items: center; justify-content: space-between;
    }
    .cert::before {
      content: '';
      position: absolute; inset: 18px;
      border: 1px solid rgba(99,102,241,0.25);
      border-radius: 10px; pointer-events: none;
    }
    .cert::after {
      content: '';
      position: absolute; top: -120px; right: -120px;
      width: 400px; height: 400px;
      background: radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%);
      pointer-events: none;
    }
    .watermark {
      position: absolute; bottom: 30px; left: 50%; transform: translateX(-50%);
      font-size: 200px; opacity: 0.03; font-family: 'Playfair Display', serif;
      color: white; white-space: nowrap; pointer-events: none;
      z-index: 0;
    }
    .top { text-align: center; position: relative; z-index: 1; }
    .platform-label {
      color: #818cf8; font-size: 11px; letter-spacing: 5px;
      text-transform: uppercase; font-weight: 600; margin-bottom: 10px;
    }
    .cert-heading {
      font-family: 'Playfair Display', serif;
      color: #f8fafc; font-size: 34px; font-weight: 700; margin-bottom: 8px;
    }
    .presented-to {
      color: #64748b; font-size: 13px; letter-spacing: 2px;
      text-transform: uppercase; margin-bottom: 16px;
    }
    .name-wrapper {
      display: inline-block;
      border-bottom: 2px solid rgba(99,102,241,0.6);
      padding: 0 32px 10px;
      margin-bottom: 8px;
    }
    .recipient-name {
      font-family: 'Playfair Display', serif;
      font-style: italic; font-size: 44px; color: #e2e8f0;
      line-height: 1.1;
    }
    .middle { position: relative; z-index: 1; display: flex; align-items: center; gap: 28px; padding: 28px 40px; background: rgba(99,102,241,0.08); border: 1px solid rgba(99,102,241,0.2); border-radius: 12px; margin: 24px 0; }
    .badge-emoji { font-size: 58px; line-height: 1; }
    .achievement-info { text-align: left; }
    .achievement-label { color: #c7d2fe; font-size: 26px; font-weight: 700; font-family: 'Playfair Display', serif; }
    .achievement-sub { color: #64748b; font-size: 13px; margin-top: 6px; letter-spacing: 0.5px; }
    .achievement-sub span { color: #818cf8; font-weight: 600; }
    .footer {
      position: relative; z-index: 1;
      display: flex; justify-content: space-between; align-items: flex-end;
      width: 100%; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.06);
    }
    .sig-block { text-align: left; }
    .sig-name { color: #6366f1; font-size: 20px; font-weight: 700; letter-spacing: 1px; }
    .sig-title { color: #334155; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; margin-top: 4px; }
    .issue-date { color: #475569; font-size: 12px; margin-top: 6px; }
    .seal {
      width: 80px; height: 80px; border-radius: 50%;
      background: linear-gradient(135deg, #f59e0b, #d97706);
      display: flex; align-items: center; justify-content: center;
      font-size: 34px;
      box-shadow: 0 0 30px rgba(245,158,11,0.5), 0 0 0 6px rgba(245,158,11,0.15);
    }
    @media print {
      body { padding: 0; margin: 0; background: white; }
      .outer { box-shadow: none; }
    }
  </style>
</head>
<body>
  <div class="outer">
    <div class="cert">
      <div class="watermark">LearnX</div>
      <div class="top">
        <div class="platform-label">LearnX Platform · Certificate of Achievement</div>
        <div class="cert-heading">This is to certify that</div>
        <div class="presented-to">The following individual has achieved</div>
        <div class="name-wrapper">
          <div class="recipient-name">${escapeHtml(userName)}</div>
        </div>
      </div>
      <div class="middle">
        <div class="badge-emoji">${badge.emoji}</div>
        <div class="achievement-info">
          <div class="achievement-label">${escapeHtml(badge.label)}</div>
          <div class="achievement-sub">by successfully completing — <span>${escapeHtml(badge.desc)}</span></div>
          <div class="achievement-sub" style="margin-top:8px;">demonstrating consistent dedication and perseverance in skill mastery.</div>
        </div>
      </div>
      <div class="footer">
        <div class="sig-block">
          <div class="sig-name">LearnX Platform</div>
          <div class="sig-title">Online Learning Academy</div>
          <div class="issue-date">Issued on ${escapeHtml(today)}</div>
        </div>
        <div class="seal">🏅</div>
      </div>
    </div>
  </div>
  <script>
    window.onload = function() {
      window.print();
      window.onafterprint = function() { window.close(); };
    };
  </script>
</body>
</html>`;

    const w = window.open('', '_blank', 'width=960,height=700');
    if (!w) {
      alert('Please allow pop-ups to print the certificate.');
      return;
    }
    w.document.write(html);
    w.document.close();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-2xl">
        {/* Close button */}
        <Button
          size="icon"
          variant="ghost"
          className="absolute -top-12 right-0 text-white/70 hover:text-white hover:bg-white/10 rounded-full"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </Button>

        {/* Certificate preview */}
        <div
          className="rounded-2xl p-[3px] shadow-2xl"
          style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #ec4899)' }}
        >
          <div className="rounded-[14px] bg-[#0f172a] relative overflow-hidden">
            {/* Inner border */}
            <div className="absolute inset-4 border border-indigo-500/20 rounded-lg pointer-events-none" />
            {/* Glow orb */}
            <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full opacity-20 pointer-events-none"
              style={{ background: 'radial-gradient(circle, #8b5cf6, transparent 70%)' }} />
            {/* Watermark */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-[160px] font-bold text-white/[0.03] select-none font-serif">LearnX</span>
            </div>

            <div className="relative z-10 p-10 flex flex-col items-center gap-6">
              {/* Header */}
              <div className="text-center">
                <p className="text-indigo-400 tracking-[4px] text-[10px] uppercase font-semibold mb-3">
                  LearnX Platform · Certificate of Achievement
                </p>
                <p className="text-slate-300 text-base font-light">This is to certify that</p>
                <div className="border-b border-indigo-500/40 pb-2 mt-3 px-8 inline-block">
                  <h2 className="text-4xl italic font-serif text-slate-100">{userName}</h2>
                </div>
                <p className="text-slate-500 text-xs mt-2 tracking-widest uppercase">has achieved</p>
              </div>

              {/* Achievement */}
              <div className="flex items-center gap-6 bg-indigo-500/10 border border-indigo-500/20 rounded-xl px-8 py-5 w-full">
                <span className="text-5xl shrink-0">{badge.emoji}</span>
                <div>
                  <p className="text-xl font-bold text-indigo-200">{badge.label}</p>
                  <p className="text-slate-400 text-sm mt-1">
                    by completing <span className="text-indigo-400 font-medium">{badge.desc}</span>
                  </p>
                  <p className="text-slate-500 text-xs mt-1 italic">
                    demonstrating consistent dedication in skill mastery.
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-between items-end w-full pt-4 border-t border-white/5">
                <div>
                  <p className="text-indigo-400 font-bold text-lg tracking-wide">LearnX Platform</p>
                  <p className="text-slate-600 text-[10px] tracking-widest uppercase mt-0.5">
                    Online Learning Academy
                  </p>
                  <p className="text-slate-500 text-xs mt-1">{today}</p>
                </div>
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center text-3xl shrink-0"
                  style={{
                    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                    boxShadow: '0 0 24px rgba(245,158,11,0.45)',
                  }}
                >
                  🏅
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 mt-5 justify-center">
          <Button
            onClick={handlePrint}
            className="gap-2 bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-900/40"
          >
            <Printer className="h-4 w-4" />
            Print / Save as PDF
          </Button>
          <Button variant="outline" onClick={onClose} className="border-white/10 text-slate-300 hover:bg-white/5">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
