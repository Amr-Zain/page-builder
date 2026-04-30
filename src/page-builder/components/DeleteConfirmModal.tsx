import { Button, Modal } from "@heroui/react";
import { AlertTriangle } from "lucide-react";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  projectName: string;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteConfirmModal({
  isOpen,
  projectName,
  onClose,
  onConfirm,
}: DeleteConfirmModalProps) {
  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Modal.Container>
        <Modal.Dialog className="sm:max-w-[400px]">
          <Modal.CloseTrigger />
          <Modal.Header>
            <Modal.Icon className="bg-danger-soft text-danger-soft-foreground">
              <AlertTriangle className="size-5" />
            </Modal.Icon>
            <Modal.Heading>Delete Project</Modal.Heading>
          </Modal.Header>
          <Modal.Body>
            <p className="text-sm text-muted">
              Are you sure you want to delete &apos;{projectName}&apos;? This action cannot be undone.
            </p>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onPress={onClose}>
              Cancel
            </Button>
            <Button
              className="bg-danger text-white"
              onPress={onConfirm}
            >
              Delete
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
