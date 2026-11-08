import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAction, useMutation, useQuery } from 'convex/react';
import { useAuthToken } from '@convex-dev/auth/react';
import {
  ArrowLeft,
  CalendarClock,
  Camera,
  ChevronDown,
  ChevronUp,
  Images,
  Mic,
  Square,
  Plus,
  Minus,
  Trash2,
  Check,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import {
  blankItem,
  localDay,
  localTime,
  mealAnalysisSchema,
  mealSchema,
  totals,
  type MealInput,
  type MealItem,
} from '@tenday/domain';
import { api, type Doc, type Id } from '../lib/backend';
import { useApp, errorMessage } from '../lib/app-state';
import { draftFile, operationId, useDraft } from '../lib/storage';
import { photoFile, uploadFile } from '../lib/files';
import {
  Banner,
  Button,
  Field,
  IconButton,
  Loading,
  NumberField,
  Sheet,
  TextArea,
} from '../components/ui';
import { formatDay } from '../lib/format';

type MealDraft = {
  operationId: string;
  day: string;
  time: string;
  text: string;
  source: MealInput['source'];
  photoName?: string;
  fileId?: Id<'files'>;
  review?: MealInput;
};
type Recognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult:
    | ((event: { results: ArrayLike<{ 0: { transcript: string } }> }) => void)
    | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
};
export function MealPage() {
  const { id } = useParams();
  const existing = useQuery(
    api.records.meal,
    id ? { id: id as Id<'meals'> } : 'skip',
  );
  if (id && !existing) return <Loading />;
  return <MealEditor key={id ?? 'new'} existing={existing} />;
}
function MealEditor({ existing }: { existing?: Doc<'meals'> | null }) {
  const navigate = useNavigate(),
    location = useLocation(),
    token = useAuthToken();
  const { sessionId, enqueue, connected, toast } = useApp();
  const backTo = location.state?.returnTo === '/history' ? '/history' : '/';
  const fileKey = `${sessionId}:meal`;
  const draft = useDraft<MealDraft>(
    `tenday:web:meal:${sessionId}:${existing?._id ?? 'new'}`,
    {
      operationId: operationId(),
      day: localDay(),
      time: localTime(),
      text: '',
      source: 'text',
      review: existing?.meal,
    },
  );
  const { change, value, ready } = draft;
  const [file, setFile] = useState<File>(),
    [preview, setPreview] = useState(''),
    [busy, setBusy] = useState(''),
    [error, setError] = useState(''),
    [listening, setListening] = useState(false),
    [deleting, setDeleting] = useState(false);
  const camera = useRef<HTMLInputElement>(null),
    gallery = useRef<HTMLInputElement>(null),
    recognizer = useRef<Recognition | null>(null),
    locked = useRef(false);
  const analyse = useAction(api.ai.analyseMeal),
    remove = useMutation(api.records.deleteMeal);
  const job = useQuery(
    api.jobs.get,
    ready ? { operationId: value.operationId } : 'skip',
  );
  useEffect(() => {
    if (!existing)
      void draftFile(fileKey)
        .then(setFile)
        .catch(() =>
          setError(
            'Your saved photo could not reopen. Choose it again; your text is kept.',
          ),
        );
  }, [fileKey, existing]);
  useEffect(() => {
    if (!file) {
      setPreview('');
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  useEffect(() => () => recognizer.current?.abort(), []);
  useEffect(() => {
    if (job?.status === 'ready' && job.output && !value.review) {
      try {
        const parsed = mealAnalysisSchema.parse(JSON.parse(job.output));
        change((old) => ({
          ...old,
          review: {
            ...parsed,
            day: old.day,
            time: old.time,
            source: old.source,
          },
        }));
        setBusy('');
      } catch {
        setError(
          'This estimate could not reopen. Retry analysis or enter it manually.',
        );
        setBusy('');
      }
    }
    if (job?.status === 'error') {
      setError(job.error ?? 'Analysis could not finish.');
      setBusy('');
    }
  }, [job, value.review, change]);
  if (!ready) return <Loading />;
  async function choose(selected?: File) {
    if (!selected) return;
    setError('');
    try {
      const prepared = await photoFile(selected);
      await draftFile(fileKey, prepared);
      setFile(prepared);
      change((old) => ({
        ...old,
        photoName: selected.name,
        source: 'photo',
        fileId: undefined,
        review: undefined,
        operationId: operationId(),
      }));
    } catch (e) {
      setError(errorMessage(e));
    }
  }
  function speak() {
    const w = window as typeof window & {
      SpeechRecognition?: new () => Recognition;
      webkitSpeechRecognition?: new () => Recognition;
    };
    const Service = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Service) {
      setError(
        'This browser has no speech service. Type a description or choose a photo.',
      );
      return;
    }
    try {
      const r = new Service();
      recognizer.current = r;
      r.lang = navigator.language || 'en-US';
      r.interimResults = true;
      r.continuous = false;
      r.onresult = (event) => {
        const text = event.results[0]?.[0]?.transcript;
        if (text)
          change((old) => ({
            ...old,
            text,
            source: 'voice',
            operationId: operationId(),
          }));
      };
      r.onerror = () => {
        setListening(false);
        setError(
          'Voice recognition could not finish. Check microphone permission or type your description.',
        );
      };
      r.onend = () => setListening(false);
      setError('');
      r.start();
      setListening(true);
    } catch {
      setListening(false);
      setError('Voice recognition is unavailable. Your description is kept.');
    }
  }
  async function run() {
    if (locked.current) return;
    if (!connected) {
      setError(
        'AI needs a connection. Your input is kept; you can enter this meal manually.',
      );
      return;
    }
    if (value.photoName && !file && !value.fileId) {
      setError('Choose your photo again, or remove it to continue with text.');
      return;
    }
    locked.current = true;
    setError('');
    try {
      let fileId = value.fileId;
      if (file && !fileId) {
        setBusy('Uploading photo…');
        fileId = await uploadFile(file, 'meal', token);
        change((old) => ({ ...old, fileId }));
      }
      setBusy('Making an editable estimate…');
      const result = await analyse({
        operationId: value.operationId,
        text: value.text,
        fileId,
      });
      if (result.status === 'error')
        setError(result.error ?? 'Analysis could not finish.');
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      locked.current = false;
      setBusy('');
    }
  }
  async function save() {
    if (locked.current || !value.review) return;
    const parsed = mealSchema.safeParse(value.review);
    if (!parsed.success) {
      setError(
        'Check the name, date, portions and nutrition values before saving.',
      );
      return;
    }
    locked.current = true;
    setBusy('Keeping your confirmed meal…');
    try {
      enqueue({
        kind: 'meal',
        operationId: value.operationId,
        meal: parsed.data,
        id: existing?._id,
        revision: existing?.revision,
        status: 'queued',
      });
      draft.clear();
      if (!existing) void draftFile(fileKey, null);
      navigate(backTo);
    } catch (e) {
      locked.current = false;
      setBusy('');
      setError(errorMessage(e));
    }
  }
  const capturing = !!busy || listening;
  const manual = () =>
    change((old) => ({
      ...old,
      operationId: operationId(),
      source: 'manual',
      review: {
        title: '',
        day: old.day,
        time: old.time,
        source: 'manual',
        items: [blankItem()],
        note: '',
      },
    }));
  const removePhoto = () => {
    void draftFile(fileKey, null);
    setFile(undefined);
    change((old) => ({
      ...old,
      photoName: undefined,
      fileId: undefined,
      source: 'text',
      operationId: operationId(),
    }));
  };
  return (
    <Sheet
      eyebrow={value.review ? (existing ? 'Saved meal' : 'Review') : 'New meal'}
      title={
        value.review
          ? existing
            ? 'Edit your meal'
            : 'Does this look right?'
          : 'What are you eating?'
      }
      subtitle={
        value.review
          ? 'Adjust anything before saving. Nothing is logged until you do.'
          : 'Snap it, say it or type it. You’ll review an estimate first.'
      }
      backTo={backTo}
      trailing={
        value.review && !existing ? (
          <Button
            icon={ArrowLeft}
            size="small"
            variant="secondary"
            disabled={!!busy}
            onClick={() =>
              change((old) => ({
                ...old,
                review: undefined,
                operationId: operationId(),
              }))
            }
          >
            Recapture
          </Button>
        ) : undefined
      }
      footer={
        value.review ? (
          <Button icon={Check} busy={!!busy} onClick={save}>
            {busy || 'Save meal'}
          </Button>
        ) : (
          <>
            <Button
              icon={Sparkles}
              busy={!!busy}
              disabled={!value.text.trim() && !value.photoName}
              onClick={run}
            >
              {busy || 'Estimate my meal'}
            </Button>
            <Button variant="ghost" size="medium" disabled={!!busy} onClick={manual}>
              Enter manually
            </Button>
          </>
        )
      }
    >
      <div className="stack">
        {error && <Banner error>{error}</Banner>}
        {value.photoName && (
          <div className={`photo-preview ${value.review ? 'small' : ''}`}>
            {preview ? (
              <img src={preview} alt="Selected meal" />
            ) : (
              <span className="photo-name">{value.photoName}</span>
            )}
            {!value.review && (
              <IconButton
                icon={X}
                label="Remove photo"
                tone="outline"
                size={38}
                disabled={!!busy}
                onClick={removePhoto}
              />
            )}
          </div>
        )}
        {value.review ? (
          <>
            <fieldset disabled={!!busy}>
              <MealReview
                meal={value.review}
                onChange={(review) => change((old) => ({ ...old, review }))}
              />
            </fieldset>
            {existing &&
              (deleting ? (
                <div className="confirm-card">
                  <h3>Delete this meal?</h3>
                  <p>Your totals for the day will update.</p>
                  <div className="two-columns">
                    <Button variant="secondary" size="medium" onClick={() => setDeleting(false)}>
                      Keep it
                    </Button>
                    <Button
                      variant="danger"
                      size="medium"
                      busy={!!busy}
                      onClick={async () => {
                        if (!connected) {
                          setError('Reconnect to delete this meal.');
                          return;
                        }
                        setBusy('Deleting…');
                        try {
                          await remove({ id: existing._id });
                          draft.clear();
                          toast('Meal removed. Your totals are updated.');
                          navigate(backTo);
                        } catch (e) {
                          setBusy('');
                          setError(errorMessage(e));
                        }
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  icon={Trash2}
                  variant="danger"
                  size="medium"
                  disabled={!!busy}
                  onClick={() => setDeleting(true)}
                >
                  Delete this meal
                </Button>
              ))}
          </>
        ) : (
          <>
            <input
              ref={camera}
              type="file"
              accept="image/*"
              capture="environment"
              hidden
              onChange={(e) => {
                void choose(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
            <input
              ref={gallery}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              hidden
              onChange={(e) => {
                void choose(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
            {!value.photoName && (
              <button
                type="button"
                className="capture-hero"
                disabled={capturing}
                onClick={() => camera.current?.click()}
              >
                <span className="capture-hero-top">
                  <span className="capture-hero-icon">
                    <Camera size={22} strokeWidth={2.2} />
                  </span>
                  <span className="eyebrow">Fastest</span>
                </span>
                <span className="capture-hero-text">
                  <strong>Take a photo</strong>
                  <small>Point at your plate. We’ll estimate each item.</small>
                </span>
              </button>
            )}
            <div className="capture-tiles">
              <button
                type="button"
                className="capture-tile"
                disabled={capturing}
                onClick={() =>
                  value.photoName ? camera.current?.click() : gallery.current?.click()
                }
              >
                <span className="capture-tile-icon">
                  {value.photoName ? (
                    <Camera size={19} strokeWidth={2.2} />
                  ) : (
                    <Images size={19} strokeWidth={2.2} />
                  )}
                </span>
                <span>
                  <strong>{value.photoName ? 'Retake' : 'Library'}</strong>
                  <small>{value.photoName ? 'Use the camera' : 'Choose a photo'}</small>
                </span>
              </button>
              <button
                type="button"
                className={`capture-tile ${listening ? 'active' : ''}`}
                disabled={!!busy}
                aria-pressed={listening}
                onClick={listening ? () => recognizer.current?.stop() : speak}
              >
                <span className="capture-tile-icon">
                  {listening ? (
                    <Square size={19} strokeWidth={2.2} />
                  ) : (
                    <Mic size={19} strokeWidth={2.2} />
                  )}
                </span>
                <span>
                  <strong>{listening ? 'Listening…' : 'Speak'}</strong>
                  <small>{listening ? 'Tap to stop' : 'Describe it aloud'}</small>
                </span>
              </button>
            </div>
            {listening && (
              <Banner tone="lime">
                Describe your meal, with amounts if you know them. Your
                browser’s speech service turns it into text.
              </Banner>
            )}
            <TextArea
              label={
                value.source === 'voice'
                  ? 'Your words — edit if needed'
                  : value.photoName
                    ? 'Add detail (optional)'
                    : 'Or type it'
              }
              placeholder="Two eggs on toast with a little butter…"
              value={value.text}
              maxLength={3000}
              disabled={!!busy}
              onChange={(e) => {
                change((old) => ({
                  ...old,
                  text: e.target.value,
                  operationId: operationId(),
                }));
                setError('');
              }}
            />
            {busy ? (
              <Banner tone="lime">
                {`${busy} You can close this sheet; your input is kept.`}
              </Banner>
            ) : (
              <p className="note-row">
                <ShieldCheck size={16} strokeWidth={2.2} />
                <span>One quick review. Nothing is saved until you confirm.</span>
              </p>
            )}
          </>
        )}
      </div>
    </Sheet>
  );
}
export function MealTotal({ meal }: { meal: MealInput }) {
  const total = totals(meal.items);
  return (
    <section
      className="meal-total"
      aria-label={`Meal total ${Math.round(total.calories)} kilocalories, ${Math.round(total.protein)} grams protein, ${Math.round(total.carbs)} grams carbs, ${Math.round(total.fat)} grams fat`}
    >
      <div>
        <span className="meal-total-label">Meal total · estimate</span>
        <p className="meal-total-kcal">
          <strong className="metric">{Math.round(total.calories).toLocaleString()}</strong>
          <span>kcal</span>
        </p>
      </div>
      <div className="meal-total-macros">
        {(
          [
            ['Protein', total.protein, 'protein'],
            ['Carbs', total.carbs, 'carbs'],
            ['Fat', total.fat, 'fat'],
          ] as const
        ).map(([label, v, col]) => (
          <div key={label}>
            <span>
              <i style={{ background: `var(--${col})` }} />
              {label}
            </span>
            <strong className="metric-sm">
              {Math.round(v)}
              <small> g</small>
            </strong>
          </div>
        ))}
      </div>
    </section>
  );
}
function MealReview({
  meal,
  onChange,
}: {
  meal: MealInput;
  onChange(meal: MealInput): void;
}) {
  const [expanded, setExpanded] = useState(-1);
  const [editDate, setEditDate] = useState(false);
  function item(index: number, patch: Partial<MealItem>) {
    onChange({
      ...meal,
      items: meal.items.map((v, i) => (i === index ? { ...v, ...patch } : v)),
    });
  }
  const validDay = /^\d{4}-\d{2}-\d{2}$/.test(meal.day);
  return (
    <div className="stack">
      <Field
        label="Meal name"
        placeholder="e.g. Paneer wrap and salad"
        value={meal.title}
        maxLength={100}
        onChange={(e) => onChange({ ...meal, title: e.target.value })}
      />
      <button
        type="button"
        className="date-pill"
        aria-expanded={editDate}
        onClick={() => setEditDate(!editDate)}
      >
        <CalendarClock size={16} strokeWidth={2.2} />
        <span>
          {validDay ? formatDay(meal.day, 'short') : meal.day} · {meal.time}
        </span>
        {editDate ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      {editDate && (
        <div className="two-columns">
          <Field
            label="Date"
            type="date"
            value={meal.day}
            onChange={(e) => onChange({ ...meal, day: e.target.value })}
          />
          <Field
            label="Time"
            type="time"
            value={meal.time}
            onChange={(e) => onChange({ ...meal, time: e.target.value })}
          />
        </div>
      )}
      <MealTotal meal={meal} />
      <div className="list-heading">
        <h2>Items</h2>
        <span>Tap an item to edit</span>
      </div>
      {meal.items.map((food, i) => {
        const open = expanded === i || !food.name;
        return (
          <div className="item-card" key={i}>
            <button
              type="button"
              className="item-head"
              aria-expanded={open}
              onClick={() => setExpanded(expanded === i ? -1 : i)}
            >
              <span>
                <strong>{food.name || `Add food ${i + 1}`}</strong>
                <small>{food.portion}</small>
              </span>
              <span className="item-kcal">
                <strong>{Math.round(food.calories * food.quantity)}</strong>
                <small>kcal</small>
              </span>
            </button>
            <div className="item-foot">
              <span className="item-macros">
                P {Math.round(food.protein * food.quantity)}g · C{' '}
                {Math.round(food.carbs * food.quantity)}g · F{' '}
                {Math.round(food.fat * food.quantity)}g
              </span>
              <span className="stepper">
                <IconButton
                  icon={Minus}
                  size={34}
                  label={`Less ${food.name || 'food'}`}
                  onClick={() =>
                    item(i, {
                      quantity: Math.max(
                        0.25,
                        Math.round((food.quantity - 0.25) * 100) / 100,
                      ),
                    })
                  }
                />
                <strong aria-label={`Quantity ${food.quantity}`}>×{food.quantity}</strong>
                <IconButton
                  icon={Plus}
                  size={34}
                  tone="ink"
                  label={`More ${food.name || 'food'}`}
                  onClick={() =>
                    item(i, {
                      quantity: Math.min(
                        100,
                        Math.round((food.quantity + 0.25) * 100) / 100,
                      ),
                    })
                  }
                />
              </span>
            </div>
            {open && (
              <div className="item-details stack">
                <Field
                  label="Food"
                  placeholder="What is it?"
                  value={food.name}
                  maxLength={100}
                  onChange={(e) => item(i, { name: e.target.value })}
                />
                <div className="two-columns wide-first">
                  <Field
                    label="One portion"
                    value={food.portion}
                    onChange={(e) => item(i, { portion: e.target.value })}
                  />
                  <NumberField
                    label="Quantity"
                    value={food.quantity}
                    onValue={(quantity) => item(i, { quantity: quantity ?? 0 })}
                  />
                </div>
                <p className="caption">Nutrition for one portion</p>
                <div className="two-columns">
                  {(['calories', 'protein', 'carbs', 'fat'] as const).map(
                    (key) => (
                      <NumberField
                        key={key}
                        label={
                          key === 'calories'
                            ? 'Energy (kcal)'
                            : `${key[0].toUpperCase() + key.slice(1)} (g)`
                        }
                        value={food[key]}
                        onValue={(n) => item(i, { [key]: n ?? 0 })}
                      />
                    ),
                  )}
                </div>
                {meal.items.length > 1 && (
                  <Button
                    variant="danger"
                    size="medium"
                    icon={Trash2}
                    onClick={() =>
                      onChange({
                        ...meal,
                        items: meal.items.filter((_, n) => n !== i),
                      })
                    }
                  >
                    Remove item
                  </Button>
                )}
              </div>
            )}
          </div>
        );
      })}
      <Button
        icon={Plus}
        variant="outline"
        size="medium"
        disabled={meal.items.length >= 30}
        onClick={() => {
          onChange({ ...meal, items: [...meal.items, blankItem()] });
          setExpanded(meal.items.length);
        }}
      >
        Add an item
      </Button>
      <TextArea
        label="Notes & assumptions"
        placeholder="Anything worth remembering about this meal"
        value={meal.note}
        maxLength={600}
        onChange={(e) => onChange({ ...meal, note: e.target.value })}
      />
      <p className="caption">
        Values are estimates, including ones you correct. Saving confirms this
        entry; it doesn’t verify nutrition accuracy.
      </p>
    </div>
  );
}
