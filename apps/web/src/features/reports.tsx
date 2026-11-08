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
  Check,
  FileUp,
  Files,
  Plus,
  ShieldCheck,
  Trash2,
  MessageCircle,
  ArrowUpRight,
} from 'lucide-react';
import {
  comparable,
  localDay,
  readingStatus,
  reportSchema,
  type Reading,
  type ReportInput,
} from '@tenday/domain';
import { api, type Id } from '../lib/backend';
import { useApp, errorMessage } from '../lib/app-state';
import { draftFile, operationId, useDraft } from '../lib/storage';
import { openSource, uploadFile } from '../lib/files';
import {
  Back,
  Banner,
  Button,
  Empty,
  Field,
  Loading,
  NumberField,
  PageTitle,
  Sheet,
  TextArea,
} from '../components/ui';
const support =
  'JPEG/PNG images or unlocked text-based PDFs, up to 3 pages and 6 MB. For scanned PDFs, choose clear page images instead.';
const blankReading = (): Reading => ({
  marker: '',
  value: '',
  unit: '',
  reference: '',
  low: null,
  high: null,
  page: null,
});
export function Reports() {
  const { results, status, loadMore } = usePaginatedQuery(
    api.records.reports,
    {},
    { initialNumItems: 20 },
  );
  return (
    <>
      <PageTitle
        title="A clearer picture."
        subtitle="Your health reports, with the context kept close."
        action={
          <Link className="button primary" to="/reports/new">
            <Plus size={19} />
            Add a report
          </Link>
        }
      />
      {status === 'LoadingFirstPage' ? (
        <Loading />
      ) : results.length ? (
        <>
          <p className="muted">Reviewed by you. Kept private.</p>
          <div className="report-grid">
            {results.map((r) => (
              <Link
                className="report-card"
                to={`/reports/${r._id}`}
                key={r._id}
              >
                <span className="row-icon">
                  <Files size={22} />
                </span>
                <span>
                  <h2>{r.report.title}</h2>
                  <p>
                    {r.day} · {r.report.readings.length} confirmed values
                  </p>
                </span>
                <ArrowUpRight size={21} />
              </Link>
            ))}
          </div>
        </>
      ) : (
        <Empty title="From report to understanding" icon={Files}>
          Add a lab report. Review the extracted values, then keep a clear
          record with its original source.
        </Empty>
      )}
      <p className="small muted">
        {support} Unconfirmed cloud uploads expire after 24 hours.
      </p>
      {status === 'CanLoadMore' && (
        <Button variant="secondary" onClick={() => loadMore(20)}>
          Earlier reports
        </Button>
      )}
    </>
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
    setBusy('Uploading your private source…');
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
      title={
        value.review ? 'Keep the details right.' : 'Your report, made clearer.'
      }
      subtitle={
        value.review
          ? 'Check every value against the source before confirming.'
          : 'Upload a short lab report. You’ll review the values before saving.'
      }
      backTo="/reports"
      footer={
        value.review ? (
          <Button icon={Check} busy={!!busy} onClick={save}>
            Confirm and save report
          </Button>
        ) : (
          <>
            <Button disabled={!value.file} busy={!!busy} onClick={run}>
              {busy || 'Extract values for review'}
            </Button>
            <Button
              disabled={!!busy}
              variant="secondary"
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
        {value.review ? (
          <>
            {value.file?.fileId && (
              <Button
                variant="secondary"
                disabled={!!busy}
                onClick={() => {
                  void openSource(
                    value.file!.fileId!,
                    value.file!.name,
                    token,
                  ).catch((e) => setError(errorMessage(e)));
                }}
              >
                Check the original source
              </Button>
            )}
            <fieldset disabled={!!busy}>
              <ReportReview
                report={value.review}
                onChange={(review) => change((old) => ({ ...old, review }))}
              />
            </fieldset>
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
              Back to source selection
            </Button>
          </>
        ) : (
          <>
            <div className="source-intro">
              <ShieldCheck size={29} />
              <h2>Your source stays attached.</h2>
              <p>
                Keep the report date, exact units and lab intervals together.
                Tenday won’t turn a result into a diagnosis.
              </p>
            </div>
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
            <Button
              icon={FileUp}
              variant="secondary"
              disabled={!!busy}
              onClick={() => input.current?.click()}
            >
              {value.file ? 'Choose a different source' : 'Choose PDF or image'}
            </Button>
            {value.file && (
              <div className="source-chip">
                <Files size={23} />
                <span>
                  <strong>{value.file.name}</strong>
                  <small>Selected, not yet confirmed.</small>
                </span>
              </div>
            )}
            <p className="muted small">{support}</p>
            <p className="small muted">
              AI reads the selected source when you tap Extract values.
              Unconfirmed cloud uploads expire after 24 hours.
            </p>
            {busy && (
              <Banner>
                {busy} You can close this dialog; your draft is kept.
              </Banner>
            )}
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
        maxLength={100}
        value={report.title}
        onChange={(e) => onChange({ ...report, title: e.target.value })}
      />
      <Field
        label="Report date"
        type="date"
        value={report.day}
        onChange={(e) => onChange({ ...report, day: e.target.value })}
      />
      <p className="small muted">
        Check against your source. Keep exact units and symbols such as “&lt;5”
        or “negative”. Leave missing intervals blank.
      </p>
      {report.readings.map((r, i) => (
        <details
          className="reading-review"
          key={i}
          open={!r.marker || undefined}
        >
          <summary>
            <strong>{r.marker || `Value ${i + 1}`}</strong>
            <span>
              {r.value || 'Not entered'} {r.unit}
            </span>
          </summary>
          <div className="stack">
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
                label="Unit (if printed)"
                value={r.unit}
                maxLength={50}
                onChange={(e) => update(i, { unit: e.target.value })}
              />
            </div>
            <Field
              label="Lab reference interval (as printed)"
              value={r.reference}
              maxLength={100}
              onChange={(e) => update(i, { reference: e.target.value })}
            />
            <div className="three-columns">
              <NumberField
                label="Lower bound"
                value={r.low}
                onValue={(low) => update(i, { low })}
              />
              <NumberField
                label="Upper bound"
                value={r.high}
                onValue={(high) => update(i, { high })}
              />
              <NumberField
                label="Source page"
                value={r.page}
                onValue={(page) => update(i, { page })}
              />
            </div>
            {report.readings.length > 1 && (
              <Button
                variant="danger"
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
        </details>
      ))}
      <Button
        icon={Plus}
        variant="secondary"
        disabled={report.readings.length >= 60}
        onClick={() =>
          onChange({
            ...report,
            readings: [...report.readings, blankReading()],
          })
        }
      >
        Add a value
      </Button>
      <TextArea
        label="Source notes & uncertainties"
        value={report.note}
        maxLength={600}
        onChange={(e) => onChange({ ...report, note: e.target.value })}
      />
      <p className="small muted">
        Save only after checking the values. “Confirmed” means you reviewed
        them, not that Tenday verified a medical interpretation.
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
  if (!report) return <Loading />;
  return (
    <>
      <Back />
      <PageTitle
        title={report.report.title}
        subtitle={`${report.day} · Values reviewed and confirmed by you`}
        action={
          <Button
            icon={MessageCircle}
            onClick={() =>
              navigate('/assistant', {
                state: { reportId: report._id, requestId: operationId() },
              })
            }
          >
            Understand this report
          </Button>
        }
      />
      {error && <Banner error>{error}</Banner>}
      {report.file && (
        <Button
          icon={Files}
          variant="secondary"
          busy={busy}
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
          Open source · {report.file.name}
        </Button>
      )}
      <Banner>
        <strong>A result is one piece of the picture.</strong>
        <p>
          Reference intervals vary by lab and method. A value inside or outside
          an interval does not establish a diagnosis. Review questions with your
          clinician.
        </p>
        <a
          className="text-link"
          href="https://medlineplus.gov/lab-tests/how-to-understand-your-lab-results/"
          target="_blank"
          rel="noreferrer"
        >
          How to read lab results · MedlinePlus
          <ArrowUpRight size={17} />
        </a>
      </Banner>
      <div className="report-grid">
        {report.report.readings.map((r, i) => {
          const status = readingStatus(r);
          const previous = report.previous.flatMap((p) =>
            p.readings
              .filter((v) => comparable(r, v))
              .map((v) => ({ day: p.day, value: v.value })),
          );
          return (
            <section className="reading-card" key={i}>
              <h2>{r.marker}</h2>
              <div className="reading-value">
                {r.value} <small>{r.unit}</small>
              </div>
              <p>
                Lab interval: {r.reference || 'Not supplied'}
                {r.page && ` · Source page ${r.page}`}
              </p>
              <p
                className={`reading-status ${status === 'above' || status === 'below' ? 'outside' : ''}`}
              >
                {status === 'unavailable'
                  ? 'No numeric comparison available.'
                  : status === 'within'
                    ? 'Within the interval supplied with this report.'
                    : `${status === 'above' ? 'Above' : 'Below'} the interval supplied with this report.`}
              </p>
              {previous.length > 0 && (
                <details>
                  <summary>Earlier values · same marker and unit</summary>
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Recorded value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previous.map((p, n) => (
                        <tr key={n}>
                          <td>{p.day}</td>
                          <td>
                            {p.value} {r.unit}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="small muted">
                    Lab methods can differ. These dated records do not establish
                    a medical trend.
                  </p>
                </details>
              )}
            </section>
          );
        })}
      </div>
      {report.report.note && <p className="muted">{report.report.note}</p>}
      {confirm ? (
        <Banner error>
          <p>Delete this report, its confirmed values and original source?</p>
          <div className="row">
            <Button
              variant="danger"
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
              Delete report & source
            </Button>
            <Button variant="secondary" onClick={() => setConfirm(false)}>
              Keep it
            </Button>
          </div>
        </Banner>
      ) : (
        <Button icon={Trash2} variant="danger" onClick={() => setConfirm(true)}>
          Delete report & source
        </Button>
      )}
    </>
  );
}
