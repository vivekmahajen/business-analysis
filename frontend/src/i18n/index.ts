import React, { createContext, useContext, useState, useEffect } from 'react';

export interface LangMeta {
  flag: string;
  nativeName: string;
  englishName: string;
  dir: 'ltr' | 'rtl';
  region: string;
}

export const LANG_META: Record<string, LangMeta> = {
  en:    { flag: '🇬🇧', nativeName: 'English',         englishName: 'English',              dir: 'ltr', region: 'European' },
  es:    { flag: '🇪🇸', nativeName: 'Español',          englishName: 'Spanish',              dir: 'ltr', region: 'European' },
  fr:    { flag: '🇫🇷', nativeName: 'Français',         englishName: 'French',               dir: 'ltr', region: 'European' },
  de:    { flag: '🇩🇪', nativeName: 'Deutsch',          englishName: 'German',               dir: 'ltr', region: 'European' },
  pt:    { flag: '🇧🇷', nativeName: 'Português',        englishName: 'Portuguese',           dir: 'ltr', region: 'European' },
  it:    { flag: '🇮🇹', nativeName: 'Italiano',         englishName: 'Italian',              dir: 'ltr', region: 'European' },
  ru:    { flag: '🇷🇺', nativeName: 'Русский',          englishName: 'Russian',              dir: 'ltr', region: 'European' },
  pl:    { flag: '🇵🇱', nativeName: 'Polski',           englishName: 'Polish',               dir: 'ltr', region: 'European' },
  nl:    { flag: '🇳🇱', nativeName: 'Nederlands',       englishName: 'Dutch',                dir: 'ltr', region: 'European' },
  sv:    { flag: '🇸🇪', nativeName: 'Svenska',          englishName: 'Swedish',              dir: 'ltr', region: 'European' },
  ar:    { flag: '🇸🇦', nativeName: 'العربية',          englishName: 'Arabic',               dir: 'rtl', region: 'Middle East' },
  he:    { flag: '🇮🇱', nativeName: 'עברית',            englishName: 'Hebrew',               dir: 'rtl', region: 'Middle East' },
  fa:    { flag: '🇮🇷', nativeName: 'فارسی',            englishName: 'Persian',              dir: 'rtl', region: 'Middle East' },
  tr:    { flag: '🇹🇷', nativeName: 'Türkçe',           englishName: 'Turkish',              dir: 'ltr', region: 'Middle East' },
  hi:    { flag: '🇮🇳', nativeName: 'हिन्दी',           englishName: 'Hindi',                dir: 'ltr', region: 'South Asian' },
  bn:    { flag: '🇧🇩', nativeName: 'বাংলা',            englishName: 'Bengali',              dir: 'ltr', region: 'South Asian' },
  zh:    { flag: '🇨🇳', nativeName: '中文(简体)',        englishName: 'Chinese (Simplified)', dir: 'ltr', region: 'East Asian' },
  'zh-TW': { flag: '🇹🇼', nativeName: '中文(繁體)',     englishName: 'Chinese (Traditional)',dir: 'ltr', region: 'East Asian' },
  ja:    { flag: '🇯🇵', nativeName: '日本語',            englishName: 'Japanese',             dir: 'ltr', region: 'East Asian' },
  ko:    { flag: '🇰🇷', nativeName: '한국어',            englishName: 'Korean',               dir: 'ltr', region: 'East Asian' },
  id:    { flag: '🇮🇩', nativeName: 'Bahasa Indonesia', englishName: 'Indonesian',           dir: 'ltr', region: 'Southeast Asian' },
  vi:    { flag: '🇻🇳', nativeName: 'Tiếng Việt',       englishName: 'Vietnamese',           dir: 'ltr', region: 'Southeast Asian' },
  th:    { flag: '🇹🇭', nativeName: 'ภาษาไทย',          englishName: 'Thai',                 dir: 'ltr', region: 'Southeast Asian' },
  tl:    { flag: '🇵🇭', nativeName: 'Filipino',         englishName: 'Filipino',             dir: 'ltr', region: 'Southeast Asian' },
  sw:    { flag: '🇰🇪', nativeName: 'Kiswahili',        englishName: 'Swahili',              dir: 'ltr', region: 'African' },
};

