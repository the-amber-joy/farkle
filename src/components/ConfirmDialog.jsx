import { useEffect, useRef } from "react";
import "./ConfirmDialog.css";

/**
 * ConfirmDialog - Reusable confirmation dialog
 */
export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  danger = false,
}) {
  const dialogRef = useRef(null);
  const confirmBtnRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      dialog.showModal();
      confirmBtnRef.current?.focus();
    } else {
      dialog.close();
    }
  }, [isOpen]);

  const handleDialogClick = (e) => {
    if (e.target === dialogRef.current) {
      onCancel();
    }
  };

  const handleCancel = (e) => {
    e.preventDefault();
    onCancel();
  };

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      className="modal-base confirm-dialog"
      onClick={handleDialogClick}
      onCancel={handleCancel}
      aria-labelledby="confirm-dialog-title"
    >
      <div className="modal-content confirm-dialog__content">
        <h2 id="confirm-dialog-title">{title}</h2>
        <p>{message}</p>
        <div className="confirm-dialog__actions">
          <button
            onClick={onCancel}
            className="confirm-dialog__btn confirm-dialog__btn--cancel"
          >
            {cancelText}
          </button>
          <button
            ref={confirmBtnRef}
            onClick={onConfirm}
            className={`confirm-dialog__btn confirm-dialog__btn--confirm ${danger ? "confirm-dialog__btn--danger" : ""}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </dialog>
  );
}
