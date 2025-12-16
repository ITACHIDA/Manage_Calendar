type Props = {
  emailInput: string;
  calendarUrlInput: string;
  icsUrlInput: string;
  onEmailChange: (value: string) => void;
  onCalendarUrlChange: (value: string) => void;
  onIcsUrlChange: (value: string) => void;
  onIcsFileUpload: (file: File) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  message: { text: string; tone: 'success' | 'error' | '' };
};

export function SyncForm({
  emailInput,
  calendarUrlInput,
  icsUrlInput,
  onEmailChange,
  onCalendarUrlChange,
  onIcsUrlChange,
  onIcsFileUpload,
  onSubmit,
  message,
}: Props) {
  return (
    <form className="sync-form" onSubmit={onSubmit}>
      <label htmlFor="emailInput">Email to sync</label>
      <div className="input-row">
        <input
          id="emailInput"
          name="email"
          type="email"
          placeholder="name@company.com"
          autoComplete="email"
          value={emailInput}
          onChange={(e) => onEmailChange(e.target.value)}
          required
        />
        <button type="submit" className="btn btn--primary">
          Sync email
        </button>
      </div>
      <div className="input-row input-row--stack">
        <input
          id="calendarUrlInput"
          name="calendarUrl"
          type="url"
          placeholder="Optional: paste Google or Outlook calendar embed URL to display schedule"
          autoComplete="off"
          value={calendarUrlInput}
          onChange={(e) => onCalendarUrlChange(e.target.value)}
        />
      </div>
      <div className="input-row input-row--stack">
        <input
          id="icsUrlInput"
          name="icsUrl"
          type="url"
          placeholder="Optional: ICS feed URL (for Outlook work/school calendars that can't be embedded)"
          autoComplete="off"
          value={icsUrlInput}
          onChange={(e) => onIcsUrlChange(e.target.value)}
        />
      </div>
      <div className="input-row input-row--stack">
        <input
          type="file"
          accept=".ics,text/calendar"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onIcsFileUpload(file);
          }}
        />
      </div>
      <p className="form-hint">We ask for read-only calendar scope via OAuth. You can disconnect anytime.</p>
      <p
        className={`form-message ${message.tone === 'success' ? 'is-success' : ''} ${
          message.tone === 'error' ? 'is-error' : ''
        }`}
        role="status"
      >
        {message.text}
      </p>
    </form>
  );
}
