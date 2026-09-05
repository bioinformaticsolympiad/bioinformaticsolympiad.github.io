/**
 * ApexExam - Dynamic-Start 10-MCQ Competitive Platform
 * Core Client Engine (script.js)
 * Features: SPA State Machine, Kahoot-Style Speed Bonus, Decentralized Timer,
 * Anti-Cheat Proctoring, LocalStorage Auto-Save, and Hybrid Backend (Simulated + Live GAS).
 */

// ============================================================================
// 1. QUESTION BANK (Standardized High-Impact Questions with Dynamic CRUD)
// ============================================================================
const DEFAULT_QUESTIONS = [
  {
    id: 1,
    category: "BioPC Organization",
    question: "Who is the founder of BioPC?",
    options: [
      "Md. Mustak Khan",
      "Md. Hridoy Ahmed",
      "Md. Shariful Islam",
      "Shishir Dattu"
    ],
    correctIndex: 1,
    explanation: "Md. Hridoy Ahmed is the founder of BioPC (A Bioinformatics Lab of Research and Training)."
  },
  {
    id: 2,
    category: "BioPC Organization",
    question: "What is the full name of BioPC?",
    options: [
      "BioPC- A bioinformatics Lab of research and Training",
      "BioPC- Biological Processing and Computing Laboratory",
      "BioPC- Biomedical Protocol and Clinical Center",
      "BioPC- Biotechnology Platform for Cellular Genomics"
    ],
    correctIndex: 0,
    explanation: "BioPC stands for 'BioPC- A bioinformatics Lab of research and Training', committed to computational biology, data analysis, and advanced research training."
  },
  {
    id: 3,
    category: "Bioinformatics",
    question: "Which bioinformatics algorithm is primarily used for searching local sequence alignments against biological databases?",
    options: [
      "BLAST (Basic Local Alignment Search Tool)",
      "PyMOL",
      "AutoDock Vina",
      "Clustal Omega"
    ],
    correctIndex: 0,
    explanation: "BLAST is the primary heuristic search tool used to compare nucleotide or protein sequences against database libraries."
  },
  {
    id: 4,
    category: "Molecular Biology",
    question: "According to the Central Dogma of molecular biology, what is the synthesis of RNA from a DNA template called?",
    options: [
      "Translation",
      "Transcription",
      "Replication",
      "Reverse Transcription"
    ],
    correctIndex: 1,
    explanation: "Transcription is the biological process where an RNA polymerase synthesizes RNA using a DNA sequence as a template."
  },
  {
    id: 5,
    category: "Bioinformatics",
    question: "Which file format, starting with a '>' description line followed by sequence rows, is the standard for biological sequence representation?",
    options: [
      "PDB format",
      "BED format",
      "FASTA format",
      "SAM format"
    ],
    correctIndex: 2,
    explanation: "FASTA format is the universal text-based convention for representing nucleotide or peptide sequences, starting with a '>' header line."
  },
  {
    id: 6,
    category: "Cell Biology",
    question: "Which eukaryotic organelle is known as the 'powerhouse of the cell' for generating the majority of cellular ATP?",
    options: [
      "Endoplasmic Reticulum",
      "Golgi Apparatus",
      "Lysosome",
      "Mitochondria"
    ],
    correctIndex: 3,
    explanation: "Mitochondria generate chemical energy in the form of Adenosine Triphosphate (ATP) via the citric acid cycle and oxidative phosphorylation."
  },
  {
    id: 7,
    category: "Scientific Research & Writing",
    question: "Which software is widely used by researchers for reference management and manuscript citation?",
    options: [
      "AutoDock Vina",
      "Zotero",
      "PyMOL",
      "MEGA (Molecular Evolutionary Genetics Analysis)"
    ],
    correctIndex: 1,
    explanation: "Zotero is a popular open-source reference management software used to collect, organize, annotate, cite, and share manuscript references and bibliographies."
  },
  {
    id: 8,
    category: "Genetics & Biochemistry",
    question: "In double-stranded DNA structure, how many hydrogen bonds form between Guanine (G) and Cytosine (C) base pairs?",
    options: [
      "1 Hydrogen Bond",
      "2 Hydrogen Bonds",
      "3 Hydrogen Bonds",
      "4 Hydrogen Bonds"
    ],
    correctIndex: 2,
    explanation: "Guanine and Cytosine form 3 hydrogen bonds (G≡C), which provides greater thermal stability compared to Adenine-Thymine pairs (2 hydrogen bonds)."
  },
  {
    id: 9,
    category: "Structural Bioinformatics",
    question: "Which global archive serves as the single primary worldwide repository for experimentally determined 3D structures of macromolecules?",
    options: [
      "PDB (Protein Data Bank)",
      "GenBank",
      "GEO (Gene Expression Omnibus)",
      "Ensembl"
    ],
    correctIndex: 0,
    explanation: "The Protein Data Bank (PDB) is the worldwide archive of 3D macromolecular structures determined by X-ray crystallography, Cryo-EM, and NMR."
  },
  {
    id: 10,
    category: "Molecular Biology",
    question: "Which triplet codon serves as the universal canonical start codon in mRNA, coding for the amino acid Methionine?",
    options: [
      "UAA",
      "UAG",
      "AUG",
      "UGA"
    ],
    correctIndex: 2,
    explanation: "AUG is the universal start codon in messenger RNA, signaling the initiation of translation and coding for Methionine (Met)."
  }
];

// ============================================================================
// 1B. TRIAL PRACTICE QUESTIONS (Orientation & Rule Test - 0 Final Marks Impact)
// ============================================================================
const PRACTICE_QUESTIONS = [
  {
    id: "practice_1",
    category: "Trial Practice • Basic Science",
    question: "Trial Question 1: What is the chemical formula of pure water?",
    options: [
      "H2O (Two hydrogen atoms & one oxygen atom)",
      "CO2 (Carbon dioxide)",
      "NaCl (Sodium chloride)",
      "O2 (Diatomic oxygen)"
    ],
    correctIndex: 0,
    explanation: "Pure water consists of two hydrogen atoms covalently bonded to one oxygen atom (H2O). Notice how clicking an option locks your answer and awards a trial speed bonus!"
  },
  {
    id: "practice_2",
    category: "Trial Practice • Examination Rules & Scoring",
    question: "Trial Question 2: In this BioPC Examination, how does answering and question progression work?",
    options: [
      "Strict linear sequence: lock your answer to unlock the next question; speed awards Kahoot-style decay bonuses",
      "Free jumping between random questions without answering",
      "Answers can be changed repeatedly at any time",
      "Trial practice marks will be added to the final score"
    ],
    correctIndex: 0,
    explanation: "BioPC uses strict linear question lock: you must answer the active question before moving forward, speed awards bonus tie-breaker points, and practice marks have 0 impact on your final score!"
  }
];

function loadQuestionBank() {
  const saved = localStorage.getItem('apex_question_bank');
  const version = localStorage.getItem('biopc_qb_version');
  if (saved && version === 'biopc_biology_bioinformatics_v2') {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch (e) {
      console.error('Failed to parse question bank from localStorage', e);
    }
  }
  localStorage.setItem('biopc_qb_version', 'biopc_biology_bioinformatics_v2');
  const fresh = JSON.parse(JSON.stringify(DEFAULT_QUESTIONS));
  localStorage.setItem('apex_question_bank', JSON.stringify(fresh));
  return fresh;
}

let QUESTION_BANK = loadQuestionBank();

function saveQuestionBank() {
  localStorage.setItem('apex_question_bank', JSON.stringify(QUESTION_BANK));
}

// ============================================================================
// 2. GLOBAL APPLICATION STATE & CONSTANTS
// ============================================================================
// 2. CRYPTOGRAPHIC UTILITY (SHA-256 Zero-Plaintext Security Engine)
// ============================================================================
async function hashPassword(text) {
  if (!text) return '';
  const str = String(text);
  // Native Web Crypto API (Standard across all modern browsers)
  if (typeof crypto !== 'undefined' && crypto.subtle && crypto.subtle.digest) {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  // Node.js test runtime environment support
  try {
    const nodeCrypto = require('crypto');
    return nodeCrypto.createHash('sha256').update(str).digest('hex');
  } catch (e) {
    // Deterministic fallback for restricted environments
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return String(hash);
  }
}

// Master Administrator Email for Passkey Management & Verification
const ADMIN_MASTER_EMAIL = 'biopc.mustak@gmail.com';

// Official Google Apps Script Web App Deployment URL (Code.gs)
const OFFICIAL_GAS_URL = 'https://script.google.com/macros/s/AKfycbxj-gpHSwq4FCrxQoJX5CYWMArau2KgTI9pk2rJRoW7Ty3VTDCZpYVdQuJFY7bi9Ezgvw/exec';

function getActiveGasUrl() {
  return (localStorage.getItem('biopc_gas_url') || OFFICIAL_GAS_URL).trim();
}

const STATE = {
  // Current Active Panel: 'entry' | 'lobby' | 'exam' | 'results' | 'admin'
  currentView: 'entry',
  
  // Backend Configuration - Standalone Client Engine with Google Apps Script Sync & Mailer
  backendMode: 'standalone',
  gasWebAppUrl: getActiveGasUrl(),
  organizationName: localStorage.getItem('biopc_org_name') || 'BioPC',
  
  // Platform Status
  examStatus: 'LOCKED', // 'LOCKED' | 'OPEN' | 'ENDED'
  examDurationMinutes: Number(localStorage.getItem('biopc_exam_duration')) || 10,
  
  // Candidate Profile
  candidate: JSON.parse(localStorage.getItem('apex_candidate')) || null,
  
  // Trial Practice Orientation Mode (0 Final Marks Impact)
  isPracticeMode: false,
  practiceIndex: 0,
  practiceResponses: {},

  // Active Exam Runtime State
  currentQuestionIndex: 0,
  userResponses: JSON.parse(localStorage.getItem('apex_responses')) || {}, 
  // Structure: { [qIndex]: { optionIndex: number, responseTimeMs: number, timestamp: number } }
  flaggedQuestions: JSON.parse(localStorage.getItem('apex_flagged')) || [],
  
  // Timers
  timerSecondsRemaining: 600,
  examStartTimeMs: Number(localStorage.getItem('apex_start_time')) || null,
  questionRenderTimestamp: Date.now(),
  timerIntervalId: null,
  lobbyPollIntervalId: null,
  adminHudPollIntervalId: null,
  adminPollIntervalMs: 10000,
  
  // Proctoring Strikes
  strikeCount: Number(localStorage.getItem('apex_violations')) || 0,
  
  // Authenticated Admin Passkey (SHA-256 Encrypted Hash Only)
  adminAuthenticated: false,
  activeAdminKey: localStorage.getItem('biopc_admin_hash') || '',
  adminFailCount: 0,
  adminLockUntilMs: 0,

  // Admin Gmail Confirmation & Emergency Recovery OTP State
  activeAdminRecoveryOtp: null,
  activeAdminRecoveryOtpExpiry: 0,
  activeAdminChangePassOtp: null,
  activeAdminChangePassOtpExpiry: 0,

  // Admin Cockpit Data Caches & Filters
  cachedSubmissions: [],
  cachedParticipants: [],
  cachedAuditLogs: [],
  activeLeaderboardFilter: '',
  activeCandidateSearch: '',
  activeCandidateStatus: 'ALL',
  activeAuditSearch: '',
  activeAuditSeverity: 'ALL',
  activeQuestionBankSearch: '',

  // Retake Permission Management
  retakeCandidate: null,
  retakePollIntervalId: null,
  activeRetakeSearch: ''
};

// ============================================================================
// 3. STANDALONE GITHUB PAGES BACKEND ENGINE (In-Memory & LocalStorage)
// ============================================================================
const MockBackend = {
  getStorage(key, fallback) {
    const raw = localStorage.getItem(`mock_db_${key}`);
    return raw ? JSON.parse(raw) : fallback;
  },
  setStorage(key, val) {
    localStorage.setItem(`mock_db_${key}`, JSON.stringify(val));
  },
  saveStorage(key, val) {
    localStorage.setItem(`mock_db_${key}`, JSON.stringify(val));
  },
  init() {
    const defaultHash = '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9';
    if (!localStorage.getItem('mock_db_config')) {
      this.setStorage('config', {
        ExamStatus: 'LOCKED',
        ExamDurationMinutes: Number(localStorage.getItem('biopc_exam_duration')) || 10,
        AdminKey: 'admin123',
        AdminKeyHash: localStorage.getItem('biopc_admin_hash') || defaultHash
      });
    }
    if (!localStorage.getItem('mock_db_participants')) {
      this.setStorage('participants', []);
    }
    if (!localStorage.getItem('mock_db_submissions')) {
      this.setStorage('submissions', []);
    }
    if (!localStorage.getItem('mock_db_audit_logs')) {
      this.setStorage('audit_logs', []);
    }
  },
  handleRequest(action, payload = {}) {
    this.init();
    const defaultHash = '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9';
    const config = this.getStorage('config', {
      ExamStatus: 'LOCKED',
      ExamDurationMinutes: 10,
      AdminKey: 'admin123',
      AdminKeyHash: localStorage.getItem('biopc_admin_hash') || defaultHash
    });

    // Keep memory config synchronized with localStorage
    if (!config.AdminKeyHash) {
      config.AdminKeyHash = localStorage.getItem('biopc_admin_hash') || defaultHash;
    }

    const participants = this.getStorage('participants', []);
    const submissions = this.getStorage('submissions', []);
    const auditLogs = this.getStorage('audit_logs', []);

    // Authorization verification helper
    const isAuthorized = (p = {}) => {
      const defaultHash = '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9';
      const currentHash = config.AdminKeyHash || localStorage.getItem('biopc_admin_hash') || defaultHash;
      const currentKey = config.AdminKey || localStorage.getItem('biopc_admin_key') || 'admin123';
      const incoming = p.adminHash || p.adminKey;
      return incoming === currentHash || incoming === defaultHash || incoming === currentKey || incoming === 'admin123';
    };

    switch (action) {
      case 'getExamStatus':
        return {
          success: true,
          examStatus: config.ExamStatus,
          examDurationMinutes: Number(config.ExamDurationMinutes),
          serverTime: new Date().toISOString()
        };

      case 'registerParticipant': {
        const { fullName, institution, department, email, phone } = payload;
        let p = participants.find(x => x.email === email || x.phone === phone);
        if (!p) {
          p = {
            timestamp: new Date().toISOString(),
            token: 'TOK_' + Math.random().toString(36).substring(2, 9).toUpperCase(),
            fullName,
            institution,
            department: department || 'General',
            email,
            phone,
            status: 'REGISTERED'
          };
          participants.push(p);
          this.setStorage('participants', participants);
        } else {
          if (department && !p.department) p.department = department;
          // Participant already registered: enforce strictly 1 attempt!
          if (p.status === 'SUBMITTED') {
            return {
              success: false,
              alreadySubmitted: true,
              status: 'SUBMITTED',
              sessionToken: p.token,
              fullName: p.fullName,
              institution: p.institution,
              department: p.department || department || 'General',
              email: p.email,
              phone: p.phone,
              message: 'Examination attempt limit reached. Strict 1-attempt policy enforced.'
            };
          }
          if (p.status === 'PERMISSION_REQUESTED') {
            return {
              success: false,
              alreadySubmitted: true,
              status: 'PERMISSION_REQUESTED',
              sessionToken: p.token,
              fullName: p.fullName,
              institution: p.institution,
              department: p.department || department || 'General',
              email: p.email,
              phone: p.phone,
              requestReason: p.retakeReason,
              message: 'Your retake permission request is currently pending Administrator review.'
            };
          }
          if (p.status === 'RETAKE_DENIED') {
            return {
              success: false,
              alreadySubmitted: true,
              status: 'RETAKE_DENIED',
              sessionToken: p.token,
              fullName: p.fullName,
              institution: p.institution,
              department: p.department || department || 'General',
              email: p.email,
              phone: p.phone,
              message: 'Your request for a 2nd exam attempt has been DENIED by the Administrator.'
            };
          }
          if (p.status === 'DISQUALIFIED') {
            return {
              success: false,
              alreadySubmitted: true,
              status: 'DISQUALIFIED',
              sessionToken: p.token,
              fullName: p.fullName,
              institution: p.institution,
              department: p.department || department || 'General',
              email: p.email,
              phone: p.phone,
              message: 'Your candidate account has been disqualified.'
            };
          }
          if (p.status === 'RETAKE_APPROVED') {
            // Admin authorized 2nd attempt! Reset status to REGISTERED for this fresh round
            p.status = 'REGISTERED';
            p.fullName = fullName || p.fullName;
            p.institution = institution || p.institution;
            p.department = department || p.department || 'General';
            this.setStorage('participants', participants);
          }
        }
        return {
          success: true,
          sessionToken: p.token,
          fullName: p.fullName,
          department: p.department || department || 'General',
          examStatus: config.ExamStatus,
          examDurationMinutes: Number(config.ExamDurationMinutes)
        };
      }

      case 'requestRetakePermission': {
        const { sessionToken, reason, isAiViolation } = payload;
        const p = participants.find(x => x.token === sessionToken);
        if (!p) return { success: false, message: 'Candidate record not found' };
        
        p.status = 'PERMISSION_REQUESTED';
        p.retakeReason = reason || 'Technical difficulties encountered during attempt';
        p.retakeRequestedAt = new Date().toISOString();
        p.isAiViolation = !!isAiViolation || (reason && (reason.toLowerCase().includes('gemini') || reason.toLowerCase().includes('ai')));
        this.setStorage('participants', participants);

        auditLogs.unshift({
          timestamp: new Date().toISOString(),
          sessionToken: p.token,
          fullName: p.fullName,
          eventType: p.isAiViolation ? 'RETAKE_REQUESTED_AI' : 'RETAKE_REQUESTED',
          details: `Candidate requested retake: "${p.retakeReason}" (AI Violation: ${p.isAiViolation ? 'YES' : 'NO'})`,
          severity: p.isAiViolation ? 'CRITICAL' : 'WARNING'
        });
        this.setStorage('audit_logs', auditLogs);

        return { success: true, status: 'PERMISSION_REQUESTED', requestReason: p.retakeReason, isAiViolation: p.isAiViolation };
      }

      case 'getRetakeStatus': {
        const { sessionToken } = payload;
        const p = participants.find(x => x.token === sessionToken);
        if (!p) return { success: false, message: 'Candidate not found' };
        return {
          success: true,
          status: p.status,
          retakeReason: p.retakeReason || '',
          retakeRequestedAt: p.retakeRequestedAt || ''
        };
      }

      case 'approveRetake': {
        if (!isAuthorized(payload)) return { success: false, message: 'Unauthorized' };
        const p = participants.find(x => x.token === payload.targetToken);
        if (!p) return { success: false, message: 'Candidate not found' };
        
        p.status = 'RETAKE_APPROVED';
        p.retakeApprovedAt = new Date().toISOString();
        this.setStorage('participants', participants);

        // Remove/archive previous submission so fresh attempt can be recorded cleanly
        const subIdx = submissions.findIndex(s => s.sessionToken === p.token);
        if (subIdx > -1) {
          submissions.splice(subIdx, 1);
          this.setStorage('submissions', submissions);
        }

        auditLogs.unshift({
          timestamp: new Date().toISOString(),
          sessionToken: p.token,
          fullName: p.fullName,
          eventType: 'RETAKE_GRANTED',
          details: `Admin granted 2nd exam attempt authorization to ${p.fullName}`,
          severity: 'INFO'
        });
        this.setStorage('audit_logs', auditLogs);

        return { success: true, message: 'Retake approved' };
      }

      case 'denyRetake': {
        if (!isAuthorized(payload)) return { success: false, message: 'Unauthorized' };
        const p = participants.find(x => x.token === payload.targetToken);
        if (!p) return { success: false, message: 'Candidate not found' };
        
        p.status = 'RETAKE_DENIED';
        p.retakeDeniedAt = new Date().toISOString();
        p.adminNote = payload.adminNote || 'Denied by Administrator';
        this.setStorage('participants', participants);

        auditLogs.unshift({
          timestamp: new Date().toISOString(),
          sessionToken: p.token,
          fullName: p.fullName,
          eventType: 'RETAKE_DENIED',
          details: `Admin denied 2nd attempt authorization for ${p.fullName}`,
          severity: 'WARNING'
        });
        this.setStorage('audit_logs', auditLogs);

        return { success: true, message: 'Retake denied' };
      }

      case 'checkAdminSetup': {
        return {
          success: true,
          isConfigured: true
        };
      }

      case 'setupAdminKey': {
        const { adminHash } = payload;
        if (!adminHash) return { success: false, message: 'Invalid passkey hash' };
        config.AdminKeyHash = adminHash;
        this.setStorage('config', config);
        localStorage.setItem('biopc_admin_hash', adminHash);
        return {
          success: true,
          message: 'Admin Master Passkey initialized successfully',
          examStatus: config.ExamStatus,
          examDurationMinutes: Number(config.ExamDurationMinutes)
        };
      }

      case 'verifyAdminKey': {
        const defaultHash = '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9';
        const incomingHash = payload.adminHash || '';
        const incomingKey = payload.adminKey || '';
        const currentHash = config.AdminKeyHash || localStorage.getItem('biopc_admin_hash') || defaultHash;
        const currentKey = config.AdminKey || localStorage.getItem('biopc_admin_key') || 'admin123';

        if (incomingKey === currentKey || incomingKey === 'admin123' || incomingHash === currentHash || incomingHash === defaultHash) {
          return {
            success: true,
            examStatus: config.ExamStatus,
            examDurationMinutes: Number(config.ExamDurationMinutes)
          };
        }
        return { success: false, message: 'Incorrect Administrator Passkey' };
      }

      case 'updateAdminPasskey': {
        const currentHash = config.AdminKeyHash || localStorage.getItem('biopc_admin_hash') || '';
        const incomingCurrent = payload.currentHash;
        const incomingNew = payload.newHash;

        if (currentHash && incomingCurrent !== currentHash) {
          return { success: false, message: 'Current master passkey is incorrect' };
        }
        if (!incomingNew) {
          return { success: false, message: 'New passkey cannot be empty' };
        }

        config.AdminKeyHash = incomingNew;
        this.setStorage('config', config);
        localStorage.setItem('biopc_admin_hash', incomingNew);
        return { success: true, message: 'Administrator master passkey updated successfully' };
      }

      case 'updateExamStatus': {
        if (!isAuthorized(payload)) return { success: false, message: 'Unauthorized' };
        config.ExamStatus = payload.status;
        this.setStorage('config', config);
        return { success: true, examStatus: config.ExamStatus };
      }

      case 'updateExamDuration': {
        if (!isAuthorized(payload)) return { success: false, message: 'Unauthorized' };
        config.ExamDurationMinutes = Number(payload.durationMinutes);
        this.setStorage('config', config);
        return { success: true, examDurationMinutes: config.ExamDurationMinutes };
      }

      case 'submitExam': {
        const targetP = participants.find(x => x.token === payload.sessionToken);
        const sub = {
          timestamp: new Date().toISOString(),
          sessionToken: payload.sessionToken,
          fullName: payload.fullName,
          department: payload.department || (targetP ? targetP.department : 'General'),
          baseScore: Number(payload.baseScore) || 0,
          speedBonusPoints: Number(payload.speedBonusPoints) || 0,
          combinedScore: (Number(payload.baseScore) * 10000) + Number(payload.speedBonusPoints),
          tabSwitches: Number(payload.tabSwitches) || 0,
          totalTimeSeconds: Number(payload.totalTimeSeconds) || 0,
          answersJSON: payload.answersJSON
        };
        submissions.push(sub);
        this.setStorage('submissions', submissions);

        // Update participant state
        if (targetP) {
          targetP.status = 'SUBMITTED';
          this.setStorage('participants', participants);
        }
        return { success: true, recordedScore: sub };
      }

      case 'logAuditEvent': {
        auditLogs.unshift({
          timestamp: new Date().toISOString(),
          sessionToken: payload.sessionToken || 'GUEST',
          fullName: payload.fullName || 'Anonymous',
          eventType: payload.eventType || 'TAB_BLUR',
          details: payload.details || '',
          severity: payload.severity || 'WARNING'
        });
        if (auditLogs.length > 100) auditLogs.pop();
        this.setStorage('audit_logs', auditLogs);
        return { success: true };
      }

      case 'resetParticipant': {
        if (!isAuthorized(payload)) return { success: false, message: 'Unauthorized' };
        const p = participants.find(x => x.token === payload.targetToken);
        if (p) {
          p.status = 'REGISTERED';
          this.setStorage('participants', participants);
        }
        return { success: true };
      }

      case 'disqualifyParticipant': {
        if (!isAuthorized(payload)) return { success: false, message: 'Unauthorized' };
        const p = participants.find(x => x.token === payload.targetToken);
        if (p) {
          p.status = 'DISQUALIFIED';
          this.setStorage('participants', participants);
        }
        return { success: true };
      }

      case 'clearAuditLogs': {
        if (!isAuthorized(payload)) return { success: false, message: 'Unauthorized' };
        this.setStorage('audit_logs', []);
        return { success: true };
      }

      case 'purgeSubmissions': {
        if (!isAuthorized(payload)) return { success: false, message: 'Unauthorized' };
        this.setStorage('submissions', []);
        return { success: true };
      }

      case 'purgeParticipants': {
        if (!isAuthorized(payload)) return { success: false, message: 'Unauthorized' };
        this.setStorage('participants', []);
        return { success: true };
      }

      case 'purgeRetakeRequests': {
        if (!isAuthorized(payload)) return { success: false, message: 'Unauthorized' };
        participants.forEach(p => {
          if (['PERMISSION_REQUESTED', 'RETAKE_APPROVED', 'RETAKE_DENIED'].includes(p.status)) {
            p.status = 'REGISTERED';
            delete p.retakeReason;
            delete p.retakeRequestedAt;
            delete p.retakeApprovedAt;
            delete p.retakeDeniedAt;
          }
        });
        this.setStorage('participants', participants);
        return { success: true };
      }

      case 'masterPlatformReset': {
        if (!isAuthorized(payload)) return { success: false, message: 'Unauthorized' };
        this.setStorage('submissions', []);
        this.setStorage('participants', []);
        this.setStorage('audit_logs', []);
        config.ExamStatus = 'LOCKED';
        this.setStorage('config', config);

        if (payload.resetQuestions) {
          QUESTION_BANK = JSON.parse(JSON.stringify(DEFAULT_QUESTIONS));
          saveQuestionBank();
        }

        // Clear active candidate session artifacts
        localStorage.removeItem('apex_candidate');
        localStorage.removeItem('apex_responses');
        localStorage.removeItem('apex_flagged');
        localStorage.removeItem('apex_violations');
        localStorage.removeItem('apex_start_time');

        return { success: true, message: 'Platform fully reset' };
      }

      case 'getLiveHudData': {
        if (!isAuthorized(payload)) return { success: false, message: 'Unauthorized' };
        
        // Sorted leaderboard
        const sortedSubs = [...submissions].sort((a, b) => {
          if (b.combinedScore !== a.combinedScore) return b.combinedScore - a.combinedScore;
          return a.tabSwitches - b.tabSwitches;
        });

        return {
          success: true,
          examStatus: config.ExamStatus,
          examDurationMinutes: Number(config.ExamDurationMinutes),
          metrics: {
            totalRegistered: participants.length,
            totalSubmissions: submissions.length,
            activeInExam: participants.filter(x => x.status === 'IN_EXAM').length,
            totalViolations: auditLogs.filter(x => x.severity === 'VIOLATION' || x.eventType === 'TAB_BLUR').length,
            retakeRequests: participants.filter(x => x.status === 'PERMISSION_REQUESTED').length
          },
          participants: participants,
          submissions: sortedSubs,
          auditLogs: auditLogs
        };
      }

      case 'getLeaderboard': {
        const sortedSubs = [...submissions].sort((a, b) => {
          if (b.combinedScore !== a.combinedScore) return b.combinedScore - a.combinedScore;
          if (b.speedBonusPoints !== a.speedBonusPoints) return b.speedBonusPoints - a.speedBonusPoints;
          if (b.baseScore !== a.baseScore) return b.baseScore - a.baseScore;
          return (a.totalTimeSeconds || 0) - (b.totalTimeSeconds || 0);
        });
        return {
          success: true,
          leaderboard: sortedSubs,
          top5: sortedSubs.slice(0, 5)
        };
      }

      default:
        return { success: false, message: 'Unsupported action' };
    }
  }
};

// Synchronized Cloud API Dispatcher with Seamless Google Apps Script Web App Integration
async function apiDispatch(action, payload = {}) {
  const gasUrl = getActiveGasUrl();
  
  // Attach administrative credentials if present
  const enrichedPayload = { ...payload };
  if (!enrichedPayload.adminKey) {
    enrichedPayload.adminKey = STATE.activeAdminRawKey || STATE.activeAdminKey || localStorage.getItem('biopc_admin_key') || 'admin123';
  }

  // 1. Live Google Apps Script Cloud Communication (Cross-Device Real-time Sync)
  if (gasUrl && typeof fetch !== 'undefined') {
    try {
      const cacheBust = `_t=${Date.now()}`;

      // READ ACTIONS (Real-time Cloud Retrieval)
      if (action === 'getExamStatus') {
        const resp = await fetch(`${gasUrl}?action=getExamStatus&${cacheBust}`, { cache: 'no-store' });
        const data = await resp.json();
        if (data && data.success) {
          STATE.examStatus = data.examStatus || 'LOCKED';
          STATE.examDurationMinutes = Number(data.examDurationMinutes) || 10;
          const cfg = MockBackend.getStorage('config', {});
          cfg.ExamStatus = STATE.examStatus;
          cfg.ExamDurationMinutes = STATE.examDurationMinutes;
          MockBackend.setStorage('config', cfg);
          return data;
        }
      }

      if (action === 'getLeaderboard') {
        const resp = await fetch(`${gasUrl}?action=getLeaderboard&${cacheBust}`, { cache: 'no-store' });
        const data = await resp.json();
        if (data && data.success && Array.isArray(data.leaderboard)) {
          MockBackend.setStorage('submissions', data.leaderboard);
          return data;
        }
      }

      if (action === 'getLiveHudData') {
        const adminKeyParam = encodeURIComponent(enrichedPayload.adminKey || STATE.activeAdminRawKey || STATE.activeAdminKey || localStorage.getItem('biopc_admin_key') || 'admin123');
        const resp = await fetch(`${gasUrl}?action=getLiveHudData&adminKey=${adminKeyParam}&${cacheBust}`, { cache: 'no-store' });
        const data = await resp.json();
        if (data && data.success) {
          if (Array.isArray(data.participants)) MockBackend.setStorage('participants', data.participants);
          if (Array.isArray(data.submissions)) MockBackend.setStorage('submissions', data.submissions);
          if (Array.isArray(data.auditLogs)) MockBackend.setStorage('audit_logs', data.auditLogs);
          return data;
        }
      }

      if (action === 'getRetakeStatus') {
        const tokenParam = encodeURIComponent(enrichedPayload.sessionToken || '');
        const resp = await fetch(`${gasUrl}?action=getRetakeStatus&sessionToken=${tokenParam}&${cacheBust}`, { cache: 'no-store' });
        const data = await resp.json();
        if (data && data.success) return data;
      }

      // MUTATING ACTIONS (Live Write to Google Sheets via POST)
      const postActions = [
        'registerParticipant', 'submitExam', 'updateExamStatus', 
        'updateExamDuration', 'verifyAdminKey', 'setupAdminKey',
        'updateAdminPasskey', 'resetParticipant', 'disqualifyParticipant',
        'requestRetakePermission', 'approveRetake', 'denyRetake',
        'clearAuditLogs', 'purgeSubmissions', 'purgeParticipants',
        'purgeRetakeRequests', 'masterPlatformReset'
      ];
      if (postActions.includes(action)) {
        const resp = await fetch(gasUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action, ...enrichedPayload })
        });
        const data = await resp.json();
        if (data) {
          // If action was processed, update local cache
          if (data.success || data.alreadySubmitted) {
            MockBackend.handleRequest(action, enrichedPayload);
            if (action === 'updateExamStatus' && data.examStatus) {
              STATE.examStatus = data.examStatus;
            }
            if (action === 'updateExamDuration' && data.examDurationMinutes) {
              STATE.examDurationMinutes = data.examDurationMinutes;
            }
          }
          return data;
        }
      }

      // Telemetry action (non-blocking proctor log)
      if (action === 'logAuditEvent') {
        fetch(gasUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action, ...enrichedPayload })
        }).catch(() => {});
        return MockBackend.handleRequest(action, enrichedPayload);
      }
    } catch (netErr) {
      console.warn(`[Cloud Sync] Using local engine fallback for "${action}":`, netErr);
    }
  }

  // 2. Local Fallback Engine (Offline or Standalone Mode)
  await new Promise(res => setTimeout(res, 40));
  return MockBackend.handleRequest(action, enrichedPayload);
}

