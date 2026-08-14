// IntentTransport abstraction, IntentExecutor interface, ExecutorRegistry,
// and concrete executor implementations for Continuity Phase 3.
//
// Transport abstraction (finding 15): WebRTC DataChannel is the only concrete
// transport today. Phase 5 may add WebTransport, LAN, or native wrappers without
// changing the runtime.
//
// Executor registry (finding 16): new intent type = new executor registered here.
// The runtime never needs a switch statement.
//
// Executor isolation (finding 13): every executor exception is caught by the
// runtime. A failing executor never terminates the runtime or other executors.
//
// Cancellation (finding 4): each executor declares whether it supports abort.
// window.open and clipboard.write are instantaneous and non-cancellable.
// File transfer (future) will be cancellable.

import type {
  IntentEnvelope,
  IntentErrorCode,
  IntentAck,
  ExecutorConcurrency,
  OpenUrlPayload,
  ContinueReadingPayload,
  ClipboardPayload,
} from "./continuity-types";
import {
  OpenUrlPayloadSchema,
  ContinueReadingPayloadSchema,
  ClipboardPayloadSchema,
  OpenFilePayloadSchema,
  MediaSharePayloadSchema,
} from "./continuity-types";

// Transport abstraction (finding 15).
// The runtime is injected with an IntentTransport so it never imports
// use-webrtc.ts directly, keeping the coupling one-directional.
export interface IntentTransport {
  /** Serialize and send a continuity-intent over the DataChannel. */
  sendIntent(envelope: IntentEnvelope): void;
  /** Send an intent-ack message over the DataChannel. */
  sendAck(ack: IntentAck): void;
  /** Returns true if the DataChannel is currently open. */
  connected(): boolean;
}

// IntentExecutor interface.
// Adding a new intent type means implementing this interface and calling
// executorRegistry.register() - the runtime itself is unchanged.
export interface IntentExecutor<
  T extends IntentEnvelope = IntentEnvelope,
> {
  /** Must match ContinuityIntentType. */
  readonly type: string;
  /** Concurrency contract (finding 2). */
  readonly concurrency: ExecutorConcurrency;
  /** Whether execution can be interrupted after it has started (finding 4). */
  readonly cancellable: boolean;
  /**
   * Returns true if this executor can run on the current device right now.
   * Called at dispatch time - never trust cached presence (finding 8).
   */
  canExecute(intent: T): boolean;
  /**
   * Validate the payload schema. Throws on invalid input.
   * Caught by the runtime which returns INVALID_PAYLOAD (finding 13).
   */
  validate(intent: T): void;
  /**
   * Perform the action. Exceptions bubble up; the runtime catches them
   * and maps to EXECUTION_FAILED (finding 13).
   */
  execute(
    intent: T,
    signal?: AbortSignal,
  ): Promise<{
    status: "completed" | "failed" | "requires-user-action";
    reasonCode?: IntentErrorCode;
    reasonMessage?: string;
  }>;
}

// ExecutorRegistry (finding 16).
// The runtime calls registry.get(type) - no switch statements anywhere.
export class ExecutorRegistry {
  private readonly map = new Map<string, IntentExecutor>();

  register(executor: IntentExecutor): void {
    this.map.set(executor.type, executor);
  }

  get(type: string): IntentExecutor | undefined {
    return this.map.get(type);
  }

  has(type: string): boolean {
    return this.map.has(type);
  }

  /** All registered intent types. Used for version negotiation and diagnostics. */
  types(): string[] {
    return Array.from(this.map.keys());
  }
}

// --- Concrete executors ---

// OpenUrlExecutor: Milestone B.
// Capability: browser.open. Concurrency: serial. Cancellable: no.
export const openUrlExecutor: IntentExecutor = {
  type: "open-url",
  concurrency: "serial",
  cancellable: false,
  canExecute(_intent) {
    return (
      typeof window !== "undefined" && typeof window.open === "function"
    );
  },
  validate(intent) {
    OpenUrlPayloadSchema.parse(intent.payload);
  },
  async execute(intent) {
    const { url } = intent.payload as OpenUrlPayload;
    const win = window.open(url, "_blank", "noopener,noreferrer");
    if (!win) {
      return {
        status: "requires-user-action",
        reasonCode: "EXECUTION_FAILED",
        reasonMessage: "Browser blocked the popup. Allow popups for QuickBridge.",
      };
    }
    return { status: "completed" };
  },
};

// ContinueReadingExecutor: Milestone B.
// Shares browser.open capability. Carries richer payload (scrollY, selection).
// Scroll restoration is a Phase 3 Milestone E enhancement; Milestone B opens URL only.
export const continueReadingExecutor: IntentExecutor = {
  type: "continue-reading",
  concurrency: "serial",
  cancellable: false,
  canExecute(_intent) {
    return (
      typeof window !== "undefined" && typeof window.open === "function"
    );
  },
  validate(intent) {
    ContinueReadingPayloadSchema.parse(intent.payload);
  },
  async execute(intent) {
    const { url } = intent.payload as ContinueReadingPayload;
    const win = window.open(url, "_blank", "noopener,noreferrer");
    if (!win) {
      return {
        status: "requires-user-action",
        reasonCode: "EXECUTION_FAILED",
        reasonMessage: "Browser blocked the popup. Allow popups for QuickBridge.",
      };
    }
    return { status: "completed" };
  },
};

