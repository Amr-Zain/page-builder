import { useState, useEffect } from "react";
import { Button, Modal, TextField, Label, Input, FieldError } from "@heroui/react";

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string) => void;
}

export function CreateProjectModal({
  isOpen,
  onClose,
  onCreate,
}: CreateProjectModalProps) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  // Clear input on close
  useEffect(() => {
    if (!isOpen) {
      setName("");
      setError("");
    }
  }, [isOpen]);

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Project name cannot be empty");
      return;
    }
    setError("");
    onCreate(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Modal.Container>
        <Modal.Dialog className="sm:max-w-[400px]">
          <Modal.CloseTrigger />
          <Modal.Header>
            <Modal.Heading>Create New Project</Modal.Heading>
          </Modal.Header>
          <Modal.Body>
            <TextField
              isInvalid={!!error}
              value={name}
              onChange={setName}
              name="projectName"
            >
              <Label>Project Name</Label>
              <Input
                placeholder="My Website"
                onKeyDown={handleKeyDown}
                autoFocus
                className={'m-2'}
              />
              {error && <FieldError>{error}</FieldError>}
            </TextField>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onPress={onClose}>
              Cancel
            </Button>
            <Button onPress={handleSubmit}>
              Create
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
