import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
  limit,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { format, subDays } from 'date-fns';

const smokesCol = (userId) => collection(db, 'users', userId, 'smokes');
const urgesCol = (userId) => collection(db, 'users', userId, 'urges');
const summaryDoc = (userId, date) => doc(db, 'users', userId, 'dailySummary', date);
const settingsDoc = (userId) => doc(db, 'users', userId, 'settings', 'prefs');

// ─── Settings ───────────────────────────────────────────────────────────────

export const DEFAULT_SETTINGS = {
  pricePerPack: 300,
  cigarettesPerPack: 20,
  displayName: '',
  currency: '₹',
};

export const getSettings = async (userId) => {
  const snap = await getDoc(settingsDoc(userId));
  return snap.exists() ? { ...DEFAULT_SETTINGS, ...snap.data() } : DEFAULT_SETTINGS;
};

export const saveSettings = async (userId, settings) => {
  await setDoc(settingsDoc(userId), settings, { merge: true });
};

// ─── Log a smoke ─────────────────────────────────────────────────────────────

export const logSmoke = async (userId, { note = '', trigger = '' } = {}) => {
  const now = new Date();
  const dateStr = format(now, 'yyyy-MM-dd');

  const settings = await getSettings(userId);
  const costPerCigarette = settings.pricePerPack / settings.cigarettesPerPack;

  const entry = {
    timestamp: Timestamp.fromDate(now),
    date: dateStr,
    hour: now.getHours(),
    note,
    trigger,
  };

  await addDoc(smokesCol(userId), entry);

  const summRef = summaryDoc(userId, dateStr);
  const summSnap = await getDoc(summRef);

  if (summSnap.exists()) {
    const prev = summSnap.data();
    await updateDoc(summRef, {
      count: prev.count + 1,
      totalExpense: parseFloat(((prev.count + 1) * costPerCigarette).toFixed(2)),
    });
  } else {
    await setDoc(summRef, {
      date: dateStr,
      count: 1,
      totalExpense: parseFloat(costPerCigarette.toFixed(2)),
    });
  }
};

// ─── Log an urge (resisted) ───────────────────────────────────────────────────

export const logUrge = async (userId, { note = '', trigger = '' } = {}) => {
  const now = new Date();
  const entry = {
    timestamp: Timestamp.fromDate(now),
    date: format(now, 'yyyy-MM-dd'),
    hour: now.getHours(),
    note,
    trigger,
  };
  await addDoc(urgesCol(userId), entry);
};

// ─── Delete a smoke entry ────────────────────────────────────────────────────

export const deleteSmoke = async (userId, smokeId, dateStr) => {
  await deleteDoc(doc(db, 'users', userId, 'smokes', smokeId));

  const summRef = summaryDoc(userId, dateStr);
  const summSnap = await getDoc(summRef);
  if (!summSnap.exists()) return;

  const settings = await getSettings(userId);
  const costPerCigarette = settings.pricePerPack / settings.cigarettesPerPack;
  const newCount = Math.max(0, summSnap.data().count - 1);

  await updateDoc(summRef, {
    count: newCount,
    totalExpense: parseFloat((newCount * costPerCigarette).toFixed(2)),
  });
};

// ─── Fetch today's smokes ────────────────────────────────────────────────────

export const getTodaySmokes = async (userId) => {
  const today = format(new Date(), 'yyyy-MM-dd');
  // No orderBy here — composite index not deployed; sort client-side instead
  const q = query(smokesCol(userId), where('date', '==', today));
  const snap = await getDocs(q);
  const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return docs.sort((a, b) => {
    const ta = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp);
    const tb = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(b.timestamp);
    return tb - ta;
  });
};

// ─── Fetch today's urges ─────────────────────────────────────────────────────

export const getTodayUrges = async (userId) => {
  const today = format(new Date(), 'yyyy-MM-dd');
  const q = query(urgesCol(userId), where('date', '==', today));
  const snap = await getDocs(q);
  const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return docs.sort((a, b) => {
    const ta = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp);
    const tb = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(b.timestamp);
    return tb - ta;
  });
};

