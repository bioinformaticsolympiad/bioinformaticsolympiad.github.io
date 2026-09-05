/**
 * Dynamic-Start 10-MCQ Platform Backend
 * Google Apps Script (Code.gs)
 * Relational Google Sheets Database Engine
 */

// ==========================================
// 1. ONE-CLICK SHEET SETUP & INITIALIZATION
// ==========================================

/**
 * Run this function once from the Apps Script editor to initialize all tabs and default configs.
 */
function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Config Sheet
  let configSheet = ss.getSheetByName('Config');
  if (!configSheet) {
    configSheet = ss.insertSheet('Config');
    configSheet.appendRow(['Parameter', 'Value', 'Description']);
    configSheet.appendRow(['ExamStatus', 'LOCKED', 'Current state: LOCKED, OPEN, or ENDED']);
    configSheet.appendRow(['ExamDurationMinutes', '10', 'Exam duration in minutes']);
    configSheet.appendRow(['AdminKey', 'admin123', 'Secret key for Admin Cockpit access']);
    formatHeaderRow(configSheet);
  }
  
  // 2. Participants Sheet
  let participantsSheet = ss.getSheetByName('Participants');
  if (!participantsSheet) {
    participantsSheet = ss.insertSheet('Participants');
    participantsSheet.appendRow([
      'Timestamp', 'SessionToken', 'FullName', 'Institution', 'Department', 'Email', 'Phone', 'Status', 'StartTime'
    ]);
    formatHeaderRow(participantsSheet);
  }
  
  // 3. Submissions Sheet
  let submissionsSheet = ss.getSheetByName('Submissions');
  if (!submissionsSheet) {
    submissionsSheet = ss.insertSheet('Submissions');
    submissionsSheet.appendRow([
      'Timestamp', 'SessionToken', 'FullName', 'Department', 'BaseScore', 'SpeedBonusPoints', 
      'CombinedScore', 'TabSwitches', 'TotalTimeSeconds', 'AnswersJSON'
    ]);
    formatHeaderRow(submissionsSheet);
  }
  
  // 4. AuditLogs Sheet
  let auditSheet = ss.getSheetByName('AuditLogs');
  if (!auditSheet) {
    auditSheet = ss.insertSheet('AuditLogs');
    auditSheet.appendRow([
      'Timestamp', 'SessionToken', 'FullName', 'EventType', 'Details', 'Severity'
    ]);
    formatHeaderRow(auditSheet);
  }

  // Remove default "Sheet1" if empty and others exist
  const defaultSheet = ss.getSheetByName('Sheet1');
  if (defaultSheet && ss.getSheets().length > 1) {
    try { ss.deleteSheet(defaultSheet); } catch(e) {}
  }
  
  Logger.log('Setup successfully completed! All 4 tabs are ready.');
}

function formatHeaderRow(sheet) {
  const header = sheet.getRange(1, 1, 1, sheet.getLastColumn());
  header.setBackground('#1e293b');
  header.setFontColor('#ffffff');
  header.setFontWeight('bold');
  sheet.setFrozenRows(1);
}

// ==========================================
// 2. CONFIG HELPER FUNCTIONS
// ==========================================

function getConfigMap() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Config');
  if (!sheet) return { ExamStatus: 'LOCKED', ExamDurationMinutes: 10, AdminKey: 'admin123' };
  
  const data = sheet.getDataRange().getValues();
  const config = {};
  for (let i = 1; i < data.length; i++) {
    const key = String(data[i][0]).trim();
    const val = data[i][1];
    if (key) {
      config[key] = val;
    }
  }
  return config;
}

function updateConfigValue(param, newValue) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Config');
  if (!sheet) return false;
  
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === param) {
      sheet.getRange(i + 1, 2).setValue(newValue);
      return true;
    }
  }
  // If not found, append
  sheet.appendRow([param, newValue, 'Dynamic update']);
  return true;
}

/**
 * Universal Administrator Authentication Validator
 * Accepts:
 * 1. Default permanent master password 'admin123'
 * 2. Active custom passkey stored in Google Sheets Config tab
 * 3. SHA-256 cryptographic digest of active passkey or 'admin123'
 */
function isAuthorizedAdmin(inputKey, config) {
  if (!inputKey) return false;
  const cfg = config || getConfigMap();
  const storedKey = String(cfg.AdminKey || 'admin123').trim();
  const cleanInput = String(inputKey).trim();
  
  // Direct match with stored key in Google Sheets
  if (cleanInput === storedKey) return true;
  
  // Permanent master default passkey 'admin123'
  if (cleanInput === 'admin123') return true;
  
  // Match SHA-256 of stored key
  try {
    const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, storedKey, Utilities.Charset.UTF_8);
    let hex = '';
    for (let i = 0; i < digest.length; i++) {
      let b = digest[i];
      if (b < 0) b += 256;
      let s = b.toString(16);
      if (s.length === 1) s = '0' + s;
      hex += s;
    }
    if (cleanInput.toLowerCase() === hex.toLowerCase()) return true;
  } catch (e) {}

  // Match SHA-256 of 'admin123' (240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9)
  const admin123Hash = '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9';
  if (cleanInput.toLowerCase() === admin123Hash) return true;

  return false;
}

// ==========================================
// 3. HTTP GET HANDLER (doGet)
// ==========================================

