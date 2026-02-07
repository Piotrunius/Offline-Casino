import { motion } from 'framer-motion';
import { Bug, CheckCircle, Lightbulb, MessageCircle, MessageSquare, Send, Sparkles, Wrench, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import trackingEngine from '../utils/trackingEngine';

// Custom styles for Turnstile captcha
const captchaStyles = `
  #captcha-container iframe {
    border-radius: 12px !important;
    overflow: hidden !important;
  }
`;

const FEEDBACK_TYPES = [
  { value: 'bug', label: 'Bug Report', color: '#E74C3C', icon: Bug },
  { value: 'feature', label: 'Feature Request', color: '#2ECC71', icon: Sparkles },
  { value: 'suggestion', label: 'Suggestions', color: '#F39C12', icon: Lightbulb },
  { value: 'improvement', label: 'Improvements', color: '#3498DB', icon: Wrench },
  { value: 'other', label: 'Other', color: '#9B59B6', icon: MessageCircle }
];

const CASINO_PAGES = [
  { value: 'dashboard', label: 'Dashboard' },
  { value: 'dice', label: 'Dice' },
  { value: 'mines', label: 'Mines' },
  { value: 'crash', label: 'Crash' },
  { value: 'scratchcards', label: 'Scratch Cards' },
  { value: 'limbo', label: 'Limbo' },
  { value: 'coinflip', label: 'Coin Flip' },
  { value: 'tower', label: 'Tower' },
  { value: 'keno', label: 'Keno' },
  { value: 'blackjack', label: 'Blackjack' },
  { value: 'slots', label: 'Slots' },
  { value: 'war', label: 'War' },
  { value: 'hilo', label: 'HiLo' },
  { value: 'baccarat', label: 'Baccarat' },
  { value: 'dragontiger', label: 'Dragon Tiger' },
  { value: 'videopoker', label: 'Video Poker' },
  { value: 'tictactoe', label: 'Tic Tac Toe' },
  { value: 'sicbo', label: 'Sicbo' },
  { value: 'threecardpoker', label: '3 Card Poker' },
  { value: 'stockexchange', label: 'Stock Exchange' },
  { value: 'other', label: 'Other' }
];

const FEEDBACK_WORKER_URL = 'https://webhook.piotrunius.workers.dev';
const TURNSTILE_SITE_KEY = '0x4AAAAAACY41I_bTFCmq-xo';

interface FeedbackButtonProps {
  currentPage?: string;
  getExportCode?: () => string;
}

export default function FeedbackButton({ currentPage = 'dashboard', getExportCode }: FeedbackButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState('bug');
  const [page, setPage] = useState(currentPage);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  const logBufferRef = useRef<string[]>([]);
  const captchaRef = useRef<string | null>(null);
  const tokenPollIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    setPage(currentPage);
  }, [currentPage]);

  // Turnstile rendering z polling fallback
  useEffect(() => {
    if (isOpen && typeof (window as any).turnstile !== 'undefined') {
      // Inject custom styles
      const styleElement = document.createElement('style');
      styleElement.textContent = captchaStyles;
      styleElement.id = 'captcha-custom-styles';
      if (!document.getElementById('captcha-custom-styles')) {
        document.head.appendChild(styleElement);
      }

      const container = document.getElementById('captcha-container');
      if (container && !captchaRef.current) {
        captchaRef.current = (window as any).turnstile.render('#captcha-container', {
          sitekey: TURNSTILE_SITE_KEY,
          callback: (token: string) => {
            setCaptchaToken(token);
            if (tokenPollIntervalRef.current) {
              clearInterval(tokenPollIntervalRef.current);
            }
          },
          'error-callback': () => {
            setCaptchaToken(null);
          },
          theme: 'dark',
          size: 'compact',
        });

        // Polling fallback - czeka na token
        let pollCount = 0;
        const maxPolls = 30; // 30 * 300ms = 9 sekund
        tokenPollIntervalRef.current = window.setInterval(() => {
          pollCount++;
          const widgetId = captchaRef.current;
          if (!widgetId) {
            clearInterval(tokenPollIntervalRef.current!);
            return;
          }

          try {
            const token = (window as any).turnstile.getResponse(widgetId);
            if (token) {
              setCaptchaToken(token);
              clearInterval(tokenPollIntervalRef.current!);
            } else if (pollCount >= maxPolls) {
              clearInterval(tokenPollIntervalRef.current!);
              console.warn('[Turnstile] Polling timeout, retrying...');
            }
          } catch (error) {
            console.error('[Turnstile] Polling error:', error);
          }
        }, 300);
      }
    }

    return () => {
      if (tokenPollIntervalRef.current) {
        clearInterval(tokenPollIntervalRef.current);
      }
      if (captchaRef.current && typeof (window as any).turnstile !== 'undefined') {
        (window as any).turnstile.remove(captchaRef.current);
        captchaRef.current = null;
      }
      setCaptchaToken(null);
    };
  }, [isOpen]);

  useEffect(() => {
    const original = {
      log: console.log,
      warn: console.warn,
      error: console.error
    };

    const pushLog = (level: string, args: unknown[]) => {
      const msg = args
        .map((item) => {
          if (typeof item === 'string') return item;
          try {
            return JSON.stringify(item);
          } catch {
            return String(item);
          }
        })
        .join(' ');
      logBufferRef.current.push(`[${level}] ${msg}`);
      if (logBufferRef.current.length > 50) {
        logBufferRef.current.shift();
      }
    };

    console.log = (...args: unknown[]) => {
      pushLog('log', args);
      original.log(...args);
    };
    console.warn = (...args: unknown[]) => {
      pushLog('warn', args);
      original.warn(...args);
    };
    console.error = (...args: unknown[]) => {
      pushLog('error', args);
      original.error(...args);
    };

    return () => {
      console.log = original.log;
      console.warn = original.warn;
      console.error = original.error;
    };
  }, []);

  const getSystemInfo = () => {
    const nav = navigator;
    const ua = nav.userAgent;
    const deviceType = /Mobi|Android|iPhone|iPad|iPod/i.test(ua) ? 'Mobile' : 'Desktop';
    const gl = (() => {
      try {
        const canvas = document.createElement('canvas');
        const glCtx = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
        if (!glCtx) return {};
        const debugInfo = glCtx.getExtension('WEBGL_debug_renderer_info') as any;
        return debugInfo ? {
          gpuVendor: glCtx.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL),
          gpuRenderer: glCtx.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
        } : {};
      } catch {
        return {};
      }
    })();
    const timing = performance?.timing;
    const loadTime = timing ? Math.max(0, Math.round(timing.loadEventEnd - timing.navigationStart)) + 'ms' : 'N/A';
    const perfNow = Math.round(performance.now()) + 'ms since navigation';
    return {
      userAgent: nav.userAgent,
      language: nav.language,
      platform: nav.platform,
      vendor: nav.vendor || '',
      doNotTrack: nav.doNotTrack || 'unspecified',
      referrer: document.referrer || 'N/A',
      visibility: document.visibilityState,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      dpr: window.devicePixelRatio,
      colorDepth: window.screen.colorDepth,
      deviceType,
      cores: nav.hardwareConcurrency || 'Unknown',
      memory: (nav as any).deviceMemory ? `${(nav as any).deviceMemory}GB` : 'Unknown',
      online: nav.onLine ? 'Online' : 'Offline',
      readyState: document.readyState,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      loadTime,
      perfNow,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      ...gl
    };
  };

  const formatSystemInfo = (info: ReturnType<typeof getSystemInfo>) => {
    const lines = [
      `• URL: ${info.url}`,
      `• Referrer: ${info.referrer}`,
      `• Visibility: ${info.visibility}`,
      `• Browser: ${info.userAgent}`,
      `• Platform: ${info.platform} | Vendor: ${info.vendor}`,
      `• Lang: ${info.language} | DNT: ${info.doNotTrack}`,
      `• Resolution: ${info.screenResolution} (viewport: ${info.viewport}) | DPR: ${info.dpr}`,
      `• ColorDepth: ${info.colorDepth}`,
      `• Memory: ${info.memory} | Cores: ${info.cores}`,
      `• Online: ${info.online} | Ready: ${info.readyState}`,
      `• Timezone: ${info.timezone}`,
      `• Load: ${info.loadTime} | Perf: ${info.perfNow}`,
      info.gpuVendor && info.gpuRenderer ? `• GPU: ${info.gpuVendor} — ${info.gpuRenderer}` : '• GPU: Unknown'
    ];
    return lines.join('\n');
  };


  const setModalOpen = (open: boolean, track = true) => {
    setIsOpen(open);
    if (track) {
      if (open) {
        trackingEngine.trackOpenModal('feedback');
      } else {
        trackingEngine.trackCloseModal('feedback');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!captchaToken) {
      setSubmitStatus('error');
      setStatusMessage('Please wait for captcha verification...');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const systemInfo = getSystemInfo();
      const feedbackType = FEEDBACK_TYPES.find(t => t.value === type);
      const pageName = CASINO_PAGES.find(p => p.value === page)?.label || page;
      const logs = logBufferRef.current.slice(-20).join('\n');
      const systemInfoRaw = formatSystemInfo(systemInfo);
      const systemInfoText = systemInfoRaw.length > 1000 ? `${systemInfoRaw.slice(0, 1000)}\n...` : systemInfoRaw;

      // Create Discord embed
      const embed: any = {
        title: `[${feedbackType?.label}] ${title}`,
        description: description,
        color: parseInt(feedbackType?.color?.replace('#', '') || 'ffffff', 16),
        fields: [
          { name: 'Type', value: feedbackType?.label || 'Unknown', inline: true },
          { name: 'Page', value: pageName, inline: true },
          { name: 'System Info', value: `\`\`\`\n${systemInfoText}\n\`\`\``, inline: false }
        ],
        timestamp: new Date().toISOString(),
        footer: {
          text: 'Offline Casino Feedback System'
        }
      };

      if (logs) {
        const trimmedLogs = logs.length > 1000 ? `${logs.slice(0, 1000)}\n...` : logs;
        embed.fields.push({ name: 'Console Logs', value: `\`\`\`\n${trimmedLogs}\n\`\`\``, inline: false });
      }

      // Send as JSON to worker (not FormData)
      const payload = {
        embeds: [embed],
        content: ''
      };

      const response = await fetch(FEEDBACK_WORKER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Origin-Verify': window.location.origin,
          'X-Captcha-Token': captchaToken || ''
        },
        body: JSON.stringify(payload)
      });

      console.log('[Feedback] Response status:', response.status);
      console.log('[Feedback] Token sent:', captchaToken ? 'YES' : 'NO (empty)');

      const result = await response.json();

      if (!response.ok) {
        console.error('[Feedback] Worker error:', result);
        throw new Error(result.error || result.message || `Request failed: ${response.statusText}`);
      }

      trackingEngine.track('feedback_submitted', {
        type: type,
        page: page
      });

      setSubmitStatus('success');
      setStatusMessage('Feedback submitted successfully!');

      // Reset form after 2 seconds
      setTimeout(() => {
        setIsOpen(false);
        setTitle('');
        setDescription('');
        setCaptchaToken(null);
        setSubmitStatus('idle');
        setStatusMessage('');
      }, 2000);

    } catch (error: any) {
      console.error('Feedback submission failed:', error);
      setSubmitStatus('error');
      setStatusMessage(`❌ ${error.message || 'Failed to submit feedback. Please try again.'}`);
      trackingEngine.track('feedback_submission_failed', { error: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpen = () => {
    setModalOpen(true);
  };

  const handleClose = () => {
    setModalOpen(false);
  };
  return (
    <>
      {/* Feedback Button */}
      <button
        onClick={handleOpen}
        className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 transition-all relative"
        title="Send Feedback"
      >
        <MessageSquare size={20} />
      </button>

      {/* Feedback Modal */}
      {isOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={handleClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-[#0a0a10] border border-white/10 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                  <MessageSquare size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Send Feedback</h3>
                  <p className="text-sm text-gray-400">Help us improve Offline Casino</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="w-8 h-8 text-gray-400 hover:text-white flex items-center justify-center"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Feedback Type</label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {FEEDBACK_TYPES.map((feedbackType) => {
                    const IconComponent = feedbackType.icon;
                    return (
                      <button
                        key={feedbackType.value}
                        type="button"
                        onClick={() => setType(feedbackType.value)}
                        className={`p-2 rounded-xl border transition-all ${
                          type === feedbackType.value
                            ? 'bg-white/10 border-white/20'
                            : 'bg-white/5 border-white/5 hover:bg-white/10'
                        }`}
                        style={{
                          borderColor: type === feedbackType.value ? feedbackType.color : undefined
                        }}
                      >
                        <div className="flex items-center justify-center mb-1" style={{ color: feedbackType.color }}>
                          <IconComponent size={20} />
                        </div>
                        <div className="text-xs text-gray-300">{feedbackType.label}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Page Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Related Page</label>
                <select
                  value={page}
                  onChange={(e) => setPage(e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500/50 transition-all"
                >
                  {CASINO_PAGES.map((pageOption) => (
                    <option key={pageOption.value} value={pageOption.value} className="bg-[#0a0a0f]">
                      {pageOption.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Brief summary of your feedback"
                  required
                  maxLength={100}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 transition-all"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide detailed information about your feedback..."
                  required
                  rows={3}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 transition-all resize-none"
                />
              </div>

              {/* Hidden Turnstile Widget (opacity: 0, not visibility: hidden) */}
              <div id="captcha-container" className="opacity-0 pointer-events-none absolute" style={{ height: 0, overflow: 'hidden' }}></div>

              {/* Bottom Section: Status and Submit */}
              <div className="space-y-3 pt-2">
                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || !title || !description}
                  className={`w-full px-6 py-3 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2 ${
                    isSubmitting || !title || !description
                      ? 'bg-gray-600 cursor-not-allowed opacity-50'
                      : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      Submit Feedback
                    </>
                  )}
                </button>

                {/* Status Message */}
                {statusMessage && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`p-3 rounded-xl flex items-center gap-2 text-sm ${
                      submitStatus === 'success'
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}
                  >
                    {submitStatus === 'success' && <CheckCircle size={18} />}
                    <span className="font-medium">{statusMessage}</span>
                  </motion.div>
                )}
              </div>

            </form>
          </motion.div>
        </div>
      , document.body)}
    </>
  );
}