// ─── Fetch today summary ─────────────────────────────────────────────────────

export const getTodaySummary = async (userId) => {
  const today = format(new Date(), 'yyyy-MM-dd');
  const snap = await getDoc(summaryDoc(userId, today));
  return snap.exists() ? snap.data() : { date: today, count: 0, totalExpense: 0 };
};

// ─── Fetch last N days summaries ─────────────────────────────────────────────

export const getRecentSummaries = async (userId, days = 30) => {
  const today = new Date();
  const promises = Array.from({ length: days }, (_, i) => {
    const d = subDays(today, i);
    const dateStr = format(d, 'yyyy-MM-dd');
    return getDoc(summaryDoc(userId, dateStr)).then((snap) => ({
      date: dateStr,
      count: snap.exists() ? snap.data().count : 0,
      totalExpense: snap.exists() ? snap.data().totalExpense : 0,
    }));
  });
  const results = await Promise.all(promises);
  return results.reverse();
};

// ─── Fetch smokes for a specific date ────────────────────────────────────────

export const getSmokesForDate = async (userId, dateStr) => {
  const q = query(smokesCol(userId), where('date', '==', dateStr));
  const snap = await getDocs(q);
  const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return docs.sort((a, b) => {
    const ta = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp);
    const tb = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(b.timestamp);
    return ta - tb;
  });
};

// ─── Urge counts for last N days ─────────────────────────────────────────────

export const getUrgeCountsForDays = async (userId, days = 7) => {
  const startDate = format(subDays(new Date(), days - 1), 'yyyy-MM-dd');
  const q = query(
    urgesCol(userId),
    where('date', '>=', startDate),
    orderBy('date', 'asc'),
    limit(500)
  );
  const snap = await getDocs(q);

  const countMap = {};
  snap.docs.forEach((d) => {
    const { date } = d.data();
    countMap[date] = (countMap[date] || 0) + 1;
  });

  return Array.from({ length: days }, (_, i) => {
    const dateStr = format(subDays(new Date(), days - 1 - i), 'yyyy-MM-dd');
    return { date: dateStr, count: countMap[dateStr] || 0 };
  });
};

// ─── Stats helpers ────────────────────────────────────────────────────────────

export const getHourlyDistribution = async (userId) => {
  const counts = new Array(24).fill(0);
  const sevenDaysAgo = format(subDays(new Date(), 7), 'yyyy-MM-dd');

  const q = query(
    smokesCol(userId),
    where('date', '>=', sevenDaysAgo),
    orderBy('date', 'asc'),
    limit(500)
  );
  const snap = await getDocs(q);
  snap.docs.forEach((d) => {
    const hour = d.data().hour ?? 0;
    counts[hour] = (counts[hour] || 0) + 1;
  });
  return counts;
};

export const getUrgeHourlyDistribution = async (userId) => {
  const counts = new Array(24).fill(0);
  const sevenDaysAgo = format(subDays(new Date(), 7), 'yyyy-MM-dd');

  const q = query(
    urgesCol(userId),
    where('date', '>=', sevenDaysAgo),
    orderBy('date', 'asc'),
    limit(500)
  );
  const snap = await getDocs(q);
  snap.docs.forEach((d) => {
    const hour = d.data().hour ?? 0;
    counts[hour] = (counts[hour] || 0) + 1;
  });
  return counts;
};

export const getMonthlyTotal = async (userId) => {
  const summaries = await getRecentSummaries(userId, 30);
  return {
    totalSmokes: summaries.reduce((s, d) => s + d.count, 0),
    totalExpense: summaries.reduce((s, d) => s + d.totalExpense, 0),
    avgPerDay: parseFloat(
      (summaries.reduce((s, d) => s + d.count, 0) / 30).toFixed(1)
    ),
  };
};