function doGet(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);
  
  try {
    const params = e ? e.parameter : {};
    const action = params.action || 'getExamStatus';
    
    let result = { success: false, message: 'Invalid action' };
    
    if (action === 'getExamStatus') {
      const config = getConfigMap();
      result = {
        success: true,
        examStatus: config.ExamStatus || 'LOCKED',
        examDurationMinutes: Number(config.ExamDurationMinutes) || 10,
        serverTime: new Date().toISOString()
      };
    } 
    else if (action === 'getLeaderboard') {
      result = getLeaderboardData();
    }
    else if (action === 'getLiveHudData') {
      const adminKey = params.adminKey || params.adminHash;
      const config = getConfigMap();
      if (!isAuthorizedAdmin(adminKey, config)) {
        result = { success: false, message: 'Unauthorized: Invalid Admin Key' };
      } else {
        result = getAdminHudData();
      }
    }
    else if (action === 'getRetakeStatus') {
      result = handleGetRetakeStatus(params);
    }
    else if (action === 'ping') {
      result = { success: true, message: 'API is alive', timestamp: new Date().toISOString() };
    }
    
    return createJsonResponse(result);
  } catch (error) {
    return createJsonResponse({ success: false, error: error.toString() });
  } finally {
    lock.releaseLock();
  }
}

// ==========================================
// 4. HTTP POST HANDLER (doPost)
// ==========================================

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);
  
  try {
    let payload = {};
    if (e && e.postData && e.postData.contents) {
      try {
        payload = JSON.parse(e.postData.contents);
      } catch (err) {
        payload = e.parameter;
      }
    } else if (e && e.parameter) {
      payload = e.parameter;
    }
    
    const action = payload.action || '';
    let result = { success: false, message: 'Unknown action' };
    
    // Cross-Device Synchronization Queries
    if (action === 'getExamStatus') {
      const config = getConfigMap();
      result = {
        success: true,
        examStatus: config.ExamStatus || 'LOCKED',
        examDurationMinutes: Number(config.ExamDurationMinutes) || 10,
        serverTime: new Date().toISOString()
      };
    }
    else if (action === 'getLeaderboard') {
      result = getLeaderboardData();
    }
    else if (action === 'getLiveHudData') {
      const adminKey = payload.adminKey || payload.adminHash;
      const config = getConfigMap();
      if (!isAuthorizedAdmin(adminKey, config)) {
        result = { success: false, message: 'Unauthorized: Invalid Admin Key' };
      } else {
        result = getAdminHudData();
      }
    }
    else if (action === 'getRetakeStatus') {
      result = handleGetRetakeStatus(payload);
    }
    
    // Mutating Operations
    else if (action === 'registerParticipant') {
      result = handleRegisterParticipant(payload);
    }
    else if (action === 'verifyAdminKey') {
      result = handleVerifyAdminKey(payload);
    }
    else if (action === 'updateExamStatus') {
      result = handleUpdateExamStatus(payload);
    }
    else if (action === 'updateExamDuration') {
      result = handleUpdateExamDuration(payload);
    }
    else if (action === 'submitExam') {
      result = handleSubmitExam(payload);
    }
    else if (action === 'logAuditEvent') {
      result = handleLogAuditEvent(payload);
    }
    else if (action === 'resetParticipant') {
      result = handleResetParticipant(payload);
    }
    else if (action === 'disqualifyParticipant') {
      result = handleDisqualifyParticipant(payload);
    }
    else if (action === 'updateAdminPasskey') {
      result = handleUpdateAdminPasskey(payload);
    }
    else if (action === 'sendAdminRecoveryOtp') {
      result = handleSendAdminRecoveryOtp(payload);
    }
    else if (action === 'verifyAdminRecoveryOtp') {
      result = handleVerifyAdminRecoveryOtp(payload);
    }
    else if (action === 'sendAdminChangePassOtp') {
      result = handleSendAdminChangePassOtp(payload);
    }
    else if (action === 'testEmailDispatch') {
      result = handleTestEmailDispatch(payload);
    }
    else if (action === 'clearAuditLogs') {
      result = handleClearAuditLogs(payload);
    }
    else if (action === 'purgeSubmissions') {
      result = handlePurgeSubmissions(payload);
    }
    else if (action === 'purgeParticipants') {
      result = handlePurgeParticipants(payload);
    }
    else if (action === 'purgeRetakeRequests') {
      result = handlePurgeRetakeRequests(payload);
    }
    else if (action === 'masterPlatformReset') {
      result = handleMasterPlatformReset(payload);
    }
    else if (action === 'requestRetakePermission') {
      result = handleRequestRetakePermission(payload);
    }
    else if (action === 'approveRetake') {
      result = handleApproveRetake(payload);
    }
    else if (action === 'denyRetake') {
      result = handleDenyRetake(payload);
    }
    
    return createJsonResponse(result);
  } catch (error) {
    return createJsonResponse({ success: false, error: error.toString() });
  } finally {
    lock.releaseLock();
  }
}

// ==========================================
// 5. ACTION CONTROLLERS
// ==========================================

