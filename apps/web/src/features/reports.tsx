import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  useAction,
  useMutation,
  usePaginatedQuery,
  useQuery,
} from 'convex/react';
import { useAuthToken } from '@convex-dev/auth/react';
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  ExternalLink,
  FileText,
  FileUp,
  FlaskConical,
  Info,
  LoaderCircle,
  PenLine,
  Plus,
  ShieldCheck,
  Sparkles,
  Trash2,
} from 'lucide-react';
import {
  comparable,
  localDay,
  readingStatus,
  reportSchema,
  type Reading,
  type ReportInput,
} from '@tenday/domain';
import { api, type Doc, type Id } from '../lib/backend';
import { useIdentity } from '../../../mobile/src/lib/auth-session';
import { useApp, errorMessage } from '../lib/app-state';
import { draftFile, operationId, useDraft } from '../lib/storage';
import { openSource, uploadFile } from '../lib/files';
import {
  Back,
  Banner,
  Button,
  ButtonLink,
  Empty,
  Field,
  Group,
  IconButton,
  LinkButton,
  Loading,
  NumberField,
  PageTitle,
  Section,
  Sheet,
  TextArea,
} from '../components/ui';
import { AccountBar } from '../components/shell';
import { ConnectionBanner } from './today';
import { RangeBar, StatusChip, statusCounts } from './reading';
import { formatDay } from '../lib/format';

const blankReading = (): Reading => ({
  marker: '',
  value: '',
  unit: '',
  reference: '',
  low: null,
  high: null,
  page: null,
});
const STEPS = [
  ['Upload', 'A short lab PDF or a clear photo'],
  ['Review', 'Check each value against the source'],
  ['Keep', 'Saved with its original, privately'],
] as const;