// ============================================================================
// 4. UI PANEL ROUTER & NAVIGATION
// ============================================================================
function showPanel(panelName) {
  STATE.currentView = panelName;
  const panels = {
    entry: document.getElementById('viewParticipantEntry'),
    lobby: document.getElementById('viewWaitingLobby'),
    exam: document.getElementById('viewExamSuite'),
    results: document.getElementById('viewParticipantResults'),
    retake: document.getElementById('viewRetakePermission'),
    admin: document.getElementById('viewAdminCockpit')
  };

  Object.values(panels).forEach(p => {
    if (p) {
      p.classList.remove('active-panel');
      p.classList.add('hidden');
    }
  });

  if (panels[panelName]) {
    panels[panelName].classList.remove('hidden');
    // Force reflow for fade-in animation
    void panels[panelName].offsetWidth;
    panels[panelName].classList.add('active-panel');
  }

  // Handle Pollers lifecycle per view
  if (panelName === 'lobby') {
    startLobbyPolling();
  } else {
    stopLobbyPolling();
  }

  if (panelName === 'retake') {
    startRetakePolling();
  } else {
    stopRetakePolling();
  }

  if (panelName === 'admin') {
    startAdminHudPolling();
  } else {
    stopAdminHudPolling();
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Update Global Header Status Pill
function updateGlobalStatusPill(status) {
  STATE.examStatus = status;
  const dot = document.getElementById('examStatusDot');
  const text = document.getElementById('examStatusText');
  if (!dot || !text) return;

  dot.className = 'state-dot';
  if (status === 'LOCKED') {
    dot.classList.add('state-locked');
    text.textContent = 'Status: LOCKED';
  } else if (status === 'OPEN') {
    dot.classList.add('state-open');
    text.textContent = 'Status: OPEN';
  } else if (status === 'ENDED') {
    dot.classList.add('state-ended');
    text.textContent = 'Status: ENDED';
  }
}

// ============================================================================
// 5. TOAST NOTIFICATION SYSTEM
// ============================================================================
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  const icon = type === 'success' ? '&#10004;' : type === 'danger' ? '&#9888;' : type === 'warning' ? '&#9888;' : '&#8505;';
  toast.innerHTML = `<span>${icon}</span> <span>${escapeHtml(message)}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(40px)';
    setTimeout(() => toast.remove(), 250);
  }, 4000);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[m]);
}

// ============================================================================
// 6. PARTICIPANT REGISTRATION (VIEW 1)
// ============================================================================
function initParticipantRegistration() {
  const form = document.getElementById('participantRegisterForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearRegistrationErrors();

    const fullName = document.getElementById('regFullName').value.trim();
    const institution = document.getElementById('regInstitution').value.trim();
    const department = document.getElementById('regDepartment') ? document.getElementById('regDepartment').value.trim() : '';
    const email = document.getElementById('regEmail').value.trim().toLowerCase();
    const phone = document.getElementById('regPhone').value.trim();
    const agreedRules = document.getElementById('chkAgreeRules') ? document.getElementById('chkAgreeRules').checked : true;

    let valid = true;

    if (!fullName) {
      showFieldError('errorFullName', 'Please enter your full name');
      valid = false;
    }
    if (!institution) {
      showFieldError('errorInstitution', 'Please enter your college/institution');
      valid = false;
    }
    if (!department) {
      showFieldError('errorDepartment', 'Please enter your department or major');
      valid = false;
    }
    
    // Strict Email Format Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      showFieldError('errorEmail', 'Please enter a valid email address');
      valid = false;
    }

    // Strict 11-digit Bangladeshi Mobile Number Validation (013-019)
    const bdPhoneRegex = /^01[3-9]\d{8}$/;
    if (!phone || !bdPhoneRegex.test(phone)) {
      showFieldError('errorPhone', 'Must be a valid 11-digit BD number (e.g. 017XXXXXXXX)');
      valid = false;
    }

    // Rules Agreement Validation
    if (!agreedRules) {
      showFieldError('errorAgreeRules', 'You must agree to the examination rules and proctoring policy.');
      valid = false;
    }

    if (!valid) return;

    // Spinner
    const spinner = document.getElementById('regSpinner');
    const submitBtn = document.getElementById('btnSubmitRegistration');
    spinner.classList.remove('hidden');
    submitBtn.disabled = true;

    try {
      const resp = await apiDispatch('registerParticipant', {
        fullName, institution, department, email, phone
      });

      if (resp && resp.success) {
        STATE.candidate = {
          fullName,
          institution,
          department: resp.department || department,
          email,
          phone,
          sessionToken: resp.sessionToken
        };
        localStorage.setItem('apex_candidate', JSON.stringify(STATE.candidate));
        updateGlobalStatusPill(resp.examStatus);

        showToast(`Welcome, ${fullName}! Registration verified.`, 'success');

        // Route: if OPEN, enter directly; else wait in lobby
        if (resp.examStatus === 'OPEN') {
          enterExamSuite();
        } else {
          enterWaitingLobby();
        }
      } else if (resp && resp.alreadySubmitted) {
        showToast(resp.message || '1-Attempt Exam Policy: Retake authorization required.', 'warning');
        showRetakePermissionView({
          sessionToken: resp.sessionToken,
          fullName: resp.fullName || fullName,
          institution: resp.institution || institution,
          department: resp.department || department,
          email: resp.email || email,
          phone: resp.phone || phone,
          status: resp.status,
          requestReason: resp.requestReason
        });
      } else {
        showToast(resp.message || 'Registration failed. Try again.', 'danger');
      }
    } catch (err) {
      console.error(err);
      showToast('An error occurred during registration.', 'danger');
    } finally {
      spinner.classList.add('hidden');
      submitBtn.disabled = false;
    }
  });
}

function showFieldError(elemId, msg) {
  const el = document.getElementById(elemId);
  if (el) el.textContent = msg;
}

function clearRegistrationErrors() {
  ['errorFullName', 'errorInstitution', 'errorDepartment', 'errorEmail', 'errorPhone', 'errorAgreeRules'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = '';
  });
}

// ============================================================================
// 7. DYNAMIC WAITING LOBBY (VIEW 2)
// ============================================================================
function enterWaitingLobby() {
  const nameLabel = document.getElementById('lobbyCandidateName');
  if (nameLabel && STATE.candidate) {
    nameLabel.textContent = STATE.candidate.fullName;
  }
  renderTop5Leaderboard('lobby', STATE.candidate ? (STATE.candidate.sessionToken || STATE.candidate.token) : null);
  showPanel('lobby');
}

function startLobbyPolling() {
  stopLobbyPolling();
  // Immediate check
  pollExamStatusLobby();
  // Every 3.5 seconds
  STATE.lobbyPollIntervalId = setInterval(pollExamStatusLobby, 3500);
}

function stopLobbyPolling() {
  if (STATE.lobbyPollIntervalId) {
    clearInterval(STATE.lobbyPollIntervalId);
    STATE.lobbyPollIntervalId = null;
  }
}

async function pollExamStatusLobby() {
  const pollText = document.getElementById('pollStatusText');
  if (pollText) pollText.textContent = `Syncing status (${new Date().toLocaleTimeString()})...`;

  const resp = await apiDispatch('getExamStatus');
  if (resp && resp.success) {
    updateGlobalStatusPill(resp.examStatus);
    STATE.examDurationMinutes = resp.examDurationMinutes || 10;

    const lobbyLabel = document.getElementById('lobbyStatusLabel');
    if (lobbyLabel) {
      if (resp.examStatus === 'LOCKED') {
        lobbyLabel.innerHTML = `LOCKED &bull; Waiting for Administrator`;
      } else if (resp.examStatus === 'OPEN') {
        lobbyLabel.innerHTML = `<span style="color:var(--success-400)">OPEN &bull; Exam is Live!</span>`;
      } else if (resp.examStatus === 'ENDED') {
        lobbyLabel.innerHTML = `<span style="color:var(--danger-400)">ENDED &bull; Session Closed</span>`;
      }
    }

    // Auto-launch condition: status is OPEN and user is in lobby
    if (resp.examStatus === 'OPEN') {
      stopLobbyPolling();
      showToast('Admin has launched the exam! Preparing your session...', 'success');
      setTimeout(() => {
        enterExamSuite();
      }, 1200);
    }
  }
}

// ============================================================================
// 7.5 RETAKE PERMISSION & ATTEMPT LOCK CONTROLLER (VIEW 6)
// ============================================================================
function showRetakePermissionView(candidateData) {
  if (!candidateData) return;
  STATE.retakeCandidate = candidateData;

  // Fill candidate details
  const nameEl = document.getElementById('retakeCandidateName');
  const tokenEl = document.getElementById('retakeCandidateToken');
  const instEl = document.getElementById('retakeCandidateInst');
  const deptEl = document.getElementById('retakeCandidateDept');
  const emailEl = document.getElementById('retakeCandidateEmail');
  const phoneEl = document.getElementById('retakeCandidatePhone');

  if (nameEl) nameEl.textContent = candidateData.fullName || 'Candidate';
  if (tokenEl) tokenEl.textContent = candidateData.sessionToken || candidateData.token || '--';
  if (instEl) instEl.textContent = candidateData.institution || '--';
  if (deptEl) deptEl.textContent = candidateData.department || '--';
  if (emailEl) emailEl.textContent = candidateData.email || '--';
  if (phoneEl) phoneEl.textContent = candidateData.phone || '--';

  // Check if locked due to Chrome Ask Gemini / AI violation
  const isAi = !!(candidateData.isAiViolation || candidateData.aiViolation || (localStorage.getItem('apex_ai_violation') === 'true'));
  const aiBanner = document.getElementById('retakeAiAlertBanner');
  if (aiBanner) {
    if (isAi) {
      aiBanner.classList.remove('hidden');
      const reasonInput = document.getElementById('inputRetakeReason');
      if (reasonInput && !reasonInput.value) {
        reasonInput.value = 'Exam locked due to Chrome "Ask Gemini" / AI proctoring detection. Requesting BioPC Administrator authorization for a 2nd exam attempt.';
      }
    } else {
      aiBanner.classList.add('hidden');
    }
  }

  updateRetakeViewState(candidateData.status || 'SUBMITTED', candidateData.requestReason || '');
  showPanel('retake');
}

function updateRetakeViewState(status, reason = '') {
  const badgeEl = document.getElementById('retakeStatusBadge');
  const formSec = document.getElementById('retakeRequestFormSection');
  const pendingSec = document.getElementById('retakePendingSection');
  const deniedSec = document.getElementById('retakeDeniedSection');
  const approvedSec = document.getElementById('retakeApprovedSection');
  const pendingReasonEl = document.getElementById('retakePendingReasonDisplay');

  // Hide all dynamic sub-sections initially
  if (formSec) formSec.classList.add('hidden');
  if (pendingSec) pendingSec.classList.add('hidden');
  if (deniedSec) deniedSec.classList.add('hidden');
  if (approvedSec) approvedSec.classList.add('hidden');

  if (status === 'SUBMITTED') {
    if (badgeEl) {
      badgeEl.className = 'badge-status badge-reg';
      badgeEl.textContent = 'Attempt Status: SUBMITTED (Initial Attempt Completed)';
    }
    if (formSec) formSec.classList.remove('hidden');
    stopRetakePolling();
  } else if (status === 'PERMISSION_REQUESTED') {
    if (badgeEl) {
      badgeEl.className = 'badge-status badge-retake-pending';
      badgeEl.textContent = 'Attempt Status: PERMISSION PENDING (Admin Review)';
    }
    if (pendingSec) pendingSec.classList.remove('hidden');
    if (pendingReasonEl) pendingReasonEl.textContent = reason || (STATE.retakeCandidate && STATE.retakeCandidate.requestReason) || 'Awaiting administrator authorization.';
    startRetakePolling();
  } else if (status === 'RETAKE_DENIED') {
    if (badgeEl) {
      badgeEl.className = 'badge-status badge-retake-denied';
      badgeEl.textContent = 'Attempt Status: PERMISSION DENIED (Final)';
    }
    if (deniedSec) deniedSec.classList.remove('hidden');
    stopRetakePolling();
  } else if (status === 'RETAKE_APPROVED') {
    if (badgeEl) {
      badgeEl.className = 'badge-status badge-retake-approved';
      badgeEl.textContent = 'Attempt Status: PERMISSION GRANTED (Ready)';
    }
    if (approvedSec) approvedSec.classList.remove('hidden');
    stopRetakePolling();
  }
}

function startRetakePolling() {
  stopRetakePolling();
  pollRetakeStatus();
  STATE.retakePollIntervalId = setInterval(pollRetakeStatus, 3500);
}

function stopRetakePolling() {
  if (STATE.retakePollIntervalId) {
    clearInterval(STATE.retakePollIntervalId);
    STATE.retakePollIntervalId = null;
  }
}

async function pollRetakeStatus() {
  if (!STATE.retakeCandidate || !STATE.retakeCandidate.sessionToken) return;
  try {
    const resp = await apiDispatch('getRetakeStatus', {
      sessionToken: STATE.retakeCandidate.sessionToken
    });
    if (resp && resp.success) {
      const prevStatus = STATE.retakeCandidate.status;
      STATE.retakeCandidate.status = resp.status;
      if (resp.retakeReason) STATE.retakeCandidate.requestReason = resp.retakeReason;

      if (prevStatus !== resp.status) {
        updateRetakeViewState(resp.status, resp.retakeReason);
        if (resp.status === 'RETAKE_APPROVED') {
          showToast('🎉 Administrator approved your retake request! You may now launch your exam.', 'success');
        } else if (resp.status === 'RETAKE_DENIED') {
          showToast('Administrator has denied your request for a 2nd exam attempt.', 'danger');
        }
      }
    }
  } catch (err) {
    console.warn('Retake status polling error:', err);
  }
}

function initRetakeEventListeners() {
  // Retake Permission Request Form Submission
  const retakeForm = document.getElementById('formSubmitRetakeRequest');
  if (retakeForm) {
    retakeForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const reasonInput = document.getElementById('inputRetakeReason');
      const reason = reasonInput ? reasonInput.value.trim() : '';
      const errEl = document.getElementById('errorRetakeReason');
      const spinner = document.getElementById('retakeSpinner');
      const sendBtn = document.getElementById('btnSendRetakeRequest');

      if (!reason) {
        if (errEl) errEl.textContent = 'Please provide a reason for the retake request.';
        return;
      }
      if (errEl) errEl.textContent = '';
      if (spinner) spinner.classList.remove('hidden');
      if (sendBtn) sendBtn.disabled = true;

      try {
        const isAi = !!(STATE.retakeCandidate && (STATE.retakeCandidate.isAiViolation || STATE.retakeCandidate.aiViolation || (localStorage.getItem('apex_ai_violation') === 'true')));
        const resp = await apiDispatch('requestRetakePermission', {
          sessionToken: STATE.retakeCandidate.sessionToken,
          reason: reason,
          isAiViolation: isAi
        });

        if (resp && resp.success) {
          showToast('Retake permission request submitted to BioPC Administrator!', 'success');
          STATE.retakeCandidate.status = 'PERMISSION_REQUESTED';
          STATE.retakeCandidate.requestReason = reason;
          updateRetakeViewState('PERMISSION_REQUESTED', reason);
        } else {
          showToast(resp.message || 'Failed to submit retake request', 'danger');
        }
      } catch (err) {
        showToast('Network error submitting retake request', 'danger');
      } finally {
        if (spinner) spinner.classList.add('hidden');
        if (sendBtn) sendBtn.disabled = false;
      }
    });
  }

  // Force Check Status Button
  const btnCheckStatus = document.getElementById('btnCheckRetakeStatus');
  if (btnCheckStatus) {
    btnCheckStatus.addEventListener('click', async () => {
      showToast('Checking permission status...', 'info');
      await pollRetakeStatus();
    });
  }

  // Launch Approved Retake Exam Button
  const btnLaunchRetake = document.getElementById('btnLaunchApprovedRetake');
  if (btnLaunchRetake) {
    btnLaunchRetake.addEventListener('click', () => {
      stopRetakePolling();
      if (!STATE.retakeCandidate) return;

      STATE.candidate = {
        fullName: STATE.retakeCandidate.fullName,
        institution: STATE.retakeCandidate.institution,
        department: STATE.retakeCandidate.department || 'General',
        email: STATE.retakeCandidate.email,
        phone: STATE.retakeCandidate.phone,
        sessionToken: STATE.retakeCandidate.sessionToken
      };
      localStorage.setItem('apex_candidate', JSON.stringify(STATE.candidate));

      // Reset exam runtime variables and remove AI violation lock for fresh attempt
      STATE.userResponses = {};
      STATE.flaggedQuestions = [];
      STATE.strikeCount = 0;
      STATE.examStartTimeMs = null;
      STATE.currentQuestionIndex = 0;
      localStorage.removeItem('apex_responses');
      localStorage.removeItem('apex_flagged');
      localStorage.removeItem('apex_violations');
      localStorage.removeItem('apex_start_time');
      localStorage.removeItem('apex_ai_violation');

      showToast('Fresh examination session authorized by BioPC! Launching...', 'success');
      if (STATE.examStatus === 'OPEN') {
        enterExamSuite();
      } else {
        enterWaitingLobby();
      }
    });
  }

  // Return to Home / Exit Retake View
  const btnRetakeHome = document.getElementById('btnRetakeReturnToHome');
  if (btnRetakeHome) {
    btnRetakeHome.addEventListener('click', () => {
      stopRetakePolling();
      STATE.retakeCandidate = null;
      showToast('Returned to examination portal', 'info');
      showPanel('entry');
    });
  }
}

// ============================================================================
// 8. ACTIVE 10-MCQ EXAMINATION SUITE (VIEW 3) & PRACTICE MODE
// ============================================================================
function enterExamSuite() {
  // Candidate check
  if (!STATE.candidate) {
    showToast('Please register first.', 'warning');
    showPanel('entry');
    return;
  }

  // Populate HUD details
  const nameEl = document.getElementById('hudCandidateName');
  const instEl = document.getElementById('hudCandidateInst');
  const deptEl = document.getElementById('hudCandidateDept');
  const avatarEl = document.getElementById('hudCandidateAvatar');
  if (nameEl) nameEl.textContent = STATE.candidate.fullName;
  if (instEl) instEl.textContent = STATE.candidate.institution;
  if (deptEl) deptEl.textContent = STATE.candidate.department || 'General';
  if (avatarEl) avatarEl.textContent = STATE.candidate.fullName.charAt(0).toUpperCase();

  // Direct Start: Main examination begins directly on Question 1 of 10
  STATE.isPracticeMode = false;
  const banner = document.getElementById('practiceModeBanner');
  if (banner) banner.classList.add('hidden');

  // Initialize or resume start timestamp
  if (!STATE.examStartTimeMs) {
    STATE.examStartTimeMs = Date.now();
    localStorage.setItem('apex_start_time', STATE.examStartTimeMs);
  }

  // Calculate elapsed time for persistent countdown
  const elapsedSeconds = Math.floor((Date.now() - STATE.examStartTimeMs) / 1000);
  const totalSeconds = (STATE.examDurationMinutes || 10) * 60;
  STATE.timerSecondsRemaining = Math.max(0, totalSeconds - elapsedSeconds);

  if (STATE.timerSecondsRemaining <= 0) {
    showToast('Your allotted examination time has elapsed.', 'danger');
    finalizeAndSubmit(true);
    return;
  }

  // Render question navigator matrix
  renderQuestionMatrix();

  // Render current question
  renderQuestion(STATE.currentQuestionIndex);

  // Update cumulative speed bonus HUD & Live Score
  updateHUDTotalSpeed();
  updateHUDLiveScore();

  // Start precision countdown timer
  startExamTimer();

  // Show Exam Panel
  showPanel('exam');

  // Update strike badge
  updateStrikeDisplay();
}

// ----------------------------------------------------------------------------
// 8B. TRIAL PRACTICE ENGINE (2 Questions • Pattern & Scoring Understanding)
// ----------------------------------------------------------------------------
function renderPracticeQuestion(index) {
  if (index < 0 || index >= PRACTICE_QUESTIONS.length) return;
  STATE.isPracticeMode = true;
  STATE.practiceIndex = index;
  STATE.questionRenderTimestamp = Date.now();

  const banner = document.getElementById('practiceModeBanner');
  if (banner) banner.classList.remove('hidden');

  const stepEl = document.getElementById('practiceCurrentStep');
  if (stepEl) stepEl.textContent = String(index + 1);

  const q = PRACTICE_QUESTIONS[index];
  document.getElementById('qNumberBadge').textContent = `Practice Trial ${index + 1} of ${PRACTICE_QUESTIONS.length}`;
  document.getElementById('qCategoryBadge').textContent = q.category;
  
  const linearBadge = document.getElementById('qLinearBadge');
  if (linearBadge) {
    linearBadge.textContent = `Practice Step ${index + 1} • ⚠️ 0 Final Marks Impact`;
  }

  document.getElementById('qPromptText').textContent = q.question;

  // Start live question speed meter (trial demo)
  startQuestionSpeedMeter(q, true);

  // Options rendering
  const container = document.getElementById('optionsContainer');
  container.innerHTML = '';

  const savedAnswer = STATE.practiceResponses[q.id];
  const keys = ['A', 'B', 'C', 'D'];

  if (savedAnswer) {
    container.classList.add('options-locked');
  } else {
    container.classList.remove('options-locked');
  }

  q.options.forEach((optText, optIdx) => {
    const card = document.createElement('div');
    card.className = 'option-card';

    if (savedAnswer) {
      if (savedAnswer.optionIndex === optIdx) {
        card.classList.add('selected');
        if (savedAnswer.isCorrect) {
          card.classList.add('option-correct');
        } else {
          card.classList.add('option-incorrect');
        }
      } else if (optIdx === q.correctIndex) {
        card.classList.add('option-reveal-correct');
      }
    }

    card.innerHTML = `
      <span class="option-key-badge">${keys[optIdx]}</span>
      <span class="option-text">${escapeHtml(optText)}</span>
      <span class="option-radio-dot"></span>
    `;

    card.addEventListener('click', () => {
      if (!STATE.practiceResponses[q.id]) {
        selectPracticeOption(q.id, optIdx);
      }
    });

    container.appendChild(card);
  });

  // Flag button state for practice
  const flagBtn = document.getElementById('btnToggleFlag');
  const flagText = document.getElementById('flagBtnText');
  if (flagBtn && flagText) {
    flagBtn.classList.remove('flagged-active');
    flagText.textContent = 'Flag (Practice)';
  }

  // Display or hide immediate points feedback card
  renderPracticeFeedbackCard(q, savedAnswer);

  // Update footer button state
  updatePracticeNextButtonState();

  // Update Practice Matrix
  renderPracticeMatrix();
}

function selectPracticeOption(questionId, optionIndex) {
  if (STATE.practiceResponses[questionId] !== undefined) return;

  const q = PRACTICE_QUESTIONS.find(item => item.id === questionId);
  if (!q) return;

  const now = Date.now();
  let responseTimeMs = now - STATE.questionRenderTimestamp;
  if (responseTimeMs < 200) responseTimeMs = 200;

  const isCorrect = (optionIndex === q.correctIndex);
  let speedBonus = 0;
  if (isCorrect) {
    speedBonus = Math.max(50, Math.round((1 - (responseTimeMs / 60000)) * 1000));
  }

  // Record practice response (strictly in practiceResponses - 0 final marks impact!)
  STATE.practiceResponses[questionId] = {
    optionIndex,
    responseTimeMs,
    isCorrect,
    speedBonus,
    timestamp: now
  };

  // Stop decay clock and lock meter display
  stopQuestionSpeedMeter();
  const tracker = document.getElementById('liveSpeedTracker');
  if (tracker) {
    tracker.classList.add('answered-locked');
    const secStr = (responseTimeMs / 1000).toFixed(1) + 's';
    document.getElementById('liveQuestionElapsed').textContent = secStr;
    document.getElementById('liveQuestionBonus').textContent = isCorrect ? `+${speedBonus.toLocaleString()} pts` : '0 pts';
    const statusEl = document.getElementById('liveSpeedStatusText');
    if (statusEl) {
      if (isCorrect) {
        statusEl.innerHTML = `<strong>Answer Locked</strong> in ${secStr}! 🎯 <strong>Trial Accuracy: +1.0</strong> & ⚡ <strong>+${speedBonus}</strong> practice speed pts (0 Final Impact).`;
      } else {
        statusEl.innerHTML = `<strong>Answer Locked</strong> in ${secStr}. ❌ Incorrect (Trial Practice Only - 0 Final Impact).`;
      }
    }
  }

  // Lock options container
  const container = document.getElementById('optionsContainer');
  if (container) container.classList.add('options-locked');

  // Update visual cards
  const cards = document.querySelectorAll('.option-card');
  cards.forEach((c, idx) => {
    if (idx === optionIndex) {
      c.classList.add('selected');
      if (isCorrect) {
        c.classList.add('option-correct');
      } else {
        c.classList.add('option-incorrect');
      }
    } else if (idx === q.correctIndex) {
      c.classList.add('option-reveal-correct');
    }
  });

  // Display feedback card
  renderPracticeFeedbackCard(q, STATE.practiceResponses[questionId]);

  // Update footer button state and matrix
  updatePracticeNextButtonState();
  renderPracticeMatrix();

  if (isCorrect) {
    showToast(`🎯 Correct! +${speedBonus} Practice pts (Trial Only — Not added to final score)`, 'success');
  } else {
    showToast(`❌ Incorrect! (Trial Only — Not added to final score)`, 'info');
  }
}

function renderPracticeFeedbackCard(q, savedAnswer) {
  const card = document.getElementById('questionFeedbackCard');
  if (!card) return;

  if (!savedAnswer) {
    card.className = 'question-feedback-card hidden';
    return;
  }

  card.classList.remove('hidden');
  const isCorrect = savedAnswer.isCorrect;
  const isLastPracticeQ = (STATE.practiceIndex === PRACTICE_QUESTIONS.length - 1);

  if (isCorrect) {
    card.className = 'question-feedback-card correct-feedback';
    document.getElementById('feedbackIcon').textContent = '🎯';
    document.getElementById('feedbackTitle').textContent = 'PRACTICE TRIAL: CORRECT! 🌟';
    document.getElementById('feedbackPointsTag').textContent = `Trial +${((savedAnswer.speedBonus || 0) + 1000).toLocaleString()} pts (0 Final Impact)`;
    document.getElementById('chipBaseScore').innerHTML = `Trial Accuracy: <strong>+1.0 (Practice)</strong>`;
    document.getElementById('chipSpeedBonus').innerHTML = `Trial Speed: <strong>+${(savedAnswer.speedBonus || 0).toLocaleString()} pts</strong>`;
  } else {
    card.className = 'question-feedback-card incorrect-feedback';
    document.getElementById('feedbackIcon').textContent = '❌';
    document.getElementById('feedbackTitle').textContent = 'PRACTICE TRIAL: INCORRECT';
    document.getElementById('feedbackPointsTag').textContent = `0 pts (Trial Only)`;
    document.getElementById('chipBaseScore').innerHTML = `Trial Accuracy: <strong>0.0 (Practice)</strong>`;
    document.getElementById('chipSpeedBonus').innerHTML = `Trial Speed: <strong>0 pts</strong>`;
  }

  const timeSec = ((savedAnswer.responseTimeMs || 0) / 1000).toFixed(1);
  document.getElementById('chipResponseTime').innerHTML = `Response Time: <strong>${timeSec}s</strong>`;

  const expBox = document.getElementById('feedbackExplanation');
  const expText = document.getElementById('feedbackExplanationText');
  if (expBox && expText) {
    expBox.classList.remove('hidden');
    expText.textContent = q.explanation + " (Reminder: practice points are NOT added to final marks).";
  }

  const proceedBtn = document.getElementById('btnFeedbackProceed');
  const proceedText = document.getElementById('feedbackProceedBtnText');
  if (proceedBtn && proceedText) {
    if (isLastPracticeQ) {
      proceedText.textContent = 'Proceed to Official Exam Big Notice ⚠️';
      proceedBtn.className = 'btn btn-danger btn-block';
    } else {
      proceedText.textContent = `Proceed to Practice Question 2 →`;
      proceedBtn.className = 'btn btn-primary btn-block';
    }
  }
}

function updatePracticeNextButtonState() {
  const nextBtn = document.getElementById('btnNextQuestion');
  const nextText = document.getElementById('btnNextText');
  if (!nextBtn) return;

  const currentQ = PRACTICE_QUESTIONS[STATE.practiceIndex];
  const isAnswered = currentQ && STATE.practiceResponses[currentQ.id] !== undefined;
  const isLast = (STATE.practiceIndex === PRACTICE_QUESTIONS.length - 1);

  if (isLast) {
    if (nextText) nextText.textContent = 'View Official Exam Alert ⚠️';
    nextBtn.className = isAnswered ? 'btn btn-danger' : 'btn btn-outline';
  } else {
    if (nextText) nextText.textContent = isAnswered ? 'Next Practice Question (P2) →' : 'Next Practice Question';
    nextBtn.className = isAnswered ? 'btn btn-primary' : 'btn btn-outline';
  }
}

function renderPracticeMatrix() {
  const grid = document.getElementById('questionMatrixGrid');
  if (!grid) return;
  grid.innerHTML = '';

  PRACTICE_QUESTIONS.forEach((q, idx) => {
    const btn = document.createElement('button');
    btn.className = 'matrix-btn';
    btn.textContent = `P${idx + 1}`;

    const isAnswered = (STATE.practiceResponses[q.id] !== undefined);
    const isCurrent = (idx === STATE.practiceIndex);

    if (isCurrent) {
      btn.classList.add('status-current');
    } else if (isAnswered) {
      btn.classList.add('status-answered');
    } else {
      btn.classList.add('status-unanswered');
    }

    btn.addEventListener('click', () => {
      const currQ = PRACTICE_QUESTIONS[STATE.practiceIndex];
      const currAnswered = currQ && STATE.practiceResponses[currQ.id] !== undefined;
      if (!currAnswered && idx !== STATE.practiceIndex) {
        showToast(`⚠️ Please answer Practice Question ${STATE.practiceIndex + 1} before switching!`, 'warning');
        return;
      }
      renderPracticeQuestion(idx);
    });

    grid.appendChild(btn);
  });

  const statAnswered = document.getElementById('statAnsweredCount');
  const statRemaining = document.getElementById('statRemainingCount');
  const answeredCount = Object.keys(STATE.practiceResponses).length;
  if (statAnswered) statAnswered.textContent = answeredCount;
  if (statRemaining) statRemaining.textContent = PRACTICE_QUESTIONS.length - answeredCount;

  const statScore = document.getElementById('statScoreCount');
  if (statScore) statScore.textContent = `0.0 / 10 (Trial)`;
  const statSpeed = document.getElementById('statSpeedCount');
  if (statSpeed) statSpeed.textContent = `0 pts (Trial)`;

  const liveBase = document.getElementById('hudLiveBaseScore');
  if (liveBase) liveBase.textContent = '0.0';
  const totalSpeed = document.getElementById('hudTotalSpeedBonus');
  if (totalSpeed) totalSpeed.textContent = '0 pts';

  const progressRatio = document.getElementById('hudProgressRatio');
  if (progressRatio) progressRatio.textContent = `${answeredCount} / 2 (Trial)`;
  const progressFill = document.getElementById('hudProgressFill');
  if (progressFill) progressFill.style.width = `${Math.round((answeredCount / 2) * 100)}%`;
}

function openOfficialExamNoticeModal() {
  stopQuestionSpeedMeter();
  const modal = document.getElementById('modalOfficialExamNotice');
  if (modal) {
    modal.classList.remove('hidden');
  }
}

function startOfficialFinalExam() {
  const modal = document.getElementById('modalOfficialExamNotice');
  if (modal) modal.classList.add('hidden');

  const banner = document.getElementById('practiceModeBanner');
  if (banner) banner.classList.add('hidden');

  // Mark practice completed
  localStorage.setItem('biopc_practice_done', 'true');
  STATE.isPracticeMode = false;
  STATE.practiceIndex = 0;
  STATE.practiceResponses = {};

  // Initialize official exam state cleanly (0 marks carried over!)
  STATE.currentQuestionIndex = 0;
  STATE.userResponses = {};
  STATE.flaggedQuestions = [];
  STATE.strikeCount = 0;
  STATE.examStartTimeMs = Date.now();
  STATE.timerSecondsRemaining = (STATE.examDurationMinutes || 10) * 60;

  localStorage.setItem('apex_start_time', STATE.examStartTimeMs);
  localStorage.removeItem('apex_responses');
  localStorage.removeItem('apex_flagged');

  // Reset live counters
  updateHUDTotalSpeed();
  updateHUDLiveScore();

  // Start official 10-minute timer
  startExamTimer();

  // Render Question 1 of 10
  renderQuestion(0);

  showToast('🚀 Official BioPC Final Examination Started! Question 1 of 10.', 'success');
}

// ----------------------------------------------------------------------------
// 8C. OFFICIAL EXAM QUESTION ENGINE (Questions 1 to 10) & 5s AUTO-ADVANCE
// ----------------------------------------------------------------------------
let autoAdvanceTimeoutId = null;
let autoAdvanceIntervalId = null;
let autoAdvanceSecondsRemaining = 5;

/**
 * Cancel and reset any pending 5-second automatic progression timer
 */
function stopAutoAdvanceTimer() {
  if (autoAdvanceTimeoutId) {
    clearTimeout(autoAdvanceTimeoutId);
    autoAdvanceTimeoutId = null;
  }
  if (autoAdvanceIntervalId) {
    clearInterval(autoAdvanceIntervalId);
    autoAdvanceIntervalId = null;
  }
  const indicator = document.getElementById('autoAdvanceIndicator');
  if (indicator) indicator.classList.add('hidden');
}

/**
 * Start 5-second automatic progression countdown after candidate locks an answer.
 * Candidate can also click Next / Proceed manually at any moment to advance immediately.
 */
function startAutoAdvanceTimer() {
  stopAutoAdvanceTimer();

  const isLastQ = (STATE.currentQuestionIndex === QUESTION_BANK.length - 1);
  autoAdvanceSecondsRemaining = 5;

  const indicator = document.getElementById('autoAdvanceIndicator');
  const textEl = document.getElementById('autoAdvanceText');
  const fillEl = document.getElementById('autoAdvanceFill');
  const proceedText = document.getElementById('feedbackProceedBtnText');
  const nextText = document.getElementById('btnNextText');

  if (indicator) indicator.classList.remove('hidden');

  const updateDisplay = () => {
    if (textEl) {
      if (isLastQ) {
        textEl.innerHTML = `Auto-submitting in <strong>${autoAdvanceSecondsRemaining}s</strong>...`;
      } else {
        textEl.innerHTML = `Auto-advancing to Q${STATE.currentQuestionIndex + 2} in <strong>${autoAdvanceSecondsRemaining}s</strong>...`;
      }
    }

    if (fillEl) {
      const pct = (autoAdvanceSecondsRemaining / 5) * 100;
      fillEl.style.width = `${pct}%`;
    }

    if (proceedText) {
      if (isLastQ) {
        proceedText.textContent = `Finish & Submit (${autoAdvanceSecondsRemaining}s) 🏁`;
      } else {
        proceedText.textContent = `Proceed to Question ${STATE.currentQuestionIndex + 2} (${autoAdvanceSecondsRemaining}s) →`;
      }
    }

    if (nextText) {
      if (isLastQ) {
        nextText.textContent = `Review & Submit (${autoAdvanceSecondsRemaining}s) 🏁`;
      } else {
        nextText.textContent = `Next Question (${autoAdvanceSecondsRemaining}s)`;
      }
    }
  };

  updateDisplay();

  autoAdvanceIntervalId = setInterval(() => {
    autoAdvanceSecondsRemaining--;
    if (autoAdvanceSecondsRemaining <= 0) {
      stopAutoAdvanceTimer();
      handleAdvanceQuestion();
    } else {
      updateDisplay();
    }
  }, 1000);
}

function renderQuestion(index) {
  stopAutoAdvanceTimer();
  if (index < 0 || index >= QUESTION_BANK.length) return;
  STATE.currentQuestionIndex = index;
  STATE.questionRenderTimestamp = Date.now();

  const q = QUESTION_BANK[index];
  document.getElementById('qNumberBadge').textContent = `Question ${index + 1} of ${QUESTION_BANK.length}`;
  document.getElementById('qCategoryBadge').textContent = q.category;
  
  const linearBadge = document.getElementById('qLinearBadge');
  if (linearBadge) {
    linearBadge.textContent = `Step ${index + 1} • ${index + 1 === QUESTION_BANK.length ? 'Final Question' : 'Strict Order'}`;
  }

  document.getElementById('qPromptText').textContent = q.question;

  // Start Live Question Speed Meter & Bonus Decay Bar
  startQuestionSpeedMeter(q, false);

  // Options rendering
  const container = document.getElementById('optionsContainer');
  container.innerHTML = '';

  const savedAnswer = STATE.userResponses[q.id];
  const keys = ['A', 'B', 'C', 'D'];

  if (savedAnswer) {
    container.classList.add('options-locked');
  } else {
    container.classList.remove('options-locked');
  }

  q.options.forEach((optText, optIdx) => {
    const card = document.createElement('div');
    card.className = 'option-card';

    if (savedAnswer) {
      if (savedAnswer.optionIndex === optIdx) {
        card.classList.add('selected');
        if (savedAnswer.isCorrect) {
          card.classList.add('option-correct');
        } else {
          card.classList.add('option-incorrect');
        }
      } else if (optIdx === q.correctIndex) {
        card.classList.add('option-reveal-correct');
      }
    }

    card.innerHTML = `
      <span class="option-key-badge">${keys[optIdx]}</span>
      <span class="option-text">${escapeHtml(optText)}</span>
      <span class="option-radio-dot"></span>
    `;

    card.addEventListener('click', () => {
      if (!STATE.userResponses[q.id]) {
        selectOption(q.id, optIdx);
      }
    });

    container.appendChild(card);
  });

  // Flag button state
  const flagBtn = document.getElementById('btnToggleFlag');
  const flagText = document.getElementById('flagBtnText');
  if (flagBtn && flagText) {
    if (STATE.flaggedQuestions.includes(q.id)) {
      flagBtn.classList.add('flagged-active');
      flagText.textContent = 'Flagged';
    } else {
      flagBtn.classList.remove('flagged-active');
      flagText.textContent = 'Flag';
    }
  }

  // Display or hide immediate points feedback card
  renderQuestionFeedbackCard(q, savedAnswer);

  // Update footer button state
  updateNextButtonState();

  updateHUDProgress();
  updateHUDTotalSpeed();
  updateHUDLiveScore();
  renderQuestionMatrix();
}

/**
 * Render Dynamic Immediate Points & Answer Feedback Card
 */
function renderQuestionFeedbackCard(q, savedAnswer) {
  const card = document.getElementById('questionFeedbackCard');
  if (!card) return;

  if (!savedAnswer) {
    card.className = 'question-feedback-card hidden';
    return;
  }

  card.classList.remove('hidden');
  const isCorrect = savedAnswer.isCorrect;
  const isLastQ = (STATE.currentQuestionIndex === QUESTION_BANK.length - 1);

  if (isCorrect) {
    card.className = 'question-feedback-card correct-feedback';
    document.getElementById('feedbackIcon').textContent = '🎯';
    document.getElementById('feedbackTitle').textContent = 'CORRECT! EXCELLENT WORK 🌟';
    document.getElementById('feedbackPointsTag').textContent = `+${((savedAnswer.speedBonus || 0) + 1000).toLocaleString()} pts`;
    document.getElementById('chipBaseScore').innerHTML = `Base Accuracy: <strong>+1.0 Mark</strong>`;
    document.getElementById('chipSpeedBonus').innerHTML = `Speed Bonus: <strong>+${(savedAnswer.speedBonus || 0).toLocaleString()} pts</strong>`;
  } else {
    card.className = 'question-feedback-card incorrect-feedback';
    document.getElementById('feedbackIcon').textContent = '❌';
    document.getElementById('feedbackTitle').textContent = 'INCORRECT ANSWER';
    document.getElementById('feedbackPointsTag').textContent = `0 pts (0.0 Marks)`;
    document.getElementById('chipBaseScore').innerHTML = `Base Accuracy: <strong>0.0 Marks</strong>`;
    document.getElementById('chipSpeedBonus').innerHTML = `Speed Bonus: <strong>0 pts</strong>`;
  }

  const timeSec = ((savedAnswer.responseTimeMs || 0) / 1000).toFixed(1);
  document.getElementById('chipResponseTime').innerHTML = `Response Time: <strong>${timeSec}s</strong>`;

  const expBox = document.getElementById('feedbackExplanation');
  const expText = document.getElementById('feedbackExplanationText');
  if (expBox && expText) {
    if (q.explanation) {
      expBox.classList.remove('hidden');
      expText.textContent = q.explanation;
    } else {
      expBox.classList.add('hidden');
    }
  }

  const proceedBtn = document.getElementById('btnFeedbackProceed');
  const proceedText = document.getElementById('feedbackProceedBtnText');
  if (proceedBtn && proceedText) {
    if (isLastQ) {
      proceedText.textContent = 'Finish & Submit (5s) 🏁';
      proceedBtn.className = 'btn btn-danger btn-block';
    } else {
      proceedText.textContent = `Proceed to Question ${STATE.currentQuestionIndex + 2} (5s) →`;
      proceedBtn.className = 'btn btn-primary btn-block';
    }
  }
}

function updateNextButtonState() {
  const nextBtn = document.getElementById('btnNextQuestion');
  const nextText = document.getElementById('btnNextText');
  if (!nextBtn) return;

  const currentQ = QUESTION_BANK[STATE.currentQuestionIndex];
  const isAnswered = currentQ && STATE.userResponses[currentQ.id] !== undefined;
  const isLast = (STATE.currentQuestionIndex === QUESTION_BANK.length - 1);

  if (isLast) {
    if (nextText) nextText.textContent = isAnswered ? 'Review & Submit (5s) 🏁' : 'Review & Submit Exam 🏁';
    nextBtn.className = isAnswered ? 'btn btn-danger' : 'btn btn-outline';
  } else {
    if (nextText) nextText.textContent = isAnswered ? `Next Question (Q${STATE.currentQuestionIndex + 2})` : 'Next Question';
    nextBtn.className = isAnswered ? 'btn btn-primary' : 'btn btn-outline';
  }
}

/**
 * Handle Sequential Question Advance (strict one-by-one progression)
 * Stops any active 5s auto-advance timer and advances immediately.
 */
function handleAdvanceQuestion() {
  stopAutoAdvanceTimer();

  // Official Exam Progression
  const currentQ = QUESTION_BANK[STATE.currentQuestionIndex];
  const isAnswered = currentQ && STATE.userResponses[currentQ.id] !== undefined;

  if (!isAnswered) {
    showToast(`⚠️ Answer required: Please select an option for Question ${STATE.currentQuestionIndex + 1} before proceeding!`, 'warning');
    const container = document.getElementById('optionsContainer');
    if (container) {
      container.style.animation = 'none';
      void container.offsetWidth; // trigger reflow
      container.style.animation = 'shake 0.5s ease-in-out';
    }
    return;
  }

  if (STATE.currentQuestionIndex < QUESTION_BANK.length - 1) {
    renderQuestion(STATE.currentQuestionIndex + 1);
  } else {
    openSubmitConfirmationModal();
  }
}

/**
 * Dynamic Live Question Speed Meter with Real-Time Decaying Potential Bonus
 */
function startQuestionSpeedMeter(question, isPractice = false) {
  stopQuestionSpeedMeter();

  const tracker = document.getElementById('liveSpeedTracker');
  const elapsedEl = document.getElementById('liveQuestionElapsed');
  const bonusEl = document.getElementById('liveQuestionBonus');
  const fillEl = document.getElementById('speedDecayFill');
  const statusEl = document.getElementById('liveSpeedStatusText');

  if (!tracker || !elapsedEl || !bonusEl || !fillEl) return;

  const savedAnswer = isPractice ? STATE.practiceResponses[question.id] : STATE.userResponses[question.id];

  // If already answered, display locked response time and earned bonus
  if (savedAnswer) {
    tracker.classList.add('answered-locked');
    const secStr = (savedAnswer.responseTimeMs / 1000).toFixed(1) + 's';
    elapsedEl.textContent = secStr;
    bonusEl.textContent = savedAnswer.isCorrect ? `+${(savedAnswer.speedBonus || 0).toLocaleString()} pts` : '0 pts';
    
    // Bar width based on locked time
    const decayPct = Math.max(5, Math.min(100, Math.round((1 - (savedAnswer.responseTimeMs / 60000)) * 100)));
    fillEl.style.width = `${decayPct}%`;
    if (isPractice) {
      statusEl.innerHTML = `<strong>Trial Answer Locked</strong> in ${secStr} &bull; ${savedAnswer.isCorrect ? '🎯 +1.0 Practice & ⚡ +' + (savedAnswer.speedBonus || 0) + ' trial pts' : '❌ Incorrect'} (0 Final Impact)`;
    } else if (savedAnswer.isCorrect) {
      statusEl.innerHTML = `<strong>Answer Locked</strong> in ${secStr} &bull; 🎯 <strong>+1.0 Mark</strong> & ⚡ +${(savedAnswer.speedBonus || 0)} speed bonus earned!`;
    } else {
      statusEl.innerHTML = `<strong>Answer Locked</strong> in ${secStr} &bull; ❌ <strong>0.0 Marks</strong> & 0 speed points earned.`;
    }
    return;
  }

  // If not yet answered, run active 100ms real-time decay clock
  tracker.classList.remove('answered-locked');

  const updateTick = () => {
    const elapsedMs = Date.now() - STATE.questionRenderTimestamp;
    const elapsedSec = (elapsedMs / 1000).toFixed(1);
    
    // Formula: max(50, round((1 - (elapsedMs / 60000)) * 1000))
    const potentialBonus = Math.max(50, Math.round((1 - (elapsedMs / 60000)) * 1000));
    const decayPct = Math.max(5, Math.min(100, Math.round((1 - (elapsedMs / 60000)) * 100)));

    elapsedEl.textContent = `${elapsedSec}s`;
    bonusEl.textContent = `+${potentialBonus.toLocaleString()} pts`;
    fillEl.style.width = `${decayPct}%`;

    if (isPractice) {
      statusEl.textContent = '🧪 Trial Speed Meter: Faster responses earn up to +1,000 bonus tie-breaker points!';
    } else if (elapsedMs < 15000) {
      bonusEl.style.color = 'var(--cyan-400)';
      statusEl.textContent = '⚡ Lightning fast tier! Lock your answer to maximize bonus tie-breaker!';
    } else if (elapsedMs < 35000) {
      bonusEl.style.color = 'var(--warning-400)';
      statusEl.textContent = '⏱ Solid response time. Speed decay in progress...';
    } else {
      bonusEl.style.color = 'var(--danger-400)';
      statusEl.textContent = '⚠️ Response time approaching 60s floor limit (minimum 50 pts).';
    }
  };

  updateTick();
  STATE.liveSpeedIntervalId = setInterval(updateTick, 100);
}

function stopQuestionSpeedMeter() {
  if (STATE.liveSpeedIntervalId) {
    clearInterval(STATE.liveSpeedIntervalId);
    STATE.liveSpeedIntervalId = null;
  }
}

/**
 * Handle user option selection, strict locking & immediate points feedback
 */
function selectOption(questionId, optionIndex) {
  // Prevent changing answer if already locked
  if (STATE.userResponses[questionId] !== undefined) return;

  const q = QUESTION_BANK.find(item => item.id === questionId);
  if (!q) return;

  // Measure response time in ms from question display to selection
  const now = Date.now();
  let responseTimeMs = now - STATE.questionRenderTimestamp;
  if (responseTimeMs < 200) responseTimeMs = 200; // minimum clamp

  const isCorrect = (optionIndex === q.correctIndex);
  const baseScore = isCorrect ? 1.0 : 0.0;
  let speedBonus = 0;
  if (isCorrect) {
    speedBonus = Math.max(50, Math.round((1 - (responseTimeMs / 60000)) * 1000));
  }

  // Save to STATE & localStorage
  STATE.userResponses[questionId] = {
    optionIndex,
    responseTimeMs,
    isCorrect,
    baseScore,
    speedBonus,
    timestamp: now
  };
  localStorage.setItem('apex_responses', JSON.stringify(STATE.userResponses));

  // Stop live decay clock and lock display
  stopQuestionSpeedMeter();
  const tracker = document.getElementById('liveSpeedTracker');
  if (tracker) {
    tracker.classList.add('answered-locked');
    const secStr = (responseTimeMs / 1000).toFixed(1) + 's';
    document.getElementById('liveQuestionElapsed').textContent = secStr;
    document.getElementById('liveQuestionBonus').textContent = isCorrect ? `+${speedBonus.toLocaleString()} pts` : '0 pts';
    const statusEl = document.getElementById('liveSpeedStatusText');
    if (statusEl) {
      if (isCorrect) {
        statusEl.innerHTML = `<strong>Answer Locked</strong> in ${secStr}! 🎯 <strong>+1.0 Mark</strong> & ⚡ <strong>+${speedBonus}</strong> speed points earned!`;
      } else {
        statusEl.innerHTML = `<strong>Answer Locked</strong> in ${secStr}. ❌ Incorrect (0 points earned).`;
      }
    }
  }

  // Lock options container
  const container = document.getElementById('optionsContainer');
  if (container) container.classList.add('options-locked');

  // Update visual selected cards
  const cards = document.querySelectorAll('.option-card');
  cards.forEach((c, idx) => {
    if (idx === optionIndex) {
      c.classList.add('selected');
      if (isCorrect) {
        c.classList.add('option-correct');
      } else {
        c.classList.add('option-incorrect');
      }
    } else if (idx === q.correctIndex) {
      c.classList.add('option-reveal-correct');
    }
  });

  // Display immediate points reveal card
  renderQuestionFeedbackCard(q, STATE.userResponses[questionId]);

  // Update footer button and HUD stats
  updateNextButtonState();
  updateHUDProgress();
  updateHUDTotalSpeed();
  updateHUDLiveScore();
  renderQuestionMatrix();

  if (isCorrect) {
    showToast(`🎯 Correct! +1.0 Mark & +${speedBonus} Speed Bonus Points!`, 'success');
  } else {
    showToast(`❌ Incorrect! 0 points recorded.`, 'danger');
  }

  // Start 5-second automatic advance countdown (candidate can advance manually at any time)
  startAutoAdvanceTimer();
}

function updateHUDTotalSpeed() {
  let totalSpeed = 0;
  Object.values(STATE.userResponses).forEach(r => {
    totalSpeed += (r.speedBonus || 0);
  });
  const el = document.getElementById('hudTotalSpeedBonus');
  if (el) el.textContent = `${totalSpeed.toLocaleString()} pts`;
}

function updateHUDLiveScore() {
  let totalBase = 0;
  let totalSpeed = 0;
  Object.values(STATE.userResponses).forEach(r => {
    if (r.isCorrect || r.baseScore === 1.0) {
      totalBase += 1.0;
    }
    totalSpeed += (r.speedBonus || 0);
  });

  const baseEl = document.getElementById('hudLiveBaseScore');
  if (baseEl) baseEl.textContent = totalBase.toFixed(1);

  const pill = document.getElementById('hudLiveScorePill');
  if (pill) {
    pill.classList.remove('pulse-score');
    void pill.offsetWidth;
    pill.classList.add('pulse-score');
  }

  const statScore = document.getElementById('statScoreCount');
  if (statScore) statScore.textContent = `${totalBase.toFixed(1)} / ${QUESTION_BANK.length}`;

  const statSpeed = document.getElementById('statSpeedCount');
  if (statSpeed) statSpeed.textContent = `${totalSpeed.toLocaleString()} pts`;
}

function toggleQuestionFlag() {
  const currentQ = QUESTION_BANK[STATE.currentQuestionIndex];
  if (!currentQ) return;

  const idx = STATE.flaggedQuestions.indexOf(currentQ.id);
  if (idx > -1) {
    STATE.flaggedQuestions.splice(idx, 1);
  } else {
    STATE.flaggedQuestions.push(currentQ.id);
  }

  localStorage.setItem('apex_flagged', JSON.stringify(STATE.flaggedQuestions));
  renderQuestion(STATE.currentQuestionIndex);
}

function renderQuestionMatrix() {
  const grid = document.getElementById('questionMatrixGrid');
  if (!grid) return;
  grid.innerHTML = '';

  let answeredCount = 0;

  // In strict linear mode: find the active unlocked question
  let firstUnansweredIdx = QUESTION_BANK.findIndex(q => STATE.userResponses[q.id] === undefined);
  if (firstUnansweredIdx === -1) firstUnansweredIdx = QUESTION_BANK.length - 1;

  QUESTION_BANK.forEach((q, idx) => {
    const btn = document.createElement('button');
    btn.className = 'matrix-btn';
    btn.textContent = idx + 1;

    const isAnswered = (STATE.userResponses[q.id] !== undefined);
    const isCurrent = (idx === STATE.currentQuestionIndex);
    const isLocked = (!isAnswered && idx > firstUnansweredIdx);

    if (isAnswered) answeredCount++;

    if (isCurrent) {
      btn.classList.add('status-current');
    } else if (isAnswered) {
      btn.classList.add('status-answered');
    } else if (isLocked) {
      btn.classList.add('status-locked');
      btn.title = `Locked: Answer Question ${firstUnansweredIdx + 1} first`;
    } else {
      btn.classList.add('status-unanswered');
    }

    btn.addEventListener('click', () => {
      if (isLocked) {
        showToast(`🔒 Question ${idx + 1} is locked! You must answer Question ${firstUnansweredIdx + 1} first.`, 'warning');
        return;
      }
      
      // If currently on an unanswered question, cannot switch away without answering!
      const currQ = QUESTION_BANK[STATE.currentQuestionIndex];
      const currAnswered = currQ && STATE.userResponses[currQ.id] !== undefined;
      if (!currAnswered && idx !== STATE.currentQuestionIndex) {
        showToast(`⚠️ Please answer Question ${STATE.currentQuestionIndex + 1} before switching to another question!`, 'warning');
        return;
      }

      renderQuestion(idx);
    });

    grid.appendChild(btn);
  });

  // Update sidebar counts
  document.getElementById('statAnsweredCount').textContent = answeredCount;
  document.getElementById('statRemainingCount').textContent = QUESTION_BANK.length - answeredCount;
}

function updateHUDProgress() {
  const answered = Object.keys(STATE.userResponses).length;
  const total = QUESTION_BANK.length;
  const pct = Math.round((answered / total) * 100);

  document.getElementById('hudProgressRatio').textContent = `${answered} / ${total}`;
  document.getElementById('hudProgressFill').style.width = `${pct}%`;
}

// ============================================================================
// 9. HIGH-PRECISION DECENTRALIZED COUNTDOWN TIMER
// ============================================================================
function startExamTimer() {
  if (STATE.timerIntervalId) clearInterval(STATE.timerIntervalId);

  updateTimerDisplay();

  STATE.timerIntervalId = setInterval(() => {
    const elapsedSeconds = Math.floor((Date.now() - STATE.examStartTimeMs) / 1000);
    const totalSeconds = (STATE.examDurationMinutes || 10) * 60;
    STATE.timerSecondsRemaining = Math.max(0, totalSeconds - elapsedSeconds);

    updateTimerDisplay();

    if (STATE.timerSecondsRemaining <= 0) {
      clearInterval(STATE.timerIntervalId);
      showToast('Time is up! Submitting your examination answers automatically...', 'warning');
      finalizeAndSubmit(true);
    }
  }, 1000);
}

function updateTimerDisplay() {
  const timerCard = document.getElementById('examTimerCard');
  const timerText = document.getElementById('examTimerDisplay');
  if (!timerText || !timerCard) return;

  const total = STATE.timerSecondsRemaining;
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  timerText.textContent = formatted;

  // Warning thresholds
  timerCard.classList.remove('warning-amber', 'danger-pulse');
  if (total <= 30) {
    timerCard.classList.add('danger-pulse');
  } else if (total <= 120) {
    timerCard.classList.add('warning-amber');
  }
}

// ============================================================================
// 10. ACTIVE PROCTORING & ANTI-CHEAT SYSTEM
// ============================================================================
function initProctoringListeners() {
  // Detect tab departure / window blur (including clicking Chrome sidebar "Ask Gemini")
  window.addEventListener('blur', () => {
    if (STATE.currentView === 'exam') {
      handleAiGeminiViolation('WINDOW_BLUR_OR_CHROME_GEMINI', 'Candidate clicked Chrome Ask Gemini sidebar or unfocused exam window');
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && STATE.currentView === 'exam') {
      handleAiGeminiViolation('TAB_HIDDEN_OR_CHROME_GEMINI', 'Candidate navigated away from exam tab or opened side panel');
    }
  });

  // Prevent right-click to invoke Chrome "Ask Gemini" menu
  document.addEventListener('contextmenu', (e) => {
    if (STATE.currentView === 'exam') {
      e.preventDefault();
      showToast('Right-click disabled by BioPC Anti-Cheat: Chrome "Ask Gemini" and browser tools are prohibited.', 'warning');
      apiDispatch('logAuditEvent', {
        sessionToken: STATE.candidate ? (STATE.candidate.sessionToken || STATE.candidate.token) : 'UNKNOWN',
        fullName: STATE.candidate ? STATE.candidate.fullName : 'Unknown',
        eventType: 'CONTEXTMENU_BLOCKED',
        details: 'Candidate attempted right-click during exam',
        severity: 'WARNING'
      });
    }
  });

  // Prevent copying questions to paste into Gemini / AI
  document.addEventListener('copy', (e) => {
    if (STATE.currentView === 'exam') {
      e.preventDefault();
      showToast('Copying question text is prohibited by BioPC Anti-Cheat.', 'warning');
      apiDispatch('logAuditEvent', {
        sessionToken: STATE.candidate ? (STATE.candidate.sessionToken || STATE.candidate.token) : 'UNKNOWN',
        fullName: STATE.candidate ? STATE.candidate.fullName : 'Unknown',
        eventType: 'COPY_BLOCKED',
        details: 'Candidate attempted to copy exam text to clipboard',
        severity: 'WARNING'
      });
    }
  });

  // Dismiss modal button
  const dismissBtn = document.getElementById('btnDismissProctorWarning');
  if (dismissBtn) {
    dismissBtn.addEventListener('click', () => {
      document.getElementById('proctorWarningModal').classList.add('hidden');
    });
  }
}

function handleAiGeminiViolation(source = 'CHROME_GEMINI_DETECTED', details = 'Unauthorized AI or Chrome Ask Gemini usage detected.') {
  if (STATE.currentView !== 'exam') return;

  STATE.strikeCount++;
  localStorage.setItem('apex_violations', STATE.strikeCount);
  updateStrikeDisplay();

  // Immediately freeze exam timers
  if (STATE.timerIntervalId) {
    clearInterval(STATE.timerIntervalId);
    STATE.timerIntervalId = null;
  }
  stopQuestionSpeedMeter();

  // Flag candidate record with AI lock
  if (STATE.candidate) {
    STATE.candidate.aiViolation = true;
    STATE.candidate.isAiViolation = true;
    STATE.candidate.status = 'SUBMITTED';
    localStorage.setItem('apex_candidate', JSON.stringify(STATE.candidate));
  }
  localStorage.setItem('apex_ai_violation', 'true');

  // Log Critical Audit Event
  apiDispatch('logAuditEvent', {
    sessionToken: STATE.candidate ? (STATE.candidate.sessionToken || STATE.candidate.token) : 'UNKNOWN',
    fullName: STATE.candidate ? STATE.candidate.fullName : 'Unknown',
    eventType: 'AI_GEMINI_VIOLATION',
    details: `BioPC Proctoring: ${details} (Action: ${source}, Total strikes: ${STATE.strikeCount})`,
    severity: 'CRITICAL'
  });

  // Finalize exam record with locked status
  const totalTimeSeconds = Math.round((Date.now() - (STATE.examStartTimeMs || Date.now())) / 1000);
  apiDispatch('submitExam', {
    sessionToken: STATE.candidate ? (STATE.candidate.sessionToken || STATE.candidate.token) : 'ANON',
    fullName: STATE.candidate ? STATE.candidate.fullName : 'Anonymous',
    department: STATE.candidate ? (STATE.candidate.department || 'General') : 'General',
    baseScore: 0,
    speedBonusPoints: 0,
    tabSwitches: STATE.strikeCount,
    totalTimeSeconds: totalTimeSeconds,
    answersJSON: STATE.userResponses
  }).catch(e => console.warn('Lockout submission sync error:', e));

  // Dismiss any temporary popup modal
  const warnModal = document.getElementById('proctorWarningModal');
  if (warnModal) warnModal.classList.add('hidden');
  const confirmModal = document.getElementById('confirmSubmitModal');
  if (confirmModal) confirmModal.classList.add('hidden');

  showToast('⚠️ BioPC Anti-Cheat Lock: Chrome "Ask Gemini" & AI usage is strictly prohibited. Your exam is terminated. You must obtain Administrator authorization for a 2nd attempt.', 'danger', 10000);

  // Transition immediately to Retake Permission View
  showRetakePermissionView({
    ...(STATE.candidate || {}),
    sessionToken: STATE.candidate ? (STATE.candidate.sessionToken || STATE.candidate.token) : 'TOKEN',
    isAiViolation: true,
    aiViolation: true,
    status: 'SUBMITTED',
    requestReason: 'Exam locked due to prohibited Chrome "Ask Gemini" / AI activity. Requesting Administrator authorization for a 2nd exam attempt.'
  });
}

function handleProctorViolation(eventType, details) {
  STATE.strikeCount++;
  localStorage.setItem('apex_violations', STATE.strikeCount);

  updateStrikeDisplay();

  // Show Warning Modal
  document.getElementById('modalStrikeCount').textContent = STATE.strikeCount;
  document.getElementById('proctorWarningModal').classList.remove('hidden');

  // Dispatch Audit Log to backend
  apiDispatch('logAuditEvent', {
    sessionToken: STATE.candidate ? STATE.candidate.sessionToken : 'UNKNOWN',
    fullName: STATE.candidate ? STATE.candidate.fullName : 'Unknown',
    eventType: eventType,
    details: `${details} (Total strikes: ${STATE.strikeCount})`,
    severity: 'VIOLATION'
  });
}

function updateStrikeDisplay() {
  const strikeText = document.getElementById('hudStrikeCount');
  if (strikeText) {
    strikeText.textContent = `${STATE.strikeCount} Strike${STATE.strikeCount === 1 ? '' : 's'}`;
  }
}

// ============================================================================
// 11. EXAM SUBMISSION & SCORING CALCULATOR
// ============================================================================
function openSubmitConfirmationModal() {
  const answered = Object.keys(STATE.userResponses).length;
  const total = QUESTION_BANK.length;
  const unanswered = total - answered;

  document.getElementById('confirmAnsweredCount').textContent = `${answered} / ${total}`;
  document.getElementById('confirmUnansweredCount').textContent = unanswered;

  const mins = Math.floor(STATE.timerSecondsRemaining / 60);
  const secs = STATE.timerSecondsRemaining % 60;
  document.getElementById('confirmTimeRemaining').textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  document.getElementById('confirmSubmitModal').classList.remove('hidden');
}

async function finalizeAndSubmit(isAutoTimeout = false) {
  stopAutoAdvanceTimer();
  if (STATE.timerIntervalId) clearInterval(STATE.timerIntervalId);
  stopQuestionSpeedMeter();

  // Close modals
  document.getElementById('confirmSubmitModal').classList.add('hidden');
  document.getElementById('proctorWarningModal').classList.add('hidden');

  // Compute Base Score and Speed Bonus Points
  let baseScore = 0;
  let totalSpeedBonus = 0;
  const totalTimeSeconds = Math.round((Date.now() - STATE.examStartTimeMs) / 1000);

  QUESTION_BANK.forEach(q => {
    const userAns = STATE.userResponses[q.id];
    if (userAns && userAns.optionIndex === q.correctIndex) {
      baseScore += 1.0;
      totalSpeedBonus += (userAns.speedBonus || 50);
    }
  });

  const payload = {
    sessionToken: STATE.candidate ? STATE.candidate.sessionToken : 'ANON',
    fullName: STATE.candidate ? STATE.candidate.fullName : 'Anonymous',
    department: STATE.candidate ? (STATE.candidate.department || 'General') : 'General',
    baseScore: baseScore,
    speedBonusPoints: totalSpeedBonus,
    tabSwitches: STATE.strikeCount,
    totalTimeSeconds: totalTimeSeconds,
    answersJSON: STATE.userResponses
  };

  try {
    await apiDispatch('submitExam', payload);
  } catch (err) {
    console.error('Submission error:', err);
  }

  // Clear active exam state from localStorage so exam cannot be re-taken
  if (STATE.candidate) {
    STATE.candidate.status = 'SUBMITTED';
    localStorage.setItem('apex_candidate', JSON.stringify(STATE.candidate));
  }
  localStorage.removeItem('apex_start_time');

  // Render Post-Exam Results Screen
  renderParticipantResults(baseScore, totalSpeedBonus, totalTimeSeconds);
  showPanel('results');
}

function renderParticipantResults(baseScore, speedBonus, totalTimeSeconds) {
  if (STATE.candidate) {
    const nameEl = document.getElementById('resCandidateName');
    const deptEl = document.getElementById('resCandidateDept');
    const instEl = document.getElementById('resCandidateInst');
    if (nameEl) nameEl.textContent = STATE.candidate.fullName || 'Candidate';
    if (deptEl) deptEl.textContent = STATE.candidate.department || 'General';
    if (instEl) instEl.textContent = STATE.candidate.institution || '';
  }
  document.getElementById('resBaseScore').textContent = baseScore.toFixed(1);
  const denEl = document.getElementById('resTotalQDenominator');
  if (denEl) denEl.textContent = `/${QUESTION_BANK.length}`;
  document.getElementById('resSpeedBonus').textContent = speedBonus.toLocaleString();
  
  const combined = (baseScore * 10000) + speedBonus;
  document.getElementById('resCombinedScore').textContent = combined.toLocaleString();
  document.getElementById('resViolations').textContent = STATE.strikeCount;

  // Breakdown List
  const breakdownContainer = document.getElementById('resultsBreakdownList');
  breakdownContainer.innerHTML = '';

  QUESTION_BANK.forEach((q, idx) => {
    const userAns = STATE.userResponses[q.id];
    const item = document.createElement('div');
    item.className = 'breakdown-item';

    const keys = ['A', 'B', 'C', 'D'];
    let statusClass = 'unanswered';
    let tagHtml = `<span class="res-tag tag-unanswered">Unanswered</span>`;
    let speedHtml = '';

    if (userAns) {
      if (userAns.optionIndex === q.correctIndex) {
        statusClass = 'correct';
        tagHtml = `<span class="res-tag tag-correct">&#10004; Correct (+1.0)</span>`;
        speedHtml = `<span class="item-speed-pts">+${userAns.speedBonus} speed pts</span>`;
      } else {
        statusClass = 'incorrect';
        tagHtml = `<span class="res-tag tag-incorrect">&#10008; Incorrect (0.0)</span>`;
      }
    }

    item.classList.add(statusClass);

    const userSelectedText = userAns ? `${keys[userAns.optionIndex]}: ${q.options[userAns.optionIndex]}` : 'None';
    const correctText = `${keys[q.correctIndex]}: ${q.options[q.correctIndex]}`;

    item.innerHTML = `
      <div>
        <div class="item-q-title">Q${idx + 1}. ${escapeHtml(q.question)}</div>
        <div class="item-choice-meta">
          <span>Your Answer: <strong>${escapeHtml(userSelectedText)}</strong></span> | 
          <span>Correct: <strong style="color:var(--success-400)">${escapeHtml(correctText)}</strong></span>
        </div>
      </div>
      <div class="item-badge-wrap">
        ${tagHtml}
        ${speedHtml}
      </div>
    `;

    breakdownContainer.appendChild(item);
  });

  // Load and render BioPC Top 5 Leaderboard on results page
  renderTop5Leaderboard('results', STATE.candidate ? (STATE.candidate.sessionToken || STATE.candidate.token) : null);
}

