import React, { useState, useEffect, useCallback, useRef } from 'react';
import { User, AnalysisData, GrowthAdvisorData, ReviewIntelligenceData, AnalysisEntry, Screen, AuthMode } from './types';
import { api, CreditExhaustedError, BillingStatus } from './utils/api';
import { LanguageProvider } from './i18n';
import LandingScreen from './components/LandingScreen';
import AuthScreen from './components/AuthScreen';
import DashboardScreen from './components/DashboardScreen';
import FoundScreen from './components/FoundScreen';
import PaymentScreen from './components/PaymentScreen';
import GeneratingScreen from './components/GeneratingScreen';
import ReportScreen from './components/ReportScreen';
import GrowthReportScreen from './components/GrowthReportScreen';
import ReviewReportScreen from './components/ReviewReportScreen';
import AdminLeadDiscoveryScreen from './components/AdminLeadDiscoveryScreen';
import PricingScreen from './components/PricingScreen';
import ResetPasswordScreen from './components/ResetPasswordScreen';
import UpgradeModal from './components/UpgradeModal';

const PLANS_LABEL: Record<string, string> = {
  free: 'Free', starter: 'Starter', pro: 'Pro', agency: 'Agency',
};

function AppInner() {
  const [screen, setScreen] = useState<Screen>('landing');
  const [user, setUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [urlInput, setUrlInput] = useState('');
  const [radius, setRadius] = useState(25);
  const [report, setReport] = useState<AnalysisData | null>(null);
  const [growthReport, setGrowthReport] = useState<GrowthAdvisorData | null>(null);
  const [reviewReport, setReviewReport] = useState<ReviewIntelligenceData | null>(null);
  const [reportMeta, setReportMeta] = useState<{ id: string; url: string; at: string; reportType?: 'competitive' | 'growth' | 'review' } | null>(null);
  const [saved, setSaved] = useState<AnalysisEntry[]>([]);
  const [step, setStep] = useState(0);
  const [done, setDone] = useState<number[]>([]);
  const [foundRep, setFoundRep] = useState<AnalysisEntry | null>(null);
  const [pendUrl, setPendUrl] = useState('');
  const [pendRad, setPendRad] = useState(25);
  const [pendReportType, setPendReportType] = useState<'competitive' | 'growth' | 'review'>('competitive');
  const [pendCity, setPendCity] = useState('');
  const [pendState, setPendState] = useState('');
  const [error, setError] = useState('');
  const [billingStatus, setBillingStatus] = useState<BillingStatus | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const billingRefreshPending = useRef(false);

  // Detect password-reset token in URL before restoring session
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const rt = params.get('reset_token');
    if (rt) {
      setResetToken(rt);
      setScreen('reset-password');
      window.history.replaceState({}, '', window.location.pathname);
      return;
    }
    // Restore session from localStorage
    const token = localStorage.getItem('sap_token');
    const storedUser = localStorage.getItem('sap_user');
    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
        setScreen('dashboard');
      } catch {
        localStorage.removeItem('sap_token');
        localStorage.removeItem('sap_user');
      }
    }
  }, []);

  // Handle billing success/cancelled query params on return from Stripe
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const billing = params.get('billing');
    if (billing === 'success' || billing === 'addon_success') {
      window.history.replaceState({}, '', window.location.pathname);
      // Mark that we need to re-poll billing — Stripe webhook may not have
      // processed yet, so we retry at 3s and 8s after auth finishes loading.
      billingRefreshPending.current = true;
    } else if (billing === 'cancelled') {
      window.history.replaceState({}, '', window.location.pathname);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadBillingStatus = useCallback(async () => {
    try {
      const status = await api.getBillingStatus();
      setBillingStatus(status);
    } catch {
      // non-fatal
    }
  }, []);

  const loadReports = useCallback(async () => {
    try {
      const reports = await api.getReports() as AnalysisEntry[];
      setSaved(reports);
    } catch {
      // non-fatal
    }
  }, []);

  useEffect(() => {
    if (user && screen === 'dashboard') {
      loadReports();
      if (!user.isAdmin) {
        loadBillingStatus();
        if (billingRefreshPending.current) {
          billingRefreshPending.current = false;
          // Webhook may arrive seconds after the redirect — retry to catch it
          setTimeout(() => loadBillingStatus(), 3000);
          setTimeout(() => loadBillingStatus(), 8000);
        }
      }
    }
  }, [user, screen, loadReports, loadBillingStatus]);

  const handleAuth = useCallback((u: User, token: string) => {
    localStorage.setItem('sap_token', token);
    localStorage.setItem('sap_user', JSON.stringify(u));
    setUser(u);
    setScreen('dashboard');
    setError('');
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('sap_token');
    localStorage.removeItem('sap_user');
    setUser(null);
    setReport(null);
    setGrowthReport(null);
    setReviewReport(null);
    setSaved([]);
    setBillingStatus(null);
    setScreen('landing');
  }, []);

  const handleUrlSubmit = useCallback(async (
    url: string,
    rad: number,
    reportType: 'competitive' | 'growth' | 'review',
    city?: string,
    state?: string,
  ) => {
    setError('');
    setPendReportType(reportType);
    setPendCity(city || '');
    setPendState(state || '');
    setPendUrl(url);
    setPendRad(rad);
    try {
      const result = await api.checkReport(url) as { found: boolean; report?: AnalysisEntry };
      if (result.found && result.report) {
        setFoundRep(result.report);
        setScreen('found');
      } else {
        startGeneration(url, rad, undefined, reportType, city || '', state || '');
      }
    } catch (e) {
      setError((e as Error).message);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startGeneration = useCallback(async (
    url: string,
    rad: number,
    paymentIntentId?: string,
    reportType?: 'competitive' | 'growth' | 'review',
    city?: string,
    state?: string,
  ) => {
    const effectiveReportType = reportType || pendReportType;
    const effectiveCity = city !== undefined ? city : pendCity;
    const effectiveState = state !== undefined ? state : pendState;

    setScreen('gen');
    setStep(0);
    setDone([]);
    setError('');

    const STEPS = 7;
    let currentStep = 0;
    const intervalId = setInterval(() => {
      if (currentStep < STEPS - 1) {
        setDone(prev => [...prev, currentStep]);
        currentStep++;
        setStep(currentStep);
      }
    }, 800);

    try {
      let entry: AnalysisEntry;
      if (paymentIntentId) {
        entry = await api.confirmPayment(paymentIntentId, url, rad) as AnalysisEntry;
      } else if (effectiveReportType === 'growth') {
        entry = await api.generateGrowthReport(url, rad, effectiveCity, effectiveState) as AnalysisEntry;
      } else if (effectiveReportType === 'review') {
        const { jobId } = await api.generateReviewReport(url);
        // Poll until the background job completes (avoids gateway timeout)
        let pollResult: AnalysisEntry | null = null;
        for (let i = 0; i < 36; i++) { // up to 3 minutes (36 × 5s)
          await new Promise<void>(resolve => setTimeout(resolve, 5000));
          const poll = await api.pollReviewJob(jobId);
          if (poll.status === 'failed') throw new Error(poll.error || 'Review analysis failed');
          if (poll.status === 'completed' && poll.report) {
            pollResult = poll.report as AnalysisEntry;
            break;
          }
        }
        if (!pollResult) throw new Error('Review analysis timed out. Please try again.');
        entry = pollResult;
      } else {
        entry = await api.generateReport(url, rad) as AnalysisEntry;
      }
      clearInterval(intervalId);
      setDone(Array.from({ length: STEPS }, (_, i) => i));
      setStep(STEPS - 1);

      // Refresh billing status after successful generation
      loadBillingStatus();

      setTimeout(() => {
        const entryReportType = (entry as AnalysisEntry & { reportType?: string }).reportType as 'competitive' | 'growth' | 'review' | undefined;
        if (entryReportType === 'growth') {
          setGrowthReport(entry.data as unknown as GrowthAdvisorData);
          setReport(null);
          setReviewReport(null);
        } else if (entryReportType === 'review') {
          setReviewReport(entry.data as unknown as ReviewIntelligenceData);
          setReport(null);
          setGrowthReport(null);
        } else {
          setReport(entry.data as AnalysisData);
          setGrowthReport(null);
          setReviewReport(null);
        }
        setReportMeta({
          id: entry.id,
          url: entry.url,
          at: entry.at,
          reportType: entryReportType || 'competitive',
        });
        setScreen('report');
        loadReports();
      }, 500);
    } catch (e) {
      clearInterval(intervalId);
      if (e instanceof CreditExhaustedError) {
        setShowUpgradeModal(true);
        setScreen('dashboard');
        return;
      }
      setError((e as Error).message);
      setScreen(paymentIntentId ? 'payment' : 'dashboard');
    }
  }, [loadReports, loadBillingStatus, pendReportType, pendCity, pendState]);

  const handlePaymentSuccess = useCallback(async (paymentIntentId: string) => {
    await startGeneration(pendUrl, pendRad, paymentIntentId);
  }, [pendUrl, pendRad, startGeneration]);

  const viewReport = useCallback((entry: AnalysisEntry) => {
    const entryReportType = entry.reportType;
    if (entryReportType === 'growth') {
      setGrowthReport(entry.data as unknown as GrowthAdvisorData);
      setReport(null);
      setReviewReport(null);
    } else if (entryReportType === 'review') {
      setReviewReport(entry.data as unknown as ReviewIntelligenceData);
      setReport(null);
      setGrowthReport(null);
    } else {
      setReport(entry.data as AnalysisData);
      setGrowthReport(null);
      setReviewReport(null);
    }
    setReportMeta({
      id: entry.id,
      url: entry.url,
      at: entry.at,
      reportType: entryReportType || 'competitive',
    });
    setScreen('report');
  }, []);

  const deleteReport = useCallback(async (id: string) => {
    try {
      await api.deleteReport(id);
      setSaved(prev => prev.filter(r => r.id !== id));
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  if (screen === 'reset-password' && resetToken) {
    return (
      <ResetPasswordScreen
        token={resetToken}
        onDone={() => { setResetToken(null); setAuthMode('login'); setScreen('auth'); }}
      />
    );
  }

  if (screen === 'pricing') {
    return (
      <PricingScreen
        onBack={() => setScreen(user ? 'dashboard' : 'landing')}
        isLoggedIn={!!user}
        onLoginPrompt={() => { setAuthMode('register'); setScreen('auth'); }}
        currentPlan={billingStatus?.plan}
      />
    );
  }

  if (screen === 'landing') {
    return (
      <LandingScreen
        onGetStarted={() => { setAuthMode('register'); setScreen('auth'); }}
        onLogin={() => { setAuthMode('login'); setScreen('auth'); }}
        onPricing={() => setScreen('pricing')}
      />
    );
  }

  if (screen === 'auth') {
    return (
      <AuthScreen
        mode={authMode}
        onToggleMode={() => setAuthMode(m => m === 'login' ? 'register' : 'login')}
        onSuccess={handleAuth}
        onBack={() => setScreen('landing')}
        error={error}
        setError={setError}
      />
    );
  }

  if (screen === 'dashboard') {
    return (
      <>
        <DashboardScreen
          user={user!}
          isAdmin={user?.isAdmin ?? false}
          saved={saved}
          urlInput={urlInput}
          setUrlInput={setUrlInput}
          radius={radius}
          setRadius={setRadius}
          onSubmit={handleUrlSubmit}
          onViewReport={viewReport}
          onDeleteReport={deleteReport}
          onLogout={handleLogout}
          onAdminLeads={user?.isAdmin ? () => setScreen('admin-leads') : undefined}
          onPricing={!user?.isAdmin ? () => setScreen('pricing') : undefined}
          billingStatus={!user?.isAdmin ? billingStatus : null}
          onUpgrade={!user?.isAdmin ? () => setShowUpgradeModal(true) : undefined}
          error={error}
          setError={setError}
        />
        {showUpgradeModal && !user?.isAdmin && (
          <UpgradeModal
            currentPlan={billingStatus?.plan || 'free'}
            onClose={() => setShowUpgradeModal(false)}
            onViewPricing={() => { setShowUpgradeModal(false); setScreen('pricing'); }}
            onCreditsUpdated={(newCredits, newPlan) => {
              setBillingStatus(prev => prev ? {
                ...prev,
                creditsRemaining: newCredits,
                creditsTotal: newPlan ? (newCredits === 999999 ? -1 : newCredits) : prev.creditsTotal,
                plan: newPlan ?? prev.plan,
                planName: newPlan ? (PLANS_LABEL[newPlan] ?? prev.planName) : prev.planName,
                unlimited: newCredits === 999999,
              } : prev);
            }}
          />
        )}
      </>
    );
  }

  if (screen === 'admin-leads') {
    return <AdminLeadDiscoveryScreen onBack={() => setScreen('dashboard')} />;
  }

  if (screen === 'found') {
    return (
      <FoundScreen
        entry={foundRep!}
        isAdmin={user?.isAdmin ?? false}
        onViewFree={() => viewReport(foundRep!)}
        onGenerateNew={() => startGeneration(pendUrl, pendRad, undefined, pendReportType, pendCity, pendState)}
        onBack={() => setScreen('dashboard')}
      />
    );
  }

  if (screen === 'payment') {
    return (
      <PaymentScreen
        url={pendUrl}
        radius={pendRad}
        reportType={pendReportType}
        city={pendCity}
        state={pendState}
        onSuccess={handlePaymentSuccess}
        onBack={() => setScreen('dashboard')}
        error={error}
        setError={setError}
      />
    );
  }

  if (screen === 'gen') {
    return <GeneratingScreen url={pendUrl} radius={pendRad} step={step} done={done} />;
  }

  if (screen === 'report') {
    if (reportMeta?.reportType === 'growth' && growthReport) {
      return (
        <GrowthReportScreen
          data={growthReport}
          url={reportMeta.url}
          generatedAt={reportMeta.at}
          onBack={() => setScreen('dashboard')}
        />
      );
    }
    if (reportMeta?.reportType === 'review' && reviewReport) {
      return (
        <ReviewReportScreen
          data={reviewReport}
          url={reportMeta.url}
          generatedAt={reportMeta.at}
          onBack={() => setScreen('dashboard')}
        />
      );
    }
    return (
      <ReportScreen
        data={report!}
        url={reportMeta?.url || ''}
        generatedAt={reportMeta?.at || new Date().toISOString()}
        onBack={() => setScreen('dashboard')}
      />
    );
  }

  return null;
}

export default function App() {
  return (
    <LanguageProvider>
      <AppInner />
    </LanguageProvider>
  );
}