// ClipboardExecutor: Milestone C.
// Concurrency: replace-existing - latest clipboard wins (finding 2).
// Uses ClipboardItem internally for future rich content (html, images).
export const clipboardExecutor: IntentExecutor = {
  type: "clipboard",
  concurrency: "replace-existing",
  cancellable: false,
  canExecute(_intent) {
    return (
      typeof navigator !== "undefined" &&
      !!navigator.clipboard &&
      typeof navigator.clipboard.writeText === "function"
    );
  },
  validate(intent) {
    ClipboardPayloadSchema.parse(intent.payload);
  },
  async execute(intent) {
    const payload = intent.payload as ClipboardPayload;
    const text = payload.text ?? "";
    try {
      // ClipboardItem for future-proofing: supports html, image, and other
      // mime types without a code change to the executor interface.
      if (
        typeof ClipboardItem !== "undefined" &&
        navigator.clipboard &&
        typeof navigator.clipboard.write === "function"
      ) {
        const items: Record<string, Blob> = {
          "text/plain": new Blob([text], { type: "text/plain" }),
        };
        if (payload.html) {
          items["text/html"] = new Blob([payload.html], { type: "text/html" });
        }
        await navigator.clipboard.write([new ClipboardItem(items)]);
      } else {
        await navigator.clipboard.writeText(text);
      }
      return { status: "completed" };
    } catch (err) {
      return {
        status: "requires-user-action",
        reasonCode: "EXECUTION_FAILED",
        reasonMessage:
          err instanceof Error ? err.message : "Clipboard write requires user action.",
      };
    }
  },
};

// CancelExecutor: Cancellation protocol end-to-end.
// Evaluates to a no-op but safely acknowledges receipt.
export const cancelExecutor: IntentExecutor = {
  type: "cancel",
  concurrency: "parallel",
  cancellable: false,
  canExecute(_intent) {
    return true;
  },
  validate(_intent) {
    // Validated implicitly by schema check in runtime before this is reached.
  },
  async execute(_intent) {
    // Acknowledging receipt completes the cancel cycle.
    return { status: "completed" };
  },
};

// FileExecutor: Milestone D.
// Capabilities: filesystem.write. Concurrency: parallel. Cancellable: true.
// Uses FileTransferService for the actual byte transfer after metadata validation.
export class FileExecutor implements IntentExecutor {
  type = "open-file";
  concurrency: ExecutorConcurrency = "parallel";
  cancellable = true;

  constructor(private readonly transferService: import("./continuity-file-transfer").FileTransferService) {}

  canExecute(_intent: IntentEnvelope): boolean {
    return true; // filesystem.write is generally supported if the capability is broadcast
  }

  validate(intent: IntentEnvelope): void {
    OpenFilePayloadSchema.parse(intent.payload);
  }

  async execute(
    intent: IntentEnvelope,
    signal?: AbortSignal,
  ): Promise<{
    status: "completed" | "failed" | "requires-user-action";
    reasonCode?: IntentErrorCode;
    reasonMessage?: string;
  }> {
    const payload = intent.payload as any; // Type handled by Zod
    const transferId = payload.transferId;

    if (!transferId) {
      return {
        status: "failed",
        reasonCode: "INVALID_PAYLOAD",
        reasonMessage: "Missing transferId in payload.",
      };
    }

    if (signal) {
      signal.addEventListener("abort", () => {
        this.transferService.cancelTransfer(transferId, "incoming").catch(() => {});
      });
    }

    try {
      // The intent is accepted by the continuity engine. Now we wait for the WebRTC byte transfer.
      // acceptFile waits until the WebRTC engine reports terminal status for this transferId.
      const result = await this.transferService.acceptFile(transferId);

      if (result.status === "completed") {
        return { status: "completed" };
      } else if (result.status === "cancelled") {
        return {
          status: "failed",
          reasonCode: "CANCELLED",
          reasonMessage: "Transfer was cancelled.",
        };
      } else {
        return {
          status: "failed",
          reasonCode: "EXECUTION_FAILED",
          reasonMessage: result.reason || "WebRTC transfer failed.",
        };
      }
    } catch (err) {
      return {
        status: "failed",
        reasonCode: "EXECUTION_FAILED",
        reasonMessage: err instanceof Error ? err.message : "Unknown error during transfer.",
      };
    }
  }
}

// MediaExecutor: Milestone D.
export class MediaExecutor extends FileExecutor {
  type = "media-share";

  validate(intent: IntentEnvelope): void {
    MediaSharePayloadSchema.parse(intent.payload);
  }
}