function handleRegisterParticipant(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Participants');
  if (!sheet) return { success: false, message: 'Participants sheet missing. Run setupSheets().' };
  
  const fullName = String(data.fullName || '').trim();
  const institution = String(data.institution || '').trim();
  const department = String(data.department || 'General').trim();
  const email = String(data.email || '').trim().toLowerCase();
  const phone = String(data.phone || '').trim();
  
  if (!fullName || !email || !phone) {
    return { success: false, message: 'Full name, email, and phone are mandatory.' };
  }
  
  // Check if participant is already registered
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0] || [];
  const deptColIdx = headers.indexOf('Department');
  const emailColIdx = headers.indexOf('Email') > -1 ? headers.indexOf('Email') : (deptColIdx > -1 ? 5 : 4);
  const phoneColIdx = headers.indexOf('Phone') > -1 ? headers.indexOf('Phone') : (deptColIdx > -1 ? 6 : 5);
  const statusColIdx = headers.indexOf('Status') > -1 ? headers.indexOf('Status') : (deptColIdx > -1 ? 7 : 6);

  let existingToken = null;
  let existingStatus = null;
  let existingReason = null;
  let existingRowIndex = -1;

  for (let i = 1; i < rows.length; i++) {
    const rEmail = String(rows[i][emailColIdx]).trim().toLowerCase();
    const rPhone = String(rows[i][phoneColIdx]).trim();
    if (rEmail === email || rPhone === phone) {
      existingToken = rows[i][1];
      existingStatus = String(rows[i][statusColIdx]).trim();
      existingReason = rows[i][8] || '';
      existingRowIndex = i + 1;
      break;
    }
  }
  
  if (existingToken) {
    if (existingStatus === 'SUBMITTED') {
      return {
        success: false,
        alreadySubmitted: true,
        status: 'SUBMITTED',
        sessionToken: existingToken,
        fullName: fullName,
        institution: institution,
        department: department,
        email: email,
        phone: phone,
        message: 'Examination attempt limit reached. Strict 1-attempt policy enforced.'
      };
    }
    if (existingStatus === 'PERMISSION_REQUESTED') {
      return {
        success: false,
        alreadySubmitted: true,
        status: 'PERMISSION_REQUESTED',
        sessionToken: existingToken,
        fullName: fullName,
        institution: institution,
        department: department,
        email: email,
        phone: phone,
        requestReason: existingReason,
        message: 'Your retake permission request is currently pending Administrator review.'
      };
    }
    if (existingStatus === 'RETAKE_DENIED') {
      return {
        success: false,
        alreadySubmitted: true,
        status: 'RETAKE_DENIED',
        sessionToken: existingToken,
        fullName: fullName,
        institution: institution,
        department: department,
        email: email,
        phone: phone,
        message: 'Your request for a 2nd exam attempt has been DENIED by the Administrator.'
      };
    }
    if (existingStatus === 'DISQUALIFIED') {
      return {
        success: false,
        alreadySubmitted: true,
        status: 'DISQUALIFIED',
        sessionToken: existingToken,
        fullName: fullName,
        institution: institution,
        department: department,
        email: email,
        phone: phone,
        message: 'Your candidate account has been disqualified.'
      };
    }
    if (existingStatus === 'RETAKE_APPROVED') {
      // Admin authorized 2nd attempt! Reset to REGISTERED
      sheet.getRange(existingRowIndex, statusColIdx + 1).setValue('REGISTERED');
    }
  }

  const token = existingToken || ('TOK_' + Utilities.getUuid().substring(0, 8).toUpperCase());
  const now = new Date().toISOString();
  
  if (!existingToken) {
    if (deptColIdx > -1) {
      sheet.appendRow([
        now, token, fullName, institution, department, email, phone, 'REGISTERED', ''
      ]);
    } else {
      sheet.appendRow([
        now, token, fullName, institution, email, phone, 'REGISTERED', ''
      ]);
    }
  }
  
  const config = getConfigMap();
  return {
    success: true,
    sessionToken: token,
    fullName: fullName,
    department: department,
    examStatus: config.ExamStatus || 'LOCKED',
    examDurationMinutes: Number(config.ExamDurationMinutes) || 10
  };
}

function handleVerifyAdminKey(data) {
  const inputKey = String(data.adminKey || data.adminHash || '').trim();
  const config = getConfigMap();
  
  if (isAuthorizedAdmin(inputKey, config)) {
    return {
      success: true,
      message: 'Admin authenticated',
      examStatus: config.ExamStatus || 'LOCKED',
      examDurationMinutes: Number(config.ExamDurationMinutes) || 10
    };
  }
  return { success: false, message: 'Invalid Admin Passkey' };
}

function handleUpdateExamStatus(data) {
  const adminKey = String(data.adminKey || data.adminHash || '').trim();
  const newStatus = String(data.status || '').trim().toUpperCase();
  const config = getConfigMap();
  
  if (!isAuthorizedAdmin(adminKey, config)) {
    return { success: false, message: 'Unauthorized' };
  }
  
  if (!['LOCKED', 'OPEN', 'ENDED'].includes(newStatus)) {
    return { success: false, message: 'Invalid status. Must be LOCKED, OPEN, or ENDED.' };
  }
  
  updateConfigValue('ExamStatus', newStatus);
  return { success: true, examStatus: newStatus };
}

function handleUpdateExamDuration(data) {
  const adminKey = String(data.adminKey || data.adminHash || '').trim();
  const duration = Number(data.durationMinutes);
  const config = getConfigMap();
  
  if (!isAuthorizedAdmin(adminKey, config)) {
    return { success: false, message: 'Unauthorized' };
  }
  
  if (isNaN(duration) || duration < 1 || duration > 180) {
    return { success: false, message: 'Invalid duration. Must be between 1 and 180 minutes.' };
  }
  
  updateConfigValue('ExamDurationMinutes', duration);
  return { success: true, examDurationMinutes: duration };
}