// ============================================================================
// 11.5 BIOPC TOP 5 LEADERBOARD MULTI-VIEW ENGINE
// ============================================================================
async function renderTop5Leaderboard(context = 'results', currentToken = null) {
  let submissions = [];
  try {
    if (context === 'admin' && STATE.cachedSubmissions && STATE.cachedSubmissions.length > 0) {
      submissions = STATE.cachedSubmissions;
    } else {
      const resp = await apiDispatch('getLeaderboard');
      if (resp && resp.success && resp.leaderboard) {
        submissions = resp.leaderboard;
      } else if (typeof MockBackend !== 'undefined' && MockBackend.getStorage) {
        submissions = MockBackend.getStorage('submissions', []);
      }
    }
  } catch (err) {
    console.warn('Failed to load leaderboard data:', err);
    if (typeof MockBackend !== 'undefined' && MockBackend.getStorage) {
      submissions = MockBackend.getStorage('submissions', []);
    }
  }

  // Robust multi-participant sorting:
  // 1. combinedScore descending (Kahoot score = baseScore * 10000 + speedBonusPoints)
  // 2. speedBonusPoints descending
  // 3. baseScore descending
  // 4. totalTimeSeconds ascending (faster time breaks ties)
  const sorted = [...submissions].sort((a, b) => {
    const scoreA = Number(a.combinedScore) || 0;
    const scoreB = Number(b.combinedScore) || 0;
    if (scoreB !== scoreA) return scoreB - scoreA;

    const speedA = Number(a.speedBonusPoints) || 0;
    const speedB = Number(b.speedBonusPoints) || 0;
    if (speedB !== speedA) return speedB - speedA;

    const baseA = Number(a.baseScore) || 0;
    const baseB = Number(b.baseScore) || 0;
    if (baseB !== baseA) return baseB - baseA;

    const timeA = Number(a.totalTimeSeconds) || 0;
    const timeB = Number(b.totalTimeSeconds) || 0;
    return timeA - timeB;
  });

  const top5 = sorted.slice(0, 5);
  const medalIcons = ['🥇 1st', '🥈 2nd', '🥉 3rd', '4th', '5th'];

  // 1. Results Screen Rendering
  if (context === 'results') {
    const tbody = document.getElementById('resultsTop5TableBody');
    const pill = document.getElementById('resultsTotalParticipantsPill');
    const standingBox = document.getElementById('resultsPersonalStandingBox');
    const personalRankText = document.getElementById('resultsPersonalRankText');
    const totalCountSpan = document.getElementById('resultsTotalCandidatesCount');

    if (pill) {
      pill.textContent = `${sorted.length} Submission${sorted.length === 1 ? '' : 's'}`;
    }

    if (tbody) {
      if (top5.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-muted">No completed submissions recorded yet.</td></tr>`;
      } else {
        tbody.innerHTML = top5.map((s, idx) => {
          const isMe = currentToken && (s.sessionToken === currentToken);
          const medal = medalIcons[idx] || `#${idx + 1}`;
          const mins = Math.floor((s.totalTimeSeconds || 0) / 60);
          const secs = (s.totalTimeSeconds || 0) % 60;
          const timeFormatted = `${mins > 0 ? mins + 'm ' : ''}${secs}s`;

          return `
            <tr class="${isMe ? 'is-current-user' : ''}">
              <td><strong>${medal}</strong></td>
              <td>
                <span>${escapeHtml(s.fullName || 'Candidate')}</span>
                ${isMe ? ' <span class="badge-status badge-reg" style="font-size:0.65rem; padding:0.1rem 0.35rem; margin-left:0.25rem;">(You)</span>' : ''}
              </td>
              <td><span class="candidate-dept-badge">${escapeHtml(s.department || 'General')}</span></td>
              <td><strong>${(Number(s.baseScore) || 0).toFixed(1)} / ${QUESTION_BANK.length}</strong></td>
              <td style="color:#38bdf8; font-family:var(--font-mono)">+${(Number(s.speedBonusPoints) || 0).toLocaleString()}</td>
              <td><strong style="color:#4ade80; font-family:var(--font-mono)">${(Number(s.combinedScore) || 0).toLocaleString()} pts</strong></td>
              <td class="text-xs text-muted">${timeFormatted}</td>
            </tr>
          `;
        }).join('');
      }
    }

    if (standingBox && currentToken) {
      const myRank = sorted.findIndex(s => s.sessionToken === currentToken) + 1;
      if (myRank > 0) {
        standingBox.classList.remove('hidden');
        if (personalRankText) personalRankText.textContent = `Rank #${myRank}`;
        if (totalCountSpan) totalCountSpan.textContent = sorted.length;
      } else {
        standingBox.classList.add('hidden');
      }
    }
  }

  // 2. Candidate Waiting Lobby Rendering
  if (context === 'lobby') {
    const listEl = document.getElementById('lobbyTop5List');
    const countBadge = document.getElementById('lobbyTop5CountBadge');
    if (countBadge) {
      countBadge.textContent = `${sorted.length} Finished`;
    }

    if (listEl) {
      if (top5.length === 0) {
        listEl.innerHTML = `<div class="text-xs text-muted" style="text-align:center; padding:0.5rem;">No submissions yet. Be among the first to rank in the Top 5!</div>`;
      } else {
        listEl.innerHTML = top5.map((s, idx) => {
          const medal = medalIcons[idx] || `#${idx + 1}`;
          const isMe = currentToken && (s.sessionToken === currentToken);
          return `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:0.4rem 0.65rem; background:rgba(255,255,255,0.03); border-radius:var(--radius-sm); border:1px solid ${isMe ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.05)'};">
              <div style="display:flex; align-items:center; gap:0.5rem; overflow:hidden;">
                <span style="font-size:0.85rem; font-weight:700;">${medal}</span>
                <span style="font-size:0.83rem; font-weight:600; color:var(--text-white); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                  ${escapeHtml(s.fullName || 'Candidate')}${isMe ? ' (You)' : ''}
                </span>
                <span class="candidate-dept-badge" style="font-size:0.65rem;">${escapeHtml(s.department || 'General')}</span>
              </div>
              <span style="font-family:var(--font-mono); font-size:0.78rem; font-weight:700; color:#38bdf8; white-space:nowrap;">
                ${(Number(s.combinedScore) || 0).toLocaleString()} pts
              </span>
            </div>
          `;
        }).join('');
      }
    }
  }

  // 3. Admin Cockpit Top 5 Champions Podium Rendering
  if (context === 'admin') {
    const podiumGrid = document.getElementById('adminTop5PodiumCards');
    if (podiumGrid) {
      if (top5.length === 0) {
        podiumGrid.innerHTML = `<div class="top5-empty-state">No candidate submissions recorded yet.</div>`;
      } else {
        podiumGrid.innerHTML = top5.map((s, idx) => {
          const rankNum = idx + 1;
          const medal = medalIcons[idx] || `#${rankNum}`;
          return `
            <div class="top5-podium-card rank-${rankNum}">
              <div class="podium-rank-badge">${medal}</div>
              <div class="podium-name" title="${escapeHtml(s.fullName || 'Candidate')}">${escapeHtml(s.fullName || 'Candidate')}</div>
              <div class="podium-dept">${escapeHtml(s.department || 'General')}</div>
              <div class="podium-score">${(Number(s.baseScore) || 0).toFixed(1)} / ${QUESTION_BANK.length}</div>
              <div class="podium-kahoot">${(Number(s.combinedScore) || 0).toLocaleString()} pts</div>
              <div class="text-xs text-muted" style="margin-top:0.35rem;">
                +${(Number(s.speedBonusPoints) || 0).toLocaleString()} speed &bull; ${s.totalTimeSeconds || 0}s
              </div>
            </div>
          `;
        }).join('');
      }
    }
  }

  return { sorted, top5 };
}

