import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAction, useMutation, useQuery } from 'convex/react';
import { useAuthToken } from '@convex-dev/auth/react';
import {
  Camera,
  ImagePlus,
  Mic,
  Square,
  Plus,
  Minus,
  Trash2,
  Check,
  Utensils,
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
  Loading,
  NumberField,
  Sheet,
  TextArea,
} from '../components/ui';

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
  return (
    <Sheet
      title={
        value.review
          ? existing
            ? 'Edit your meal'
            : 'Does this look right?'
          : 'What’s on your plate?'
      }
      subtitle={
        value.review
          ? 'You’re in charge. Adjust anything before saving.'
          : 'A photo, your voice, or a few words. Whatever is easiest.'
      }
      backTo={backTo}
      footer={
        value.review ? (
          <Button icon={Check} busy={!!busy} onClick={save}>
            Save meal
          </Button>
        ) : (
          <>
            <Button
              busy={!!busy}
              disabled={!value.text.trim() && !value.photoName}
              onClick={run}
            >
              {busy || 'Review my meal'}
            </Button>
            <Button
              variant="secondary"
              disabled={!!busy}
              onClick={() =>
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
                }))
              }
            >
              Enter manually
            </Button>
          </>
        )
      }
    >
      <div className="stack">
        {error && <Banner error>{error}</Banner>}
        {value.review ? (
          <>
            <fieldset disabled={!!busy}>
              <MealReview
                meal={value.review}
                onChange={(review) => change((old) => ({ ...old, review }))}
              />
            </fieldset>
            {existing ? (
              deleting ? (
                <Banner>
                  <p>Delete this meal and update your totals?</p>
                  <div className="row">
                    <Button
                      variant="danger"
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
                      Delete meal
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => setDeleting(false)}
                    >
                      Keep it
                    </Button>
                  </div>
                </Banner>
              ) : (
                <Button
                  variant="danger"
                  disabled={!!busy}
                  onClick={() => setDeleting(true)}
                >
                  Delete this meal
                </Button>
              )
            ) : (
              <Button
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
                Back to capture
              </Button>
            )}
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
            <Button
              icon={Camera}
              variant="quiet"
              disabled={!!busy || listening}
              onClick={() => camera.current?.click()}
            >
              Take a photo
            </Button>
            <div className="two-columns">
              <Button
                icon={ImagePlus}
                variant="secondary"
                disabled={!!busy || listening}
                onClick={() => gallery.current?.click()}
              >
                Choose photo
              </Button>
              <Button
                icon={listening ? Square : Mic}
                variant="secondary"
                disabled={!!busy}
                onClick={listening ? () => recognizer.current?.stop() : speak}
              >
                {listening ? 'Stop listening' : 'Speak'}
              </Button>
            </div>
            {listening && (
              <Banner>
                Listening… Your browser’s speech service turns your description
                into an editable transcript.
              </Banner>
            )}
            {value.photoName && (
              <div className="photo-card">
                {preview ? (
                  <img src={preview} alt="Selected meal" />
                ) : (
                  <p>{value.photoName}</p>
                )}
                <Button
                  variant="secondary"
                  disabled={!!busy}
                  onClick={() => {
                    void draftFile(fileKey, null);
                    setFile(undefined);
                    change((old) => ({
                      ...old,
                      photoName: undefined,
                      fileId: undefined,
                      source: 'text',
                      operationId: operationId(),
                    }));
                  }}
                >
                  Remove photo
                </Button>
              </div>
            )}
            <TextArea
              label={
                value.source === 'voice'
                  ? 'Your transcript — edit if needed'
                  : 'Or describe your meal'
              }
              placeholder="Two eggs on toast, with a little butter…"
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
            <p className="caption">
              <Utensils size={18} />
              One review. Nothing saved until you say so.
            </p>
            {busy && (
              <Banner>
                {busy} You can close this dialog; your input is kept.
              </Banner>
            )}
          </>
        )}
      </div>
    </Sheet>
  );
}
function MealReview({
  meal,
  onChange,
}: {
  meal: MealInput;
  onChange(meal: MealInput): void;
}) {
  const total = totals(meal.items);
  function item(index: number, patch: Partial<MealItem>) {
    onChange({
      ...meal,
      items: meal.items.map((v, i) => (i === index ? { ...v, ...patch } : v)),
    });
  }
  return (
    <div className="stack">
      <Field
        label="Meal name"
        value={meal.title}
        maxLength={100}
        onChange={(e) => onChange({ ...meal, title: e.target.value })}
      />
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
      <p className="small muted">
        Check the food and portions. Expand an item to edit its nutrition
        estimate.
      </p>
      {meal.items.map((food, i) => (
        <div className="food-card" key={i}>
          <details open={!food.name || undefined}>
            <summary>
              <span>
                <strong>{food.name || `Add food ${i + 1}`}</strong>
                <small>
                  {food.quantity} × {food.portion}
                </small>
              </span>
              <strong>
                {Math.round(food.calories * food.quantity)} <small>kcal</small>
              </strong>
            </summary>
            <div className="stack food-details">
              <Field
                label={`Food ${i + 1}`}
                value={food.name}
                maxLength={100}
                onChange={(e) => item(i, { name: e.target.value })}
              />
              <div className="two-columns">
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
              <p className="small muted">Nutrition per one portion</p>
              <div className="nutrition-inputs">
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
          </details>
          <div className="quantity-row">
            <span>Adjust quantity</span>
            <div className="row">
              <button
                className="icon-button"
                aria-label={`Less ${food.name || 'food'}`}
                onClick={() =>
                  item(i, {
                    quantity: Math.max(
                      0.25,
                      Math.round((food.quantity - 0.25) * 100) / 100,
                    ),
                  })
                }
              >
                <Minus size={18} />
              </button>
              <strong>{food.quantity}</strong>
              <button
                className="icon-button"
                aria-label={`More ${food.name || 'food'}`}
                onClick={() =>
                  item(i, {
                    quantity: Math.min(
                      100,
                      Math.round((food.quantity + 0.25) * 100) / 100,
                    ),
                  })
                }
              >
                <Plus size={18} />
              </button>
            </div>
          </div>
        </div>
      ))}
      <Button
        icon={Plus}
        variant="secondary"
        disabled={meal.items.length >= 30}
        onClick={() =>
          onChange({ ...meal, items: [...meal.items, blankItem()] })
        }
      >
        Add food
      </Button>
      <div className="review-total">
        <strong>Meal estimate</strong>
        <strong>{Math.round(total.calories)} kcal</strong>
        <span>
          {Math.round(total.protein)} g protein · {Math.round(total.carbs)} g
          carbs · {Math.round(total.fat)} g fat
        </span>
      </div>
      <TextArea
        label="Notes & uncertain estimates"
        value={meal.note}
        maxLength={600}
        onChange={(e) => onChange({ ...meal, note: e.target.value })}
      />
      <p className="small muted">
        Portions and nutrition are estimates, including hidden oils and
        ingredients. Saving confirms your review, not measurement accuracy.
      </p>
    </div>
  );
}