function handleSubmitExam(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const submissionsSheet = ss.getSheetByName('Submissions');
  const participantsSheet = ss.getSheetByName('Participants');
  
  if (!submissionsSheet) return { success: false, message: 'Submissions sheet missing.' };
  
  const token = String(data.sessionToken || '');
  const fullName = String(data.fullName || 'Anonymous');
  const department = String(data.department || 'General');
  const baseScore = Number(data.baseScore) || 0;
  const speedBonusPoints = Number(data.speedBonusPoints) || 0;
  const combinedScore = (baseScore * 10000) + speedBonusPoints;
  const tabSwitches = Number(data.tabSwitches) || 0;
  const totalTimeSeconds = Number(data.totalTimeSeconds) || 0;
  const answersJSON = typeof data.answersJSON === 'string' ? data.answersJSON : JSON.stringify(data.answersJSON || {});
  
  const now = new Date().toISOString();
  
  // Record Submission (check if Submissions has Department column)
  const subHeaders = submissionsSheet.getDataRange().getValues()[0] || [];
  const deptColIdx = subHeaders.indexOf('Department');

  if (deptColIdx > -1) {
    submissionsSheet.appendRow([
      now, token, fullName, department, baseScore, speedBonusPoints,
      combinedScore, tabSwitches, totalTimeSeconds, answersJSON
    ]);
  } else {
    submissionsSheet.appendRow([
      now, token, fullName, baseScore, speedBonusPoints,
      combinedScore, tabSwitches, totalTimeSeconds, answersJSON
    ]);
  }
  
  // Update participant status if exists
  if (participantsSheet && token) {
    const pData = participantsSheet.getDataRange().getValues();
    const pHeaders = pData[0] || [];
    const pDeptIdx = pHeaders.indexOf('Department');
    const pStatusCol = pHeaders.indexOf('Status') > -1 ? (pHeaders.indexOf('Status') + 1) : (pDeptIdx > -1 ? 8 : 7);

    for (let i = 1; i < pData.length; i++) {
      if (String(pData[i][1]) === token) {
        participantsSheet.getRange(i + 1, pStatusCol).setValue('SUBMITTED');
        break;
      }
    }
  }
  
  return {
    success: true,
    message: 'Exam submitted successfully',
    recordedScore: {
      baseScore: baseScore,
      speedBonusPoints: speedBonusPoints,
      combinedScore: combinedScore,
      tabSwitches: tabSwitches
    }
  };
}

function handleLogAuditEvent(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('AuditLogs');
  if (!sheet) return { success: false };
  
  const now = new Date().toISOString();
  const token = String(data.sessionToken || 'UNKNOWN');
  const fullName = String(data.fullName || 'Unknown Candidate');
  const eventType = String(data.eventType || 'TAB_BLUR');
  const details = String(data.details || '');
  const severity = String(data.severity || 'WARNING');
  
  sheet.appendRow([now, token, fullName, eventType, details, severity]);
  return { success: true };
}

function handleResetParticipant(data) {
  const adminKey = String(data.adminKey || data.adminHash || '');
  const targetToken = String(data.targetToken || '');
  const config = getConfigMap();
  
  if (!isAuthorizedAdmin(adminKey, config)) {
    return { success: false, message: 'Unauthorized' };
  }
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const pSheet = ss.getSheetByName('Participants');
  if (pSheet && targetToken) {
    const rows = pSheet.getDataRange().getValues();
    for (let i = 1; i < rows.length; i++) {
      if (String(rows[i][1]) === targetToken) {
        pSheet.getRange(i + 1, 7).setValue('REGISTERED');
        break;
      }
    }
  }
  
  return { success: true, message: 'Participant session reset' };
}

function handleDisqualifyParticipant(data) {
  const config = getConfigMap();
  const adminKey = String(data.adminKey || data.adminHash || '').trim();
  const targetToken = String(data.targetToken || '').trim();
  
  if (!isAuthorizedAdmin(adminKey, config)) {
    return { success: false, message: 'Unauthorized' };
  }
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const pSheet = ss.getSheetByName('Participants');
  if (pSheet && targetToken) {
    const rows = pSheet.getDataRange().getValues();
    for (let i = 1; i < rows.length; i++) {
      if (String(rows[i][1]) === targetToken) {
        pSheet.getRange(i + 1, 7).setValue('DISQUALIFIED');
        break;
      }
    }
  }
  return { success: true, message: 'Participant disqualified' };
}

function handleRequestRetakePermission(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const pSheet = ss.getSheetByName('Participants');
  const aSheet = ss.getSheetByName('AuditLogs');
  if (!pSheet) return { success: false, message: 'Participants sheet missing' };

  const token = String(data.sessionToken || '').trim();
  const reason = String(data.reason || '').trim() || 'Technical difficulties';
  const isAi = !!data.isAiViolation || (reason.toLowerCase().indexOf('gemini') > -1 || reason.toLowerCase().indexOf('ai') > -1);
  const now = new Date().toISOString();

  const rows = pSheet.getDataRange().getValues();
  let candidateName = '';
  let found = false;

  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][1]).trim() === token) {
      candidateName = rows[i][2];
      pSheet.getRange(i + 1, 7).setValue('PERMISSION_REQUESTED');
      if (pSheet.getLastColumn() < 9) pSheet.getRange(1, 9).setValue('RetakeReason');
      if (pSheet.getLastColumn() < 10) pSheet.getRange(1, 10).setValue('RetakeRequestedAt');
      pSheet.getRange(i + 1, 9).setValue(reason);
      pSheet.getRange(i + 1, 10).setValue(now);
      found = true;
      break;
    }
  }

  if (!found) return { success: false, message: 'Candidate not found' };

  if (aSheet) {
    aSheet.appendRow([
      now, token, candidateName, isAi ? 'RETAKE_REQUESTED_AI' : 'RETAKE_REQUESTED', `Candidate requested retake: "${reason}" (AI Violation: ${isAi ? 'YES' : 'NO'})`, isAi ? 'CRITICAL' : 'WARNING'
    ]);
  }

  return { success: true, status: 'PERMISSION_REQUESTED', requestReason: reason, isAiViolation: isAi };
}