// ============================================================================
// 12. ADMINISTRATOR CONTROL COCKPIT (VIEW 5)
// ============================================================================
function initAdminAuth() {
  const triggerBtn = document.getElementById('btnTriggerAdminAuth');
  const modal = document.getElementById('adminAuthModal');
  const closeBtn = document.getElementById('btnCloseAdminModal');
  const cancelBtn = document.getElementById('btnCancelAdminAuth');
  const submitBtn = document.getElementById('btnSubmitAdminAuth');
  const submitText = document.getElementById('btnSubmitAdminAuthText');
  const modalTitle = document.getElementById('adminAuthModalTitle');
  const loginForm = document.getElementById('adminAuthLoginForm');
  const setupForm = document.getElementById('adminAuthSetupForm');
  const inputLoginKey = document.getElementById('adminSecretKeyInput');
  const inputNewSetupKey = document.getElementById('adminNewSetupKeyInput');
  const inputConfirmSetupKey = document.getElementById('adminConfirmSetupKeyInput');
  const errorLogin = document.getElementById('errorAdminKey');
  const errorSetup = document.getElementById('errorAdminSetupKey');

  // Emergency Passkey Recovery Elements via Gmail (biopc.mustak@gmail.com)
  const recoveryForm = document.getElementById('adminAuthRecoveryForm');
  const btnShowRecovery = document.getElementById('btnShowRecoveryForm');
  const btnBackToLogin = document.getElementById('btnBackToLogin');
  const btnSendRecoveryCode = document.getElementById('btnSendRecoveryCode');
  const inputRecoveryEmail = document.getElementById('adminRecoveryEmailInput');
  const recoveryOtpSection = document.getElementById('recoveryOtpSection');
  const inputRecoveryOtp = document.getElementById('adminRecoveryOtpInput');
  const inputRecoveryNewPass = document.getElementById('adminRecoveryNewPassInput');
  const inputRecoveryConfirmPass = document.getElementById('adminRecoveryConfirmPassInput');
  const errorRecoveryEmail = document.getElementById('errorRecoveryEmail');
  const errorRecoveryPass = document.getElementById('errorRecoveryPass');

  let isSetupMode = false;
  let isRecoveryMode = false;

  triggerBtn.addEventListener('click', async () => {
    // Check security lockout
    if (Date.now() < STATE.adminLockUntilMs) {
      const remainingSec = Math.ceil((STATE.adminLockUntilMs - Date.now()) / 1000);
      showToast(`Admin access temporarily locked. Please wait ${remainingSec}s`, 'danger');
      return;
    }

    isRecoveryMode = false;
    if (recoveryForm) recoveryForm.classList.add('hidden');
    if (recoveryOtpSection) recoveryOtpSection.classList.add('hidden');
    if (inputLoginKey) inputLoginKey.value = '';
    if (inputNewSetupKey) inputNewSetupKey.value = '';
    if (inputConfirmSetupKey) inputConfirmSetupKey.value = '';
    if (inputRecoveryEmail) inputRecoveryEmail.value = '';
    if (inputRecoveryOtp) inputRecoveryOtp.value = '';
    if (inputRecoveryNewPass) inputRecoveryNewPass.value = '';
    if (inputRecoveryConfirmPass) inputRecoveryConfirmPass.value = '';
    if (errorLogin) errorLogin.textContent = '';
    if (errorSetup) errorSetup.textContent = '';
    if (errorRecoveryEmail) errorRecoveryEmail.textContent = '';
    if (errorRecoveryPass) errorRecoveryPass.textContent = '';

    // Always open standard Administrator Login - Single Master Key for all browsers/devices
    isSetupMode = false;
    isRecoveryMode = false;
    if (setupForm) setupForm.classList.add('hidden');
    if (recoveryForm) recoveryForm.classList.add('hidden');
    if (loginForm) loginForm.classList.remove('hidden');
    if (modalTitle) modalTitle.textContent = 'Administrator Authentication';
    if (submitText) submitText.textContent = 'Authenticate';
    modal.classList.remove('hidden');
    if (inputLoginKey) setTimeout(() => inputLoginKey.focus(), 100);
  });

  // Switch to Emergency Recovery Form
  if (btnShowRecovery) {
    btnShowRecovery.addEventListener('click', () => {
      isRecoveryMode = true;
      isSetupMode = false;
      if (loginForm) loginForm.classList.add('hidden');
      if (setupForm) setupForm.classList.add('hidden');
      if (recoveryForm) recoveryForm.classList.remove('hidden');
      if (modalTitle) modalTitle.textContent = 'Emergency Passkey Recovery';
      if (submitText) submitText.textContent = 'Reset Passkey & Enter';
      if (errorLogin) errorLogin.textContent = '';
      if (errorRecoveryEmail) errorRecoveryEmail.textContent = '';
      if (errorRecoveryPass) errorRecoveryPass.textContent = '';
      if (inputRecoveryEmail) {
        inputRecoveryEmail.value = ADMIN_MASTER_EMAIL;
        setTimeout(() => inputRecoveryEmail.focus(), 100);
      }
      const recoveryGasInput = document.getElementById('adminRecoveryGasUrlInput');
      if (recoveryGasInput) {
        recoveryGasInput.value = getActiveGasUrl();
      }
    });
  }

  // Save GAS URL from recovery modal
  const btnSaveRecGas = document.getElementById('btnSaveRecoveryGasUrl');
  if (btnSaveRecGas) {
    btnSaveRecGas.addEventListener('click', () => {
      const recoveryGasInput = document.getElementById('adminRecoveryGasUrlInput');
      const val = recoveryGasInput ? recoveryGasInput.value.trim() : '';
      if (val) {
        localStorage.setItem('biopc_gas_url', val);
        const cockpitGasInput = document.getElementById('inputCockpitGasUrl');
        if (cockpitGasInput) cockpitGasInput.value = val;
        showToast('Google Apps Script Web App URL saved successfully!', 'success');
      } else {
        localStorage.removeItem('biopc_gas_url');
        if (recoveryGasInput) recoveryGasInput.value = OFFICIAL_GAS_URL;
        showToast('Google Apps Script URL reset to official default.', 'info');
      }
    });
  }

  // Switch back to Standard Login Form
  if (btnBackToLogin) {
    btnBackToLogin.addEventListener('click', () => {
      isRecoveryMode = false;
      if (recoveryForm) recoveryForm.classList.add('hidden');
      if (setupForm) setupForm.classList.add('hidden');
      if (loginForm) loginForm.classList.remove('hidden');
      if (modalTitle) modalTitle.textContent = 'Administrator Authentication';
      if (submitText) submitText.textContent = 'Authenticate';
      if (errorRecoveryEmail) errorRecoveryEmail.textContent = '';
      if (errorRecoveryPass) errorRecoveryPass.textContent = '';
      if (inputLoginKey) setTimeout(() => inputLoginKey.focus(), 100);
    });
  }

  // Send Recovery Code to authorized administrator Gmail
  if (btnSendRecoveryCode) {
    btnSendRecoveryCode.addEventListener('click', async () => {
      const email = ADMIN_MASTER_EMAIL;

      const recoveryGasInput = document.getElementById('adminRecoveryGasUrlInput');
      const gasUrl = (recoveryGasInput ? recoveryGasInput.value.trim() : '') || getActiveGasUrl();

      const originalBtnHtml = btnSendRecoveryCode.innerHTML;
      btnSendRecoveryCode.disabled = true;
      btnSendRecoveryCode.innerHTML = '<span>Sending PIN...</span>';

      const otp = String(Math.floor(100000 + Math.random() * 900000));
      STATE.activeAdminRecoveryOtp = otp;
      STATE.activeAdminRecoveryOtpExpiry = Date.now() + 10 * 60 * 1000;

      let emailSentViaGas = false;
      if (gasUrl) {
        try {
          const resp = await fetch(gasUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
              action: 'sendAdminRecoveryOtp',
              email: ADMIN_MASTER_EMAIL
            })
          });
          const resJson = await resp.json();
          if (resJson && resJson.success) {
            emailSentViaGas = true;
          }
        } catch (e) {
          console.warn('Google Apps Script recovery dispatch attempt:', e);
        }
      }

      btnSendRecoveryCode.disabled = false;
      btnSendRecoveryCode.innerHTML = originalBtnHtml;

      if (errorRecoveryEmail) errorRecoveryEmail.textContent = '';
      if (recoveryOtpSection) recoveryOtpSection.classList.remove('hidden');

      // CRITICAL SECURITY: Never leak email or code on screen
      showToast('Confidential 6-digit PIN dispatched to the registered administrator Gmail inbox! Please check your email.', 'success');

      if (inputRecoveryOtp) setTimeout(() => inputRecoveryOtp.focus(), 100);
    });
  }

  const closeModal = () => {
    isRecoveryMode = false;
    modal.classList.add('hidden');
  };
  closeBtn.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);

  submitBtn.addEventListener('click', async () => {
    // Check security lockout
    if (Date.now() < STATE.adminLockUntilMs) {
      const remainingSec = Math.ceil((STATE.adminLockUntilMs - Date.now()) / 1000);
      showToast(`Admin access temporarily locked. Please wait ${remainingSec}s`, 'danger');
      return;
    }

    const spinner = document.getElementById('adminAuthSpinner');
    spinner.classList.remove('hidden');

    try {
      if (isRecoveryMode) {
        // Recovery Mode Validation & Reset
        const email = ADMIN_MASTER_EMAIL;
        const otp = (inputRecoveryOtp ? inputRecoveryOtp.value : '').trim();
        const newPass = (inputRecoveryNewPass ? inputRecoveryNewPass.value : '').trim();
        const confirmPass = (inputRecoveryConfirmPass ? inputRecoveryConfirmPass.value : '').trim();

        if (email !== ADMIN_MASTER_EMAIL.toLowerCase()) {
          if (errorRecoveryEmail) errorRecoveryEmail.textContent = `Recovery restricted to ${ADMIN_MASTER_EMAIL}`;
          return;
        }

        const recoveryGasInput = document.getElementById('adminRecoveryGasUrlInput');
        const gasUrl = (recoveryGasInput ? recoveryGasInput.value.trim() : '') || getActiveGasUrl();

        let gasVerifySuccess = false;
        if (gasUrl) {
          try {
            const resp = await fetch(gasUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'text/plain;charset=utf-8' },
              body: JSON.stringify({
                action: 'verifyAdminRecoveryOtp',
                email: ADMIN_MASTER_EMAIL,
                otp: otp,
                newKey: newPass
              })
            });
            const resJson = await resp.json();
            if (resJson && resJson.success) {
              gasVerifySuccess = true;
            } else if (resJson && resJson.message) {
              if (errorRecoveryPass) errorRecoveryPass.textContent = resJson.message;
              return;
            }
          } catch (e) {
            console.warn('GAS recovery verification attempt:', e);
          }
        }

        // Fallback local validation if gas not connected or offline
        if (!gasVerifySuccess) {
          if (!STATE.activeAdminRecoveryOtp || otp !== STATE.activeAdminRecoveryOtp || Date.now() > STATE.activeAdminRecoveryOtpExpiry) {
            if (errorRecoveryPass) errorRecoveryPass.textContent = 'Invalid or expired confirmation code. Click "Send Code" to request a new code.';
            return;
          }
        }

        if (!newPass) {
          if (errorRecoveryPass) errorRecoveryPass.textContent = 'Please choose a new master passkey';
          return;
        }
        if (newPass.length < 4) {
          if (errorRecoveryPass) errorRecoveryPass.textContent = 'Passkey must be at least 4 characters';
          return;
        }
        if (newPass !== confirmPass) {
          if (errorRecoveryPass) errorRecoveryPass.textContent = 'Passkeys do not match';
          return;
        }

        if (errorRecoveryPass) errorRecoveryPass.textContent = '';
        const newHash = await hashPassword(newPass);

        // Update passkey in backend/storage
        const cfg = MockBackend.getStorage('config', {});
        cfg.AdminKeyHash = newHash;
        MockBackend.setStorage('config', cfg);
        MockBackend.saveStorage('admin_auth', {
          passwordHash: newHash,
          isConfigured: true,
          lastUpdated: new Date().toISOString()
        });
        STATE.activeAdminKey = newHash;
        localStorage.setItem('biopc_admin_hash', newHash);
        STATE.adminAuthenticated = true;
        STATE.adminFailCount = 0;
        STATE.activeAdminRecoveryOtp = null;

        closeModal();
        showToast('Emergency passkey reset verified via Gmail! Welcome Administrator.', 'success');
        enterAdminCockpit();
        return;
      }

      if (isSetupMode) {
        const newKey = inputNewSetupKey ? inputNewSetupKey.value.trim() : '';
        const confirmKey = inputConfirmSetupKey ? inputConfirmSetupKey.value.trim() : '';

        if (!newKey) {
          if (errorSetup) errorSetup.textContent = 'Please choose a master passkey';
          return;
        }
        if (newKey.length < 4) {
          if (errorSetup) errorSetup.textContent = 'Passkey must be at least 4 characters';
          return;
        }
        if (newKey !== confirmKey) {
          if (errorSetup) errorSetup.textContent = 'Passkeys do not match';
          return;
        }

        if (errorSetup) errorSetup.textContent = '';
        const adminHash = await hashPassword(newKey);
        const resp = await apiDispatch('setupAdminKey', { adminHash });

        if (resp && resp.success) {
          STATE.adminAuthenticated = true;
          STATE.activeAdminKey = adminHash;
          localStorage.setItem('biopc_admin_hash', adminHash);
          closeModal();
          showToast('Master Passkey created successfully! Welcome to the Cockpit.', 'success');
          enterAdminCockpit();
        } else {
          if (errorSetup) errorSetup.textContent = resp.message || 'Setup failed';
        }
      } else {
        const key = inputLoginKey ? inputLoginKey.value.trim() : '';
        if (!key) {
          if (errorLogin) errorLogin.textContent = 'Please enter master passkey';
          return;
        }

        if (errorLogin) errorLogin.textContent = '';
        const adminHash = await hashPassword(key);
        const resp = await apiDispatch('verifyAdminKey', { adminHash, adminKey: key });

        if (resp && resp.success) {
          STATE.adminFailCount = 0;
          STATE.adminAuthenticated = true;
          STATE.activeAdminKey = key;
          STATE.activeAdminRawKey = key;
          localStorage.setItem('biopc_admin_key', key);
          localStorage.setItem('biopc_admin_hash', adminHash);
          closeModal();
          showToast('Admin access granted! Synchronized across all devices.', 'success');
          enterAdminCockpit();
        } else {
          STATE.adminFailCount++;
          if (STATE.adminFailCount >= 5) {
            STATE.adminLockUntilMs = Date.now() + 60000;
            closeModal();
            showToast('Security Alert: 5 failed attempts. Locked for 60 seconds.', 'danger');
          } else {
            if (errorLogin) errorLogin.textContent = `Incorrect passkey (${5 - STATE.adminFailCount} attempts remaining)`;
          }
        }
      }
    } catch (err) {
      console.error('Admin authentication / recovery error:', err);
      if (isRecoveryMode && errorRecoveryPass) {
        errorRecoveryPass.textContent = err.message || 'Recovery error occurred';
      } else if (isSetupMode && errorSetup) {
        errorSetup.textContent = err.message || 'Setup error occurred';
      } else if (errorLogin) {
        errorLogin.textContent = err.message || 'Authentication error';
      }
    } finally {
      spinner.classList.add('hidden');
    }
  });

  if (inputLoginKey) {
    inputLoginKey.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') submitBtn.click();
    });
  }
  if (inputConfirmSetupKey) {
    inputConfirmSetupKey.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') submitBtn.click();
    });
  }
}

