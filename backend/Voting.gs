/**
 * Voting.gs
 * All voting-rule enforcement lives here. The frontend never decides
 * whether a vote is valid — this file is the single source of truth.
 */

/**
 * Returns { status, settings } describing whether voting is currently open,
 * based on server time, never the client's device clock.
 */
function getVotingStatus_() {
  var settings = getSettingsMap_();
  var start = new Date(settings.start_datetime);
  var end = new Date(settings.end_datetime);
  var now = new Date();

  var status;
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    status = VOTING_STATUS.NOT_STARTED;
  } else if (now < start) {
    status = VOTING_STATUS.NOT_STARTED;
  } else if (now > end) {
    status = VOTING_STATUS.CLOSED;
  } else {
    status = VOTING_STATUS.OPEN;
  }
  return { status: status, settings: settings, now: now, start: start, end: end };
}

/** Which numbered voting day ("Day 3") today is, 1-indexed from start_datetime. */
function currentVotingDayNumber_(start, now) {
  var startDay = new Date(Utilities.formatDate(start, TIMEZONE, "yyyy-MM-dd'T'00:00:00"));
  var nowDay = new Date(Utilities.formatDate(now, TIMEZONE, "yyyy-MM-dd'T'00:00:00"));
  var diffMs = nowDay.getTime() - startDay.getTime();
  var dayNum = Math.floor(diffMs / (24 * 60 * 60 * 1000)) + 1;
  return Math.max(1, dayNum);
}

/**
 * Submits a vote. Expects:
 *   idToken     - Google Sign-In ID token (verified server side)
 *   contestantId
 *   deviceHash  - hashed client device identifier (see Security.gs)
 * Returns a confirmation object. Throws AppError_ on any invalid vote.
 */
function submitVote_(params) {
  var identity = verifyGoogleIdToken_(params.idToken);
  var email = identity.email;
  var emailHash = sha256Hex_(email);
  var deviceHash = params.deviceHash ? String(params.deviceHash).substring(0, 128) : '';

  enforceRateLimit_('vote_' + emailHash, RATE_LIMIT.MAX_REQUESTS_PER_MINUTE_PER_KEY);
  checkDeviceFanout_(deviceHash, emailHash);

  var votingState = getVotingStatus_();
  if (votingState.status === VOTING_STATUS.NOT_STARTED) {
    throw new AppError_('VOTING_NOT_STARTED', 'Voting has not started yet.');
  }
  if (votingState.status === VOTING_STATUS.CLOSED) {
    throw new AppError_('VOTING_CLOSED', 'Voting has closed.');
  }

  var contestantId = String(params.contestantId || '').trim();
  if (!contestantId) {
    throw new AppError_('INVALID_REQUEST', 'Invalid request.');
  }

  var contestant = findContestantById_(contestantId);
  if (!contestant) {
    throw new AppError_('CONTESTANT_NOT_FOUND', 'Contestant unavailable.');
  }
  if (String(contestant.status).toLowerCase() !== 'active') {
    throw new AppError_('CONTESTANT_UNAVAILABLE', 'Contestant unavailable.');
  }

  // Everything below must happen atomically to prevent race conditions
  // where two simultaneous requests both get recorded for the same voter.
  return withLock_(function () {
    var votingDayKey = currentVotingDayKey_();
    var votesSheet = getSheet_(SHEET_NAMES.VOTES);
    var existing = readSheetAsObjects_(votesSheet);

    for (var i = 0; i < existing.length; i++) {
      var v = existing[i];
      if (v.email_hash === emailHash && v.voting_day === votingDayKey && v.status === 'valid') {
        trackFailedVoteAttempt_(emailHash, deviceHash, 'ALREADY_VOTED');
        throw new AppError_('ALREADY_VOTED', 'You have already voted today. Come back after midnight to vote again.');
      }
    }

    var voter = findOrCreateVoter_(email, deviceHash);

    var voteId = newId_('vote');
    var record = {
      vote_id: voteId,
      voter_id: voter.voter_id,
      email_hash: emailHash,
      contestant_id: contestant.contestant_id,
      contestant_name: contestant.name,
      category: contestant.category,
      voting_day: votingDayKey,
      timestamp: nowIso_(),
      device_hash: deviceHash,
      status: 'valid'
    };
    appendRowFromObject_(votesSheet, getHeaders_(votesSheet), record);

    // Update voter's last_vote_date
    var votersSheet = getSheet_(SHEET_NAMES.VOTERS);
    votersSheet.getRange(voter.__row, getHeaders_(votersSheet).indexOf('last_vote_date') + 1).setValue(votingDayKey);
    if (deviceHash) {
      votersSheet.getRange(voter.__row, getHeaders_(votersSheet).indexOf('device_hash') + 1).setValue(deviceHash);
    }

    updateDailyResultsForVote_(votingDayKey, contestant);

    return {
      voteReference: voteId,
      contestantName: contestant.name,
      contestantNumber: contestant.contestant_number,
      votingDay: votingDayKey,
      votingDayNumber: currentVotingDayNumber_(votingState.start, votingState.now),
      timestamp: record.timestamp
    };
  });
}

/** Whether the currently authenticated voter has already voted today. */
function checkVoterStatus_(idToken) {
  var identity = verifyGoogleIdToken_(idToken);
  var emailHash = sha256Hex_(identity.email);
  var votingDayKey = currentVotingDayKey_();
  var votesSheet = getSheet_(SHEET_NAMES.VOTES);
  var rows = readSheetAsObjects_(votesSheet);
  var votedToday = false;
  var votedFor = null;
  for (var i = 0; i < rows.length; i++) {
    if (rows[i].email_hash === emailHash && rows[i].voting_day === votingDayKey && rows[i].status === 'valid') {
      votedToday = true;
      votedFor = rows[i].contestant_name;
      break;
    }
  }
  return { email: identity.email, votedToday: votedToday, votedFor: votedFor, votingDay: votingDayKey };
}

/** Incrementally maintains the DailyResults sheet so it never needs a full rescan for the public/admin summary. */
function updateDailyResultsForVote_(votingDayKey, contestant) {
  var sheet = getSheet_(SHEET_NAMES.DAILY_RESULTS);
  var rows = readSheetAsObjects_(sheet);
  for (var i = 0; i < rows.length; i++) {
    if (rows[i].voting_day === votingDayKey && rows[i].contestant_id === contestant.contestant_id) {
      var newCount = Number(rows[i].vote_count || 0) + 1;
      var headers = getHeaders_(sheet);
      sheet.getRange(rows[i].__row, headers.indexOf('vote_count') + 1).setValue(newCount);
      sheet.getRange(rows[i].__row, headers.indexOf('last_updated') + 1).setValue(nowIso_());
      return;
    }
  }
  appendRowFromObject_(sheet, getHeaders_(sheet), {
    voting_day: votingDayKey,
    contestant_id: contestant.contestant_id,
    contestant_name: contestant.name,
    category: contestant.category,
    vote_count: 1,
    last_updated: nowIso_()
  });
}
