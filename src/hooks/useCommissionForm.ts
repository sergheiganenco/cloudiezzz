'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import type { CommissionFormData } from '@/lib/types';
import {
  PACKAGES,
  ADDONS,
  COUPONS,
  DEFAULT_COUPON,
  PACKAGE_TIMES,
  MOODS,
  LANGUAGES,
} from '@/lib/constants';
import { calculatePrice, formatCurrency, lookupCoupon, generateOrderId, validateEmail } from '@/lib/utils';

const initialFormData: CommissionFormData = {
  package: '',
  buyer_name: '',
  buyer_email: '',
  due_date: '',
  buyer_phone: '',
  rec_name: '',
  rec_age: '',
  relationship: '',
  occasion: '',
  others: '',
  how_met: '',
  memories: '',
  love_about: '',
  feeling: '',
  one_line: '',
  avoid: '',
  mood: '',
  genre: [],
  language: 'en',
  vocal: '',
  references: '',
  must_include: '',
  catchphrase: '',
  credit: '',
  lyric_tone: '',
  rating: '',
  approve: '',
  addons: [],
  anything_else: '',
  couponCode: DEFAULT_COUPON,
  discountPercent: COUPONS[DEFAULT_COUPON]?.discount ? COUPONS[DEFAULT_COUPON].discount * 100 : 0,
};

const STORAGE_KEY = 'cloudiezzz_draft';

function saveDraft(step: number, data: CommissionFormData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ step, data, savedAt: Date.now() }));
  } catch {}
}

function loadDraft(): { step: number; data: CommissionFormData } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Expire after 7 days
    if (Date.now() - parsed.savedAt > 7 * 24 * 60 * 60 * 1000) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return { step: parsed.step, data: parsed.data };
  } catch {
    return null;
  }
}

function clearDraft() {
  try { localStorage.removeItem(STORAGE_KEY); } catch {}
}