export interface T {
  // Global
  signIn: string;
  signOut: string;
  back: string;
  adminBadge: string;
  downloadHtml: string;
  pleaseWait: string;
  processing: string;
  checking: string;
  deleteConfirm: string;
  score: string;
  notAvailable: string;
  generatedBy: string;
  mileRadius: string;
  milesLabel: string;
  mileLabel: string;
  chooseLanguage: string;
  searchLanguages: string;
  noLanguagesFound: string;
  // Landing
  aiPowered: string;
  heroHeadline1: string;
  heroHeadline2: string;
  heroSub: string;
  getReport: string;
  viewSavedReports: string;
  oneTimePayment: string;
  sampleReport: string;
  seeExactlyWhatYouGet: string;
  competitiveAnalysis: string;
  salesGrowthAdvisor: string;
  totalRevenueOpportunity: string;
  estimatedMonthlyRange: string;
  topQuickWin: string;
  growthOpportunities: string;
  competitorsFound: string;
  competitorInspiredOpportunities: string;
  weaknessesIdentified: string;
  competitiveGapsFound: string;
  strategicRecommendations: string;
  moreUnlocked: string;
  readyToOutpace: string;
  analyzeWebsite: string;
  // Features
  feature1Title: string;
  feature1Desc: string;
  feature2Title: string;
  feature2Desc: string;
  feature3Title: string;
  feature3Desc: string;
  feature4Title: string;
  feature4Desc: string;
  feature5Title: string;
  feature5Desc: string;
  feature6Title: string;
  feature6Desc: string;
  // Auth
  welcomeBack: string;
  createYourAccount: string;
  signInSub: string;
  registerSub: string;
  fullNameLabel: string;
  emailLabel: string;
  passwordLabel: string;
  signingIn: string;
  creatingAccount: string;
  noAccount: string;
  alreadyHaveAccount: string;
  termsTitle: string;
  termsAgree: string;
  // Dashboard
  analyzeTitle: string;
  analyzeSub: string;
  urlPlaceholder: string;
  cityPlaceholder: string;
  statePlaceholder: string;
  radiusLabel: string;
  reportType: string;
  competitiveReport: string;
  growthReport: string;
  competitiveReportDesc: string;
  growthReportDesc: string;
  analyzeButton: string;
  analyzingButton: string;
  savedReportsTitle: string;
  noSavedReports: string;
  deleteReport: string;
  viewReport: string;
  // Found screen
  reportExistsTitle: string;
  reportExistsSub: string;
  viewFullReportFree: string;
  generateFreshFree: string;
  generateFreshPaid: string;
  // Payment
  paymentDetails: string;
  nameOnCardLabel: string;
  cardNumberLabel: string;
  expiryLabel: string;
  cvcLabel: string;
  payButton: string;
  orderSummary: string;
  reportFor: string;
  securePayment: string;
  // Report sections
  executiveSummary: string;
  performanceScores: string;
  competitorAnalysis: string;
  strengthsSection: string;
  weaknessesSection: string;
  gapAnalysis: string;
  strategicRecommendations2: string;
  seoLabel: string;
  digitalPresence: string;
  contentLabel: string;
  uxDesign: string;
  // Growth report sections
  businessOverviewSection: string;
  currentProductsLabel: string;
  actionRoadmapSection: string;
  revenueOpportunitySection: string;
  marketingTacticsSection: string;
  competitorOpportunitiesSection: string;
  quickWinsSection: string;
  thirtyDayLabel: string;
  sixtyDayLabel: string;
  ninetyDayLabel: string;
  impactLabel: string;
  effortLabel: string;
  estimatedCostLabel: string;
  stepsLabel: string;
}

