/**
 * Bakes a warm "cassette tape" character into a recorded voice note:
 * a lowpass to soften the highs, a highpass to trim sub-rumble, gentle
 * saturation for warmth, and a touch of "wow & flutter" (pitch wobble)
 * via a modulated delay line. Renders offline and re-encodes to WAV so
 * the effect is baked in identically for both listeners, not just a
 * playback-time toggle.
 */
export async function applyLofiFilter(blob: Blob): Promise<Blob> {
  const arrayBuffer = await blob.arrayBuffer();
  const AudioCtor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtor) return blob;

  const decodeCtx = new AudioCtor();
  const audioBuffer = await decodeCtx.decodeAudioData(arrayBuffer.slice(0));
  await decodeCtx.close();

  const offlineCtx = new OfflineAudioContext(
    audioBuffer.numberOfChannels,
    audioBuffer.length,
    audioBuffer.sampleRate,
  );

  const source = offlineCtx.createBufferSource();
  source.buffer = audioBuffer;

  const highpass = offlineCtx.createBiquadFilter();
  highpass.type = "highpass";
  highpass.frequency.value = 120;

  const lowpass = offlineCtx.createBiquadFilter();
  lowpass.type = "lowpass";
  lowpass.frequency.value = 3600;
  lowpass.Q.value = 0.7;

  const shaper = offlineCtx.createWaveShaper();
  shaper.curve = makeSaturationCurve(18) as Float32Array<ArrayBuffer>;
  shaper.oversample = "2x";

  const delay = offlineCtx.createDelay(0.05);
  delay.delayTime.value = 0.01;
  const lfo = offlineCtx.createOscillator();
  lfo.frequency.value = 5.5;
  const lfoGain = offlineCtx.createGain();
  lfoGain.gain.value = 0.0025;
  lfo.connect(lfoGain);
  lfoGain.connect(delay.delayTime);

  const outGain = offlineCtx.createGain();
  outGain.gain.value = 1.15;

  source.connect(highpass);
  highpass.connect(lowpass);
  lowpass.connect(shaper);
  shaper.connect(delay);
  delay.connect(outGain);
  outGain.connect(offlineCtx.destination);

  source.start();
  lfo.start();
  const rendered = await offlineCtx.startRendering();
  return audioBufferToWav(rendered);
}

function makeSaturationCurve(amount: number): Float32Array {
  const samples = 1024;
  const curve = new Float32Array(samples);
  for (let i = 0; i < samples; i++) {
    const x = (i * 2) / samples - 1;
    curve[i] = ((Math.PI + amount) * x) / (Math.PI + amount * Math.abs(x));
  }
  return curve;
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