function handleGetRetakeStatus(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const pSheet = ss.getSheetByName('Participants');
  if (!pSheet) return { success: false, message: 'Sheet not found' };

  const token = String(data.sessionToken || '').trim();
  const rows = pSheet.getDataRange().getValues();

  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][1]).trim() === token) {
      return {
        success: true,
        status: String(rows[i][6]).trim(),
        retakeReason: rows[i][8] || '',
        retakeRequestedAt: rows[i][9] || ''
      };
    }
  }

  return { success: false, message: 'Candidate not found' };
}

function handleApproveRetake(data) {
  const config = getConfigMap();
  const adminKey = String(data.adminKey || data.adminHash || '').trim();
  const targetToken = String(data.targetToken || '').trim();

  if (!isAuthorizedAdmin(adminKey, config)) {
    return { success: false, message: 'Unauthorized' };
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const pSheet = ss.getSheetByName('Participants');
  const sSheet = ss.getSheetByName('Submissions');
  const aSheet = ss.getSheetByName('AuditLogs');
  const now = new Date().toISOString();

  let candidateName = '';
  if (pSheet && targetToken) {
    const rows = pSheet.getDataRange().getValues();
    for (let i = 1; i < rows.length; i++) {
      if (String(rows[i][1]).trim() === targetToken) {
        candidateName = rows[i][2];
        pSheet.getRange(i + 1, 7).setValue('RETAKE_APPROVED');
        break;
      }
    }
  }

  // Remove previous submission so new attempt score can be recorded
  if (sSheet && targetToken) {
    const sRows = sSheet.getDataRange().getValues();
    for (let i = sRows.length - 1; i >= 1; i--) {
      if (String(sRows[i][1]).trim() === targetToken) {
        sSheet.deleteRow(i + 1);
      }
    }
  }

  if (aSheet) {
    aSheet.appendRow([
      now, targetToken, candidateName, 'RETAKE_GRANTED', `Admin authorized 2nd exam attempt for ${candidateName}`, 'INFO'
    ]);
  }

  return { success: true, message: 'Retake approved' };
}

function handleDenyRetake(data) {
  const config = getConfigMap();
  const adminKey = String(data.adminKey || data.adminHash || '').trim();
  const targetToken = String(data.targetToken || '').trim();

  if (!isAuthorizedAdmin(adminKey, config)) {
    return { success: false, message: 'Unauthorized' };
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const pSheet = ss.getSheetByName('Participants');
  const aSheet = ss.getSheetByName('AuditLogs');
  const now = new Date().toISOString();

  let candidateName = '';
  if (pSheet && targetToken) {
    const rows = pSheet.getDataRange().getValues();
    for (let i = 1; i < rows.length; i++) {
      if (String(rows[i][1]).trim() === targetToken) {
        candidateName = rows[i][2];
        pSheet.getRange(i + 1, 7).setValue('RETAKE_DENIED');
        break;
      }
    }
  }

  if (aSheet) {
    aSheet.appendRow([
      now, targetToken, candidateName, 'RETAKE_DENIED', `Admin denied 2nd exam attempt for ${candidateName}`, 'WARNING'
    ]);
  }

  return { success: true, message: 'Retake denied' };
}

function handleUpdateAdminPasskey(data) {
  const config = getConfigMap();
  const adminKey = String(data.adminKey || data.adminHash || '').trim();
  const newKey = String(data.newKey || '').trim();
  
  if (!isAuthorizedAdmin(adminKey, config)) {
    return { success: false, message: 'Unauthorized' };
  }
  if (!newKey) {
    return { success: false, message: 'New passkey cannot be empty' };
  }
  
  updateConfigValue('AdminKey', newKey);
  return { success: true, message: 'Admin passkey updated' };
}

function handleSendAdminRecoveryOtp(data) {
  const email = String(data.email || '').trim().toLowerCase();
  const targetEmail = 'biopc.mustak@gmail.com';
  
  if (email !== targetEmail.toLowerCase()) {
    return { success: false, message: 'Unauthorized: Emergency recovery is restricted strictly to ' + targetEmail };
  }
  
  // Generate secure 6-digit OTP
  const otp = String(Math.floor(100000 + Math.random() * 900000));
  const expiry = Date.now() + 10 * 60 * 1000; // 10 minutes
  
  const props = PropertiesService.getScriptProperties();
  props.setProperty('ADMIN_RECOVERY_OTP', otp);
  props.setProperty('ADMIN_RECOVERY_OTP_EXPIRY', String(expiry));
  
  const subject = '🔒 [BioPC Security] Emergency Administrator Passkey Recovery Code';
  const htmlBody = 
    '<div style="font-family: Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 25px; background: #0f172a; color: #f8fafc; border-radius: 12px; border: 1px solid #1e293b;">' +
      '<div style="text-align: center; margin-bottom: 24px;">' +
        '<h2 style="color: #38bdf8; margin: 0; font-size: 22px;">BioPC Administrator Security</h2>' +
        '<p style="color: #94a3b8; font-size: 13px; margin-top: 4px;">Official Quiz Platform Emergency Access Control</p>' +
      '</div>' +
      '<div style="background: #1e293b; padding: 18px; border-radius: 8px; border-left: 4px solid #38bdf8; margin-bottom: 24px;">' +
        '<p style="margin: 0 0 8px; font-size: 14px; color: #e2e8f0;">A master passkey recovery request was initiated for administrator account: <strong>' + targetEmail + '</strong>.</p>' +
        '<p style="margin: 0; font-size: 13px; color: #94a3b8;">Use the confidential 6-digit verification code below to confirm your identity and reset your passkey. <strong>Never share this code with anyone.</strong></p>' +
      '</div>' +
      '<div style="text-align: center; margin: 28px 0;">' +
        '<div style="display: inline-block; background: #0284c7; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: 8px; padding: 14px 32px; border-radius: 8px; font-family: monospace;">' +
          otp +
        '</div>' +
        '<p style="color: #f59e0b; font-size: 13px; margin-top: 12px; font-weight: 600;">⏱ This verification code is valid for 10 minutes.</p>' +
      '</div>' +
      '<div style="border-top: 1px solid #334155; padding-top: 16px; font-size: 12px; color: #64748b; text-align: center; line-height: 1.5;">' +
        '<p style="margin: 0;">If you did not initiate this recovery request, your administrator passkey remains safe. However, please inspect your platform audit logs.</p>' +
        '<p style="margin: 6px 0 0;">&copy; BioPC - A Bioinformatics Lab of Research and Training.</p>' +
      '</div>' +
    '</div>';
  
  try {
    MailApp.sendEmail({
      to: targetEmail,
      subject: subject,
      htmlBody: htmlBody
    });
  } catch (mailErr) {
    try {
      GmailApp.sendEmail(targetEmail, subject, '', { htmlBody: htmlBody });
    } catch (gErr) {
      return { success: false, message: 'Email dispatch failed: ' + gErr.toString() };
    }
  }
  
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const aSheet = ss.getSheetByName('AuditLogs');
    if (aSheet) {
      aSheet.appendRow([
        new Date().toISOString(), 'SYSTEM', 'Administrator', 'ADMIN_RECOVERY_CODE_DISPATCHED', 'Emergency recovery verification code dispatched to ' + targetEmail, 'WARNING'
      ]);
    }
  } catch (e) {}
  
  return { success: true, message: 'Verification code successfully sent to ' + targetEmail };
}

function handleVerifyAdminRecoveryOtp(data) {
  const email = String(data.email || '').trim().toLowerCase();
  const otp = String(data.otp || '').trim();
  const newKey = String(data.newKey || '').trim();
  const targetEmail = 'biopc.mustak@gmail.com';
  
  if (email !== targetEmail.toLowerCase()) {
    return { success: false, message: 'Unauthorized email address' };
  }
  
  const props = PropertiesService.getScriptProperties();
  const storedOtp = props.getProperty('ADMIN_RECOVERY_OTP');
  const storedExpiry = Number(props.getProperty('ADMIN_RECOVERY_OTP_EXPIRY') || 0);
  
  if (!storedOtp || otp !== storedOtp || Date.now() > storedExpiry) {
    return { success: false, message: 'Invalid or expired confirmation code. Please check your Gmail or request a new code.' };
  }
  
  if (!newKey) {
    return { success: false, message: 'New passkey cannot be empty' };
  }
  
  updateConfigValue('AdminKey', newKey);
  props.deleteProperty('ADMIN_RECOVERY_OTP');
  props.deleteProperty('ADMIN_RECOVERY_OTP_EXPIRY');
  
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const aSheet = ss.getSheetByName('AuditLogs');
    if (aSheet) {
      aSheet.appendRow([
        new Date().toISOString(), 'SYSTEM', 'Administrator', 'ADMIN_PASSKEY_RESET', 'Master passkey successfully reset via Gmail OTP confirmation (' + targetEmail + ')', 'INFO'
      ]);
    }
  } catch (e) {}
  
  return { success: true, message: 'Master passkey reset successfully' };
}

