// The OCR Equation Solver demo — the real thing, recorded: the script reads
// equations off the screen with pytesseract and clicks the right answer.

export default function OcrSim() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 p-4">
        <div className="relative h-full w-full overflow-hidden rounded-lg border border-pane-edge bg-black">
          <iframe
            src="https://www.youtube-nocookie.com/embed/SVFRD3A5OtA"
            title="OCR Equation Solver — real demo video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="absolute inset-0 h-full w-full"
          />
        </div>
      </div>
      <p className="border-t border-pane-edge px-4 py-2.5 font-mono text-[11px] leading-relaxed text-pane-dim">
        the actual solver, recorded: screenshot → pytesseract OCR → regex validation → eval →
        auto-click the correct answer.
      </p>
    </div>
  );
}
