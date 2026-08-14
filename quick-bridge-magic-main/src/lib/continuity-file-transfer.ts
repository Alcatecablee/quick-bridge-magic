import { IncomingFile, OutgoingFile, isTerminalTransferState } from "../hooks/use-webrtc";

export type FileTransferResult =
  | { status: "completed"; transferId: string }
  | { status: "failed"; transferId: string; reason: string }
  | { status: "cancelled"; transferId: string };

export interface FileTransferService {
  offerFile(transferId: string, file: File): Promise<FileTransferResult>;
  acceptFile(transferId: string): Promise<FileTransferResult>;
  cancelTransfer(transferId: string, direction: "incoming" | "outgoing"): Promise<void>;
}

export class WebRTCFileTransferService implements FileTransferService {
  private resolvers = new Map<string, (res: FileTransferResult) => void>();
  private incomingFiles: IncomingFile[] = [];
  private outgoingFiles: OutgoingFile[] = [];

  constructor(
    private sendFileHook: (f: File, idOverride?: string) => void,
    private cancelOutgoingHook: (id: string) => void,
    private cancelIncomingHook: (id: string) => void,
  ) {}

  updateState(incoming: IncomingFile[], outgoing: OutgoingFile[]) {
    this.incomingFiles = incoming;
    this.outgoingFiles = outgoing;

    for (const [id, resolve] of Array.from(this.resolvers.entries())) {
      // Check if this ID is in incoming
      const inc = this.incomingFiles.find(f => f.id === id);
      if (inc && isTerminalTransferState(inc.state)) {
        this.resolvers.delete(id);
        resolve(this.mapToResult(inc.state, id, inc.error));
        continue;
      }

      // Check if this ID is in outgoing
      const out = this.outgoingFiles.find(f => f.id === id);
      if (out && isTerminalTransferState(out.state)) {
        this.resolvers.delete(id);
        resolve(this.mapToResult(out.state, id, out.error));
        continue;
      }
    }
  }

  offerFile(transferId: string, file: File): Promise<FileTransferResult> {
    return new Promise((resolve) => {
      this.resolvers.set(transferId, resolve);
      this.sendFileHook(file, transferId);
    });
  }

  acceptFile(transferId: string): Promise<FileTransferResult> {
    return new Promise((resolve) => {
      const inc = this.incomingFiles.find(f => f.id === transferId);
      if (inc && isTerminalTransferState(inc.state)) {
        resolve(this.mapToResult(inc.state, transferId, inc.error));
        return;
      }
      this.resolvers.set(transferId, resolve);
    });
  }

  async cancelTransfer(transferId: string, direction: "incoming" | "outgoing"): Promise<void> {
    if (direction === "incoming") {
      this.cancelIncomingHook(transferId);
    } else {
      this.cancelOutgoingHook(transferId);
    }
    // The state update from the hook will eventually fire updateState and resolve the pending promise with "cancelled".
  }

  private mapToResult(state: string, transferId: string, error?: string): FileTransferResult {
    if (state === "completed" || state === "verified") {
      return { status: "completed", transferId };
    }
    if (state === "cancelled") {
      return { status: "cancelled", transferId };
    }
    return { status: "failed", transferId, reason: error || "Unknown error" };
  }
}
