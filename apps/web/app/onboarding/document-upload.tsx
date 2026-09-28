'use client';

import { useRef, useState } from 'react';
import { FileUp, ShieldAlert } from 'lucide-react';
import { patientDocumentUploadSchema } from '@sizocare/validation';
import { createClient } from '@/lib/supabase/client';

const extensions = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'image/jpeg': 'jpg',
  'image/png': 'png',
} as const;

export function DocumentUpload() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<string>();
  const [uploading, setUploading] = useState(false);

  async function upload(file?: File) {
    setError(undefined);
    setMessage(undefined);
    const parsed = patientDocumentUploadSchema.safeParse(
      file ? { name: file.name, type: file.type, size: file.size } : {},
    );
    if (!file || !parsed.success) {
      setError('Choose a PDF, DOCX, JPG, or PNG smaller than 25 MB.');
      inputRef.current?.focus();
      return;
    }
    setUploading(true);
    setProgress(10);
    const supabase = createClient();
    const { data: document, error: reserveError } = await supabase.rpc('reserve_document_upload', {
      p_original_filename: file.name,
      p_file_type: extensions[file.type as keyof typeof extensions],
      p_size_bytes: file.size,
    });
    if (reserveError || !document) {
      setError('We could not prepare this upload. Try again.');
      setUploading(false);
      return;
    }
    setProgress(35);
    const { error: uploadError } = await supabase.storage
      .from('patient-documents')
      .upload(document.storage_path, file, { contentType: file.type, upsert: false });
    if (uploadError) {
      setError('The file could not be uploaded. Check your connection and try again.');
      setUploading(false);
      return;
    }
    setProgress(85);
    const { error: queueError } = await supabase.rpc('queue_document', {
      p_document_id: document.id,
    });
    if (queueError) {
      setError(
        'The file was uploaded, but processing could not be queued. Contact support before uploading it again.',
      );
      setUploading(false);
      return;
    }
    setProgress(100);
    setUploading(false);
    setMessage(
      'Upload complete. The document is queued until secure Gemini processing is configured.',
    );
    if (inputRef.current) inputRef.current.value = '';
  }

  return (
    <section className="document-intake" aria-labelledby="document-title">
      <div className="document-heading">
        <FileUp aria-hidden="true" />
        <div>
          <h2 id="document-title">Add a patient document</h2>
          <p>
            Upload supporting context now. SizoCare will keep it queued—not interpreted—until secure
            document processing is available.
          </p>
        </div>
      </div>
      <p className="privacy-warning">
        <ShieldAlert aria-hidden="true" />
        <span>
          <strong>Typing the essential details yourself is safer and more private.</strong> Document
          summaries may later use a third-party hosted LLM, which means selected document content
          may leave SizoCare after your explicit consent.
        </span>
      </p>
      <label className="file-field" htmlFor="patient-document">
        <span>PDF, DOCX, JPG, or PNG · 25 MB maximum</span>
        <input
          ref={inputRef}
          id="patient-document"
          type="file"
          accept=".pdf,.docx,.jpg,.jpeg,.png,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png"
          disabled={uploading}
          onChange={(event) => upload(event.target.files?.[0])}
        />
      </label>
      {uploading ? (
        <div className="upload-progress" role="status" aria-live="polite">
          <progress max="100" value={progress} />
          Uploading document… {progress}%
        </div>
      ) : null}
      {error ? (
        <p className="form-message error" role="alert">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="form-message" role="status">
          {message}
        </p>
      ) : null}
    </section>
  );
}
