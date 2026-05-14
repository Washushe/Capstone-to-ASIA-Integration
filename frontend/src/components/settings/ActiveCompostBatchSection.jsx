import { useEffect, useMemo, useState } from 'react';
import {
  createCompostBatch,
  getActiveCompostBatch,
  getCompostBatches,
  setActiveCompostBatch,
  updateCompostBatch,
  updateCompostBatchStatus,
} from '../../services/api.js';

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

function emptyForm() {
  return {
    batchName: '',
    primaryMaterial: '',
    materialDescription: '',
    startDate: todayString(),
    expectedDurationDays: 30,
    binLocation: '',
    notes: '',
  };
}

function formFromBatch(batch) {
  if (!batch) return emptyForm();

  return {
    batchName: batch.batchName || '',
    primaryMaterial: batch.primaryMaterial || '',
    materialDescription: batch.materialDescription || '',
    startDate: batch.startDate || todayString(),
    expectedDurationDays: batch.expectedDurationDays || 30,
    binLocation: batch.binLocation || '',
    notes: batch.notes || '',
  };
}

function formatDate(value) {
  if (!value) return 'Not set';
  return value;
}

function ActiveCompostBatchSection() {
  const [activeBatch, setActiveBatch] = useState(null);
  const [batches, setBatches] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState(null);
  const [form, setForm] = useState(() => emptyForm());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const selectedBatch = useMemo(
    () => batches.find((batch) => batch.batchId === selectedBatchId) || activeBatch,
    [activeBatch, batches, selectedBatchId]
  );

  async function loadBatches() {
    setLoading(true);
    setError('');

    try {
      const [batchList, active] = await Promise.all([
        getCompostBatches(),
        getActiveCompostBatch().catch(() => null),
      ]);

      const list = Array.isArray(batchList) ? batchList : [];
      const currentActive = active || list.find((batch) => batch.status === 'ACTIVE') || null;

      setBatches(list);
      setActiveBatch(currentActive);
      setSelectedBatchId(currentActive?.batchId || list[0]?.batchId || null);
      setForm(formFromBatch(currentActive || list[0]));
    } catch (err) {
      setError(err.message || 'Failed to load compost batches.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBatches();
  }, []);

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function selectBatch(batch) {
    setSelectedBatchId(batch.batchId);
    setForm(formFromBatch(batch));
    setMessage('');
    setError('');
  }

  async function handleCreateBatch(event) {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    try {
      const created = await createCompostBatch({
        ...form,
        expectedDurationDays: Number(form.expectedDurationDays),
      });
      setMessage(`${created.batchCode} is now active.`);
      await loadBatches();
    } catch (err) {
      setError(err.message || 'Failed to create compost batch.');
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateBatch() {
    if (!selectedBatch?.batchId) {
      setError('Select a compost batch first.');
      return;
    }

    setSaving(true);
    setMessage('');
    setError('');

    try {
      const updated = await updateCompostBatch(selectedBatch.batchId, {
        ...form,
        expectedDurationDays: Number(form.expectedDurationDays),
      });
      setMessage(`${updated.batchCode} was updated.`);
      await loadBatches();
    } catch (err) {
      setError(err.message || 'Failed to update compost batch.');
    } finally {
      setSaving(false);
    }
  }

  async function handleSetActive(batchId) {
    setSaving(true);
    setMessage('');
    setError('');

    try {
      const updated = await setActiveCompostBatch(batchId);
      setMessage(`${updated.batchCode} is now active.`);
      await loadBatches();
    } catch (err) {
      setError(err.message || 'Failed to set active batch.');
    } finally {
      setSaving(false);
    }
  }

  async function handleStatus(status) {
    if (!selectedBatch?.batchId) {
      setError('Select a compost batch first.');
      return;
    }

    setSaving(true);
    setMessage('');
    setError('');

    try {
      const updated = await updateCompostBatchStatus(selectedBatch.batchId, status);
      setMessage(`${updated.batchCode} status changed to ${updated.status}.`);
      await loadBatches();
    } catch (err) {
      setError(err.message || 'Failed to update batch status.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="info-box settings-full-box">
        <h4>Active Compost Batch</h4>
        <p>Loading compost batches...</p>
      </div>
    );
  }

  return (
    <div className="info-box active-batch-section">
      <div className="active-batch-header">
        <div>
          <h4>Active Compost Batch</h4>
          <p className="note-text">
            {activeBatch
              ? `${activeBatch.batchCode} - ${activeBatch.batchName}`
              : 'No active compost batch'}
          </p>
        </div>
        <span className={`batch-status-pill ${activeBatch ? 'active' : 'inactive'}`}>
          {activeBatch?.status || 'NONE'}
        </span>
      </div>

      {message && <p className="form-message success">{message}</p>}
      {error && <p className="form-message error">{error}</p>}

      {activeBatch && (
        <div className="active-batch-summary">
          <div>
            <span>Primary material</span>
            <strong>{activeBatch.primaryMaterial}</strong>
          </div>
          <div>
            <span>Start date</span>
            <strong>{formatDate(activeBatch.startDate)}</strong>
          </div>
          <div>
            <span>Estimated ready</span>
            <strong>{formatDate(activeBatch.latestPredictedReadyDate || activeBatch.initialEstimatedReadyDate)}</strong>
          </div>
          <div>
            <span>Bin location</span>
            <strong>{activeBatch.binLocation || 'Not set'}</strong>
          </div>
        </div>
      )}

      <form className="batch-form" onSubmit={handleCreateBatch}>
        <div className="batch-form-grid">
          <label>
            Batch name
            <input
              type="text"
              value={form.batchName}
              onChange={(event) => updateField('batchName', event.target.value)}
            />
          </label>

          <label>
            Primary material
            <input
              type="text"
              value={form.primaryMaterial}
              onChange={(event) => updateField('primaryMaterial', event.target.value)}
            />
          </label>

          <label>
            Start date
            <input
              type="date"
              value={form.startDate}
              onChange={(event) => updateField('startDate', event.target.value)}
            />
          </label>

          <label>
            Expected duration days
            <input
              type="number"
              min="1"
              value={form.expectedDurationDays}
              onChange={(event) => updateField('expectedDurationDays', event.target.value)}
            />
          </label>

          <label>
            Bin location
            <input
              type="text"
              value={form.binLocation}
              onChange={(event) => updateField('binLocation', event.target.value)}
            />
          </label>

          <label>
            Material description
            <textarea
              value={form.materialDescription}
              onChange={(event) => updateField('materialDescription', event.target.value)}
            />
          </label>

          <label className="batch-notes-field">
            Notes
            <textarea
              value={form.notes}
              onChange={(event) => updateField('notes', event.target.value)}
            />
          </label>
        </div>

        <div className="batch-action-row">
          <button type="submit" className="primary-button" disabled={saving}>
            {saving ? 'Saving...' : 'Create Batch'}
          </button>
          <button type="button" className="secondary-button" onClick={handleUpdateBatch} disabled={saving}>
            Update Batch
          </button>
          <button type="button" className="secondary-button" onClick={() => handleStatus('READY')} disabled={saving}>
            Mark READY
          </button>
          <button type="button" className="secondary-button" onClick={() => handleStatus('COMPLETED')} disabled={saving}>
            Mark COMPLETED
          </button>
          <button type="button" className="secondary-button" onClick={() => handleStatus('CANCELLED')} disabled={saving}>
            Mark CANCELLED
          </button>
        </div>
      </form>

      {batches.length > 0 && (
        <div className="batch-list">
          {batches.map((batch) => (
            <div
              key={batch.batchId}
              className={`batch-list-row ${batch.batchId === selectedBatch?.batchId ? 'selected' : ''}`}
            >
              <button type="button" className="batch-select-button" onClick={() => selectBatch(batch)}>
                <strong>{batch.batchCode}</strong>
                <span>{batch.batchName}</span>
              </button>
              <span className={`batch-status-pill ${batch.status === 'ACTIVE' ? 'active' : 'inactive'}`}>
                {batch.status}
              </span>
              {batch.status !== 'ACTIVE' && batch.status !== 'COMPLETED' && batch.status !== 'CANCELLED' && (
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => handleSetActive(batch.batchId)}
                  disabled={saving}
                >
                  Set Active
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ActiveCompostBatchSection;