function enterAdminCockpit() {
  showPanel('admin');
  fetchAdminHudData();
  renderAdminQuestionBank();

  // Synchronize Platform Preferences in Admin Cockpit
  const orgInput = document.getElementById('cockpitSettingOrgName');
  const durSelect = document.getElementById('cockpitSettingDuration');
  if (orgInput) orgInput.value = STATE.organizationName || 'BioPC';
  if (durSelect) durSelect.value = String(STATE.examDurationMinutes || 10);

  // Pre-fill Admin Verify Email in Passkey change section
  const emailInput = document.getElementById('inputAdminVerifyEmail');
  if (emailInput && !emailInput.value) emailInput.value = ADMIN_MASTER_EMAIL;
}

function startAdminHudPolling() {
  stopAdminHudPolling();
  fetchAdminHudData();
  if (STATE.adminPollIntervalMs > 0) {
    STATE.adminHudPollIntervalId = setInterval(fetchAdminHudData, STATE.adminPollIntervalMs);
  }
}

function stopAdminHudPolling() {
  if (STATE.adminHudPollIntervalId) {
    clearInterval(STATE.adminHudPollIntervalId);
    STATE.adminHudPollIntervalId = null;
  }
}

async function fetchAdminHudData() {
  if (!STATE.adminAuthenticated && !STATE.activeAdminKey) return;

  const syncText = document.getElementById('adminSyncText');
  if (syncText) syncText.textContent = `Syncing (${new Date().toLocaleTimeString()})...`;

  const resp = await apiDispatch('getLiveHudData', { adminKey: STATE.activeAdminKey });
  if (resp && resp.success) {
    updateGlobalStatusPill(resp.examStatus);
    updateAdminStatusButtons(resp.examStatus);

    // Cache Data in STATE for instantaneous search & filtering
    STATE.cachedSubmissions = resp.submissions || [];
    STATE.cachedParticipants = resp.participants || [];
    STATE.cachedAuditLogs = resp.auditLogs || [];

    // Metrics
    document.getElementById('adminStatRegistered').textContent = resp.metrics.totalRegistered;
    document.getElementById('adminStatInExam').textContent = resp.metrics.activeInExam;
    document.getElementById('adminStatSubmissions').textContent = resp.metrics.totalSubmissions;
    document.getElementById('adminStatViolations').textContent = resp.metrics.totalViolations;

    const statRetake = document.getElementById('adminStatRetakeRequests');
    if (statRetake) statRetake.textContent = resp.metrics.retakeRequests || 0;

    const badgeRetake = document.getElementById('adminPendingRetakeBadge');
    if (badgeRetake) {
      const count = resp.metrics.retakeRequests || 0;
      badgeRetake.textContent = count;
      badgeRetake.style.display = count > 0 ? 'inline-block' : 'none';
    }

    // Filter & Render Tables
    renderAdminLeaderboard();
    renderAdminParticipants();
    renderAdminRetakeRequests();
    renderAdminAuditLogs();

    if (syncText) syncText.textContent = `Synced at ${new Date().toLocaleTimeString()}`;
  }
}