const BASE_EN: T = {
  // Global
  signIn: 'Sign in',
  signOut: 'Sign out',
  back: 'Back',
  adminBadge: 'Admin',
  downloadHtml: 'Download HTML',
  pleaseWait: 'Please wait…',
  processing: 'Processing…',
  checking: 'Checking…',
  deleteConfirm: 'Are you sure you want to delete this report?',
  score: 'Score',
  notAvailable: 'N/A',
  generatedBy: 'Generated by SiteAnalyzer Pro',
  mileRadius: 'mile radius',
  milesLabel: 'miles',
  mileLabel: 'mile',
  chooseLanguage: 'Choose Language',
  searchLanguages: 'Search languages…',
  noLanguagesFound: 'No languages found',
  // Landing
  aiPowered: 'AI-Powered Competitive Intelligence',
  heroHeadline1: 'Know exactly where your',
  heroHeadline2: 'competitors have the edge',
  heroSub: 'Enter any business website and get a complete competitive analysis with actionable strategies to close the gap — in minutes.',
  getReport: 'Get Your Report — $99',
  viewSavedReports: 'View Saved Reports',
  oneTimePayment: 'One-time payment · No subscription · Reports saved free forever',
  sampleReport: 'Sample Report',
  seeExactlyWhatYouGet: 'See exactly what you get',
  competitiveAnalysis: 'Competitive Analysis',
  salesGrowthAdvisor: 'Sales Growth Advisor',
  totalRevenueOpportunity: 'Total Revenue Opportunity',
  estimatedMonthlyRange: 'estimated monthly range',
  topQuickWin: 'Top Quick Win:',
  growthOpportunities: 'Growth Opportunities',
  competitorsFound: 'Competitors Found',
  competitorInspiredOpportunities: 'Competitor-Inspired Opportunities',
  weaknessesIdentified: 'weaknesses identified with impact ratings',
  competitiveGapsFound: 'competitive gaps mapped to competitors',
  strategicRecommendations: 'strategic recommendations with step-by-step plans',
  moreUnlocked: 'more sections unlocked in full report',
  readyToOutpace: 'Ready to outpace your competition?',
  analyzeWebsite: 'Analyze a Website — $99',
  // Features
  feature1Title: 'Deep Competitive Analysis',
  feature1Desc: 'Identify your top competitors and see exactly where they outperform you across SEO, content, UX, and digital presence.',
  feature2Title: 'Actionable Gap Analysis',
  feature2Desc: 'See every competitive gap with clear priority levels — Critical, High, Medium, Low — so you know where to focus first.',
  feature3Title: 'Strategic Roadmap',
  feature3Desc: 'Get step-by-step implementation plans for each recommendation, including estimated costs and timelines.',
  feature4Title: 'Performance Scoring',
  feature4Desc: 'Comprehensive scores across SEO, Digital Presence, Content Quality, and UX Design.',
  feature5Title: 'Sales Growth Advisor',
  feature5Desc: 'AI-powered revenue opportunity analysis with 30/60/90-day action roadmaps to grow your business.',
  feature6Title: 'Instant HTML Export',
  feature6Desc: 'Download a beautifully formatted HTML report to share with your team or clients.',
  // Auth
  welcomeBack: 'Welcome back',
  createYourAccount: 'Create your account',
  signInSub: 'Sign in to access your reports',
  registerSub: 'Start analyzing your competitors today',
  fullNameLabel: 'Full name',
  emailLabel: 'Email address',
  passwordLabel: 'Password',
  signingIn: 'Signing in…',
  creatingAccount: 'Creating account…',
  noAccount: "Don't have an account? Register",
  alreadyHaveAccount: 'Already have an account? Sign in',
  termsTitle: 'Terms of Service',
  termsAgree: 'I have read and agree to the Terms of Service',
  // Dashboard
  analyzeTitle: 'Analyze a Website',
  analyzeSub: 'Enter a URL to get started',
  urlPlaceholder: 'https://example.com',
  cityPlaceholder: 'City',
  statePlaceholder: 'State',
  radiusLabel: 'Radius',
  reportType: 'Report Type',
  competitiveReport: 'Competitive Report',
  growthReport: 'Growth Report',
  competitiveReportDesc: 'Deep competitor analysis with gap analysis and strategic recommendations.',
  growthReportDesc: 'Revenue opportunities, quick wins, and a 90-day action roadmap.',
  analyzeButton: 'Analyze',
  analyzingButton: 'Analyzing…',
  savedReportsTitle: 'Saved Reports',
  noSavedReports: 'No saved reports yet.',
  deleteReport: 'Delete',
  viewReport: 'View',
  // Found screen
  reportExistsTitle: 'Report Already Exists',
  reportExistsSub: 'We found an existing report for this URL.',
  viewFullReportFree: 'View Full Report (Free)',
  generateFreshFree: 'Generate Fresh Report (Free)',
  generateFreshPaid: 'Generate Fresh Report ($99)',
  // Payment
  paymentDetails: 'Payment Details',
  nameOnCardLabel: 'Name on card',
  cardNumberLabel: 'Card number',
  expiryLabel: 'Expiry',
  cvcLabel: 'CVC',
  payButton: 'Pay $99',
  orderSummary: 'Order Summary',
  reportFor: 'Report for',
  securePayment: 'Secured by Stripe. Your card details are never stored.',
  // Report sections
  executiveSummary: 'Executive Summary',
  performanceScores: 'Performance Scores',
  competitorAnalysis: 'Competitor Analysis',
  strengthsSection: 'Strengths',
  weaknessesSection: 'Weaknesses',
  gapAnalysis: 'Gap Analysis',
  strategicRecommendations2: 'Strategic Recommendations',
  seoLabel: 'SEO',
  digitalPresence: 'Digital Presence',
  contentLabel: 'Content',
  uxDesign: 'UX / Design',
  // Growth report
  businessOverviewSection: 'Business Overview',
  currentProductsLabel: 'Current Products / Services',
  actionRoadmapSection: 'Action Roadmap',
  revenueOpportunitySection: 'Revenue Opportunity',
  marketingTacticsSection: 'Marketing Tactics',
  competitorOpportunitiesSection: 'Competitor-Inspired Opportunities',
  quickWinsSection: 'Quick Wins',
  thirtyDayLabel: '30-Day',
  sixtyDayLabel: '60-Day',
  ninetyDayLabel: '90-Day',
  impactLabel: 'Impact',
  effortLabel: 'Effort',
  estimatedCostLabel: 'Estimated Cost',
  stepsLabel: 'Steps',
};

