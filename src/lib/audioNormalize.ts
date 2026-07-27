/**
 * Voice notes are recorded in whatever format the browser's MediaRecorder
 * defaults to — Chrome/Android produces WebM/Opus, Safari/iOS produces
 * MP4/AAC. Safari cannot decode WebM audio at all, on any iOS version,
 * ever — so a voice note recorded on Android was completely silent for
 * an iPhone listener. This decodes whatever came out of the recorder and
 * re-encodes it as plain WAV, which every browser (including every
 * version of Safari) can always play. Trade-off: WAV is uncompressed, so
 * the file is larger than the original — acceptable for short voice notes.
 */
export async function normalizeToWav(blob: Blob): Promise<Blob> {
  try {
    const arrayBuffer = await blob.arrayBuffer();
    const AudioCtor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtor) return blob;

    const decodeCtx = new AudioCtor();
    const audioBuffer = await decodeCtx.decodeAudioData(arrayBuffer.slice(0));
    await decodeCtx.close();
    return audioBufferToWav(audioBuffer);
  } catch {
    // If decoding fails for some reason, fall back to the original rather
    // than blocking the send entirely.
    return blob;
  }
}

function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const bitDepth = 16;

  const interleaved = interleave(buffer);
  const dataLength = interleaved.length * (bitDepth / 8);
  const arrayBuffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(arrayBuffer);

  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + dataLength, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * (bitDepth / 8), true);
  view.setUint16(32, numChannels * (bitDepth / 8), true);
  view.setUint16(34, bitDepth, true);
  writeString(view, 36, "data");
  view.setUint32(40, dataLength, true);

  let offset = 44;
  for (let i = 0; i < interleaved.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, interleaved[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  return new Blob([arrayBuffer], { type: "audio/wav" });
}

function interleave(buffer: AudioBuffer): Float32Array {
  const numChannels = buffer.numberOfChannels;
  const channels: Float32Array[] = [];
  for (let c = 0; c < numChannels; c++) channels.push(buffer.getChannelData(c));
  const result = new Float32Array(buffer.length * numChannels);
  let index = 0;
  for (let i = 0; i < buffer.length; i++) {
    for (let c = 0; c < numChannels; c++) result[index++] = channels[c][i];
  }
  return result;
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
}