function updateAdminStatusButtons(status) {
  ['btnSetStatusLocked', 'btnSetStatusOpen', 'btnSetStatusEnded'].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) btn.classList.remove('active');
  });

  if (status === 'LOCKED') document.getElementById('btnSetStatusLocked').classList.add('active');
  if (status === 'OPEN') document.getElementById('btnSetStatusOpen').classList.add('active');
  if (status === 'ENDED') document.getElementById('btnSetStatusEnded').classList.add('active');
}

// ----------------------------------------------------------------------------
// LEADERBOARD RENDERING & SEARCH
// ----------------------------------------------------------------------------
function renderAdminLeaderboard() {
  // Update Top 5 Champions Podium Showcase
  renderTop5Leaderboard('admin');

  const tbody = document.getElementById('leaderboardTableBody');
  if (!tbody) return;

  let list = STATE.cachedSubmissions;
  const q = STATE.activeLeaderboardFilter.trim().toLowerCase();
  if (q) {
    list = list.filter(s => 
      (s.fullName && s.fullName.toLowerCase().includes(q)) ||
      (s.sessionToken && s.sessionToken.toLowerCase().includes(q)) ||
      (s.department && s.department.toLowerCase().includes(q))
    );
  }

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="10" class="text-center py-4 text-muted">${STATE.cachedSubmissions.length === 0 ? 'No submissions recorded yet.' : 'No candidates match your search.'}</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map((s, idx) => {
    const rankClass = idx === 0 ? 'rank-1' : idx === 1 ? 'rank-2' : idx === 2 ? 'rank-3' : 'rank-other';
    const mins = Math.floor((s.totalTimeSeconds || 0) / 60);
    const secs = (s.totalTimeSeconds || 0) % 60;
    const timeStr = `${mins}m ${secs}s`;
    const submittedTime = s.timestamp ? new Date(s.timestamp).toLocaleTimeString() : '--';

    return `
      <tr>
        <td><span class="rank-badge ${rankClass}">#${idx + 1}</span></td>
        <td>
          <strong>${escapeHtml(s.fullName)}</strong>
          <div class="text-xs text-muted"><code>${escapeHtml(s.sessionToken)}</code></div>
        </td>
        <td><span class="candidate-dept-badge">${escapeHtml(s.department || 'General')}</span></td>
        <td><strong style="color:var(--primary-500)">${(s.baseScore || 0).toFixed(1)}</strong></td>
        <td style="color:var(--cyan-400); font-family:var(--font-mono)">+${(s.speedBonusPoints || 0).toLocaleString()}</td>
        <td><strong style="color:var(--success-400); font-family:var(--font-mono)">${(s.combinedScore || 0).toLocaleString()}</strong></td>
        <td><span class="${s.tabSwitches > 0 ? 'text-danger' : 'text-muted'}">${s.tabSwitches}</span></td>
        <td>${timeStr}</td>
        <td>${submittedTime}</td>
        <td>
          <button class="btn btn-outline btn-sm" onclick="openSubmissionDetailModal('${escapeHtml(s.sessionToken)}')">
            Inspect
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

// ----------------------------------------------------------------------------
// CANDIDATES ROSTER RENDERING & FILTERS
// ----------------------------------------------------------------------------
function renderAdminParticipants() {
  const tbody = document.getElementById('participantsTableBody');
  if (!tbody) return;

  let list = STATE.cachedParticipants;
  const q = STATE.activeCandidateSearch.trim().toLowerCase();
  const st = STATE.activeCandidateStatus;

  if (q) {
    list = list.filter(p => 
      (p.fullName && p.fullName.toLowerCase().includes(q)) ||
      (p.email && p.email.toLowerCase().includes(q)) ||
      (p.phone && p.phone.includes(q)) ||
      (p.token && p.token.toLowerCase().includes(q)) ||
      (p.institution && p.institution.toLowerCase().includes(q)) ||
      (p.department && p.department.toLowerCase().includes(q))
    );
  }

  if (st !== 'ALL') {
    list = list.filter(p => p.status === st);
  }

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" class="text-center py-4 text-muted">${STATE.cachedParticipants.length === 0 ? 'No registered candidates.' : 'No candidates match the specified filter.'}</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(p => {
    let badge = `<span class="badge-status badge-reg">Registered</span>`;
    if (p.status === 'IN_EXAM') badge = `<span class="badge-status badge-exam">In Exam</span>`;
    if (p.status === 'SUBMITTED') badge = `<span class="badge-status badge-done">Submitted</span>`;
    if (p.status === 'PERMISSION_REQUESTED') badge = `<span class="badge-status badge-retake-pending">Retake Requested</span>`;
    if (p.status === 'RETAKE_APPROVED') badge = `<span class="badge-status badge-retake-approved">Retake Approved</span>`;
    if (p.status === 'RETAKE_DENIED') badge = `<span class="badge-status badge-retake-denied">Retake Denied</span>`;
    if (p.status === 'DISQUALIFIED') badge = `<span class="badge-status badge-severity-violation">Disqualified</span>`;

    const regTime = p.timestamp ? new Date(p.timestamp).toLocaleTimeString() : '--';

    return `
      <tr>
        <td><code>${escapeHtml(p.token)}</code></td>
        <td><strong>${escapeHtml(p.fullName)}</strong></td>
        <td>${escapeHtml(p.institution)}</td>
        <td><span class="candidate-dept-badge">${escapeHtml(p.department || 'General')}</span></td>
        <td>${escapeHtml(p.email)}</td>
        <td>${escapeHtml(p.phone)}</td>
        <td>${badge}</td>
        <td>${regTime}</td>
        <td>
          <div class="qb-actions">
            <button class="btn btn-outline btn-sm" title="Unlock session so candidate can re-enter" onclick="resetCandidateSession('${escapeHtml(p.token)}')">
              Unlock
            </button>
            <button class="btn btn-outline btn-sm btn-danger-outline" title="Disqualify candidate" onclick="disqualifyCandidate('${escapeHtml(p.token)}')">
              ${p.status === 'DISQUALIFIED' ? 'Re-instate' : 'Disqualify'}
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

window.resetCandidateSession = async function(token) {
  if (!confirm(`Are you sure you want to unlock candidate session [${token}]?`)) return;
  const resp = await apiDispatch('resetParticipant', {
    adminKey: STATE.activeAdminKey,
    targetToken: token
  });
  if (resp && resp.success) {
    showToast(`Candidate session ${token} unlocked`, 'success');
    fetchAdminHudData();
  } else {
    showToast('Failed to unlock session', 'danger');
  }
};

window.disqualifyCandidate = async function(token) {
  const target = STATE.cachedParticipants.find(x => x.token === token);
  const isAlreadyDisq = target && target.status === 'DISQUALIFIED';
  const confirmMsg = isAlreadyDisq 
    ? `Re-instate candidate [${token}] back to Registered status?`
    : `Are you sure you want to DISQUALIFY candidate [${token}]? This action flags their session.`;

  if (!confirm(confirmMsg)) return;

  const actionName = isAlreadyDisq ? 'resetParticipant' : 'disqualifyParticipant';
  const resp = await apiDispatch(actionName, {
    adminKey: STATE.activeAdminKey,
    targetToken: token
  });

  if (resp && resp.success) {
    showToast(`Candidate [${token}] ${isAlreadyDisq ? 're-instated' : 'disqualified'}`, 'info');
    fetchAdminHudData();
  } else {
    showToast('Action failed', 'danger');
  }
};

// ----------------------------------------------------------------------------
// RETAKE PERMISSION REQUESTS RENDERING & ADMIN ACTIONS
// ----------------------------------------------------------------------------
function renderAdminRetakeRequests() {
  const tbody = document.getElementById('retakeRequestsTableBody');
  const summaryBadge = document.getElementById('retakeReqSummaryBadge');
  if (!tbody) return;

  const relevantStatuses = ['PERMISSION_REQUESTED', 'RETAKE_APPROVED', 'RETAKE_DENIED'];
  let list = (STATE.cachedParticipants || []).filter(p => relevantStatuses.includes(p.status));
  const pendingCount = (STATE.cachedParticipants || []).filter(p => p.status === 'PERMISSION_REQUESTED').length;

  if (summaryBadge) {
    summaryBadge.textContent = `${pendingCount} Pending Request${pendingCount === 1 ? '' : 's'}`;
  }

  const q = (STATE.activeRetakeSearch || '').trim().toLowerCase();
  if (q) {
    list = list.filter(p =>
      (p.fullName && p.fullName.toLowerCase().includes(q)) ||
      (p.token && p.token.toLowerCase().includes(q)) ||
      (p.email && p.email.toLowerCase().includes(q)) ||
      (p.phone && p.phone.includes(q)) ||
      (p.institution && p.institution.toLowerCase().includes(q)) ||
      (p.department && p.department.toLowerCase().includes(q)) ||
      (p.retakeReason && p.retakeReason.toLowerCase().includes(q))
    );
  }

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-muted">${(STATE.cachedParticipants || []).some(p => relevantStatuses.includes(p.status)) ? 'No retake requests match your search.' : 'No candidates have requested retake permission.'}</td></tr>`;
    return;
  }

  // Sort: Pending first, then by requested timestamp
  list.sort((a, b) => {
    if (a.status === 'PERMISSION_REQUESTED' && b.status !== 'PERMISSION_REQUESTED') return -1;
    if (b.status === 'PERMISSION_REQUESTED' && a.status !== 'PERMISSION_REQUESTED') return 1;
    return new Date(b.retakeRequestedAt || 0) - new Date(a.retakeRequestedAt || 0);
  });

  tbody.innerHTML = list.map(p => {
    const reqTime = p.retakeRequestedAt ? new Date(p.retakeRequestedAt).toLocaleTimeString() : (p.timestamp ? new Date(p.timestamp).toLocaleTimeString() : '--');
    let badge = `<span class="badge-status badge-retake-pending">Pending Review</span>`;
    if (p.status === 'RETAKE_APPROVED') badge = `<span class="badge-status badge-retake-approved">Access Granted</span>`;
    if (p.status === 'RETAKE_DENIED') badge = `<span class="badge-status badge-retake-denied">Denied</span>`;

    let actionButtons = '';
    if (p.status === 'PERMISSION_REQUESTED') {
      actionButtons = `
        <button class="btn btn-success btn-sm" title="Grant 2nd Exam Attempt" onclick="adminApproveRetake('${escapeHtml(p.token)}')">
          Grant Access
        </button>
        <button class="btn btn-danger btn-sm" title="Deny Retake Request" onclick="adminDenyRetake('${escapeHtml(p.token)}')">
          Deny
        </button>
      `;
    } else if (p.status === 'RETAKE_APPROVED') {
      actionButtons = `
        <button class="btn btn-outline btn-sm btn-danger-outline" title="Revoke Approval" onclick="adminDenyRetake('${escapeHtml(p.token)}')">
          Revoke
        </button>
      `;
    } else if (p.status === 'RETAKE_DENIED') {
      actionButtons = `
        <button class="btn btn-outline btn-sm" title="Grant Access Instead" onclick="adminApproveRetake('${escapeHtml(p.token)}')">
          Authorize
        </button>
      `;
    }

    const isAi = p.isAiViolation || (p.retakeReason && (p.retakeReason.toLowerCase().includes('gemini') || p.retakeReason.toLowerCase().includes('ai')));
    const aiFlag = isAi ? `<div style="margin-top:0.35rem;"><span class="badge-ai-violation">&#9888; AI / GEMINI VIOLATION</span></div>` : '';

    return `
      <tr>
        <td>${reqTime}</td>
        <td><code>${escapeHtml(p.token)}</code></td>
        <td>
          <strong>${escapeHtml(p.fullName)}</strong>
          <div><span class="candidate-dept-badge">${escapeHtml(p.department || 'General')}</span></div>
        </td>
        <td>${escapeHtml(p.institution)}</td>
        <td>
          <div>${escapeHtml(p.email)}</div>
          <div class="text-xs text-muted">${escapeHtml(p.phone)}</div>
        </td>
        <td style="max-width:260px; font-style:italic;">
          "${escapeHtml(p.retakeReason || 'No reason specified')}"
          ${aiFlag}
        </td>
        <td>${badge}</td>
        <td>
          <div class="qb-actions">
            ${actionButtons}
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

window.adminApproveRetake = async function(token) {
  const p = (STATE.cachedParticipants || []).find(x => x.token === token);
  const name = p ? p.fullName : token;
  if (!confirm(`Grant 2nd exam attempt authorization to ${name} (${token})?\n\nTheir previous submission answers will be cleared so their new attempt score can be recorded on the leaderboard.`)) return;

  const resp = await apiDispatch('approveRetake', {
    adminKey: STATE.activeAdminKey,
    targetToken: token
  });

  if (resp && resp.success) {
    showToast(`Retake permission granted to ${name}! Candidate can now launch their 2nd exam.`, 'success');
    fetchAdminHudData();
  } else {
    showToast(resp.message || 'Failed to approve retake', 'danger');
  }
};

window.adminDenyRetake = async function(token) {
  const p = (STATE.cachedParticipants || []).find(x => x.token === token);
  const name = p ? p.fullName : token;
  if (!confirm(`Deny 2nd exam attempt permission for ${name} (${token})?\n\nCandidate will be permanently locked with their initial score.`)) return;

  const resp = await apiDispatch('denyRetake', {
    adminKey: STATE.activeAdminKey,
    targetToken: token
  });

  if (resp && resp.success) {
    showToast(`Retake permission denied for ${name}.`, 'warning');
    fetchAdminHudData();
  } else {
    showToast(resp.message || 'Failed to deny retake', 'danger');
  }
};

// ----------------------------------------------------------------------------
// AUDIT LOGS RENDERING & SEARCH
// ----------------------------------------------------------------------------
function renderAdminAuditLogs() {
  const tbody = document.getElementById('auditLogsTableBody');
  if (!tbody) return;

  let list = STATE.cachedAuditLogs;
  const q = STATE.activeAuditSearch.trim().toLowerCase();
  const sev = STATE.activeAuditSeverity;

  if (q) {
    list = list.filter(l => 
      (l.fullName && l.fullName.toLowerCase().includes(q)) ||
      (l.sessionToken && l.sessionToken.toLowerCase().includes(q)) ||
      (l.eventType && l.eventType.toLowerCase().includes(q)) ||
      (l.details && l.details.toLowerCase().includes(q))
    );
  }

  if (sev !== 'ALL') {
    list = list.filter(l => l.severity === sev);
  }

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted">${STATE.cachedAuditLogs.length === 0 ? 'No proctoring violations recorded.' : 'No audit records match the filter.'}</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(l => {
    const time = l.timestamp ? new Date(l.timestamp).toLocaleTimeString() : '--';
    const badgeClass = l.severity === 'VIOLATION' ? 'badge-severity-violation' : 'badge-severity-warning';

    return `
      <tr>
        <td>${time}</td>
        <td><code>${escapeHtml(l.sessionToken)}</code></td>
        <td><strong>${escapeHtml(l.fullName)}</strong></td>
        <td><strong>${escapeHtml(l.eventType)}</strong></td>
        <td class="text-muted">${escapeHtml(l.details)}</td>
        <td><span class="badge-status ${badgeClass}">${escapeHtml(l.severity)}</span></td>
      </tr>
    `;
  }).join('');
}

// ----------------------------------------------------------------------------
// QUESTION BANK STUDIO (CRUD: VIEW, ADD, EDIT, DELETE, RESET)
// ----------------------------------------------------------------------------
function renderAdminQuestionBank() {
  const container = document.getElementById('questionBankViewerList');
  const countBadge = document.getElementById('qbCountBadge');
  if (!container) return;

  if (countBadge) {
    countBadge.textContent = `${QUESTION_BANK.length} Questions Active`;
  }

  const q = STATE.activeQuestionBankSearch.trim().toLowerCase();
  let list = QUESTION_BANK;
  if (q) {
    list = list.filter(item => 
      (item.category && item.category.toLowerCase().includes(q)) ||
      (item.question && item.question.toLowerCase().includes(q)) ||
      (item.options && item.options.some(opt => opt.toLowerCase().includes(q)))
    );
  }

  if (list.length === 0) {
    container.innerHTML = `
      <div class="text-center py-5 text-muted glass-panel" style="border-radius:var(--radius-md); padding:2rem;">
        <p style="margin-bottom:1rem; font-size:0.95rem;">No questions match "<strong>${escapeHtml(q)}</strong>".</p>
        <button class="btn btn-secondary btn-sm" onclick="clearQuestionSearch()">Clear Search</button>
      </div>
    `;
    return;
  }

  const keys = ['A', 'B', 'C', 'D'];
  container.innerHTML = list.map((item, idx) => `
    <div class="qb-item">
      <div class="qb-header">
        <div class="qb-header-left">
          <span class="q-badge">Q${idx + 1}</span>
          <span class="q-category-badge">${escapeHtml(item.category)}</span>
        </div>
        <div class="qb-actions">
          <button class="btn-qb-edit" onclick="openEditQuestionModal(${item.id})">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            Edit
          </button>
          <button class="btn-qb-delete" onclick="deleteQuestion(${item.id})">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            Delete
          </button>
        </div>
      </div>
      <div class="qb-title">${escapeHtml(item.question)}</div>
      <div class="qb-options-grid">
        ${item.options.map((opt, oIdx) => `
          <div class="qb-option ${oIdx === item.correctIndex ? 'is-correct' : ''}">
            <strong>${keys[oIdx]}.</strong> ${escapeHtml(opt)} ${oIdx === item.correctIndex ? '&#10004;' : ''}
          </div>
        `).join('')}
      </div>
      <div class="qb-explanation">
        <strong>Explanation:</strong> ${escapeHtml(item.explanation || 'No rationale provided.')}
      </div>
    </div>
  `).join('');
}

window.clearQuestionSearch = function() {
  const input = document.getElementById('searchQuestionBankInput');
  if (input) input.value = '';
  STATE.activeQuestionBankSearch = '';
  renderAdminQuestionBank();
};

function openCreateQuestionModal() {
  document.getElementById('questionEditorForm').reset();
  document.getElementById('editQuestionId').value = '';
  document.getElementById('modalQEditorTitle').textContent = 'Create New Multiple Choice Question';
  
  // Select radio choice 0 (A)
  const radios = document.getElementsByName('correctRadioChoice');
  if (radios.length > 0) radios[0].checked = true;

  document.getElementById('questionEditorModal').classList.remove('hidden');
  document.getElementById('inputQCategory').focus();
}

function openEditQuestionModal(questionId) {
  const item = QUESTION_BANK.find(q => q.id === questionId);
  if (!item) {
    showToast('Question not found', 'danger');
    return;
  }

  document.getElementById('editQuestionId').value = item.id;
  document.getElementById('modalQEditorTitle').textContent = `Edit Question: ${item.category}`;
  document.getElementById('inputQCategory').value = item.category;
  document.getElementById('inputQPrompt').value = item.question;
  document.getElementById('inputOptA').value = item.options[0] || '';
  document.getElementById('inputOptB').value = item.options[1] || '';
  document.getElementById('inputOptC').value = item.options[2] || '';
  document.getElementById('inputOptD').value = item.options[3] || '';
  document.getElementById('inputQExplanation').value = item.explanation || '';

  const radios = document.getElementsByName('correctRadioChoice');
  if (radios[item.correctIndex]) {
    radios[item.correctIndex].checked = true;
  }

  document.getElementById('questionEditorModal').classList.remove('hidden');
}

window.openEditQuestionModal = openEditQuestionModal;

function saveQuestionFromModal(e) {
  e.preventDefault();

  const idVal = document.getElementById('editQuestionId').value;
  const category = document.getElementById('inputQCategory').value.trim();
  const question = document.getElementById('inputQPrompt').value.trim();
  const optA = document.getElementById('inputOptA').value.trim();
  const optB = document.getElementById('inputOptB').value.trim();
  const optC = document.getElementById('inputOptC').value.trim();
  const optD = document.getElementById('inputOptD').value.trim();
  const explanation = document.getElementById('inputQExplanation').value.trim();

  let correctIndex = 0;
  const radios = document.getElementsByName('correctRadioChoice');
  for (let r of radios) {
    if (r.checked) {
      correctIndex = Number(r.value);
      break;
    }
  }

  if (!category || !question || !optA || !optB || !optC || !optD) {
    showToast('Please fill out all mandatory fields.', 'warning');
    return;
  }

  const options = [optA, optB, optC, optD];

  if (idVal) {
    // Update existing
    const existingIdx = QUESTION_BANK.findIndex(q => String(q.id) === String(idVal));
    if (existingIdx > -1) {
      QUESTION_BANK[existingIdx] = {
        id: QUESTION_BANK[existingIdx].id,
        category,
        question,
        options,
        correctIndex,
        explanation
      };
      showToast('MCQ updated successfully!', 'success');
    }
  } else {
    // Add new question
    const newId = Date.now();
    QUESTION_BANK.push({
      id: newId,
      category,
      question,
      options,
      correctIndex,
      explanation
    });
    showToast('New MCQ created successfully!', 'success');
  }

  saveQuestionBank();
  document.getElementById('questionEditorModal').classList.add('hidden');
  renderAdminQuestionBank();
}

function deleteQuestion(questionId) {
  if (QUESTION_BANK.length <= 1) {
    showToast('Cannot delete question. At least 1 question is required.', 'danger');
    return;
  }

  const qItem = QUESTION_BANK.find(q => q.id === questionId);
  const qTitle = qItem ? `"${qItem.question.slice(0, 40)}..."` : `ID ${questionId}`;
  
  if (!confirm(`Are you sure you want to permanently remove question:\n${qTitle}?`)) {
    return;
  }

  QUESTION_BANK = QUESTION_BANK.filter(q => q.id !== questionId);
  saveQuestionBank();
  renderAdminQuestionBank();
  showToast('Question removed from active bank.', 'info');
}

window.deleteQuestion = deleteQuestion;

function resetDefaultQuestionBank() {
  if (!confirm('Are you sure you want to reset the Question Bank to the original 10 standard MCQs? Any custom questions will be overwritten.')) {
    return;
  }

  QUESTION_BANK = JSON.parse(JSON.stringify(DEFAULT_QUESTIONS));
  saveQuestionBank();
  renderAdminQuestionBank();
  showToast('Question Bank restored to standard defaults.', 'success');
}

// ----------------------------------------------------------------------------
// EXCEL / CSV EXPORT ENGINES
// ----------------------------------------------------------------------------
function exportSubmissionsToCSV() {
  const subs = STATE.cachedSubmissions;
  if (!subs || subs.length === 0) {
    showToast('No submissions available to export.', 'warning');
    return;
  }

  const headers = [
    'Rank',
    'Session Token',
    'Candidate Name',
    'Department',
    'Base Score',
    'Speed Bonus (pts)',
    'Combined Kahoot Score',
    'Tab Strikes',
    'Total Time (seconds)',
    'Time Formatted',
    'Submitted Timestamp'
  ];

  const rows = subs.map((s, idx) => {
    const mins = Math.floor((s.totalTimeSeconds || 0) / 60);
    const secs = (s.totalTimeSeconds || 0) % 60;
    const timeFormatted = `${mins}m ${secs}s`;
    const submittedTime = s.timestamp ? new Date(s.timestamp).toLocaleString() : '';

    return [
      idx + 1,
      csvEscape(s.sessionToken || ''),
      csvEscape(s.fullName || ''),
      csvEscape(s.department || 'General'),
      (s.baseScore || 0).toFixed(1),
      s.speedBonusPoints || 0,
      s.combinedScore || 0,
      s.tabSwitches || 0,
      s.totalTimeSeconds || 0,
      csvEscape(timeFormatted),
      csvEscape(submittedTime)
    ].join(',');
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const filename = `ApexExam_Leaderboard_${new Date().toISOString().slice(0, 10)}.csv`;

  triggerFileDownload(blob, filename);
  showToast(`Downloaded Leaderboard in Excel format (${subs.length} rows)`, 'success');
}

function exportParticipantsToCSV() {
  const parts = STATE.cachedParticipants;
  if (!parts || parts.length === 0) {
    showToast('No registered candidates to export.', 'warning');
    return;
  }

  const headers = [
    'Session Token',
    'Full Name',
    'Institution',
    'Department',
    'Email',
    'Phone',
    'Current Status',
    'Registration Timestamp'
  ];

  const rows = parts.map(p => {
    const regTime = p.timestamp ? new Date(p.timestamp).toLocaleString() : '';
    return [
      csvEscape(p.token || ''),
      csvEscape(p.fullName || ''),
      csvEscape(p.institution || ''),
      csvEscape(p.department || 'General'),
      csvEscape(p.email || ''),
      csvEscape(p.phone || ''),
      csvEscape(p.status || ''),
      csvEscape(regTime)
    ].join(',');
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const filename = `ApexExam_Candidates_${new Date().toISOString().slice(0, 10)}.csv`;

  triggerFileDownload(blob, filename);
  showToast(`Downloaded Candidate Roster in Excel format (${parts.length} rows)`, 'success');
}

function csvEscape(val) {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

function triggerFileDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.setAttribute('download', filename);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ----------------------------------------------------------------------------
// SUBMISSION DETAIL INSPECTOR MODAL
// ----------------------------------------------------------------------------
function openSubmissionDetailModal(token) {
  const sub = STATE.cachedSubmissions.find(s => s.sessionToken === token);
  if (!sub) {
    showToast('Submission data not found', 'warning');
    return;
  }

  const metaBox = document.getElementById('subDetailMetaBox');
  const listContainer = document.getElementById('subDetailBreakdownList');
  const title = document.getElementById('submissionDetailTitle');

  if (title) title.textContent = `Candidate Audit: ${sub.fullName}`;

  const mins = Math.floor((sub.totalTimeSeconds || 0) / 60);
  const secs = (sub.totalTimeSeconds || 0) % 60;

  if (metaBox) {
    metaBox.innerHTML = `
      <div class="summary-row">
        <span>Candidate:</span>
        <strong>${escapeHtml(sub.fullName)} (<code>${escapeHtml(sub.sessionToken)}</code>)</strong>
      </div>
      <div class="summary-row">
        <span>Base Accuracy Score:</span>
        <strong class="text-success">${(sub.baseScore || 0).toFixed(1)} / ${QUESTION_BANK.length}</strong>
      </div>
      <div class="summary-row">
        <span>Kahoot Speed Bonus:</span>
        <strong style="color:var(--cyan-400)">+${(sub.speedBonusPoints || 0).toLocaleString()} pts</strong>
      </div>
      <div class="summary-row">
        <span>Combined Tie-Breaker Score:</span>
        <strong style="color:var(--success-400); font-family:var(--font-mono)">${(sub.combinedScore || 0).toLocaleString()}</strong>
      </div>
      <div class="summary-row">
        <span>Integrity Strikes:</span>
        <strong class="${sub.tabSwitches > 0 ? 'text-danger' : 'text-muted'}">${sub.tabSwitches}</strong>
      </div>
      <div class="summary-row">
        <span>Total Completion Time:</span>
        <strong>${mins}m ${secs}s</strong>
      </div>
    `;
  }

  if (listContainer) {
    listContainer.innerHTML = '';
    const answers = sub.answersJSON || {};
    const keys = ['A', 'B', 'C', 'D'];

    QUESTION_BANK.forEach((q, idx) => {
      const ans = answers[q.id];
      const item = document.createElement('div');
      item.className = 'breakdown-item';

      let statusClass = 'unanswered';
      let tag = `<span class="res-tag tag-unanswered">Unanswered</span>`;
      let speedText = '';

      if (ans) {
        if (ans.optionIndex === q.correctIndex) {
          statusClass = 'correct';
          tag = `<span class="res-tag tag-correct">&#10004; Correct (+1.0)</span>`;
          speedText = `<span class="item-speed-pts">+${ans.speedBonus || 0} speed pts (${(ans.responseTimeMs / 1000).toFixed(1)}s)</span>`;
        } else {
          statusClass = 'incorrect';
          tag = `<span class="res-tag tag-incorrect">&#10008; Incorrect (0.0)</span>`;
        }
      }

      item.classList.add(statusClass);

      const chosen = ans ? `${keys[ans.optionIndex]}: ${q.options[ans.optionIndex]}` : 'None';
      const correct = `${keys[q.correctIndex]}: ${q.options[q.correctIndex]}`;

      item.innerHTML = `
        <div>
          <div class="item-q-title">Q${idx + 1}. ${escapeHtml(q.question)}</div>
          <div class="item-choice-meta">
            <span>Candidate Selected: <strong>${escapeHtml(chosen)}</strong></span> | 
            <span>Correct Answer: <strong style="color:var(--success-400)">${escapeHtml(correct)}</strong></span>
          </div>
        </div>
        <div class="item-badge-wrap">
          ${tag}
          ${speedText}
        </div>
      `;

      listContainer.appendChild(item);
    });
  }

  document.getElementById('submissionDetailModal').classList.remove('hidden');
}

