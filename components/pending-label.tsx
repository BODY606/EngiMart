export function PendingLabel({
  pending,
  idle,
  busy,
}: {
  pending: boolean;
  idle: string;
  busy: string;
}) {
  return (
    <>
      {pending ? <span className="btn-spinner" aria-hidden /> : null}
      {pending ? busy : idle}
    </>
  );
}