export function useCommissionForm() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<CommissionFormData>(initialFormData);
  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderNo, setOrderNo] = useState('—');
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [hasDraft, setHasDraft] = useState(false);

  // Restore draft on mount — auto-resume where the user left off
  useEffect(() => {
    setOrderNo(generateOrderId());
    const draft = loadDraft();
    if (draft && draft.step >= 1 && draft.step <= 6) {
      setFormData(draft.data);
      setStep(draft.step);
    }
  }, []);

  // Auto-save on changes (steps 1-6 only, not after submission)
  useEffect(() => {
    if (step >= 1 && step <= 6) {
      saveDraft(step, formData);
    }
  }, [step, formData]);
  const [couponFeedback, setCouponFeedback] = useState<{
    type: 'success' | 'error' | 'hint' | '';
    message: string;
  }>({ type: 'success', message: `${DEFAULT_COUPON} auto-applied - ${COUPONS[DEFAULT_COUPON]?.label}` });

  // Active field tracking for CloudHelper
  const [activeFieldId, setActiveFieldId] = useState<string | undefined>(undefined);
  const [activeFieldRect, setActiveFieldRect] = useState<DOMRect | null>(null);

  // Price calculation
  const priceBreakdown = useMemo(
    () => calculatePrice(formData.package, formData.addons, formData.couponCode || null),
    [formData.package, formData.addons, formData.couponCode]
  );

  // Update field
  const updateField = useCallback(
    <K extends keyof CommissionFormData>(key: K, value: CommissionFormData[K]) => {
      setFormData((prev) => ({ ...prev, [key]: value }));
      setErrors([]);
    },
    []
  );

  // Single-select chip toggle (relationship, occasion, mood, vocal, lyric_tone, rating, approve)
  const toggleChip = useCallback(
    (field: keyof CommissionFormData, value: string) => {
      setFormData((prev) => ({
        ...prev,
        [field]: prev[field] === value ? '' : value,
      }));
      setErrors([]);
    },
    []
  );

  // Multi-select chip toggle (genre)
  const toggleGenre = useCallback((genre: string) => {
    setFormData((prev) => ({
      ...prev,
      genre: prev.genre.includes(genre)
        ? prev.genre.filter((g) => g !== genre)
        : [...prev.genre, genre],
    }));
    setErrors([]);
  }, []);

  // Addon toggle (multi-select)
  const toggleAddon = useCallback((addonId: string) => {
    setFormData((prev) => ({
      ...prev,
      addons: prev.addons.includes(addonId)
        ? prev.addons.filter((id) => id !== addonId)
        : [...prev.addons, addonId],
    }));
  }, []);

  // Coupon apply
  const applyCoupon = useCallback((code: string) => {
    const trimmed = code.toUpperCase().trim();
    if (!trimmed) {
      setCouponFeedback({ type: 'error', message: 'Please enter a coupon code' });
      return;
    }
    const result = lookupCoupon(trimmed);
    if (result.valid) {
      setFormData((prev) => ({
        ...prev,
        couponCode: trimmed,
        discountPercent: result.discount * 100,
      }));
      setCouponFeedback({ type: 'success', message: `${trimmed} applied - ${result.label}` });
    } else {
      setCouponFeedback({ type: 'error', message: 'Invalid coupon code' });
    }
  }, []);

  // Coupon remove
  const removeCoupon = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      couponCode: '',
      discountPercent: 0,
    }));
    setCouponFeedback({ type: '', message: '' });
  }, []);

  // ── Per-step validation ────────────────────────────────────────
  const validateStep = useCallback((s: number): string[] => {
    const fd = formData;
    const errs: string[] = [];

    switch (s) {
      case 1: // Package & buyer info
        if (!fd.package) errs.push('Please select a package');
        if (!fd.buyer_name?.trim()) errs.push('Please enter your name');
        if (!fd.buyer_email?.trim()) errs.push('Please enter your email');
        else if (!validateEmail(fd.buyer_email.trim())) errs.push('Please enter a valid email address');
        break;

      case 2: // Recipient
        if (!fd.rec_name?.trim()) errs.push('Please enter the recipient\'s name');
        if (!fd.relationship) errs.push('Please select your relationship');
        if (!fd.occasion) errs.push('Please select the occasion');
        break;

      case 3: // Story
        if (!fd.how_met?.trim()) errs.push('Please tell us how you met — this is the heart of your song');
        if (!fd.memories?.trim()) errs.push('Please share at least one favorite memory');
        break;

      case 4: // Sound
        if (!fd.mood) errs.push('Please select a mood');
        if (fd.genre.length === 0) errs.push('Please select at least one genre');
        if (!fd.vocal) errs.push('Please select a vocal preference');
        break;

      // Steps 5 & 6 — all optional
      default:
        break;
    }

    return errs;
  }, [formData]);

  // Navigation with validation
  const nextStep = useCallback(() => {
    const errs = validateStep(step);
    if (errs.length > 0) {
      setErrors(errs);
      return false;
    }
    setErrors([]);
    setStep((s) => Math.min(s + 1, 7));
    return true;
  }, [step, validateStep]);

  const prevStep = useCallback(() => {
    setErrors([]);
    setStep((s) => Math.max(s - 1, 1));
  }, []);

  const goToStep = useCallback((s: number) => {
    setErrors([]);
    setStep(s);
  }, []);

  // Submit
  const submitOrder = useCallback(async () => {
    // Final validation — check all required steps
    for (let s = 1; s <= 4; s++) {
      const errs = validateStep(s);
      if (errs.length > 0) {
        setErrors(errs);
        setStep(s);
        return;
      }
    }

    setIsSubmitting(true);
    setErrors([]);
    try {
      const res = await fetch('/api/commission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        clearDraft();
        if (data.orderNumber) setOrderNo(data.orderNumber);
        if (data.accessToken) setAccessToken(data.accessToken);
        if (data.orderId) setFormData((prev) => ({ ...prev, _orderId: data.orderId }));
        setStep(7);
      } else {
        setErrors([data.error || 'Something went wrong. Please try again.']);
      }
    } catch {
      setErrors(['Network error. Please check your connection and try again.']);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData]);

  // Reset
  // Resume saved draft
  const resumeDraft = useCallback(() => {
    const draft = loadDraft();
    if (draft) {
      setFormData(draft.data);
      setStep(draft.step);
      setHasDraft(false);
    }
  }, []);

  // Dismiss draft banner
  const dismissDraft = useCallback(() => {
    clearDraft();
    setHasDraft(false);
  }, []);

  const resetForm = useCallback(() => {
    setFormData(initialFormData);
    setStep(1);
    setErrors([]);
    setAccessToken(null);
    clearDraft();
    setHasDraft(false);
    setCouponFeedback({
      type: 'success',
      message: `${DEFAULT_COUPON} auto-applied - ${COUPONS[DEFAULT_COUPON]?.label}`,
    });
  }, []);

  // Focus tracking for CloudHelper
  const trackFocus = useCallback((fieldId: string, el: HTMLElement | null) => {
    if (el) {
      setActiveFieldId(fieldId);
      setActiveFieldRect(el.getBoundingClientRect());
    }
  }, []);

  const clearFocus = useCallback(() => {
    setActiveFieldId(undefined);
    setActiveFieldRect(null);
  }, []);

  // Build brief HTML summary
  const buildBrief = useCallback((): string => {
    const fd = formData;
    const pkg = PACKAGES.find((p) => p.id === fd.package);
    const pkgTime = fd.package ? PACKAGE_TIMES[fd.package] || '' : '';
    const moodObj = MOODS.find((m) => m.id === fd.mood);
    const langObj = LANGUAGES.find((l) => l.code === fd.language);
    const selectedAddons = ADDONS.filter((a) => fd.addons.includes(a.id));

    const lines: string[] = [];

    lines.push('<b>Package</b>');
    lines.push(pkg ? `${pkg.name} (${formatCurrency(pkg.nowPrice)}) - ${pkgTime}` : 'None selected');
    lines.push('');

    lines.push('<b>Buyer</b>');
    lines.push(`${fd.buyer_name || '-'} / ${fd.buyer_email || '-'}`);
    if (fd.buyer_phone) lines.push(`Phone: ${fd.buyer_phone}`);
    if (fd.due_date) lines.push(`Due: ${fd.due_date}`);
    lines.push('');

    lines.push('<b>Recipient</b>');
    lines.push(`${fd.rec_name || '-'}${fd.rec_age ? `, age ${fd.rec_age}` : ''}`);
    if (fd.relationship) lines.push(`Relationship: ${fd.relationship}`);
    if (fd.occasion) lines.push(`Occasion: ${fd.occasion}`);
    if (fd.others) lines.push(`Others: ${fd.others}`);
    lines.push('');

    lines.push('<b>Story</b>');
    if (fd.how_met) lines.push(`How met: ${fd.how_met}`);
    if (fd.memories) lines.push(`Memories: ${fd.memories}`);
    if (fd.love_about) lines.push(`Love about them: ${fd.love_about}`);
    if (fd.feeling) lines.push(`Feeling: ${fd.feeling}`);
    if (fd.one_line) lines.push(`One line: ${fd.one_line}`);
    if (fd.avoid) lines.push(`Avoid: ${fd.avoid}`);
    lines.push('');

    lines.push('<b>Sound</b>');
    if (moodObj) lines.push(`Mood: ${moodObj.emoji} ${moodObj.label}`);
    if (fd.genre.length > 0) lines.push(`Genres: ${fd.genre.join(', ')}`);
    if (langObj) lines.push(`Language: ${langObj.flag} ${langObj.name}`);
    if (fd.vocal) lines.push(`Vocal: ${fd.vocal}`);
    if (fd.references) lines.push(`References: ${fd.references}`);
    lines.push('');

    lines.push('<b>Lyrics</b>');
    if (fd.must_include) lines.push(`Must include: ${fd.must_include}`);
    if (fd.catchphrase) lines.push(`Catchphrase: ${fd.catchphrase}`);
    if (fd.credit) lines.push(`Credit: ${fd.credit}`);
    if (fd.lyric_tone) lines.push(`Tone: ${fd.lyric_tone}`);
    if (fd.rating) lines.push(`Rating: ${fd.rating}`);
    if (fd.approve) lines.push(`Approval: ${fd.approve}`);
    lines.push('');

    if (selectedAddons.length > 0) {
      lines.push('<b>Add-ons</b>');
      selectedAddons.forEach((a) => {
        const priceLabel = a.id === 'rush' ? '+50%' : formatCurrency(a.price);
        lines.push(`${a.label} (${priceLabel})`);
      });
      lines.push('');
    }

    if (fd.anything_else) {
      lines.push('<b>Additional notes</b>');
      lines.push(fd.anything_else);
      lines.push('');
    }

    if (fd.couponCode) {
      lines.push(`<b>Coupon:</b> ${fd.couponCode} (-${fd.discountPercent}%)`);
    }

    return lines.join('\n');
  }, [formData]);

  return {
    step,
    formData,
    errors,
    isSubmitting,
    orderNo,
    accessToken,
    hasDraft,
    priceBreakdown,
    couponFeedback,
    activeFieldId,
    activeFieldRect,
    updateField,
    toggleChip,
    toggleGenre,
    toggleAddon,
    applyCoupon,
    removeCoupon,
    nextStep,
    prevStep,
    goToStep,
    submitOrder,
    resetForm,
    resumeDraft,
    dismissDraft,
    trackFocus,
    clearFocus,
    buildBrief,
  };
}
