import React, { useState, useRef, useCallback } from 'react'

export interface UploadedFile {
  file: File
  previewUrl: string
  type: 'image' | 'pdf'
}

interface HandwrittenUploadProps {
  onUpload: (files: UploadedFile[]) => void
  onClear: () => void
  uploaded: UploadedFile[]
  disabled?: boolean
}

export function HandwrittenUpload({ onUpload, onClear, uploaded, disabled }: HandwrittenUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const processFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return
    const results: UploadedFile[] = []
    let pending = files.length

    Array.from(files).forEach(file => {
      const type = file.type.startsWith('image/') ? 'image' : 'pdf'
      const reader = new FileReader()
      reader.onload = (e) => {
        results.push({ file, previewUrl: e.target?.result as string, type })
        pending--
        if (pending === 0) onUpload(results)
      }
      reader.readAsDataURL(file)
    })
  }, [onUpload])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    processFiles(e.dataTransfer.files)
  }, [processFiles])

  const dropZoneStyle: React.CSSProperties = {
    border: `2px dashed ${dragging ? 'var(--accent-blue)' : 'var(--border)'}`,
    borderRadius: '10px',
    padding: '2rem',
    textAlign: 'center',
    cursor: disabled ? 'not-allowed' : 'pointer',
    background: dragging ? 'rgba(79,142,247,0.05)' : 'transparent',
    transition: 'all 0.2s',
    opacity: disabled ? 0.5 : 1,
  }

  if (uploaded.length > 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.5rem' }}>
          {uploaded.map((u, i) => (
            <div key={i} style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)', aspectRatio: '3/4', background: 'var(--bg-elevated)' }}>
              {u.type === 'image' ? (
                <img src={u.previewUrl} alt={`Page ${i+1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '2rem' }}>📄</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>PDF</span>
                  <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', padding: '0 0.5rem', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>{u.file.name}</span>
                </div>
              )}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={onClear}
            disabled={disabled}
            style={{ padding: '0.375rem 0.875rem', borderRadius: '7px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', fontSize: '0.8125rem', cursor: 'pointer' }}
          >
            Remove
          </button>
          <button
            onClick={() => inputRef.current?.click()}
            disabled={disabled}
            style={{ padding: '0.375rem 0.875rem', borderRadius: '7px', border: '1px solid var(--accent-blue)', background: 'transparent', color: 'var(--accent-blue)', fontSize: '0.8125rem', cursor: 'pointer' }}
          >
            Replace
          </button>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*,.pdf"
          multiple
          style={{ display: 'none' }}
          onChange={e => { processFiles(e.target.files); e.target.value = '' }}
        />
      </div>
    )
  }

  return (
    <div
      style={dropZoneStyle}
      onClick={() => !disabled && inputRef.current?.click()}
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>✍️</div>
      <p style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: '0.25rem', fontSize: '0.9375rem' }}>
        Upload your work
      </p>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
        Drop images or PDF here, or click to browse
      </p>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.375rem' }}>
        JPG, PNG, PDF accepted
      </p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,.pdf"
        multiple
        style={{ display: 'none' }}
        onChange={e => { processFiles(e.target.files); e.target.value = '' }}
      />
    </div>
  )
}
