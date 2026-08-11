import re

file_path = "c:/Users/Clive/Downloads/quick-bridge-magic-main/quick-bridge-magic-main/src/hooks/use-webrtc.ts"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update SessionEndReason
content = re.sub(
    r'export type SessionEndReason =[\s\S]*?\| "error";',
    'export type SessionEndReason =\n  | "local_disconnect"\n  | "remote_disconnect"\n  | "transport_lost"\n  | "timeout"\n  | "session_expired"\n  | "verification_failed"\n  | "key_changed"\n  | "navigation"\n  | "browser_closed"\n  | "error"\n  | "host_not_found";',
    content
)

# 8. Add canTransition guard and replace setStatus
can_transition = """function canTransition(from: ConnectionStatus, to: ConnectionStatus): boolean {
  if (from === "ended") return false;
  if (from === "ending" && to !== "ended") return false;
  return true;
}

"""
if "function canTransition" not in content:
    content = content.replace("export function useWebRTC(", can_transition + "export function useWebRTC(")

content = content.replace(
    'const [status, setStatus] = useState<ConnectionStatus>("waiting");',
    'const [statusRaw, setStatusRaw] = useState<ConnectionStatus>("waiting");\n  const status = statusRaw;\n  const setStatus = useCallback((to: ConnectionStatus) => {\n    setStatusRaw(prev => canTransition(prev, to) ? to : prev);\n  }, []);'
)

# 2. Add sessionGenerationRef and hasConnectedRef
if "const sessionGenerationRef" not in content:
    content = content.replace(
        'const reconnectAttemptRef = useRef(0);',
        'const reconnectAttemptRef = useRef(0);\n  const sessionGenerationRef = useRef(0);\n  const hasConnectedRef = useRef(false);'
    )

# 3. endSession increment sessionGenerationRef.current
content = content.replace(
    'sessionEndingRef.current = true;\n    endReasonRef.current = reason;',
    'sessionEndingRef.current = true;\n    endReasonRef.current = reason;\n    sessionGenerationRef.current++;'
)

# 4. Guard async callbacks with sessionGenerationRef.current
content = content.replace(
    'reconnectTimerRef.current = setTimeout(() => {',
    'const generation = sessionGenerationRef.current;\n      reconnectTimerRef.current = setTimeout(() => {\n        if (generation !== sessionGenerationRef.current) return;'
)

content = content.replace(
    'connectTimerRef.current = setTimeout(() => {',
    'const generation = sessionGenerationRef.current;\n    connectTimerRef.current = setTimeout(() => {\n      if (generation !== sessionGenerationRef.current) return;'
)

content = content.replace(
    'disconnectedTimerRef.current = setTimeout(() => {',
    'const generation = sessionGenerationRef.current;\n          disconnectedTimerRef.current = setTimeout(() => {\n            if (generation !== sessionGenerationRef.current) return;'
)

content = content.replace(
    'stableTimerRef.current = setTimeout(() => {',
    'const generation = sessionGenerationRef.current;\n        stableTimerRef.current = setTimeout(() => {\n          if (generation !== sessionGenerationRef.current) return;'
)

content = content.replace(
    'autoResumeTimerRef.current = setTimeout(() => {',
    'const generation = sessionGenerationRef.current;\n        autoResumeTimerRef.current = setTimeout(() => {\n          if (generation !== sessionGenerationRef.current) return;'
)

content = content.replace(
    'pc.onicecandidate = (e) => {',
    'const generation = sessionGenerationRef.current;\n    pc.onicecandidate = (e) => {\n      if (generation !== sessionGenerationRef.current) return;'
)

# 5. manualReconnect startOffer try/catch
content = content.replace(
    'void startOfferRef.current?.();',
    'if (startOfferRef.current) {\n        startOfferRef.current().catch((err) => {\n          qbError("[QB] manualReconnect: offer failed", err);\n          endSessionRef.current("transport_lost");\n        });\n      }'
)

# Mark hasConnectedRef when connected
content = content.replace(
    'if (st === "connected") {',
    'if (st === "connected") {\n        hasConnectedRef.current = true;'
)
content = content.replace(
    'dc.onopen = () => {',
    'dc.onopen = () => {\n        hasConnectedRef.current = true;'
)

# 7. Use host_not_found instead of timeout or error if !hasConnectedRef.current
# Let's do this by manually finding where we timeout on connect
content = content.replace(
    'endSessionRef.current("timeout");',
    'endSessionRef.current(hasConnectedRef.current ? "timeout" : "host_not_found");'
)

# Write out the modified file
with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