function handleSendAdminChangePassOtp(data) {
  const email = String(data.email || '').trim().toLowerCase();
  const targetEmail = 'biopc.mustak@gmail.com';
  
  if (email !== targetEmail.toLowerCase()) {
    return { success: false, message: 'Unauthorized: Passkey change verification is restricted strictly to ' + targetEmail };
  }
  
  const otp = String(Math.floor(100000 + Math.random() * 900000));
  const expiry = Date.now() + 10 * 60 * 1000;
  
  const props = PropertiesService.getScriptProperties();
  props.setProperty('ADMIN_CHANGE_OTP', otp);
  props.setProperty('ADMIN_CHANGE_OTP_EXPIRY', String(expiry));
  
  const subject = '🔒 [BioPC Security] Passkey Change Verification Code';
  const htmlBody = 
    '<div style="font-family: Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 25px; background: #0f172a; color: #f8fafc; border-radius: 12px; border: 1px solid #1e293b;">' +
      '<div style="text-align: center; margin-bottom: 24px;">' +
        '<h2 style="color: #38bdf8; margin: 0; font-size: 22px;">BioPC Administrator Security</h2>' +
        '<p style="color: #94a3b8; font-size: 13px; margin-top: 4px;">Passkey Change Authorization</p>' +
      '</div>' +
      '<div style="background: #1e293b; padding: 18px; border-radius: 8px; border-left: 4px solid #38bdf8; margin-bottom: 24px;">' +
        '<p style="margin: 0 0 8px; font-size: 14px; color: #e2e8f0;">A request to update the administrator passkey was initiated in the Admin Cockpit.</p>' +
        '<p style="margin: 0; font-size: 13px; color: #94a3b8;">Enter the 6-digit verification code below to authorize this change.</p>' +
      '</div>' +
      '<div style="text-align: center; margin: 28px 0;">' +
        '<div style="display: inline-block; background: #0284c7; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: 8px; padding: 14px 32px; border-radius: 8px; font-family: monospace;">' +
          otp +
        '</div>' +
        '<p style="color: #f59e0b; font-size: 13px; margin-top: 12px; font-weight: 600;">⏱ Valid for 10 minutes.</p>' +
      '</div>' +
      '<div style="border-top: 1px solid #334155; padding-top: 16px; font-size: 12px; color: #64748b; text-align: center;">' +
        '<p style="margin: 0;">&copy; BioPC - A Bioinformatics Lab of Research and Training.</p>' +
      '</div>' +
    '</div>';
    
  try {
    MailApp.sendEmail({ to: targetEmail, subject: subject, htmlBody: htmlBody });
  } catch (err) {
    try {
      GmailApp.sendEmail(targetEmail, subject, '', { htmlBody: htmlBody });
    } catch (gErr) {
      return { success: false, message: 'Email dispatch failed: ' + gErr.toString() };
    }
  }
  
  return { success: true, message: 'Verification code dispatched to ' + targetEmail };
}

