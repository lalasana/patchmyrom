/*
 * PatchMyROM checksum worker (ROM Checksum Checker).
 *
 * Reads a File in fixed-size chunks and feeds each chunk through the streaming CRC32 / MD5 / SHA-1 /
 * SHA-256 hashers (stream-hash.js), so memory use is one chunk plus a small header window regardless
 * of how large the file is. The first bytes of the file (and a few fixed header locations) are kept so
 * rom-toolkit.js can recognise the platform from the file's own header, not just its extension.
 * Nothing is ever uploaded: the worker only reads the File object it is handed.
 */

self.importScripts("/workers/stream-hash.js", "/workers/rom-toolkit.js");

var CHUNK_SIZE = 4 * 1024 * 1024; // 4 MB

function describeReadError(err) {
  if (err && err.name === "RangeError") {
    return "Your browser ran out of memory while reading this file. Close other tabs and try again.";
  }
  if (err && (err.name === "NotReadableError" || err.name === "NotFoundError" || err.name === "SecurityError")) {
    return "The browser couldn't read this file. If it is on a network or cloud drive, copy it to your device first, then select it again.";
  }
  return (err && err.message) || "Could not read this file.";
}

function hashFile(requestId, file) {
  var total = file.size;
  var hashers = StreamHash.createAll();
  var head = new Uint8Array(Math.min(total, RomToolkit.HEAD_BYTES));
  var started = Date.now();
  var offset = 0;

  self.postMessage({ type: "hash-progress", requestId: requestId, loaded: 0, total: total });

  function next() {
    if (offset >= total) return Promise.resolve();
    var end = Math.min(offset + CHUNK_SIZE, total);
    return file
      .slice(offset, end)
      .arrayBuffer()
      .then(function (buffer) {
        var chunk = new Uint8Array(buffer);
        if (offset < head.length) head.set(chunk.subarray(0, Math.min(chunk.length, head.length - offset)), offset);
        hashers.update(chunk);
        offset = end;
        self.postMessage({ type: "hash-progress", requestId: requestId, loaded: offset, total: total });
        return next();
      });
  }

  function readProbes() {
    var probes = [];
    var chain = Promise.resolve();
    RomToolkit.EXTRA_PROBES.forEach(function (probe) {
      if (total < probe.offset + 1) return;
      chain = chain.then(function () {
        var end = Math.min(total, probe.offset + probe.length);
        return file
          .slice(probe.offset, end)
          .arrayBuffer()
          .then(function (buffer) {
            probes.push({ offset: probe.offset, bytes: new Uint8Array(buffer) });
          });
      });
    });
    return chain.then(function () {
      return probes;
    });
  }

  return next()
    .then(readProbes)
    .then(function (probes) {
      var hashes = hashers.digest();
      var platform = RomToolkit.detectPlatform({ fileName: file.name, size: total, head: head, probes: probes });
      self.postMessage({
        type: "hash-result",
        requestId: requestId,
        data: {
          fileName: file.name,
          fileSize: total,
          hashes: hashes,
          platform: platform,
          elapsedMs: Date.now() - started,
        },
      });
    });
}

self.onmessage = function (event) {
  var data = event.data;
  if (!data || data.type !== "hash-file") return;
  hashFile(data.requestId, data.file).catch(function (err) {
    self.postMessage({
      type: "error",
      requestId: data.requestId,
      code: err && err.name === "RangeError" ? "out-of-memory" : "read-failed",
      message: describeReadError(err),
    });
  });
};
