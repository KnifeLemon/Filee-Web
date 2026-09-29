// Minimal MP4 (ISO BMFF) muxer for one H.264 video track encoded with WebCodecs.
// Writes ftyp, moov (before the data, so browsers can start playing immediately) and one mdat.
// Samples must be in the "avc" (length-prefixed) format; the avcC box comes from the encoder's decoderConfig.

const encoder = new TextEncoder();

function box(type, ...parts) {
  const payload = parts.flat(Infinity).filter(Boolean);
  const size = 8 + payload.reduce((sum, p) => sum + p.byteLength, 0);
  const header = new Uint8Array(8);
  new DataView(header.buffer).setUint32(0, size);
  header.set(encoder.encode(type), 4);
  return [header, ...payload];
}

function fullBox(type, version, flags, ...parts) {
  const head = new Uint8Array(4);
  new DataView(head.buffer).setUint32(0, (version << 24) | flags);
  return box(type, head, ...parts);
}

function u32(...values) {
  const bytes = new Uint8Array(values.length * 4);
  const view = new DataView(bytes.buffer);
  values.forEach((v, i) => view.setUint32(i * 4, v));
  return bytes;
}

function u16(...values) {
  const bytes = new Uint8Array(values.length * 2);
  const view = new DataView(bytes.buffer);
  values.forEach((v, i) => view.setUint16(i * 2, v));
  return bytes;
}

const matrix = u32(0x00010000, 0, 0, 0, 0x00010000, 0, 0, 0, 0x40000000);
const length = parts => parts.flat(Infinity).reduce((sum, p) => sum + p.byteLength, 0);

/**
 * @param {{width:number, height:number, fps:number, avcC:Uint8Array, samples:{data:Uint8Array, key:boolean}[]}} video
 * @returns {Uint8Array} the .mp4 file
 */
export function muxMp4({ width, height, fps, avcC, samples }) {
  const timescale = fps * 1000;
  const delta = 1000;
  const duration = samples.length * delta;
  const movieDuration = Math.round((samples.length / fps) * 1000); // mvhd uses a 1000 Hz timescale

  const ftyp = box('ftyp', encoder.encode('isom'), u32(0x200), encoder.encode('isomiso2avc1mp41'));

  const sampleEntry = box('avc1',
    new Uint8Array(6), u16(1),                  // reserved, data reference index
    new Uint8Array(16),                          // pre-defined / reserved
    u16(width, height), u32(0x00480000, 0x00480000, 0), u16(1),
    new Uint8Array(32),                          // compressor name
    u16(0x0018, 0xffff),
    box('avcC', avcC));

  const keyFrames = samples.map((s, i) => (s.key ? i + 1 : 0)).filter(Boolean);
  const stbl = chunkOffset => box('stbl',
    fullBox('stsd', 0, 0, u32(1), sampleEntry),
    fullBox('stts', 0, 0, u32(1, samples.length, delta)),
    fullBox('stss', 0, 0, u32(keyFrames.length, ...keyFrames)),
    fullBox('stsc', 0, 0, u32(1, 1, samples.length, 1)),
    fullBox('stsz', 0, 0, u32(0, samples.length, ...samples.map(s => s.data.byteLength))),
    fullBox('stco', 0, 0, u32(1, chunkOffset)));

  const moov = chunkOffset => box('moov',
    fullBox('mvhd', 0, 0, u32(0, 0, 1000, movieDuration, 0x00010000), u16(0x0100), new Uint8Array(10), matrix, new Uint8Array(24), u32(2)),
    box('trak',
      fullBox('tkhd', 0, 3, u32(0, 0, 1, 0, movieDuration), new Uint8Array(8), u16(0, 0, 0, 0), matrix, u32(width << 16, height << 16)),
      box('mdia',
        fullBox('mdhd', 0, 0, u32(0, 0, timescale, duration), u16(0x55c4, 0)),
        fullBox('hdlr', 0, 0, u32(0), encoder.encode('vide'), new Uint8Array(12), encoder.encode('Filee video\0')),
        box('minf',
          fullBox('vmhd', 0, 1, new Uint8Array(8)),
          box('dinf', fullBox('dref', 0, 0, u32(1), fullBox('url ', 0, 1))),
          stbl(chunkOffset)))));

  // moov size does not depend on the offset value, so measure it once and then write the real offset.
  const moovSize = length(moov(0));
  const ftypSize = length(ftyp);
  const mdatPayload = samples.reduce((sum, s) => sum + s.data.byteLength, 0);
  const parts = [ftyp, moov(ftypSize + moovSize + 8), box('mdat', samples.map(s => s.data))].flat(Infinity);

  const file = new Uint8Array(ftypSize + moovSize + 8 + mdatPayload);
  let offset = 0;
  for (const part of parts) {
    file.set(part, offset);
    offset += part.byteLength;
  }
  return file;
}

/**
 * Renders frames with drawFrame(ctx, t) and encodes them to H.264 MP4.
 * @param {HTMLCanvasElement} canvas
 * @param {(t:number) => void} drawFrame  draws the frame at time t (seconds)
 * @param {{fps:number, duration:number, bitrate:number, onProgress?:(f:number)=>void}} options
 */
export async function encodeMp4(source, drawFrame, { fps, duration, bitrate, onProgress, width, height }) {
  // Frames are drawn at the composition size and scaled into the output canvas when a smaller size is asked for.
  const canvas = width && (width !== source.width || height !== source.height)
    ? Object.assign(document.createElement('canvas'), { width, height })
    : source;
  const scaled = canvas.getContext('2d');
  const samples = [];
  let avcC = null;
  let failure = null;
  const videoEncoder = new VideoEncoder({
    output: (chunk, metadata) => {
      if (metadata?.decoderConfig?.description)
        avcC = new Uint8Array(metadata.decoderConfig.description);
      const data = new Uint8Array(chunk.byteLength);
      chunk.copyTo(data);
      samples.push({ data, key: chunk.type === 'key' });
    },
    error: e => { failure = e; },
  });
  videoEncoder.configure({
    codec: 'avc1.640028', width: canvas.width, height: canvas.height, bitrate, framerate: fps,
    avc: { format: 'avc' }, latencyMode: 'quality', bitrateMode: 'variable',
  });

  const frames = Math.round(duration * fps);
  for (let i = 0; i < frames; i++) {
    drawFrame(i / fps);
    if (canvas !== source) {
      scaled.imageSmoothingQuality = 'high';
      scaled.drawImage(source, 0, 0, canvas.width, canvas.height);
    }
    const frame = new VideoFrame(canvas, { timestamp: Math.round((i * 1e6) / fps), duration: Math.round(1e6 / fps) });
    videoEncoder.encode(frame, { keyFrame: i % (fps * 2) === 0 });
    frame.close();
    if (videoEncoder.encodeQueueSize > 8)
      await new Promise(resolve => videoEncoder.addEventListener('dequeue', resolve, { once: true }));
    if (failure)
      throw failure;
    onProgress?.(i / frames);
  }
  await videoEncoder.flush();
  videoEncoder.close();
  if (!avcC)
    throw new Error('The encoder produced no decoder configuration.');
  return muxMp4({ width: canvas.width, height: canvas.height, fps, avcC, samples });
}
