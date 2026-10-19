/**
 * What the patcher may truthfully tell the user about the file it just produced.
 * Pure (no imports) so the Node regression tests can import it directly.
 *
 *  verified    the patch carries a checksum for the whole output and it matched
 *  partial     only some parts (xdelta windows) carry a checksum; those matched, the rest are unchecked
 *  unverified  the file was generated, but the patch has no checksum, so nothing could be checked
 *  mismatch    a checksum was present and did NOT match (the worker normally discards such output)
 */
export type VerificationState = "verified" | "partial" | "unverified" | "mismatch";

export type VerificationDetail = { checked: number; total: number } | null | undefined;

export function describeVerification(
  outputVerified: boolean | null,
  detail?: VerificationDetail
): { state: VerificationState; label: string } {
  if (outputVerified === true) {
    return { state: "verified", label: "Output verified against the patch's checksum" };
  }
  if (outputVerified === false) {
    return { state: "mismatch", label: "Output checksum didn't match — double-check the file before using it" };
  }
  if (detail && detail.total > 0 && detail.checked > 0 && detail.checked < detail.total) {
    return {
      state: "partial",
      label: `Partly verified: ${detail.checked} of ${detail.total} parts of this patch carry a checksum and matched; the rest couldn't be checked`,
    };
  }
  return {
    state: "unverified",
    label: "File created, but this patch has no built-in checksum, so the result couldn't be verified",
  };
}
