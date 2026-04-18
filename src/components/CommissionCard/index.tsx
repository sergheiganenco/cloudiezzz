'use client';

import { useState, useRef, useEffect } from 'react';
import { useCommissionForm } from '@/hooks/useCommissionForm';
import {
  STEPS,
  PACKAGES,
  PACKAGE_TIMES,
  RELATIONSHIPS,
  OCCASION_TYPES,
  GENRES,
  MOODS,
  VOCAL_OPTIONS,
  LANGUAGES,
  LYRIC_TONES,
  CONTENT_RATINGS,
  APPROVAL_OPTIONS,
  ADDONS,
  COUPONS,
} from '@/lib/constants';
import { formatCurrency } from '@/lib/utils';
import {
  playGroupSound,
  playGenreSound,
  playToggleOn,
  playToggleOff,
  playStepAdvance,
  playStepBack,
  playNote,
  PENTATONIC,
} from '@/lib/audio';
import CloudHelper from '@/components/CloudHelper';

export default function CommissionCard() {
  const form = useCommissionForm();

  return (
    <section id="commission">
      {/* Resume draft banner */}
      {form.hasDraft && form.step === 1 && (
        <div className="draft-banner">
          <span>You have an unfinished order. Pick up where you left off?</span>
          <button className="btn primary" style={{ padding: '6px 16px', fontSize: 13 }} onClick={form.resumeDraft}>Resume</button>
          <button className="btn" style={{ padding: '6px 12px', fontSize: 13 }} onClick={form.dismissDraft}>Dismiss</button>
        </div>
      )}

      {/* Progress pips */}
      <div className="progress-wrap">
        <div className="progress">
          {STEPS.map((s, i) => (
            <span key={s.id}>
              <span
                className={`pip${form.step > s.id ? ' done' : ''}${form.step === s.id ? ' active' : ''}`}
                onClick={() => {
                  if (s.id < form.step) {
                    playNote(PENTATONIC[i % PENTATONIC.length], { dur: 0.3, vol: 0.14 });
                    form.goToStep(s.id);
                  }
                }}
              >
                {form.step > s.id ? '\u2713' : s.id}
              </span>
              {i < STEPS.length - 1 && <span className="pip-line" />}
            </span>
          ))}
        </div>
        <div className="step-label">
          Step <strong>{form.step}</strong> of {STEPS.length} &mdash;{' '}
          {STEPS.find((s) => s.id === form.step)?.label ?? ''}
        </div>
      </div>

      {/* Card */}
      <div className="card">
        {/* Decorative flowers */}
        <div className="card-flower cf1">
          <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><g opacity=".6">{[0,45,90,135,180,225,270,315].map(a=><ellipse key={a} cx="100" cy="100" rx="30" ry="60" fill="var(--pink)" transform={`rotate(${a} 100 100)`}/>)}<circle cx="100" cy="100" r="20" fill="var(--yellow-deep)"/></g></svg>
        </div>
        <div className="card-flower cf2">
          <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><g opacity=".6">{[0,45,90,135,180,225,270,315].map(a=><ellipse key={a} cx="100" cy="100" rx="30" ry="60" fill="var(--orange)" transform={`rotate(${a} 100 100)`}/>)}<circle cx="100" cy="100" r="20" fill="var(--yellow-deep)"/></g></svg>
        </div>
        <div className="card-flower cf3">
          <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><g opacity=".6">{[0,45,90,135,180,225,270,315].map(a=><ellipse key={a} cx="100" cy="100" rx="30" ry="60" fill="var(--lavender)" transform={`rotate(${a} 100 100)`}/>)}<circle cx="100" cy="100" r="20" fill="var(--yellow-deep)"/></g></svg>
        </div>
        <div className="card-flower cf4">
          <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><g opacity=".6">{[0,45,90,135,180,225,270,315].map(a=><ellipse key={a} cx="100" cy="100" rx="30" ry="60" fill="var(--mint)" transform={`rotate(${a} 100 100)`}/>)}<circle cx="100" cy="100" r="20" fill="var(--yellow-deep)"/></g></svg>
        </div>

        {/* Order number header */}
        <div className="commission-no">Order {form.orderNo}</div>

        {/* CloudHelper */}
        <CloudHelper
          activeFieldId={form.activeFieldId}
          activeFieldRect={form.activeFieldRect}
        />

        {/* Steps */}
        {form.step === 1 && <StepFormat form={form} />}
        {form.step === 2 && <StepRecipient form={form} />}
        {form.step === 3 && <StepStory form={form} />}
        {form.step === 4 && <StepSound form={form} />}
        {form.step === 5 && <StepLyrics form={form} />}
        {form.step === 6 && <StepReview form={form} />}
        {form.step === 7 && <StepComplete form={form} />}

        {/* Errors */}
        {form.errors.length > 0 && (
          <div style={{
            marginTop: 16,
            background: 'rgba(236, 72, 153, 0.08)',
            border: '2px solid var(--pink)',
            borderRadius: 14,
            padding: '14px 20px',
          }}>
            {form.errors.map((err, i) => (
              <p key={i} style={{
                color: 'var(--pink-deep)',
                fontFamily: "'Fredoka', sans-serif",
                fontWeight: 600,
                fontSize: 14,
                margin: '4px 0',
              }}>
                {'\u2022'} {err}
              </p>
            ))}
          </div>
        )}

        {/* Navigation */}
        {form.step < 7 && (
          <div className="nav">
            {form.step > 1 ? (
              <button
                className="btn"
                onClick={() => {
                  playStepBack();
                  form.prevStep();
                }}
              >
                &larr; Back
              </button>
            ) : (
              <span />
            )}

            {/* Live price display */}
            <LivePrice form={form} />

            {form.step < 6 ? (
              <button
                className="btn primary"
                onClick={() => {
                  playStepAdvance();
                  form.nextStep();
                }}
              >
                Continue &rarr;
              </button>
            ) : (
              <button
                className="btn primary"
                onClick={() => {
                  playStepAdvance();
                  form.submitOrder();
                }}
                disabled={form.isSubmitting}
              >
                {form.isSubmitting ? 'Submitting...' : 'Place order \u2192'}
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

/* ===== Types ===== */
type FormProps = { form: ReturnType<typeof useCommissionForm> };

/* ===== Live Price ===== */
function LivePrice({ form }: FormProps) {
  const pb = form.priceBreakdown;

  if (!pb) {
    return <div className="price-live empty">Pick a package</div>;
  }

  return (
    <div className="price-live">
      {pb.discount > 0 && (
        <span className="strike">{formatCurrency(pb.beforeDiscount)}</span>
      )}
      <span className="total">{formatCurrency(pb.total)}</span>
      {pb.discount > 0 && (
        <span className="save">
          Save <b>{Math.round(pb.rate * 100)}%</b>
        </span>
      )}
    </div>
  );
}

/* ===== Step 1: Format ===== */
function StepFormat({ form }: FormProps) {
  const focusProps = (fieldId: string) => ({
    onFocus: (e: React.FocusEvent<HTMLInputElement>) => form.trackFocus(fieldId, e.currentTarget),
    onBlur: () => form.clearFocus(),
  });

  return (
    <div className="step active">
      <span className="step-num">i. The format</span>
      <h2>Choose your <em>package</em></h2>
      <p className="step-intro">
        Select a package and tell us about yourself.
      </p>

      {/* Packages */}
      <div className="packages">
        {PACKAGES.map((pkg, i) => {
          const isSelected = form.formData.package === pkg.id;
          const coupon = form.formData.couponCode
            ? COUPONS[form.formData.couponCode.toUpperCase()]
            : null;
          const hasDiscount = coupon && coupon.discount > 0;
          const discountedPrice = hasDiscount
            ? Math.round(pkg.nowPrice * (1 - coupon.discount))
            : pkg.nowPrice;

          return (
            <div
              key={pkg.id}
              className={`pkg${isSelected ? ' selected' : ''}`}
              onClick={() => {
                playGroupSound('package', i);
                form.updateField('package', pkg.id);
              }}
            >
              <div className="pkg-name">{pkg.name}</div>
              <div className="pkg-price">
                {hasDiscount ? (
                  <>
                    <span className="was">{formatCurrency(pkg.nowPrice)}</span>
                    <span className="now">{formatCurrency(discountedPrice)}</span>
                  </>
                ) : (
                  <span className="full">{formatCurrency(pkg.nowPrice)}</span>
                )}
              </div>
              <div className="pkg-time">{PACKAGE_TIMES[pkg.id]}</div>
              <div className="pkg-desc">{pkg.description}</div>
            </div>
          );
        })}
      </div>

      {/* Buyer info */}
      <div className="row two">
        <label>
          <div className="lbl">
            Your name <span className="req">required</span>
          </div>
          <input
            type="text"
            placeholder="Your full name"
            value={form.formData.buyer_name}
            onChange={(e) => form.updateField('buyer_name', e.target.value)}
            {...focusProps('buyer_name')}
          />
        </label>
        <label>
          <div className="lbl">
            Email <span className="req">required</span>
          </div>
          <input
            type="email"
            placeholder="you@example.com"
            value={form.formData.buyer_email}
            onChange={(e) => form.updateField('buyer_email', e.target.value)}
            {...focusProps('buyer_email')}
          />
        </label>
      </div>

      <div className="row two">
        <label>
          <div className="lbl">
            Due date <span className="hint">optional</span>
          </div>
          <input
            type="date"
            value={form.formData.due_date}
            onChange={(e) => form.updateField('due_date', e.target.value)}
            {...focusProps('due_date')}
          />
        </label>
        <label>
          <div className="lbl">
            Phone <span className="hint">optional</span>
          </div>
          <input
            type="tel"
            placeholder="+1 (555) 000-0000"
            value={form.formData.buyer_phone}
            onChange={(e) => form.updateField('buyer_phone', e.target.value)}
            {...focusProps('buyer_phone')}
          />
        </label>
      </div>
    </div>
  );
}

/* ===== Step 2: Recipient ===== */
function StepRecipient({ form }: FormProps) {
  const focusProps = (fieldId: string) => ({
    onFocus: (e: React.FocusEvent<HTMLInputElement>) => form.trackFocus(fieldId, e.currentTarget),
    onBlur: () => form.clearFocus(),
  });

  return (
    <div className="step active">
      <span className="step-num">ii. The recipient</span>
      <h2>Who is this <em>for?</em></h2>
      <p className="step-intro">
        Tell us about the person who will receive this song.
      </p>

      <div className="row two">
        <label>
          <div className="lbl">
            Recipient&apos;s name <span className="req">required</span>
          </div>
          <input
            type="text"
            placeholder="e.g. Sarah, Mom, Grandpa Joe"
            value={form.formData.rec_name}
            onChange={(e) => form.updateField('rec_name', e.target.value)}
            {...focusProps('rec_name')}
          />
        </label>
        <label>
          <div className="lbl">
            Age <span className="hint">optional</span>
          </div>
          <input
            type="text"
            placeholder="e.g. 30, turning 5"
            value={form.formData.rec_age}
            onChange={(e) => form.updateField('rec_age', e.target.value)}
            {...focusProps('rec_age')}
          />
        </label>
      </div>

      {/* Relationship chips */}
      <div className="row">
        <div className="lbl">Relationship <span className="req">required</span></div>
        <div className="chips" data-group="relationship">
          {RELATIONSHIPS.map((rel, i) => (
            <span
              key={rel}
              className={`chip${form.formData.relationship === rel ? ' selected' : ''}`}
              onClick={() => {
                playGroupSound('relationship', i);
                form.toggleChip('relationship', rel);
              }}
            >
              {rel}
            </span>
          ))}
        </div>
      </div>

      {/* Occasion chips */}
      <div className="row">
        <div className="lbl">Occasion <span className="req">required</span></div>
        <div className="chips" data-group="occasion">
          {OCCASION_TYPES.map((occ, i) => (
            <span
              key={occ}
              className={`chip accent${form.formData.occasion === occ ? ' selected' : ''}`}
              onClick={() => {
                playGroupSound('occasion', i);
                form.toggleChip('occasion', occ);
              }}
            >
              {occ}
            </span>
          ))}
        </div>
      </div>

      {/* Others input */}
      <div className="row">
        <label>
          <div className="lbl">
            Others mentioned in the song <span className="hint">optional</span>
          </div>
          <input
            type="text"
            placeholder="e.g. kids: Lily & Max, dog: Biscuit"
            value={form.formData.others}
            onChange={(e) => form.updateField('others', e.target.value)}
            {...focusProps('others')}
          />
        </label>
      </div>
    </div>
  );
}

/* ===== Step 3: Story ===== */
function StepStory({ form }: FormProps) {
  const focusPropsInput = (fieldId: string) => ({
    onFocus: (e: React.FocusEvent<HTMLInputElement>) => form.trackFocus(fieldId, e.currentTarget),
    onBlur: () => form.clearFocus(),
  });
  const focusPropsTextarea = (fieldId: string) => ({
    onFocus: (e: React.FocusEvent<HTMLTextAreaElement>) => form.trackFocus(fieldId, e.currentTarget),
    onBlur: () => form.clearFocus(),
  });

  return (
    <div className="step active">
      <span className="step-num">iii. The story</span>
      <h2>The heart of the <em>song</em></h2>
      <p className="step-intro">
        The more you share, the more personal the song. Every detail counts.
      </p>

      <div className="row">
        <label>
          <div className="lbl">
            How did you meet? <span className="req">required</span>
          </div>
          <textarea
            placeholder="Where, when, and how your paths first crossed..."
            rows={3}
            value={form.formData.how_met}
            onChange={(e) => form.updateField('how_met', e.target.value)}
            {...focusPropsTextarea('how_met')}
          />
        </label>
      </div>

      <div className="row">
        <label>
          <div className="lbl">
            Favourite memories together <span className="req">required</span>
          </div>
          <textarea
            placeholder="Inside jokes, trips, milestones, everyday moments..."
            rows={5}
            value={form.formData.memories}
            onChange={(e) => form.updateField('memories', e.target.value)}
            {...focusPropsTextarea('memories')}
          />
        </label>
      </div>

      <div className="row two">
        <label>
          <div className="lbl">What do you love about them?</div>
          <textarea
            placeholder="Qualities, habits, the little things..."
            rows={3}
            value={form.formData.love_about}
            onChange={(e) => form.updateField('love_about', e.target.value)}
            {...focusPropsTextarea('love_about')}
          />
        </label>
        <label>
          <div className="lbl">How should the song make them feel?</div>
          <textarea
            placeholder="Tearful joy, laughter, nostalgia..."
            rows={3}
            value={form.formData.feeling}
            onChange={(e) => form.updateField('feeling', e.target.value)}
            {...focusPropsTextarea('feeling')}
          />
        </label>
      </div>

      <div className="row two">
        <label>
          <div className="lbl">
            If you could say one line to them <span className="hint">optional</span>
          </div>
          <input
            type="text"
            placeholder="e.g. You changed my world"
            value={form.formData.one_line}
            onChange={(e) => form.updateField('one_line', e.target.value)}
            {...focusPropsInput('one_line')}
          />
        </label>
        <label>
          <div className="lbl">
            Anything to avoid? <span className="hint">optional</span>
          </div>
          <input
            type="text"
            placeholder="Topics, words, or themes to steer clear of"
            value={form.formData.avoid}
            onChange={(e) => form.updateField('avoid', e.target.value)}
            {...focusPropsInput('avoid')}
          />
        </label>
      </div>
    </div>
  );
}

/* ===== Step 4: Sound ===== */
function StepSound({ form }: FormProps) {
  const focusPropsInput = (fieldId: string) => ({
    onFocus: (e: React.FocusEvent<HTMLInputElement>) => form.trackFocus(fieldId, e.currentTarget),
    onBlur: () => form.clearFocus(),
  });

  return (
    <div className="step active">
      <span className="step-num">iv. The sound</span>
      <h2>Set the <em>mood</em></h2>
      <p className="step-intro">
        Choose the musical style and sound for your song.
      </p>

      {/* Mood selector */}
      <div className="row">
        <div className="lbl">Mood <span className="req">required</span></div>
        <div className="moods" data-group="mood">
          {MOODS.map((mood, i) => (
            <div
              key={mood.id}
              className={`mood${form.formData.mood === mood.id ? ' selected' : ''}`}
              onClick={() => {
                playGroupSound('mood', i);
                form.toggleChip('mood', mood.id);
              }}
            >
              <span className="mood-emoji">{mood.emoji}</span>
              <div className="mood-name">{mood.label}</div>
              <div className="mood-sub">{mood.description}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Genre chips */}
      <div className="row">
        <div className="lbl">
          Genre <span className="req">pick 1 or more</span>
        </div>
        <div className="chips" data-group="genre">
          {GENRES.map((genre) => (
            <span
              key={genre}
              className={`chip${form.formData.genre.includes(genre) ? ' selected' : ''}`}
              onClick={() => {
                playGenreSound(genre);
                form.toggleGenre(genre);
              }}
            >
              {genre}
            </span>
          ))}
        </div>
      </div>

      {/* Language + Vocal */}
      <div className="row two">
        <div>
          <div className="lbl">Language</div>
          <LanguageDropdown
            value={form.formData.language}
            onChange={(code) => form.updateField('language', code)}
          />
        </div>
        <div>
          <div className="lbl">Vocal preference <span className="req">required</span></div>
          <div className="chips" data-group="vocal">
            {VOCAL_OPTIONS.map((v, i) => (
              <span
                key={v}
                className={`chip${form.formData.vocal === v ? ' selected' : ''}`}
                onClick={() => {
                  playGroupSound('vocal', i);
                  form.toggleChip('vocal', v);
                }}
              >
                {v}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* References */}
      <div className="row">
        <label>
          <div className="lbl">
            Reference songs <span className="hint">songs that capture the vibe you want</span>
          </div>
          <input
            type="text"
            placeholder="e.g. 'Thinking Out Loud' by Ed Sheeran"
            value={form.formData.references}
            onChange={(e) => form.updateField('references', e.target.value)}
            {...focusPropsInput('references')}
          />
        </label>
      </div>
    </div>
  );
}

/* ===== Step 5: Lyrics ===== */
function StepLyrics({ form }: FormProps) {
  const focusPropsInput = (fieldId: string) => ({
    onFocus: (e: React.FocusEvent<HTMLInputElement>) => form.trackFocus(fieldId, e.currentTarget),
    onBlur: () => form.clearFocus(),
  });
  const focusPropsTextarea = (fieldId: string) => ({
    onFocus: (e: React.FocusEvent<HTMLTextAreaElement>) => form.trackFocus(fieldId, e.currentTarget),
    onBlur: () => form.clearFocus(),
  });

  return (
    <div className="step active">
      <span className="step-num">v. The words</span>
      <h2>Shape the <em>lyrics</em></h2>
      <p className="step-intro">
        Guide the lyricist with phrases, tone, and boundaries.
      </p>

      <div className="row">
        <label>
          <div className="lbl">
            Words or phrases to include <span className="hint">optional</span>
          </div>
          <textarea
            placeholder="Names, dates, secret phrases, pet names..."
            rows={4}
            value={form.formData.must_include}
            onChange={(e) => form.updateField('must_include', e.target.value)}
            {...focusPropsTextarea('must_include')}
          />
        </label>
      </div>

      <div className="row two">
        <label>
          <div className="lbl">
            Catchphrase or saying <span className="hint">optional</span>
          </div>
          <input
            type="text"
            placeholder="Their signature line"
            value={form.formData.catchphrase}
            onChange={(e) => form.updateField('catchphrase', e.target.value)}
            {...focusPropsInput('catchphrase')}
          />
        </label>
        <label>
          <div className="lbl">
            Credit / &quot;from&quot; line <span className="hint">optional</span>
          </div>
          <input
            type="text"
            placeholder="e.g. With love, from James"
            value={form.formData.credit}
            onChange={(e) => form.updateField('credit', e.target.value)}
            {...focusPropsInput('credit')}
          />
        </label>
      </div>

      {/* Lyric tone + Rating */}
      <div className="row two">
        <div>
          <div className="lbl">Lyric tone</div>
          <div className="chips" data-group="lyric_tone">
            {LYRIC_TONES.map((tone, i) => (
              <span
                key={tone}
                className={`chip${form.formData.lyric_tone === tone ? ' selected' : ''}`}
                onClick={() => {
                  playGroupSound('lyric_tone', i);
                  form.toggleChip('lyric_tone', tone);
                }}
              >
                {tone}
              </span>
            ))}
          </div>
        </div>
        <div>
          <div className="lbl">Content rating</div>
          <div className="chips" data-group="rating">
            {CONTENT_RATINGS.map((r, i) => (
              <span
                key={r}
                className={`chip${form.formData.rating === r ? ' selected' : ''}`}
                onClick={() => {
                  playGroupSound('rating', i);
                  form.toggleChip('rating', r);
                }}
              >
                {r}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Approval */}
      <div className="row">
        <div className="lbl">Lyric approval before recording?</div>
        <div className="chips" data-group="approve">
          {APPROVAL_OPTIONS.map((opt, i) => (
            <span
              key={opt}
              className={`chip${form.formData.approve === opt ? ' selected' : ''}`}
              onClick={() => {
                playGroupSound('approve', i);
                form.toggleChip('approve', opt);
              }}
            >
              {opt}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ===== Step 6: Review ===== */
function StepReview({ form }: FormProps) {
  const [couponInput, setCouponInput] = useState(form.formData.couponCode || '');
  const pb = form.priceBreakdown;

  const focusPropsTextarea = (fieldId: string) => ({
    onFocus: (e: React.FocusEvent<HTMLTextAreaElement>) => form.trackFocus(fieldId, e.currentTarget),
    onBlur: () => form.clearFocus(),
  });
  const focusPropsInput = (fieldId: string) => ({
    onFocus: (e: React.FocusEvent<HTMLInputElement>) => form.trackFocus(fieldId, e.currentTarget),
    onBlur: () => form.clearFocus(),
  });

  return (
    <div className="step active">
      <span className="step-num">vi. Final touches</span>
      <h2>Add-ons &amp; <em>review</em></h2>
      <p className="step-intro">
        Enhance your order and review everything before submitting.
      </p>

      {/* Addon toggles */}
      <div className="row">
        <div className="lbl">Add-ons</div>
        {ADDONS.map((addon) => {
          const isActive = form.formData.addons.includes(addon.id);
          return (
            <div
              key={addon.id}
              className={`addon${isActive ? ' selected' : ''}`}
              onClick={() => {
                if (isActive) playToggleOff();
                else playToggleOn();
                form.toggleAddon(addon.id);
              }}
            >
              <div className="addon-info">
                <div className="addon-name">{addon.label}</div>
                <div className="addon-price">
                  {addon.id === 'rush' ? '+50% of subtotal' : formatCurrency(addon.price)}
                </div>
              </div>
              <div className="addon-toggle" />
            </div>
          );
        })}
      </div>

      {/* Anything else */}
      <div className="row">
        <label>
          <div className="lbl">
            Anything else? <span className="hint">optional</span>
          </div>
          <textarea
            placeholder="Any final thoughts, requests, or instructions..."
            rows={3}
            value={form.formData.anything_else}
            onChange={(e) => form.updateField('anything_else', e.target.value)}
            {...focusPropsTextarea('anything_else')}
          />
        </label>
      </div>

      {/* Coupon */}
      <div className="row">
        <div className="lbl">Coupon code</div>
        <div className="coupon">
          <input
            type="text"
            placeholder="Enter code..."
            value={couponInput}
            onChange={(e) => setCouponInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && form.applyCoupon(couponInput)}
            {...focusPropsInput('couponInput')}
          />
          <button className="coupon-btn" onClick={() => form.applyCoupon(couponInput)}>
            Apply
          </button>
        </div>
        {form.couponFeedback.type && (
          <div className={`coupon-feedback ${form.couponFeedback.type}`}>
            {form.couponFeedback.message}
          </div>
        )}
        {form.formData.couponCode && form.formData.discountPercent > 0 && (
          <div className="coupon-applied" style={{ marginTop: 10 }}>
            <span>{form.formData.couponCode} &mdash; {form.formData.discountPercent}% off applied</span>
            <button
              className="coupon-remove"
              onClick={() => {
                form.removeCoupon();
                setCouponInput('');
              }}
            >
              Remove
            </button>
          </div>
        )}
      </div>

      {/* Price summary */}
      <div className="price-summary">
        {pb ? (
          <>
            <div className="ps-row">
              <span className="label">{form.formData.package} Package</span>
              <span className="amt">{formatCurrency(pb.pkgPrice)}</span>
            </div>
            {pb.addonTotal > 0 && (
              <div className="ps-row">
                <span className="label">Add-ons</span>
                <span className="amt">{formatCurrency(pb.addonTotal)}</span>
              </div>
            )}
            {pb.hasRush && (
              <div className="ps-row">
                <span className="label">Rush delivery (+50%)</span>
                <span className="amt">{formatCurrency(pb.rushFee)}</span>
              </div>
            )}
            {pb.discount > 0 && (
              <div className="ps-row discount sep">
                <span className="label">Discount ({Math.round(pb.rate * 100)}%)</span>
                <span className="amt">-{formatCurrency(pb.discount)}</span>
              </div>
            )}
            <div className="ps-total">
              <span className="label">Total</span>
              <span className="amt">{formatCurrency(pb.total)}</span>
            </div>
          </>
        ) : (
          <div className="ps-empty">Select a package to see pricing</div>
        )}
      </div>

      {/* Production brief */}
      <div className="row">
        <div className="lbl">Production brief</div>
        <div
          className="brief"
          dangerouslySetInnerHTML={{ __html: form.buildBrief() }}
        />
      </div>
    </div>
  );
}

/* ===== Step 7: Complete ===== */
function StepComplete({ form }: FormProps) {
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState('');
  const [paid, setPaid] = useState(false);

  const handlePayment = async () => {
    setPaying(true);
    setPayError('');
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: form.formData._orderId }),
      });
      const data = await res.json();
      if (data.devMode) {
        // Dev mode — payment auto-completed
        setPaid(true);
      } else if (data.url) {
        window.location.href = data.url;
      } else {
        setPayError(data.error || 'Could not start checkout');
      }
    } catch {
      setPayError('Network error. Please try again.');
    } finally {
      setPaying(false);
    }
  };

  const trackingUrl = form.accessToken
    ? `${window.location.origin}/order/${form.accessToken}`
    : null;

  return (
    <div className="step active">
      <div className="complete">
        <div className="mark">{'\u273F'}</div>
        {paid ? (
          <>
            <h2>payment <em>complete</em></h2>
            <p style={{ fontFamily: 'var(--fn)', fontSize: 15, color: '#5d5346', textAlign: 'center', marginTop: 8 }}>
              Order <strong>{form.orderNo}</strong>
            </p>
            <p className="step-intro" style={{ textAlign: 'center', marginTop: 16 }}>
              Your song is now in the production queue! We&apos;ll start working on it right away.
            </p>
          </>
        ) : (
          <>
            <h2>order <em>placed</em></h2>
            <p style={{ fontFamily: 'var(--fn)', fontSize: 15, color: '#5d5346', textAlign: 'center', marginTop: 8 }}>
              Order <strong>{form.orderNo}</strong>
            </p>
            <p className="step-intro" style={{ textAlign: 'center', marginTop: 16 }}>
              Almost there! Complete payment to start production on your song.
            </p>
          </>
        )}

        {payError && (
          <p style={{ color: '#dc2626', textAlign: 'center', fontSize: 14, marginTop: 8 }}>{payError}</p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center', marginTop: 24 }}>
          {!paid && (
            <button
              className="btn primary"
              onClick={handlePayment}
              disabled={paying}
              style={{ minWidth: 240, fontSize: 16, padding: '16px 32px' }}
            >
              {paying ? 'Processing...' : 'Pay Now \u2192'}
            </button>
          )}

          {trackingUrl && (
            <a
              href={trackingUrl}
              className="btn primary"
              style={paid ? { minWidth: 240, fontSize: 16, padding: '16px 32px', textDecoration: 'none' } : { display: 'none' }}
            >
              Track Your Order
            </a>
          )}

          {trackingUrl && (
            <p style={{ fontFamily: 'var(--fn)', fontSize: 13, color: '#8b7e6e', textAlign: 'center', maxWidth: 320 }}>
              Your order page:<br />
              <a href={trackingUrl} style={{ color: '#ec4899', wordBreak: 'break-all' }}>
                {trackingUrl}
              </a>
            </p>
          )}

          <button
            className="btn"
            onClick={form.resetForm}
            style={{ fontSize: 14, marginTop: 8 }}
          >
            Order another song
          </button>
        </div>
      </div>
    </div>
  );
}

/* ===== Language Dropdown ===== */
function LanguageDropdown({
  value,
  onChange,
}: {
  value: string;
  onChange: (code: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  const selected = LANGUAGES.find((l) => l.code === value);
  const filtered = LANGUAGES.filter(
    (l) =>
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.code.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`lang-select${isOpen ? ' open' : ''}`} ref={ref}>
      <div className="lang-trigger" onClick={() => setIsOpen(!isOpen)}>
        <span className="lang-current">
          {selected ? (
            <>
              <span className="flag">{selected.flag}</span>
              {selected.name}
            </>
          ) : (
            <span className="placeholder">Select a language...</span>
          )}
        </span>
        <span className="arrow">{'\u25BC'}</span>
      </div>

      <div className="lang-dropdown">
        <div className="lang-search">
          <input
            type="text"
            placeholder="Search languages..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
        <div className="lang-list">
          {filtered.length > 0 ? (
            filtered.map((lang) => (
              <div
                key={lang.code}
                className={`lang-option${value === lang.code ? ' selected' : ''}`}
                onClick={() => {
                  playGroupSound('language', LANGUAGES.indexOf(lang) % 4);
                  onChange(lang.code);
                  setIsOpen(false);
                  setSearch('');
                }}
              >
                <span className="flag">{lang.flag}</span>
                <span className="name">{lang.name}</span>
              </div>
            ))
          ) : (
            <div className="lang-empty">No languages found</div>
          )}
        </div>
      </div>
    </div>
  );
}