const OVERRIDES: Record<string, Partial<T>> = {
  es: {
    signIn: 'Iniciar sesión',
    signOut: 'Cerrar sesión',
    back: 'Volver',
    adminBadge: 'Admin',
    downloadHtml: 'Descargar HTML',
    pleaseWait: 'Por favor espera…',
    processing: 'Procesando…',
    checking: 'Verificando…',
    deleteConfirm: '¿Estás seguro de que deseas eliminar este informe?',
    score: 'Puntuación',
    chooseLanguage: 'Elegir idioma',
    searchLanguages: 'Buscar idiomas…',
    noLanguagesFound: 'No se encontraron idiomas',
    aiPowered: 'Inteligencia Competitiva con IA',
    heroHeadline1: 'Sabe exactamente dónde tus',
    heroHeadline2: 'competidores tienen la ventaja',
    heroSub: 'Ingresa cualquier sitio web de negocios y obtén un análisis competitivo completo con estrategias accionables para cerrar la brecha, en minutos.',
    getReport: 'Obtener Informe — $99',
    viewSavedReports: 'Ver Informes Guardados',
    oneTimePayment: 'Pago único · Sin suscripción · Informes guardados gratis para siempre',
    sampleReport: 'Informe de Muestra',
    seeExactlyWhatYouGet: 'Ve exactamente lo que obtienes',
    competitiveAnalysis: 'Análisis Competitivo',
    salesGrowthAdvisor: 'Asesor de Crecimiento de Ventas',
    readyToOutpace: '¿Listo para superar a tu competencia?',
    analyzeWebsite: 'Analizar un Sitio Web — $99',
    welcomeBack: 'Bienvenido de vuelta',
    createYourAccount: 'Crea tu cuenta',
    signInSub: 'Inicia sesión para acceder a tus informes',
    registerSub: 'Comienza a analizar a tus competidores hoy',
    fullNameLabel: 'Nombre completo',
    emailLabel: 'Correo electrónico',
    passwordLabel: 'Contraseña',
    signingIn: 'Iniciando sesión…',
    creatingAccount: 'Creando cuenta…',
    noAccount: '¿No tienes cuenta? Regístrate',
    alreadyHaveAccount: '¿Ya tienes una cuenta? Inicia sesión',
    termsAgree: 'He leído y acepto los Términos de Servicio',
    analyzeTitle: 'Analizar un Sitio Web',
    urlPlaceholder: 'https://ejemplo.com',
    analyzeButton: 'Analizar',
    analyzingButton: 'Analizando…',
    savedReportsTitle: 'Informes Guardados',
    noSavedReports: 'Aún no hay informes guardados.',
    executiveSummary: 'Resumen Ejecutivo',
    performanceScores: 'Puntuaciones de Rendimiento',
    competitorAnalysis: 'Análisis de Competidores',
    strengthsSection: 'Fortalezas',
    weaknessesSection: 'Debilidades',
    gapAnalysis: 'Análisis de Brechas',
    strategicRecommendations2: 'Recomendaciones Estratégicas',
  },
  fr: {
    signIn: 'Se connecter',
    signOut: 'Se déconnecter',
    back: 'Retour',
    downloadHtml: 'Télécharger HTML',
    pleaseWait: 'Veuillez patienter…',
    processing: 'Traitement…',
    checking: 'Vérification…',
    deleteConfirm: 'Êtes-vous sûr de vouloir supprimer ce rapport ?',
    score: 'Score',
    chooseLanguage: 'Choisir la langue',
    searchLanguages: 'Rechercher des langues…',
    noLanguagesFound: 'Aucune langue trouvée',
    aiPowered: 'Intelligence Compétitive par IA',
    heroHeadline1: 'Sachez exactement où vos',
    heroHeadline2: 'concurrents ont l\'avantage',
    heroSub: 'Entrez n\'importe quel site web d\'entreprise et obtenez une analyse concurrentielle complète avec des stratégies exploitables pour combler l\'écart, en quelques minutes.',
    getReport: 'Obtenir le Rapport — 99 $',
    viewSavedReports: 'Voir les Rapports Enregistrés',
    oneTimePayment: 'Paiement unique · Sans abonnement · Rapports sauvegardés gratuitement pour toujours',
    sampleReport: 'Rapport Exemple',
    competitiveAnalysis: 'Analyse Concurrentielle',
    salesGrowthAdvisor: 'Conseiller en Croissance des Ventes',
    readyToOutpace: 'Prêt à dépasser vos concurrents ?',
    analyzeWebsite: 'Analyser un Site Web — 99 $',
    welcomeBack: 'Bon retour',
    createYourAccount: 'Créez votre compte',
    signInSub: 'Connectez-vous pour accéder à vos rapports',
    registerSub: 'Commencez à analyser vos concurrents aujourd\'hui',
    fullNameLabel: 'Nom complet',
    emailLabel: 'Adresse e-mail',
    passwordLabel: 'Mot de passe',
    signingIn: 'Connexion…',
    creatingAccount: 'Création du compte…',
    noAccount: 'Pas de compte ? S\'inscrire',
    alreadyHaveAccount: 'Vous avez déjà un compte ? Se connecter',
    termsAgree: 'J\'ai lu et j\'accepte les Conditions d\'utilisation',
    analyzeTitle: 'Analyser un Site Web',
    analyzeButton: 'Analyser',
    analyzingButton: 'Analyse…',
    savedReportsTitle: 'Rapports Enregistrés',
    noSavedReports: 'Aucun rapport enregistré pour l\'instant.',
    executiveSummary: 'Résumé Exécutif',
    performanceScores: 'Scores de Performance',
    competitorAnalysis: 'Analyse des Concurrents',
    strengthsSection: 'Forces',
    weaknessesSection: 'Faiblesses',
    gapAnalysis: 'Analyse des Lacunes',
    strategicRecommendations2: 'Recommandations Stratégiques',
  },
  de: {
    signIn: 'Anmelden',
    signOut: 'Abmelden',
    back: 'Zurück',
    downloadHtml: 'HTML herunterladen',
    pleaseWait: 'Bitte warten…',
    processing: 'Verarbeitung…',
    checking: 'Prüfung…',
    deleteConfirm: 'Möchten Sie diesen Bericht wirklich löschen?',
    score: 'Punktzahl',
    chooseLanguage: 'Sprache wählen',
    searchLanguages: 'Sprachen suchen…',
    noLanguagesFound: 'Keine Sprachen gefunden',
    aiPowered: 'KI-gestützte Wettbewerbsintelligenz',
    heroHeadline1: 'Wissen Sie genau, wo Ihre',
    heroHeadline2: 'Konkurrenten die Nase vorn haben',
    heroSub: 'Geben Sie eine beliebige Unternehmenswebsite ein und erhalten Sie eine vollständige Wettbewerbsanalyse mit umsetzbaren Strategien, um die Lücke zu schließen — in Minuten.',
    getReport: 'Bericht holen — 99 $',
    viewSavedReports: 'Gespeicherte Berichte anzeigen',
    oneTimePayment: 'Einmalzahlung · Kein Abonnement · Berichte dauerhaft kostenlos gespeichert',
    sampleReport: 'Musterbericht',
    competitiveAnalysis: 'Wettbewerbsanalyse',
    salesGrowthAdvisor: 'Vertriebswachstums-Berater',
    readyToOutpace: 'Bereit, Ihre Konkurrenz zu übertreffen?',
    analyzeWebsite: 'Website analysieren — 99 $',
    welcomeBack: 'Willkommen zurück',
    createYourAccount: 'Konto erstellen',
    signInSub: 'Melden Sie sich an, um auf Ihre Berichte zuzugreifen',
    registerSub: 'Beginnen Sie noch heute mit der Analyse Ihrer Konkurrenten',
    fullNameLabel: 'Vollständiger Name',
    emailLabel: 'E-Mail-Adresse',
    passwordLabel: 'Passwort',
    signingIn: 'Anmeldung…',
    creatingAccount: 'Konto wird erstellt…',
    noAccount: 'Kein Konto? Registrieren',
    alreadyHaveAccount: 'Haben Sie bereits ein Konto? Anmelden',
    termsAgree: 'Ich habe die Nutzungsbedingungen gelesen und stimme ihnen zu',
    analyzeTitle: 'Website analysieren',
    analyzeButton: 'Analysieren',
    analyzingButton: 'Analysiere…',
    savedReportsTitle: 'Gespeicherte Berichte',
    noSavedReports: 'Noch keine gespeicherten Berichte.',
    executiveSummary: 'Zusammenfassung',
    performanceScores: 'Leistungswerte',
    competitorAnalysis: 'Konkurrenzanalyse',
    strengthsSection: 'Stärken',
    weaknessesSection: 'Schwächen',
    gapAnalysis: 'Lückenanalyse',
    strategicRecommendations2: 'Strategische Empfehlungen',
  },
  pt: {
    signIn: 'Entrar',
    signOut: 'Sair',
    back: 'Voltar',
    downloadHtml: 'Baixar HTML',
    pleaseWait: 'Por favor aguarde…',
    processing: 'Processando…',
    checking: 'Verificando…',
    chooseLanguage: 'Escolher idioma',
    searchLanguages: 'Pesquisar idiomas…',
    noLanguagesFound: 'Nenhum idioma encontrado',
    aiPowered: 'Inteligência Competitiva com IA',
    heroHeadline1: 'Saiba exatamente onde seus',
    heroHeadline2: 'concorrentes têm vantagem',
    heroSub: 'Digite qualquer site de negócios e obtenha uma análise competitiva completa com estratégias acionáveis para fechar a lacuna — em minutos.',
    getReport: 'Obter Relatório — $99',
    viewSavedReports: 'Ver Relatórios Salvos',
    sampleReport: 'Relatório de Exemplo',
    competitiveAnalysis: 'Análise Competitiva',
    salesGrowthAdvisor: 'Consultor de Crescimento de Vendas',
    readyToOutpace: 'Pronto para superar sua concorrência?',
    analyzeWebsite: 'Analisar um Site — $99',
    welcomeBack: 'Bem-vindo de volta',
    createYourAccount: 'Crie sua conta',
    fullNameLabel: 'Nome completo',
    emailLabel: 'Endereço de e-mail',
    passwordLabel: 'Senha',
    analyzeButton: 'Analisar',
    analyzingButton: 'Analisando…',
    savedReportsTitle: 'Relatórios Salvos',
    executiveSummary: 'Resumo Executivo',
    performanceScores: 'Pontuações de Desempenho',
    competitorAnalysis: 'Análise de Concorrentes',
    strengthsSection: 'Pontos Fortes',
    weaknessesSection: 'Pontos Fracos',
    gapAnalysis: 'Análise de Lacunas',
    strategicRecommendations2: 'Recomendações Estratégicas',
  },
  it: {
    signIn: 'Accedi',
    signOut: 'Esci',
    back: 'Indietro',
    downloadHtml: 'Scarica HTML',
    chooseLanguage: 'Scegli lingua',
    searchLanguages: 'Cerca lingue…',
    aiPowered: 'Intelligenza Competitiva con IA',
    heroHeadline1: 'Sappi esattamente dove i tuoi',
    heroHeadline2: 'concorrenti hanno il vantaggio',
    getReport: 'Ottieni il Report — $99',
    viewSavedReports: 'Visualizza Report Salvati',
    sampleReport: 'Report di Esempio',
    competitiveAnalysis: 'Analisi Competitiva',
    readyToOutpace: 'Pronto a superare la concorrenza?',
    analyzeWebsite: 'Analizza un Sito — $99',
    welcomeBack: 'Bentornato',
    createYourAccount: 'Crea il tuo account',
    fullNameLabel: 'Nome completo',
    emailLabel: 'Indirizzo email',
    passwordLabel: 'Password',
    analyzeButton: 'Analizza',
    savedReportsTitle: 'Report Salvati',
    executiveSummary: 'Sommario Esecutivo',
    competitorAnalysis: 'Analisi dei Concorrenti',
    strengthsSection: 'Punti di Forza',
    weaknessesSection: 'Punti di Debolezza',
    strategicRecommendations2: 'Raccomandazioni Strategiche',
  },
  ru: {
    signIn: 'Войти',
    signOut: 'Выйти',
    back: 'Назад',
    downloadHtml: 'Скачать HTML',
    chooseLanguage: 'Выбрать язык',
    searchLanguages: 'Поиск языков…',
    aiPowered: 'Конкурентная разведка на основе ИИ',
    heroHeadline1: 'Узнайте, где именно ваши',
    heroHeadline2: 'конкуренты имеют преимущество',
    getReport: 'Получить отчёт — $99',
    viewSavedReports: 'Просмотреть сохранённые отчёты',
    sampleReport: 'Пример отчёта',
    competitiveAnalysis: 'Конкурентный анализ',
    readyToOutpace: 'Готовы обогнать конкурентов?',
    analyzeWebsite: 'Анализировать сайт — $99',
    welcomeBack: 'С возвращением',
    createYourAccount: 'Создать аккаунт',
    fullNameLabel: 'Полное имя',
    emailLabel: 'Электронная почта',
    passwordLabel: 'Пароль',
    analyzeButton: 'Анализировать',
    savedReportsTitle: 'Сохранённые отчёты',
    executiveSummary: 'Резюме',
    competitorAnalysis: 'Анализ конкурентов',
    strengthsSection: 'Сильные стороны',
    weaknessesSection: 'Слабые стороны',
    strategicRecommendations2: 'Стратегические рекомендации',
  },
  ar: {
    signIn: 'تسجيل الدخول',
    signOut: 'تسجيل الخروج',
    back: 'رجوع',
    downloadHtml: 'تحميل HTML',
    chooseLanguage: 'اختر اللغة',
    searchLanguages: 'ابحث عن اللغات…',
    noLanguagesFound: 'لم يتم العثور على لغات',
    aiPowered: 'ذكاء تنافسي بالذكاء الاصطناعي',
    heroHeadline1: 'اعرف بالضبط أين يتفوق',
    heroHeadline2: 'منافسوك عليك',
    heroSub: 'أدخل أي موقع ويب للأعمال واحصل على تحليل تنافسي شامل مع استراتيجيات قابلة للتنفيذ لسد الفجوة — في دقائق.',
    getReport: 'احصل على تقريرك — $99',
    viewSavedReports: 'عرض التقارير المحفوظة',
    sampleReport: 'تقرير نموذجي',
    competitiveAnalysis: 'التحليل التنافسي',
    salesGrowthAdvisor: 'مستشار نمو المبيعات',
    readyToOutpace: 'هل أنت مستعد للتفوق على منافسيك؟',
    analyzeWebsite: 'تحليل موقع ويب — $99',
    welcomeBack: 'مرحباً بعودتك',
    createYourAccount: 'أنشئ حسابك',
    fullNameLabel: 'الاسم الكامل',
    emailLabel: 'البريد الإلكتروني',
    passwordLabel: 'كلمة المرور',
    analyzeButton: 'تحليل',
    analyzingButton: 'جاري التحليل…',
    savedReportsTitle: 'التقارير المحفوظة',
    executiveSummary: 'الملخص التنفيذي',
    performanceScores: 'درجات الأداء',
    competitorAnalysis: 'تحليل المنافسين',
    strengthsSection: 'نقاط القوة',
    weaknessesSection: 'نقاط الضعف',
    gapAnalysis: 'تحليل الفجوات',
    strategicRecommendations2: 'التوصيات الاستراتيجية',
  },
  zh: {
    signIn: '登录',
    signOut: '退出登录',
    back: '返回',
    downloadHtml: '下载 HTML',
    chooseLanguage: '选择语言',
    searchLanguages: '搜索语言…',
    noLanguagesFound: '未找到语言',
    aiPowered: 'AI 驱动的竞争情报',
    heroHeadline1: '了解竞争对手',
    heroHeadline2: '在哪里占据优势',
    heroSub: '输入任意企业网站，几分钟内获得完整的竞争分析和可行策略，缩小差距。',
    getReport: '获取报告 — $99',
    viewSavedReports: '查看保存的报告',
    sampleReport: '示例报告',
    competitiveAnalysis: '竞争分析',
    salesGrowthAdvisor: '销售增长顾问',
    readyToOutpace: '准备好超越竞争对手了吗？',
    analyzeWebsite: '分析网站 — $99',
    welcomeBack: '欢迎回来',
    createYourAccount: '创建您的账户',
    fullNameLabel: '全名',
    emailLabel: '电子邮件地址',
    passwordLabel: '密码',
    analyzeButton: '分析',
    analyzingButton: '分析中…',
    savedReportsTitle: '保存的报告',
    executiveSummary: '执行摘要',
    performanceScores: '性能评分',
    competitorAnalysis: '竞争对手分析',
    strengthsSection: '优势',
    weaknessesSection: '劣势',
    gapAnalysis: '差距分析',
    strategicRecommendations2: '战略建议',
  },
  ja: {
    signIn: 'ログイン',
    signOut: 'ログアウト',
    back: '戻る',
    downloadHtml: 'HTMLをダウンロード',
    chooseLanguage: '言語を選択',
    searchLanguages: '言語を検索…',
    aiPowered: 'AI搭載の競合分析',
    heroHeadline1: '競合他社がどこで',
    heroHeadline2: '優位性を持っているか正確に把握する',
    getReport: 'レポートを取得 — $99',
    viewSavedReports: '保存済みレポートを表示',
    sampleReport: 'サンプルレポート',
    competitiveAnalysis: '競合分析',
    salesGrowthAdvisor: '売上成長アドバイザー',
    readyToOutpace: '競合他社を上回る準備はできていますか？',
    analyzeWebsite: 'ウェブサイトを分析 — $99',
    welcomeBack: 'おかえりなさい',
    createYourAccount: 'アカウントを作成',
    fullNameLabel: '氏名',
    emailLabel: 'メールアドレス',
    passwordLabel: 'パスワード',
    analyzeButton: '分析',
    analyzingButton: '分析中…',
    savedReportsTitle: '保存済みレポート',
    executiveSummary: 'エグゼクティブサマリー',
    competitorAnalysis: '競合他社分析',
    strengthsSection: '強み',
    weaknessesSection: '弱み',
    strategicRecommendations2: '戦略的提言',
  },
  ko: {
    signIn: '로그인',
    signOut: '로그아웃',
    back: '뒤로',
    downloadHtml: 'HTML 다운로드',
    chooseLanguage: '언어 선택',
    searchLanguages: '언어 검색…',
    aiPowered: 'AI 기반 경쟁 인텔리전스',
    heroHeadline1: '경쟁사가 어디서',
    heroHeadline2: '우위를 점하는지 정확히 파악하세요',
    getReport: '보고서 받기 — $99',
    viewSavedReports: '저장된 보고서 보기',
    sampleReport: '샘플 보고서',
    competitiveAnalysis: '경쟁 분석',
    salesGrowthAdvisor: '매출 성장 어드바이저',
    readyToOutpace: '경쟁사를 앞서 나갈 준비가 되셨나요?',
    analyzeWebsite: '웹사이트 분석 — $99',
    welcomeBack: '다시 오셨군요',
    createYourAccount: '계정 만들기',
    fullNameLabel: '이름',
    emailLabel: '이메일 주소',
    passwordLabel: '비밀번호',
    analyzeButton: '분석',
    analyzingButton: '분석 중…',
    savedReportsTitle: '저장된 보고서',
    executiveSummary: '경영진 요약',
    competitorAnalysis: '경쟁사 분석',
    strengthsSection: '강점',
    weaknessesSection: '약점',
    strategicRecommendations2: '전략적 권고사항',
  },
  hi: {
    signIn: 'साइन इन करें',
    signOut: 'साइन आउट करें',
    back: 'वापस',
    downloadHtml: 'HTML डाउनलोड करें',
    chooseLanguage: 'भाषा चुनें',
    searchLanguages: 'भाषाएं खोजें…',
    aiPowered: 'AI-संचालित प्रतिस्पर्धी खुफिया',
    heroHeadline1: 'जानें कि आपके प्रतिस्पर्धी',
    heroHeadline2: 'कहाँ बढ़त रखते हैं',
    getReport: 'रिपोर्ट प्राप्त करें — $99',
    viewSavedReports: 'सहेजी गई रिपोर्ट देखें',
    sampleReport: 'नमूना रिपोर्ट',
    competitiveAnalysis: 'प्रतिस्पर्धी विश्लेषण',
    readyToOutpace: 'अपनी प्रतिस्पर्धा से आगे निकलने के लिए तैयार हैं?',
    analyzeWebsite: 'वेबसाइट विश्लेषण — $99',
    welcomeBack: 'वापस स्वागत है',
    createYourAccount: 'अपना खाता बनाएं',
    fullNameLabel: 'पूरा नाम',
    emailLabel: 'ईमेल पता',
    passwordLabel: 'पासवर्ड',
    analyzeButton: 'विश्लेषण करें',
    savedReportsTitle: 'सहेजी गई रिपोर्ट',
    executiveSummary: 'कार्यकारी सारांश',
    competitorAnalysis: 'प्रतिस्पर्धी विश्लेषण',
    strengthsSection: 'ताकत',
    weaknessesSection: 'कमज़ोरियाँ',
    strategicRecommendations2: 'रणनीतिक सिफारिशें',
  },
  tr: {
    signIn: 'Giriş yap',
    signOut: 'Çıkış yap',
    back: 'Geri',
    downloadHtml: 'HTML İndir',
    chooseLanguage: 'Dil seç',
    searchLanguages: 'Dil ara…',
    aiPowered: 'Yapay Zeka Destekli Rekabet İstihbaratı',
    heroHeadline1: 'Rakiplerinizin tam olarak nerede',
    heroHeadline2: 'avantajlı olduğunu bilin',
    getReport: 'Raporunuzu Alın — $99',
    viewSavedReports: 'Kayıtlı Raporları Görüntüle',
    sampleReport: 'Örnek Rapor',
    competitiveAnalysis: 'Rekabet Analizi',
    readyToOutpace: 'Rakiplerinizi geçmeye hazır mısınız?',
    analyzeWebsite: 'Web Sitesi Analiz Et — $99',
    welcomeBack: 'Tekrar hoş geldiniz',
    createYourAccount: 'Hesabınızı oluşturun',
    fullNameLabel: 'Ad Soyad',
    emailLabel: 'E-posta adresi',
    passwordLabel: 'Şifre',
    analyzeButton: 'Analiz Et',
    savedReportsTitle: 'Kayıtlı Raporlar',
    executiveSummary: 'Yönetici Özeti',
    competitorAnalysis: 'Rakip Analizi',
    strengthsSection: 'Güçlü Yönler',
    weaknessesSection: 'Zayıf Yönler',
    strategicRecommendations2: 'Stratejik Öneriler',
  },
  id: {
    signIn: 'Masuk',
    signOut: 'Keluar',
    back: 'Kembali',
    downloadHtml: 'Unduh HTML',
    chooseLanguage: 'Pilih Bahasa',
    searchLanguages: 'Cari bahasa…',
    aiPowered: 'Kecerdasan Kompetitif Berbasis AI',
    heroHeadline1: 'Ketahui persis di mana pesaing Anda',
    heroHeadline2: 'memiliki keunggulan',
    getReport: 'Dapatkan Laporan — $99',
    viewSavedReports: 'Lihat Laporan Tersimpan',
    sampleReport: 'Laporan Contoh',
    competitiveAnalysis: 'Analisis Kompetitif',
    readyToOutpace: 'Siap melampaui pesaing Anda?',
    analyzeWebsite: 'Analisis Situs Web — $99',
    welcomeBack: 'Selamat datang kembali',
    createYourAccount: 'Buat akun Anda',
    fullNameLabel: 'Nama lengkap',
    emailLabel: 'Alamat email',
    passwordLabel: 'Kata sandi',
    analyzeButton: 'Analisis',
    savedReportsTitle: 'Laporan Tersimpan',
    executiveSummary: 'Ringkasan Eksekutif',
    competitorAnalysis: 'Analisis Pesaing',
    strengthsSection: 'Kekuatan',
    weaknessesSection: 'Kelemahan',
    strategicRecommendations2: 'Rekomendasi Strategis',
  },
};

export const TRANSLATIONS: Record<string, T> = Object.fromEntries(
  Object.keys(OVERRIDES).map((code) => [code, { ...BASE_EN, ...OVERRIDES[code] }])
);
TRANSLATIONS.en = BASE_EN;

interface I18nContextType {
  t: T;
  lang: string;
  setLang: (code: string) => void;
  dir: 'ltr' | 'rtl';
}

const I18nContext = createContext<I18nContextType>({
  t: BASE_EN,
  lang: 'en',
  setLang: () => {},
  dir: 'ltr',
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState(() => {
    try {
      const saved = localStorage.getItem('sap_lang');
      if (saved && LANG_META[saved]) return saved;
    } catch {}
    return 'en';
  });

  const setLang = (code: string) => {
    try { localStorage.setItem('sap_lang', code); } catch {}
    setLangState(code);
  };

  const meta = LANG_META[lang] ?? LANG_META.en;
  const dir = meta.dir;

  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = lang;
  }, [lang, dir]);

  const t = TRANSLATIONS[lang] ?? TRANSLATIONS.en;

  return React.createElement(
    I18nContext.Provider,
    { value: { t, lang, setLang, dir } },
    children
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
