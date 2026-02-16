import { cx } from "../../lib/utils";

export function Chip({
  label,
  selected,
  onClick
}: {
  label: string;
  selected?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "chip",
        selected ? "chip-active" : "chip-idle"
      )}
      aria-pressed={selected}
    >
      {label}
    </button>
  );
}