function handleTestEmailDispatch(data) {
  const email = String(data.email || 'biopc.mustak@gmail.com').trim().toLowerCase();
  const subject = '✅ [BioPC] Google Apps Script Gmail Connectivity Test';
  const htmlBody = 
    '<div style="font-family: Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 25px; background: #0f172a; color: #f8fafc; border-radius: 12px;">' +
      '<h2 style="color: #22c55e; margin: 0;">BioPC Mailer Status: Connected</h2>' +
      '<p style="color: #e2e8f0; font-size: 14px; margin-top: 12px;">Your Google Apps Script Web App is successfully configured and connected to Gmail!</p>' +
      '<p style="color: #94a3b8; font-size: 13px;">Emergency recovery codes and administrative security alerts will be reliably delivered to this address (' + email + ').</p>' +
      '<div style="border-top: 1px solid #334155; padding-top: 16px; font-size: 12px; color: #64748b; margin-top: 20px;">' +
        '<p style="margin: 0;">Timestamp: ' + new Date().toISOString() + '</p>' +
      '</div>' +
    '</div>';
    
  MailApp.sendEmail({ to: email, subject: subject, htmlBody: htmlBody });
  return { success: true, message: 'Test email successfully sent to ' + email };
}

function handleClearAuditLogs(data) {
  const config = getConfigMap();
  const adminKey = String(data.adminKey || data.adminHash || '').trim();
  if (!isAuthorizedAdmin(adminKey, config)) return { success: false, message: 'Unauthorized' };

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const aSheet = ss.getSheetByName('AuditLogs');
  if (aSheet && aSheet.getLastRow() > 1) {
    aSheet.deleteRows(2, aSheet.getLastRow() - 1);
  }
  return { success: true, message: 'Audit logs cleared' };
}

function handlePurgeSubmissions(data) {
  const config = getConfigMap();
  const adminKey = String(data.adminKey || data.adminHash || '').trim();
  if (!isAuthorizedAdmin(adminKey, config)) return { success: false, message: 'Unauthorized' };

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sSheet = ss.getSheetByName('Submissions');
  if (sSheet && sSheet.getLastRow() > 1) {
    sSheet.deleteRows(2, sSheet.getLastRow() - 1);
  }
  return { success: true, message: 'Submissions purged' };
}

function handlePurgeParticipants(data) {
  const config = getConfigMap();
  const adminKey = String(data.adminKey || data.adminHash || '').trim();
  if (!isAuthorizedAdmin(adminKey, config)) return { success: false, message: 'Unauthorized' };

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const pSheet = ss.getSheetByName('Participants');
  if (pSheet && pSheet.getLastRow() > 1) {
    pSheet.deleteRows(2, pSheet.getLastRow() - 1);
  }
  return { success: true, message: 'Participants purged' };
}

function handlePurgeRetakeRequests(data) {
  const config = getConfigMap();
  const adminKey = String(data.adminKey || data.adminHash || '').trim();
  if (!isAuthorizedAdmin(adminKey, config)) return { success: false, message: 'Unauthorized' };

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const pSheet = ss.getSheetByName('Participants');
  if (pSheet && pSheet.getLastRow() > 1) {
    const rows = pSheet.getDataRange().getValues();
    for (let i = 1; i < rows.length; i++) {
      const status = String(rows[i][6]).trim();
      if (status === 'PERMISSION_REQUESTED' || status === 'RETAKE_DENIED' || status === 'RETAKE_APPROVED') {
        pSheet.getRange(i + 1, 7).setValue('SUBMITTED');
        if (pSheet.getLastColumn() >= 9) pSheet.getRange(i + 1, 9).setValue('');
        if (pSheet.getLastColumn() >= 10) pSheet.getRange(i + 1, 10).setValue('');
      }
    }
  }
  return { success: true, message: 'Retake requests reset successfully' };
}

