import { useLayoutEffect, useState, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";

interface AnchoredMenuProps {
  /** The trigger element the menu is glued to (menu appears just below it). */
  anchorRef: RefObject<HTMLElement>;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

/**
 * Renders `children` in a fixed-position layer portalled to <body>, anchored
 * directly BELOW `anchorRef`. Because it lives at the body root it escapes any
 * ancestor `overflow` clipping (e.g. the horizontal carousel track) and any
 * ancestor stacking context, so the menu always sits IN FRONT of the next
 * section instead of being cut off by it. Repositions on scroll/resize so it
 * stays stuck to the trigger.
 */
const AnchoredMenu = ({ anchorRef, open, onClose, children }: AnchoredMenuProps) => {
  const [pos, setPos] = useState<{ left: number; top: number; width: number } | null>(null);

  useLayoutEffect(() => {
    if (!open) return;
    const update = () => {
      const el = anchorRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setPos({ left: r.left, top: r.bottom + 4, width: r.width });
    };
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open, anchorRef]);

  if (!open || !pos) return null;

  return createPortal(
    <>
      {/* Click-away layer under the menu */}
      <div className="fixed inset-0 z-[998]" onClick={onClose} />
      <div
        className="fixed z-[999]"
        style={{ left: pos.left, top: pos.top, minWidth: pos.width }}
      >
        {children}
      </div>
    </>,
    document.body,
  );
};

export default AnchoredMenu;
