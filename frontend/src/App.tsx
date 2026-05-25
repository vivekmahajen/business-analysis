import React, { useState, useEffect, useCallback } from 'react';
import { User, AnalysisData, AnalysisEntry, Screen, AuthMode } from './types';
import { api } from './utils/api';
import LandingScreen from './components/LandingScreen';
import AuthScreen from './components/AuthScreen';
import DashboardScreen from './components/DashboardScreen';
import FoundScreen from './components/FoundScreen';
import PaymentScreen from './components/PaymentScreen';
import GeneratingScreen from './components/GeneratingScreen';
import ReportScreen from './components/ReportScreen';

export default function App() {
  const [screen, setScreen] = useState<Screen>('landing');
  const [user, setUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [urlInput, setUrlInput] = useState('');
  const [radius, setRadius] = useState(25);
  const [report, setReport] = useState<AnalysisData | null>(null);
  const [reportMeta, setReportMeta] = useState<{ id: string; url: string; at: string } | null>(null);
  const [saved, setSaved] = useState<AnalysisEntry[]>([]);
  const [step, setStep] = useState(0);
  const [done, setDone] = useState<number[]>([]);
  const [foundRep, setFoundRep] = useState<AnalysisEntry | null>(null);
  const [pendUrl, setPendUrl] = useState('');
  const [pendRad, setPendRad] = useState(25);
  const [error, setError] = useState('');

  // Restore session from localStorage
  useEffect(() => {
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

  const loadReports = useCallback(async () => {
    try {
      const reports = await api.getReports() as AnalysisEntry[];
      setSaved(reports);
    } catch {
      // non-fatal
    }
  }, []);

  useEffect(() => {
    if (user && screen === 'dashboard') loadReports();
  }, [user, screen, loadReports]);

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
    setSaved([]);
    setScreen('landing');
  }, []);

  const handleUrlSubmit = useCallback(async (url: string, rad: number) => {
    setError('');
    try {
      const result = await api.checkReport(url) as { found: boolean; report?: AnalysisEntry };
      if (result.found && result.report) {
        setFoundRep(result.report);
        setPendUrl(url);
        setPendRad(rad);
        setScreen('found');
      } else {
        setPendUrl(url);
        setPendRad(rad);
        // Admins skip payment entirely
        if (user?.isAdmin) {
          startGeneration(url, rad);
        } else {
          setScreen('payment');
        }
      }
    } catch (e) {
      setError((e as Error).message);
    }
  }, [user]);

  const startGeneration = useCallback(async (url: string, rad: number, paymentIntentId?: string) => {
    setScreen('gen');
    setStep(0);
    setDone([]);
    setError('');

    const STEPS = 7;
    let currentStep = 0;
    const interval = setInterval(() => {
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
      } else {
        entry = await api.generateReportAdmin(url, rad) as AnalysisEntry;
      }
      clearInterval(interval);
      setDone(Array.from({ length: STEPS }, (_, i) => i));
      setStep(STEPS - 1);

      setTimeout(() => {
        setReport(entry.data);
        setReportMeta({ id: entry.id, url: entry.url, at: entry.at });
        setScreen('report');
        loadReports();
      }, 500);
    } catch (e) {
      clearInterval(interval);
      setError((e as Error).message);
      setScreen(paymentIntentId ? 'payment' : 'dashboard');
    }
  }, [loadReports]);

  const handlePaymentSuccess = useCallback(async (paymentIntentId: string) => {
    await startGeneration(pendUrl, pendRad, paymentIntentId);
  }, [pendUrl, pendRad, startGeneration]);

  const viewReport = useCallback((entry: AnalysisEntry) => {
    setReport(entry.data);
    setReportMeta({ id: entry.id, url: entry.url, at: entry.at });
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

  if (screen === 'landing') {
    return (
      <LandingScreen
        onGetStarted={() => { setAuthMode('register'); setScreen('auth'); }}
        onLogin={() => { setAuthMode('login'); setScreen('auth'); }}
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
        error={error}
        setError={setError}
      />
    );
  }

  if (screen === 'found') {
    return (
      <FoundScreen
        entry={foundRep!}
        isAdmin={user?.isAdmin ?? false}
        onViewFree={() => viewReport(foundRep!)}
        onGenerateNew={() => {
          if (user?.isAdmin) {
            startGeneration(pendUrl, pendRad);
          } else {
            setScreen('payment');
          }
        }}
        onBack={() => setScreen('dashboard')}
      />
    );
  }

  if (screen === 'payment') {
    return (
      <PaymentScreen
        url={pendUrl}
        radius={pendRad}
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