function handleMasterPlatformReset(data) {
  const config = getConfigMap();
  const adminKey = String(data.adminKey || data.adminHash || '').trim();
  if (!isAuthorizedAdmin(adminKey, config)) return { success: false, message: 'Unauthorized' };

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Purge Submissions
  const sSheet = ss.getSheetByName('Submissions');
  if (sSheet && sSheet.getLastRow() > 1) {
    sSheet.deleteRows(2, sSheet.getLastRow() - 1);
  }

  // 2. Purge Participants
  const pSheet = ss.getSheetByName('Participants');
  if (pSheet && pSheet.getLastRow() > 1) {
    pSheet.deleteRows(2, pSheet.getLastRow() - 1);
  }

  // 3. Clear Audit Logs
  const aSheet = ss.getSheetByName('AuditLogs');
  if (aSheet && aSheet.getLastRow() > 1) {
    aSheet.deleteRows(2, aSheet.getLastRow() - 1);
  }

  // 4. Lock Exam Status
  updateConfigValue('ExamStatus', 'LOCKED');

  // 5. Append reset log event
  if (aSheet) {
    aSheet.appendRow([
      new Date().toISOString(),
      'SYSTEM',
      'Administrator',
      'MASTER_PLATFORM_RESET',
      'Platform data factory-reset executed by Administrator',
      'CRITICAL'
    ]);
  }

  return { success: true, message: 'Master platform factory reset completed successfully' };
}

// ==========================================
// 6. LEADERBOARD & HUD DATA AGGREGATORS
// ==========================================

function getLeaderboardData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Submissions');
  if (!sheet) return { success: true, leaderboard: [] };
  
  const rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return { success: true, leaderboard: [] };
  
  const headers = rows[0] || [];
  const deptIdx = headers.indexOf('Department');
  const hasDept = deptIdx > -1;

  const list = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    list.push({
      timestamp: row[0],
      sessionToken: row[1],
      fullName: row[2],
      department: hasDept ? (row[deptIdx] || 'General') : 'General',
      baseScore: Number(hasDept ? row[4] : row[3]) || 0,
      speedBonusPoints: Number(hasDept ? row[5] : row[4]) || 0,
      combinedScore: Number(hasDept ? row[6] : row[5]) || 0,
      tabSwitches: Number(hasDept ? row[7] : row[6]) || 0,
      totalTimeSeconds: Number(hasDept ? row[8] : row[7]) || 0
    });
  }
  
  // Sort descending by CombinedScore, speedBonus, baseScore, then ascending by totalTimeSeconds
  list.sort((a, b) => {
    if (b.combinedScore !== a.combinedScore) return b.combinedScore - a.combinedScore;
    if (b.speedBonusPoints !== a.speedBonusPoints) return b.speedBonusPoints - a.speedBonusPoints;
    if (b.baseScore !== a.baseScore) return b.baseScore - a.baseScore;
    return (a.totalTimeSeconds || 0) - (b.totalTimeSeconds || 0);
  });
  
  return { 
    success: true, 
    leaderboard: list.slice(0, 50),
    top5: list.slice(0, 5)
  };
}

function getAdminHudData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const pSheet = ss.getSheetByName('Participants');
  const sSheet = ss.getSheetByName('Submissions');
  const aSheet = ss.getSheetByName('AuditLogs');
  const config = getConfigMap();
  
  // 1. Participants count
  let participantsList = [];
  if (pSheet && pSheet.getLastRow() > 1) {
    const pRows = pSheet.getDataRange().getValues();
    const headers = pRows[0] || [];
    const deptIdx = headers.indexOf('Department');
    const hasDept = deptIdx > -1;
    const emailIdx = headers.indexOf('Email') > -1 ? headers.indexOf('Email') : (hasDept ? 5 : 4);
    const phoneIdx = headers.indexOf('Phone') > -1 ? headers.indexOf('Phone') : (hasDept ? 6 : 5);
    const statusIdx = headers.indexOf('Status') > -1 ? headers.indexOf('Status') : (hasDept ? 7 : 6);

    for (let i = 1; i < pRows.length; i++) {
      participantsList.push({
        timestamp: pRows[i][0],
        token: pRows[i][1],
        fullName: pRows[i][2],
        institution: pRows[i][3],
        department: hasDept ? (pRows[i][deptIdx] || 'General') : 'General',
        email: pRows[i][emailIdx],
        phone: pRows[i][phoneIdx],
        status: pRows[i][statusIdx],
        retakeReason: pRows[i][8] || '',
        retakeRequestedAt: pRows[i][9] || ''
      });
    }
  }
  
  // 2. Submissions
  const submissionsResult = getLeaderboardData();
  const submissions = submissionsResult.leaderboard || [];
  
  // 3. Audit Logs (last 30 events)
  let auditLogs = [];
  if (aSheet && aSheet.getLastRow() > 1) {
    const aRows = aSheet.getDataRange().getValues();
    for (let i = Math.max(1, aRows.length - 30); i < aRows.length; i++) {
      auditLogs.push({
        timestamp: aRows[i][0],
        sessionToken: aRows[i][1],
        fullName: aRows[i][2],
        eventType: aRows[i][3],
        details: aRows[i][4],
        severity: aRows[i][5]
      });
    }
    auditLogs.reverse();
  }
  
  return {
    success: true,
    examStatus: config.ExamStatus || 'LOCKED',
    examDurationMinutes: Number(config.ExamDurationMinutes) || 10,
    metrics: {
      totalRegistered: participantsList.length,
      totalSubmissions: submissions.length,
      activeInExam: participantsList.filter(p => p.status === 'IN_EXAM').length,
      totalViolations: auditLogs.filter(a => a.severity === 'VIOLATION' || a.eventType === 'TAB_BLUR').length,
      retakeRequests: participantsList.filter(p => p.status === 'PERMISSION_REQUESTED').length
    },
    participants: participantsList,
    submissions: submissions,
    auditLogs: auditLogs
  };
}

// ==========================================
// 7. CORS & RESPONSE SERIALIZATION
// ==========================================

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