function LeadReport({ r }: { r: Doc<'reports'> }) {
  const n = statusCounts(r.report.readings);
  const count = r.report.readings.length;
  return (
    <Link
      className="lead-report"
      to={`/reports/${r._id}`}
      aria-label={`Latest report: ${r.report.title}, ${formatDay(r.day)}, ${count} values. Open`}
    >
      <span className="lead-top">
        <span className="eyebrow">Latest · {formatDay(r.day, 'short')}</span>
        <span className="lead-arrow">
          <ArrowUpRight size={18} strokeWidth={2.4} />
        </span>
      </span>
      <h2>{r.report.title}</h2>
      <span className="lead-stats">
        {(
          [
            [count, 'values'],
            [n.within, 'in range'],
            [n.outside, 'outside'],
          ] as const
        ).map(([v, label]) => (
          <span key={label}>
            <strong className="metric-sm">{v}</strong>
            <small>{label}</small>
          </span>
        ))}
      </span>
    </Link>
  );
}
function ReportRow({ r }: { r: Doc<'reports'> }) {
  const count = r.report.readings.length;
  return (
    <Link className="row-button" to={`/reports/${r._id}`}>
      <span className="row-tile large">
        <FileText size={20} strokeWidth={2} />
      </span>
      <span className="row-text">
        <strong>{r.report.title}</strong>
        <small>
          {formatDay(r.day)} · {count} {count === 1 ? 'value' : 'values'}
        </small>
      </span>
      {statusCounts(r.report.readings).outside > 0 && (
        <i className="outside-dot" aria-label="Has values outside range" />
      )}
      <ChevronRight size={18} className="muted-icon" />
    </Link>
  );
}
export function Reports() {
  const { account } = useIdentity();
  const { results, status, loadMore } = usePaginatedQuery(
    api.records.reports,
    {},
    { initialNumItems: 20 },
  );
  const [lead, ...rest] = results;
  return (
    <div className="page">
      <AccountBar />
      <PageTitle
        eyebrow="Health records"
        title="Reports"
        action={
          results.length > 0 ? (
            <ButtonLink to="/reports/new" icon={Plus} size="small">
              Add
            </ButtonLink>
          ) : undefined
        }
      />
      <ConnectionBanner />
      {status === 'LoadingFirstPage' ? (
        <Loading>Opening your reports…</Loading>
      ) : results.length === 0 ? (
        <Empty
          title="From report to understanding"
          icon={FlaskConical}
          action={
            <ButtonLink to="/reports/new" icon={Plus}>
              Add your first report
            </ButtonLink>
          }
        >
          Add a lab report. You’ll check the extracted values, then keep a
          clear record with its original source.
        </Empty>
      ) : (
        <div className="reports-grid">
          <div className="reports-lead">
            <LeadReport r={lead} />
          </div>
          {rest.length > 0 && (
            <div className="reports-rest">
              <Section title="Earlier" />
              <Group>
                {rest.map((r) => (
                  <ReportRow key={r._id} r={r} />
                ))}
              </Group>
            </div>
          )}
        </div>
      )}
      {status === 'CanLoadMore' && (
        <Button variant="secondary" size="medium" onClick={() => loadMore(20)}>
          Earlier reports
        </Button>
      )}
      <p className="note-row spaced">
        <ShieldCheck size={16} strokeWidth={2.2} />
        <span>
          {account?.demo
            ? 'Shared demo reports with fictional values. '
            : 'Reviewed by you and kept private. '}
          JPEG/PNG images or text PDFs up to 3 pages and 6 MB. Unconfirmed
          uploads expire after 24 hours.
        </span>
      </p>
    </div>
  );
}
type Draft = {
  operationId: string;
  file?: { name: string; mime: string; fileId?: Id<'files'> };
  review?: ReportInput;
};
export function AddReport() {
  const navigate = useNavigate(),
    token = useAuthToken(),
    { sessionId, connected, enqueue } = useApp();
  const fileKey = `${sessionId}:report`;
  const draft = useDraft<Draft>(`tenday:web:report:${sessionId}`, {
    operationId: operationId(),
  });
  const { value, change, ready } = draft;
  const [file, setFile] = useState<File>(),
    [busy, setBusy] = useState(''),
    [error, setError] = useState('');
  const input = useRef<HTMLInputElement>(null),
    locked = useRef(false);
  const analyse = useAction(api.ai.analyseReport);
  const job = useQuery(
    api.jobs.get,
    ready ? { operationId: value.operationId } : 'skip',
  );
  useEffect(() => {
    void draftFile(fileKey)
      .then(setFile)
      .catch(() =>
        setError(
          'The source could not reopen. Choose it again; your reviewed values are kept.',
        ),
      );
  }, [fileKey]);
  useEffect(() => {
    if (job?.status === 'ready' && job.output && !value.review) {
      try {
        const review = reportSchema.parse(JSON.parse(job.output));
        change((old) => ({ ...old, review }));
        setBusy('');
      } catch {
        setError(
          'This draft could not reopen. Retry analysis or enter the values manually.',
        );
        setBusy('');
      }
    }
    if (job?.status === 'error') {
      setBusy('');
      setError(job.error ?? 'The report could not be read.');
    }
  }, [job, value.review, change]);
  if (!ready) return <Loading />;
  async function choose(selected?: File) {
    if (!selected) return;
    if (
      !['application/pdf', 'image/jpeg', 'image/png'].includes(selected.type)
    ) {
      setError('Choose a PDF, JPEG or PNG report.');
      return;
    }
    if (selected.size > 6 * 1024 * 1024) {
      setError('Choose a report smaller than 6 MB.');
      return;
    }
    try {
      await draftFile(fileKey, selected);
      setFile(selected);
      change({
        operationId: operationId(),
        file: { name: selected.name, mime: selected.type },
      });
      setError('');
    } catch (e) {
      setError(errorMessage(e));
    }
  }
  async function attach() {
    if (!value.file) return undefined;
    if (value.file.fileId) return value.file.fileId;
    if (!file)
      throw new Error(
        'Choose the original file again before attaching it. Your reviewed values are kept.',
      );
    if (!connected)
      throw new Error(
        'Reconnect to attach the source. Your selected file and values are kept.',
      );
    const fileId = await uploadFile(file, 'report', token);
    change((old) => ({ ...old, file: { ...old.file!, fileId } }));
    return fileId;
  }
  async function run() {
    if (locked.current || !value.file) return;
    if (!connected) {
      setError(
        'Reconnect to extract the report. The selected source is kept here.',
      );
      return;
    }
    locked.current = true;
    setBusy('Uploading your source…');
    setError('');
    try {
      const fileId = await attach();
      if (!fileId) throw new Error('Choose a report first.');
      setBusy('Reading values for your review…');
      const result = await analyse({
        operationId: value.operationId,
        fileId,
        day: localDay(),
      });
      if (result.status === 'error')
        setError(result.error ?? 'Try again or enter values manually.');
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy('');
      locked.current = false;
    }
  }
  async function save() {
    if (locked.current || !value.review) return;
    const parsed = reportSchema.safeParse(value.review);
    if (!parsed.success) {
      setError(
        'Check the report date and each value, unit, interval and source page.',
      );
      return;
    }
    locked.current = true;
    setBusy('Keeping your confirmed report…');
    setError('');
    try {
      const fileId = await attach();
      enqueue({
        kind: 'report',
        operationId: value.operationId,
        report: parsed.data,
        fileId,
        status: 'queued',
      });
      draft.clear();
      void draftFile(fileKey, null);
      navigate('/reports');
    } catch (e) {
      setBusy('');
      locked.current = false;
      setError(errorMessage(e));
    }
  }
  return (
    <Sheet
      eyebrow={value.review ? 'Review' : 'New report'}
      title={value.review ? 'Check every value' : 'Add a lab report'}
      subtitle={
        value.review
          ? 'Compare with the source before confirming. Keep exact units and symbols.'
          : 'We’ll read the values for you to review. Nothing is saved until you confirm.'
      }
      backTo="/reports"
      trailing={
        value.review ? (
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
            Source
          </Button>
        ) : undefined
      }
      footer={
        value.review ? (
          <Button icon={Check} busy={!!busy} onClick={save}>
            {busy || 'Confirm and save'}
          </Button>
        ) : (
          <>
            <Button
              icon={Sparkles}
              disabled={!value.file}
              busy={!!busy}
              onClick={run}
            >
              {busy || 'Read values'}
            </Button>
            <Button
              disabled={!!busy}
              variant="ghost"
              size="medium"
              onClick={() =>
                change((old) => ({
                  ...old,
                  operationId: operationId(),
                  review: {
                    title: '',
                    day: localDay(),
                    readings: [blankReading()],
                    note: '',
                  },
                }))
              }
            >
              Enter values manually
            </Button>
          </>
        )
      }
    >
      <div className="stack">
        {error && <Banner error>{error}</Banner>}
        <input
          hidden
          ref={input}
          type="file"
          accept="application/pdf,image/jpeg,image/png"
          onChange={(e) => {
            void choose(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
        {value.review ? (
          <>
            {value.file?.fileId && (
              <Group>
                <button
                  type="button"
                  className="row-button"
                  disabled={!!busy}
                  onClick={() => {
                    void openSource(
                      value.file!.fileId!,
                      value.file!.name,
                      token,
                    ).catch((e) => setError(errorMessage(e)));
                  }}
                >
                  <span className="row-tile">
                    <FileText size={20} strokeWidth={2} />
                  </span>
                  <span className="row-text">
                    <strong>Check the original</strong>
                    <small>{value.file.name}</small>
                  </span>
                  <ExternalLink size={18} className="muted-icon" />
                </button>
              </Group>
            )}
            <fieldset disabled={!!busy}>
              <ReportReview
                report={value.review}
                onChange={(review) => change((old) => ({ ...old, review }))}
              />
            </fieldset>
          </>
        ) : (
          <>
            {value.file ? (
              <div className="file-card">
                <span className="file-icon">
                  <FileText size={22} strokeWidth={2.2} />
                </span>
                <span className="row-text">
                  <strong>{value.file.name}</strong>
                  <small>
                    {value.file.fileId
                      ? 'Uploaded · not saved yet'
                      : 'Selected · not saved yet'}
                  </small>
                </span>
                {!busy && (
                  <LinkButton chevron={false} onClick={() => input.current?.click()}>
                    Change
                  </LinkButton>
                )}
              </div>
            ) : (
              <button
                type="button"
                className="dropzone"
                disabled={!!busy}
                onClick={() => input.current?.click()}
              >
                <span className="dropzone-icon">
                  <FileUp size={24} strokeWidth={2.2} />
                </span>
                <strong>Choose a PDF or image</strong>
                <small>JPEG or PNG, or a text-based PDF · up to 3 pages, 6 MB</small>
              </button>
            )}
            {busy && (
              <Banner tone="lime">
                {`${busy} You can close this sheet; your draft is kept.`}
              </Banner>
            )}
            <ol className="steps">
              {STEPS.map(([title, body], i) => (
                <li key={title} className={i === 0 ? 'on' : ''}>
                  <span className="step-num">{i + 1}</span>
                  <span>
                    <strong>{title}</strong>
                    <small>{body}</small>
                  </span>
                </li>
              ))}
            </ol>
            <p className="note-row">
              <ShieldCheck size={16} strokeWidth={2.2} />
              <span>
                AI reads only the file you choose, when you tap Read values. For
                scanned PDFs, use clear page photos. Unconfirmed uploads expire
                after 24 hours. Tenday never turns a result into a diagnosis.
              </span>
            </p>
          </>
        )}
      </div>
    </Sheet>
  );
}
function ReportReview({
  report,
  onChange,
}: {
  report: ReportInput;
  onChange(value: ReportInput): void;
}) {
  const [expanded, setExpanded] = useState(-1);
  function update(index: number, patch: Partial<Reading>) {
    onChange({
      ...report,
      readings: report.readings.map((r, i) =>
        i === index ? { ...r, ...patch } : r,
      ),
    });
  }
  return (
    <div className="stack">
      <Field
        label="Report title"
        placeholder="e.g. Annual blood panel"
        maxLength={100}
        value={report.title}
        onChange={(e) => onChange({ ...report, title: e.target.value })}
      />
      <Field
        label="Report date"
        type="date"
        hint="As printed on the report"
        value={report.day}
        onChange={(e) => onChange({ ...report, day: e.target.value })}
      />
      <div className="list-heading">
        <h2>
          Values <span className="muted">{report.readings.length}</span>
        </h2>
        <span>Tap to check</span>
      </div>
      <p className="caption">
        Keep symbols such as “&lt;5” or “negative”. Leave missing intervals
        blank.
      </p>
      {report.readings.map((r, i) => {
        const open = expanded === i || !r.marker;
        return (
          <div className="item-card" key={i}>
            <button
              type="button"
              className="item-head"
              aria-expanded={open}
              onClick={() => setExpanded(expanded === i ? -1 : i)}
            >
              <span>
                <strong>{r.marker || `Value ${i + 1}`}</strong>
                {r.reference && <small>Interval {r.reference}</small>}
              </span>
              <span className="item-kcal">
                <strong>
                  {r.value || '—'} <small>{r.unit}</small>
                </strong>
                {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </span>
            </button>
            {!open && r.value && <StatusChip reading={r} />}
            {open && (
              <div className="item-details stack">
                <Field
                  label="Marker name"
                  value={r.marker}
                  maxLength={100}
                  onChange={(e) => update(i, { marker: e.target.value })}
                />
                <div className="two-columns">
                  <Field
                    label="Exact result"
                    value={r.value}
                    maxLength={80}
                    onChange={(e) => update(i, { value: e.target.value })}
                  />
                  <Field
                    label="Unit"
                    hint="If printed"
                    value={r.unit}
                    maxLength={50}
                    onChange={(e) => update(i, { unit: e.target.value })}
                  />
                </div>
                <Field
                  label="Lab reference interval"
                  hint="As printed on the report"
                  value={r.reference}
                  maxLength={100}
                  onChange={(e) => update(i, { reference: e.target.value })}
                />
                <div className="three-columns">
                  <NumberField
                    label="Lower bound"
                    hint="Optional"
                    value={r.low}
                    onValue={(low) => update(i, { low })}
                  />
                  <NumberField
                    label="Upper bound"
                    hint="Optional"
                    value={r.high}
                    onValue={(high) => update(i, { high })}
                  />
                  <NumberField
                    label="Source page"
                    hint="1–3"
                    value={r.page}
                    onValue={(page) => update(i, { page })}
                  />
                </div>
                {report.readings.length > 1 && (
                  <Button
                    variant="danger"
                    size="medium"
                    icon={Trash2}
                    onClick={() =>
                      onChange({
                        ...report,
                        readings: report.readings.filter((_, n) => n !== i),
                      })
                    }
                  >
                    Remove value
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
        disabled={report.readings.length >= 60}
        onClick={() => {
          onChange({
            ...report,
            readings: [...report.readings, blankReading()],
          });
          setExpanded(report.readings.length);
        }}
      >
        Add a value
      </Button>
      <TextArea
        label="Source notes & uncertainties"
        placeholder="Anything unclear on the original"
        value={report.note}
        maxLength={600}
        onChange={(e) => onChange({ ...report, note: e.target.value })}
      />
      <p className="caption">
        “Confirmed” means you reviewed these values, not that Tenday verified a
        medical interpretation.
      </p>
    </div>
  );
}
export function ReportDetail() {
  const { id } = useParams(),
    navigate = useNavigate(),
    token = useAuthToken();
  const report = useQuery(api.records.report, { id: id as Id<'reports'> });
  const remove = useMutation(api.records.deleteReport);
  const { connected, toast } = useApp();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [confirm, setConfirm] = useState(false);
  if (!report) return <Loading>Opening report…</Loading>;
  const counts = statusCounts(report.report.readings);
  const understand = () =>
    navigate('/assistant', {
      state: { reportId: report._id, requestId: operationId() },
    });
  return (
    <div className="page report-detail">
      <div className="page-top">
        <Back />
        <IconButton
          icon={Trash2}
          label="Delete report and source"
          onClick={() => setConfirm(true)}
        />
      </div>
      <PageTitle
        eyebrow={`${formatDay(report.day)} · Confirmed by you`}
        title={report.report.title}
        action={
          <Button icon={Sparkles} className="desktop-only" onClick={understand}>
            Understand this report
          </Button>
        }
      />
      <div className="detail-grid">
        <div className="detail-main stack">
          {error && <Banner error>{error}</Banner>}
          {confirm && (
            <div className="confirm-card">
              <h3>Delete this report and its source?</h3>
              <p>
                Its readings will be removed from future guidance. Earlier
                conversation messages can be cleared in Assistant.
              </p>
              <div className="two-columns">
                <Button variant="secondary" size="medium" onClick={() => setConfirm(false)}>
                  Keep
                </Button>
                <Button
                  variant="danger"
                  size="medium"
                  busy={busy}
                  onClick={async () => {
                    if (!connected) {
                      setError('Reconnect to delete this report.');
                      return;
                    }
                    setBusy(true);
                    try {
                      await remove({ id: report._id });
                      toast('Report and source removed.');
                      navigate('/reports');
                    } catch (e) {
                      setBusy(false);
                      setError(errorMessage(e));
                    }
                  }}
                >
                  Delete
                </Button>
              </div>
            </div>
          )}
          <div className="summary-tiles">
            {(
              [
                ['In range', counts.within, 'success'],
                ['Outside', counts.outside, 'warning'],
                ['No range', counts.unavailable, 'neutral'],
              ] as const
            ).map(([label, n, tone]) => (
              <div key={label} className={`summary-tile tone-${tone}`} aria-label={`${n} ${label}`}>
                <strong className="metric-sm">{n}</strong>
                <small>{label}</small>
              </div>
            ))}
          </div>
          {report.file ? (
            <Group>
              <button
                type="button"
                className="row-button"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  setError('');
                  try {
                    await openSource(report.file!.id, report.file!.name, token);
                  } catch (e) {
                    setError(errorMessage(e));
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                <span className="row-tile">
                  <FileText size={20} strokeWidth={2} />
                </span>
                <span className="row-text">
                  <strong>Original source</strong>
                  <small>{busy ? 'Opening…' : report.file.name}</small>
                </span>
                {busy ? (
                  <LoaderCircle className="spin" size={18} />
                ) : (
                  <ExternalLink size={18} className="muted-icon" />
                )}
              </button>
            </Group>
          ) : (
            <Banner title="Entered manually">
              No original file is attached to these values.
            </Banner>
          )}
          <Section
            title="Results"
            subtitle="Exact values with the lab’s own intervals"
          />
          <div className="results-grid">
            {report.report.readings.map((r, i) => {
              const status = readingStatus(r);
              const outside = status === 'above' || status === 'below';
              const previous = report.previous
                .flatMap((p) =>
                  p.readings
                    .filter((v) => comparable(r, v))
                    .map((v) => ({ day: p.day, value: v.value })),
                )
                .slice(0, 4);
              return (
                <section className="reading-card" key={i}>
                  <div className="reading-head">
                    <div>
                      <h3>{r.marker}</h3>
                      <StatusChip reading={r} />
                    </div>
                    <div className={`reading-value ${outside ? 'outside' : ''}`}>
                      <strong className="metric-sm">{r.value}</strong>
                      {r.unit && <small>{r.unit}</small>}
                    </div>
                  </div>
                  <RangeBar reading={r} />
                  <p className="caption">
                    Lab interval: {r.reference || 'Not supplied'}
                    {r.page ? ` · Page ${r.page}` : ''}
                  </p>
                  {previous.length > 0 && (
                    <div className="earlier">
                      <small>Earlier · same marker and unit</small>
                      <div className="earlier-pills">
                        {previous.map((p, n) => (
                          <span key={n}>
                            {formatDay(p.day, 'short')} · <b>{p.value}</b>
                          </span>
                        ))}
                      </div>
                      <small className="muted">
                        Methods may differ between labs; a few readings don’t
                        establish a trend.
                      </small>
                    </div>
                  )}
                </section>
              );
            })}
          </div>
          {report.report.note && (
            <p className="note-row">
              <PenLine size={15} />
              <span>{report.report.note}</span>
            </p>
          )}
        </div>
        <aside className="detail-side">
          <section className="keep-card">
            <span className="eyebrow lime-ink">
              <Info size={15} strokeWidth={2.4} />
              Keep in mind
            </span>
            <h3>A result is one piece of the picture.</h3>
            <p>
              Intervals vary by lab and method. A value inside or outside one
              doesn’t establish a diagnosis. Review questions with your
              clinician.
            </p>
            <a
              className="link-button"
              href="https://medlineplus.gov/lab-tests/how-to-understand-your-lab-results/"
              target="_blank"
              rel="noreferrer"
            >
              How to read lab results · MedlinePlus
              <ArrowUpRight size={16} />
            </a>
          </section>
        </aside>
      </div>
      <div className="sticky-cta mobile-only">
        <Button icon={Sparkles} onClick={understand}>
          Understand this report
        </Button>
      </div>
    </div>
  );
}