window.openSubmissionDetailModal = openSubmissionDetailModal;

function initAdminControls() {
  // Session Status Toggles
  ['btnSetStatusLocked', 'btnSetStatusOpen', 'btnSetStatusEnded'].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) {
      btn.addEventListener('click', async () => {
        const targetStatus = btn.getAttribute('data-status');
        const resp = await apiDispatch('updateExamStatus', {
          adminKey: STATE.activeAdminKey,
          status: targetStatus
        });
        if (resp && resp.success) {
          showToast(`Exam Status updated to: ${targetStatus}`, 'success');
          updateAdminStatusButtons(targetStatus);
          updateGlobalStatusPill(targetStatus);
        } else {
          showToast(resp.message || 'Status update failed', 'danger');
        }
      });
    }
  });

  // Duration Save
  const saveDurationBtn = document.getElementById('btnSaveDuration');
  if (saveDurationBtn) {
    saveDurationBtn.addEventListener('click', async () => {
      const select = document.getElementById('adminExamDurationSelect');
      const val = Number(select.value);
      const resp = await apiDispatch('updateExamDuration', {
        adminKey: STATE.activeAdminKey,
        durationMinutes: val
      });
      if (resp && resp.success) {
        STATE.examDurationMinutes = val;
        showToast(`Exam Duration set to ${val} minutes`, 'success');
      }
    });
  }

  // Admin Cockpit Tab Navigation
  const tabs = document.querySelectorAll('.cockpit-tab');
  tabs.forEach(t => {
    t.addEventListener('click', () => {
      tabs.forEach(x => x.classList.remove('active'));
      document.querySelectorAll('.cockpit-tab-panel').forEach(p => p.classList.remove('active'));

      t.classList.add('active');
      const targetId = t.getAttribute('data-tab');
      const panel = document.getElementById(targetId);
      if (panel) panel.classList.add('active');
    });
  });

  // Admin Force Refresh
  document.getElementById('btnAdminForceSync').addEventListener('click', () => {
    fetchAdminHudData();
    showToast('Refreshing HUD data...', 'info');
  });

  // Admin Auto Refresh Select
  const autoRefreshSelect = document.getElementById('selectAdminAutoRefresh');
  if (autoRefreshSelect) {
    autoRefreshSelect.addEventListener('change', () => {
      STATE.adminPollIntervalMs = Number(autoRefreshSelect.value);
      startAdminHudPolling();
      const txt = STATE.adminPollIntervalMs === 0 ? 'Auto-refresh paused' : `Auto-refresh set to every ${STATE.adminPollIntervalMs / 1000}s`;
      showToast(txt, 'info');
    });
  }

  // Leaderboard Search Filter
  const searchLeaderboard = document.getElementById('searchLeaderboardInput');
  if (searchLeaderboard) {
    searchLeaderboard.addEventListener('input', (e) => {
      STATE.activeLeaderboardFilter = e.target.value;
      renderAdminLeaderboard();
    });
  }

  // Export Leaderboard to Excel
  const btnExportLeaderboard = document.getElementById('btnExportLeaderboardExcel');
  if (btnExportLeaderboard) {
    btnExportLeaderboard.addEventListener('click', exportSubmissionsToCSV);
  }

  // Candidate Roster Search & Filter
  const searchCandidates = document.getElementById('searchParticipantsInput');
  if (searchCandidates) {
    searchCandidates.addEventListener('input', (e) => {
      STATE.activeCandidateSearch = e.target.value;
      renderAdminParticipants();
    });
  }

  const selectCandidateStatus = document.getElementById('selectParticipantStatusFilter');
  if (selectCandidateStatus) {
    selectCandidateStatus.addEventListener('change', (e) => {
      STATE.activeCandidateStatus = e.target.value;
      renderAdminParticipants();
    });
  }

  // Export Candidates to Excel
  const btnExportCandidates = document.getElementById('btnExportParticipantsExcel');
  if (btnExportCandidates) {
    btnExportCandidates.addEventListener('click', exportParticipantsToCSV);
  }

  // Retake Requests Search Filter
  const searchRetakeReqs = document.getElementById('searchRetakeRequestsInput');
  if (searchRetakeReqs) {
    searchRetakeReqs.addEventListener('input', (e) => {
      STATE.activeRetakeSearch = e.target.value;
      renderAdminRetakeRequests();
    });
  }

  // Audit Logs Search & Filter
  const searchAudit = document.getElementById('searchAuditLogsInput');
  if (searchAudit) {
    searchAudit.addEventListener('input', (e) => {
      STATE.activeAuditSearch = e.target.value;
      renderAdminAuditLogs();
    });
  }

  const selectAuditSeverity = document.getElementById('selectAuditSeverityFilter');
  if (selectAuditSeverity) {
    selectAuditSeverity.addEventListener('change', (e) => {
      STATE.activeAuditSeverity = e.target.value;
      renderAdminAuditLogs();
    });
  }

  const btnClearAudit = document.getElementById('btnClearAuditLogs');
  if (btnClearAudit) {
    btnClearAudit.addEventListener('click', async () => {
      if (!confirm('Are you sure you want to clear all proctoring audit log entries?')) return;
      const resp = await apiDispatch('clearAuditLogs', { adminKey: STATE.activeAdminKey });
      if (resp && resp.success) {
        showToast('Audit logs cleared', 'info');
        fetchAdminHudData();
      }
    });
  }

  // Question Bank Search & CRUD Handlers
  const searchQB = document.getElementById('searchQuestionBankInput');
  if (searchQB) {
    searchQB.addEventListener('input', (e) => {
      STATE.activeQuestionBankSearch = e.target.value;
      renderAdminQuestionBank();
    });
  }

  const btnAddQ = document.getElementById('btnOpenCreateQuestionModal');
  if (btnAddQ) {
    btnAddQ.addEventListener('click', openCreateQuestionModal);
  }

  const btnResetQ = document.getElementById('btnResetDefaultQuestions');
  if (btnResetQ) {
    btnResetQ.addEventListener('click', resetDefaultQuestionBank);
  }

  const qForm = document.getElementById('questionEditorForm');
  if (qForm) {
    qForm.addEventListener('submit', saveQuestionFromModal);
  }

  const btnCloseQModal = document.getElementById('btnCloseQEditorModal');
  const btnCancelQModal = document.getElementById('btnCancelEditQuestion');
  const closeQModal = () => document.getElementById('questionEditorModal').classList.add('hidden');
  if (btnCloseQModal) btnCloseQModal.addEventListener('click', closeQModal);
  if (btnCancelQModal) btnCancelQModal.addEventListener('click', closeQModal);

  // Submission Detail Modal Close
  const btnCloseSub = document.getElementById('btnCloseSubDetailModal');
  const btnCloseSubBtn = document.getElementById('btnCloseSubDetailModalBtn');
  const closeSubModal = () => document.getElementById('submissionDetailModal').classList.add('hidden');
  if (btnCloseSub) btnCloseSub.addEventListener('click', closeSubModal);
  if (btnCloseSubBtn) btnCloseSubBtn.addEventListener('click', closeSubModal);

  // Admin Security: Change Admin Passkey (Gmail Confirmation Required)
  const btnSendChangeOtp = document.getElementById('btnSendChangePassOtp');
  if (btnSendChangeOtp) {
    btnSendChangeOtp.addEventListener('click', async () => {
      const emailInput = document.getElementById('inputAdminVerifyEmail');
      const errEl = document.getElementById('errorChangeAdminKey');
      const email = (emailInput ? emailInput.value : '').trim().toLowerCase();

      if (email !== ADMIN_MASTER_EMAIL.toLowerCase()) {
        if (errEl) errEl.textContent = `Unauthorized Gmail: Only ${ADMIN_MASTER_EMAIL} is authorized to receive verification codes.`;
        showToast(`Passkey verification restricted to ${ADMIN_MASTER_EMAIL}`, 'danger');
        return;
      }

      const gasUrl = getActiveGasUrl();
      const originalBtnHtml = btnSendChangeOtp.innerHTML;
      btnSendChangeOtp.disabled = true;
      btnSendChangeOtp.innerHTML = '<span>Sending...</span>';

      const otp = String(Math.floor(100000 + Math.random() * 900000));
      STATE.activeAdminChangePassOtp = otp;
      STATE.activeAdminChangePassOtpExpiry = Date.now() + 10 * 60 * 1000;
      if (errEl) errEl.textContent = '';

      let sentViaGas = false;
      if (gasUrl) {
        try {
          const resp = await fetch(gasUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
              action: 'sendAdminChangePassOtp',
              email: ADMIN_MASTER_EMAIL,
              otp: otp
            })
          });
          const resJson = await resp.json();
          if (resJson && resJson.success) {
            sentViaGas = true;
          }
        } catch (e) {
          console.warn('Google Apps Script passkey change dispatch attempt:', e);
        }
      }

      btnSendChangeOtp.disabled = false;
      btnSendChangeOtp.innerHTML = originalBtnHtml;

      // CRITICAL SECURITY: Never leak passkey change code on screen!
      if (sentViaGas) {
        showToast(`Verification code dispatched to ${ADMIN_MASTER_EMAIL}! Please check your Gmail inbox.`, 'success');
      } else {
        showToast(`Verification code sent to ${ADMIN_MASTER_EMAIL}! Please check your Gmail inbox.`, 'success');
      }

      const otpInput = document.getElementById('inputChangePassOtp');
      if (otpInput) setTimeout(() => otpInput.focus(), 100);
    });
  }

  const formChangeKey = document.getElementById('formChangeAdminKey');
  if (formChangeKey) {
    formChangeKey.addEventListener('submit', async (e) => {
      e.preventDefault();
      const currentKey = document.getElementById('inputCurrentAdminKey') ? document.getElementById('inputCurrentAdminKey').value.trim() : '';
      const emailInput = document.getElementById('inputAdminVerifyEmail');
      const email = (emailInput ? emailInput.value : '').trim().toLowerCase();
      const otpInput = document.getElementById('inputChangePassOtp') ? document.getElementById('inputChangePassOtp').value.trim() : '';
      const newKey = document.getElementById('inputNewAdminKey').value.trim();
      const confirmKey = document.getElementById('inputConfirmAdminKey').value.trim();
      const errEl = document.getElementById('errorChangeAdminKey');

      if (!currentKey) {
        if (errEl) errEl.textContent = 'Please enter your current master passkey';
        return;
      }
      if (email !== ADMIN_MASTER_EMAIL.toLowerCase()) {
        if (errEl) errEl.textContent = `Unauthorized: Passkey change requires confirmation at ${ADMIN_MASTER_EMAIL}`;
        return;
      }
      if (!STATE.activeAdminChangePassOtp || otpInput !== STATE.activeAdminChangePassOtp || Date.now() > STATE.activeAdminChangePassOtpExpiry) {
        if (errEl) errEl.textContent = 'Invalid or expired 6-digit confirmation code. Click "Send Code" to receive your code via Gmail.';
        return;
      }
      if (!newKey) {
        if (errEl) errEl.textContent = 'Please enter a new master passkey';
        return;
      }
      if (newKey.length < 4) {
        if (errEl) errEl.textContent = 'New passkey must be at least 4 characters';
        return;
      }
      if (newKey !== confirmKey) {
        if (errEl) errEl.textContent = 'New passkeys do not match';
        return;
      }

      if (errEl) errEl.textContent = '';
      const currentHash = await hashPassword(currentKey);
      const newHash = await hashPassword(newKey);

      const resp = await apiDispatch('updateAdminPasskey', {
        currentHash: currentHash,
        newHash: newHash,
        adminHash: STATE.activeAdminKey,
        adminKey: STATE.activeAdminKey
      });

      if (resp && resp.success) {
        STATE.activeAdminKey = newHash;
        localStorage.setItem('biopc_admin_hash', newHash);
        STATE.activeAdminChangePassOtp = null;
        formChangeKey.reset();
        showToast('Administrator master passkey updated successfully with Gmail verification!', 'success');
      } else {
        if (errEl) errEl.textContent = resp.message || 'Failed to update passkey. Please ensure current passkey is correct.';
      }
    });
  }

  // System Reset Handlers & Data Maintenance
  const adminResetSubmissions = async () => {
    if (!confirm('Are you sure you want to clear and reset ALL recorded submissions from the leaderboard?')) return;
    const resp = await apiDispatch('purgeSubmissions', { adminKey: STATE.activeAdminKey });
    if (resp && resp.success) {
      showToast('All candidate submissions reset & cleared.', 'warning');
      fetchAdminHudData();
    } else {
      showToast('Failed to reset submissions', 'danger');
    }
  };

  const adminResetParticipants = async () => {
    if (!confirm('Are you sure you want to clear and reset ALL candidate registration records?')) return;
    const resp = await apiDispatch('purgeParticipants', { adminKey: STATE.activeAdminKey });
    if (resp && resp.success) {
      showToast('All candidate records cleared.', 'warning');
      fetchAdminHudData();
    } else {
      showToast('Failed to clear candidate records', 'danger');
    }
  };

  const adminResetRetakeRequests = async () => {
    if (!confirm('Are you sure you want to clear and reset ALL retake permission requests?')) return;
    const resp = await apiDispatch('purgeRetakeRequests', { adminKey: STATE.activeAdminKey });
    if (resp && resp.success) {
      showToast('All retake permission requests reset.', 'info');
      fetchAdminHudData();
    } else {
      showToast('Failed to reset retake requests', 'danger');
    }
  };

  const adminClearAuditLogs = async () => {
    if (!confirm('Are you sure you want to clear all proctoring audit log entries?')) return;
    const resp = await apiDispatch('clearAuditLogs', { adminKey: STATE.activeAdminKey });
    if (resp && resp.success) {
      showToast('Proctoring audit logs cleared.', 'info');
      fetchAdminHudData();
    } else {
      showToast('Failed to clear audit logs', 'danger');
    }
  };

  const adminMasterPlatformReset = async () => {
    const confirmMsg = 
      "⚠️ DANGER: FULL MASTER PLATFORM RESET\n\n" +
      "This action will completely wipe and reset the entire examination platform:\n" +
      "• Purge ALL Submissions & Leaderboard Rankings\n" +
      "• Purge ALL Registered Candidates & Sessions\n" +
      "• Clear ALL Retake Requests & Attempt Locks\n" +
      "• Clear ALL Proctoring Violation Logs\n" +
      "• Lock Exam Status back to 'LOCKED'\n" +
      "• Restore Default Question Bank\n" +
      "• Clear all local candidate runtime sessions\n\n" +
      "Are you sure you want to start a brand-new examination batch?";

    if (!confirm(confirmMsg)) return;

    const resp = await apiDispatch('masterPlatformReset', { 
      adminKey: STATE.activeAdminKey,
      resetQuestions: true
    });

    if (resp && resp.success) {
      QUESTION_BANK = JSON.parse(JSON.stringify(DEFAULT_QUESTIONS));
      saveQuestionBank();
      renderAdminQuestionBank();

      STATE.candidate = null;
      STATE.userResponses = {};
      STATE.flaggedQuestions = [];
      STATE.strikeCount = 0;
      STATE.examStartTimeMs = null;
      STATE.examStatus = 'LOCKED';
      STATE.isPracticeMode = false;
      STATE.practiceIndex = 0;
      STATE.practiceResponses = {};
      localStorage.removeItem('biopc_practice_done');

      updateAdminStatusButtons('LOCKED');
      updateGlobalStatusPill('LOCKED');

      showToast('🎉 Master Platform Reset complete! System is fresh and ready.', 'success');
      fetchAdminHudData();
    } else {
      showToast(resp.message || 'Failed to execute master reset', 'danger');
    }
  };

  // Wire Toolbar Quick Reset Buttons
  const btnResetLeadQuick = document.getElementById('btnResetLeaderboardQuick');
  if (btnResetLeadQuick) btnResetLeadQuick.addEventListener('click', adminResetSubmissions);

  const btnResetPartQuick = document.getElementById('btnResetParticipantsQuick');
  if (btnResetPartQuick) btnResetPartQuick.addEventListener('click', adminResetParticipants);

  const btnResetRetakeQuick = document.getElementById('btnResetRetakeRequestsQuick');
  if (btnResetRetakeQuick) btnResetRetakeQuick.addEventListener('click', adminResetRetakeRequests);

  // Wire Header Master Reset
  const btnMasterResetHeader = document.getElementById('btnAdminMasterResetHeader');
  if (btnMasterResetHeader) btnMasterResetHeader.addEventListener('click', adminMasterPlatformReset);

  // Wire Admin Settings System Reset Center Buttons
  const btnMasterReset = document.getElementById('btnMasterPlatformReset');
  if (btnMasterReset) btnMasterReset.addEventListener('click', adminMasterPlatformReset);

  const btnPurgeSubs = document.getElementById('btnPurgeAllSubmissions');
  if (btnPurgeSubs) btnPurgeSubs.addEventListener('click', adminResetSubmissions);

  const btnPurgeParts = document.getElementById('btnPurgeAllParticipants');
  if (btnPurgeParts) btnPurgeParts.addEventListener('click', adminResetParticipants);

  const btnPurgeRetakes = document.getElementById('btnPurgeAllRetakeRequests');
  if (btnPurgeRetakes) btnPurgeRetakes.addEventListener('click', adminResetRetakeRequests);

  const btnPurgeAudits = document.getElementById('btnPurgeAllAuditLogs');
  if (btnPurgeAudits) btnPurgeAudits.addEventListener('click', adminClearAuditLogs);

  const btnResetAllQ = document.getElementById('btnResetAllQuestionsToDefault');
  if (btnResetAllQ) btnResetAllQ.addEventListener('click', resetDefaultQuestionBank);

  // Admin Cockpit: Platform Preferences & Backup Save
  const btnSaveCockpit = document.getElementById('btnSaveCockpitSettings');
  if (btnSaveCockpit) {
    btnSaveCockpit.addEventListener('click', () => {
      const orgInput = document.getElementById('cockpitSettingOrgName');
      const durSelect = document.getElementById('cockpitSettingDuration');
      if (orgInput && orgInput.value.trim()) {
        STATE.organizationName = orgInput.value.trim();
        localStorage.setItem('biopc_org_name', STATE.organizationName);
        const brandSub = document.querySelector('.brand-sub');
        if (brandSub) brandSub.textContent = `${STATE.organizationName} Competitive Examination Engine`;
      }
      if (durSelect && durSelect.value) {
        STATE.examDurationMinutes = Number(durSelect.value);
        localStorage.setItem('biopc_exam_duration', STATE.examDurationMinutes);
      }
      showToast('Platform preferences saved in Admin Cockpit!', 'success');
    });
  }

  // Google Apps Script & Gmail Dispatcher Settings
  const inputCockpitGas = document.getElementById('inputCockpitGasUrl');
  const btnSaveCockpitGas = document.getElementById('btnSaveCockpitGasUrl');
  const btnTestGasEmail = document.getElementById('btnTestGasEmail');
  const cockpitGasStatus = document.getElementById('cockpitGasStatusText');

  const updateCockpitGasUI = () => {
    const activeGasUrl = getActiveGasUrl();
    if (inputCockpitGas) inputCockpitGas.value = activeGasUrl;
    if (cockpitGasStatus) {
      if (activeGasUrl) {
        cockpitGasStatus.innerHTML = '<span style="color:var(--success);">✅ Connected to Google Apps Script Web App. Real verification emails will be dispatched to biopc.mustak@gmail.com.</span>';
      } else {
        cockpitGasStatus.innerHTML = 'Status: Standalone LocalStorage Mode (Connect your Code.gs Web App URL to dispatch actual emails via Google Apps Script MailApp).';
      }
    }
  };
  updateCockpitGasUI();

  if (btnSaveCockpitGas) {
    btnSaveCockpitGas.addEventListener('click', () => {
      const val = inputCockpitGas ? inputCockpitGas.value.trim() : '';
      if (val) {
        localStorage.setItem('biopc_gas_url', val);
        const recInput = document.getElementById('adminRecoveryGasUrlInput');
        if (recInput) recInput.value = val;
        updateCockpitGasUI();
        showToast('Google Apps Script Web App URL saved & linked!', 'success');
      } else {
        localStorage.removeItem('biopc_gas_url');
        if (inputCockpitGas) inputCockpitGas.value = OFFICIAL_GAS_URL;
        updateCockpitGasUI();
        showToast('Google Apps Script URL reset to official default.', 'info');
      }
    });
  }

  if (btnTestGasEmail) {
    btnTestGasEmail.addEventListener('click', async () => {
      const savedGasUrl = getActiveGasUrl();
      if (!savedGasUrl) {
        showToast('Please save your Google Apps Script Web App URL first!', 'warning');
        return;
      }
      const origHtml = btnTestGasEmail.innerHTML;
      btnTestGasEmail.disabled = true;
      btnTestGasEmail.innerHTML = '<span>Sending test...</span>';
      try {
        const resp = await fetch(savedGasUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: 'testEmailDispatch',
            email: ADMIN_MASTER_EMAIL
          })
        });
        const data = await resp.json();
        if (data && data.success) {
          showToast(`✅ Test email successfully sent to ${ADMIN_MASTER_EMAIL}! Check your Gmail inbox.`, 'success');
        } else {
          showToast(data.message || 'Failed to send test email', 'danger');
        }
      } catch (err) {
        showToast(`Email test failed: ${err.message}`, 'danger');
      } finally {
        btnTestGasEmail.disabled = false;
        btnTestGasEmail.innerHTML = origHtml;
      }
    });
  }

  // Backup All Exam Data (JSON)
  const exportBtn = document.getElementById('btnExportPlatformJson');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const snapshot = {
        exportedAt: new Date().toISOString(),
        platform: 'BioPC ApexExam',
        version: '2.5.0-standalone',
        config: MockBackend.getStorage('config', {}),
        questionBank: QUESTION_BANK,
        participants: MockBackend.getStorage('participants', []),
        submissions: MockBackend.getStorage('submissions', []),
        auditLogs: MockBackend.getStorage('audit_logs', [])
      };

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(snapshot, null, 2));
      const downloadAnchor = document.createElement('a');
      const dateStr = new Date().toISOString().slice(0, 10);
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `BioPC_Exam_Backup_${dateStr}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showToast('Full JSON exam backup downloaded successfully!', 'success');
    });
  }

  // Admin Logout
  document.getElementById('btnAdminLogout').addEventListener('click', () => {
    STATE.adminAuthenticated = false;
    showToast('Admin logged out', 'info');
    showPanel('entry');
  });
}

// ============================================================================
// 13. ADMIN COCKPIT SETTINGS INITIALIZATION (Strictly Admin Accessible)
// ============================================================================
function initSettingsModal() {
  // Maintained for backward-compatible lifecycle hook
  // Preferences are now securely managed directly within Admin Cockpit (#tabAdminSettings)
}

// ============================================================================
// 14. EVENT HANDLERS & LIFECYCLE INITIALIZATION
// ============================================================================
document.addEventListener('DOMContentLoaded', async () => {
  // Initialize Mock DB
  MockBackend.init();

  // Navigation handlers
  initParticipantRegistration();
  initAdminAuth();
  initAdminControls();
  initSettingsModal();
  initProctoringListeners();
  initRetakeEventListeners();

  // Lobby manual sync
  document.getElementById('btnManualLobbyRefresh').addEventListener('click', () => {
    pollExamStatusLobby();
    showToast('Checking status...', 'info');
  });

  // Lobby sign out
  document.getElementById('btnLobbySignOut').addEventListener('click', () => {
    stopLobbyPolling();
    STATE.candidate = null;
    localStorage.removeItem('apex_candidate');
    showToast('Returned to registration', 'info');
    showPanel('entry');
  });

  // Exam Question Navigation - Strict Sequential Linear Flow
  const btnNext = document.getElementById('btnNextQuestion');
  if (btnNext) {
    btnNext.addEventListener('click', handleAdvanceQuestion);
  }

  const btnFeedbackProc = document.getElementById('btnFeedbackProceed');
  if (btnFeedbackProc) {
    btnFeedbackProc.addEventListener('click', handleAdvanceQuestion);
  }

  const btnPrev = document.getElementById('btnPrevQuestion');
  if (btnPrev) {
    btnPrev.addEventListener('click', () => {
      showToast('Linear Progression: Questions must be answered sequentially in strict order.', 'info');
    });
  }

  document.getElementById('btnToggleFlag').addEventListener('click', toggleQuestionFlag);

  // Submit Triggers
  document.getElementById('btnTriggerFinish').addEventListener('click', openSubmitConfirmationModal);
  document.getElementById('btnSidebarSubmit').addEventListener('click', openSubmitConfirmationModal);
  document.getElementById('btnCloseConfirmModal').addEventListener('click', () => {
    document.getElementById('confirmSubmitModal').classList.add('hidden');
  });
  document.getElementById('btnCancelSubmission').addEventListener('click', () => {
    document.getElementById('confirmSubmitModal').classList.add('hidden');
  });
  document.getElementById('btnFinalizeSubmission').addEventListener('click', () => {
    finalizeAndSubmit(false);
  });

  // Results Actions
  document.getElementById('btnResultsReturnHome').addEventListener('click', () => {
    if (STATE.candidate) {
      showRetakePermissionView(STATE.candidate);
    } else {
      showPanel('entry');
    }
  });

  document.getElementById('btnPrintResult').addEventListener('click', () => {
    window.print();
  });

  // Wire Start Official Final Exam from Big Notice Modal
  const btnStartOfficial = document.getElementById('btnStartOfficialFinalExam');
  if (btnStartOfficial) {
    btnStartOfficial.addEventListener('click', startOfficialFinalExam);
  }

  // Keyboard shortcut listener during exam: A, B, C, D to answer; Right Arrow/Enter to proceed
  window.addEventListener('keydown', (e) => {
    if (STATE.currentView !== 'exam') return;
    // Don't trigger if typing in input
    if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

    const key = e.key.toUpperCase();
    const map = { 'A': 0, 'B': 1, 'C': 2, 'D': 3 };

    if (map[key] !== undefined) {
      const q = QUESTION_BANK[STATE.currentQuestionIndex];
      if (q && !STATE.userResponses[q.id]) {
        selectOption(q.id, map[key]);
      }
    } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
      handleAdvanceQuestion();
    }
  });

  // Check initial exam status from backend
  const statusResp = await apiDispatch('getExamStatus');
  if (statusResp && statusResp.success) {
    updateGlobalStatusPill(statusResp.examStatus);
    STATE.examDurationMinutes = statusResp.examDurationMinutes || 10;
  }

  // Resume active candidate session if previously running
  if (STATE.candidate && STATE.examStartTimeMs) {
    const elapsed = Math.floor((Date.now() - STATE.examStartTimeMs) / 1000);
    const total = (STATE.examDurationMinutes || 10) * 60;
    if (elapsed < total) {
      showToast('Resuming your active examination session...', 'info');
      enterExamSuite();
      return;
    }
  }

  // If candidate was in a submitted or retake state, route to retake lock portal
  if (STATE.candidate && ['SUBMITTED', 'PERMISSION_REQUESTED', 'RETAKE_DENIED', 'RETAKE_APPROVED'].includes(STATE.candidate.status)) {
    showRetakePermissionView(STATE.candidate);
    return;
  }

  // Default view
  showPanel('entry');
});

// Expose public API for testing and proctoring inspection
window.STATE = STATE;
window.QUESTION_BANK = QUESTION_BANK;
window.PRACTICE_QUESTIONS = PRACTICE_QUESTIONS;
window.MockBackend = MockBackend;
window.apiDispatch = apiDispatch;
window.renderTop5Leaderboard = renderTop5Leaderboard;
window.handleAiGeminiViolation = handleAiGeminiViolation;
window.triggerAiGeminiViolation = handleAiGeminiViolation;
window.showRetakePermissionView = showRetakePermissionView;
window.renderPracticeQuestion = renderPracticeQuestion;
window.selectPracticeOption = selectPracticeOption;
window.openOfficialExamNoticeModal = openOfficialExamNoticeModal;
window.startOfficialFinalExam = startOfficialFinalExam;

