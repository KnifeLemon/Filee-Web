// THE place for every format and support claim on filee.sh: the app version, the optional engines, every format
// with its extensions, what each format converts to (and with which engine), the conversion guide pages and the FAQ.
// Counts, lists, the format catalog, the conversion pages, the JSON-LD and llms.txt are all generated from here, so a
// correction made here reaches every page. build.mjs runs validateCatalog() and stops on inconsistencies.
//
// Texts are { en, ko, 'zh-CN', pl, … } objects made with T(en, ko, zh): English, Korean and Chinese are written here,
// every other language comes from src/texts/<lang>.mjs, a dictionary from the English text to the translation.
// validateCatalog() fails the build when a translation is missing, has other placeholders, or belongs to an English
// text that no longer exists (so changing an English text means updating its translations). Placeholders like
// {formatTotal} are filled by vars() below.

import { LANGS, LANGUAGE } from './languages.mjs';

export { LANGS };
/**
 * The latest release, set from GitHub at build time (useVersion); this value is the fallback when GitHub can't be
 * reached.
 */
export let VERSION = '2.2.0';
/** The release the hero badge's "New in …" list (hero.badge) is about. Update both together at a release. */
export const NEW_IN = '2.2';

/** Sets VERSION to the latest release before the pages are rendered (build.mjs). */
export function useVersion(version) {
  VERSION = version;
}

/** Languages written as T() arguments; the others come from their dictionaries. */
const INLINE = ['en', 'ko', 'zh-CN'];
const DICTIONARIES = Object.fromEntries(await Promise.all(LANGS.filter(l => !INLINE.includes(l))
  .map(async l => [l, (await import(`./texts/${l}.mjs`)).default])));
/** Every T() text and its dictionary key, for validateCatalog(). */
const TEXTS = [];

/**
 * A text in every language. context: only where the same English text needs another translation elsewhere (for
 * example a name that is lower case in running text); the dictionaries then key it as "English [context]".
 */
const T = (en, ko, zh, context) => {
  const text = { en, ko, 'zh-CN': zh };
  const key = context ? `${en} [${context}]` : en;
  for (const [lang, dictionary] of Object.entries(DICTIONARIES)) {
    if (Object.hasOwn(dictionary, key)) text[lang] = dictionary[key];
  }
  TEXTS.push({ text, key });
  return text;
};

/** Picks the text for lang from a T() object (plain strings are language neutral). */
export const L = (value, lang) => (value == null || typeof value === 'string' ? value : value[lang] ?? value.en);

/* ───────── Engines ───────── */

/**
 * Optional engines: not in the installer, downloaded inside the app into Filee's own folder when wanted.
 * sizeMB is the approximate download (null = not stated on the site).
 */
export const ENGINES = {
  ffmpeg: {
    name: 'FFmpeg', sizeMB: 100, url: 'https://ffmpeg.org/',
    for: T('video and audio, subtitle extraction and saving HEIC', '동영상·오디오, 자막 추출, HEIC 저장', '视频和音频、提取字幕以及保存 HEIC'),
  },
  libreoffice: {
    name: 'LibreOffice', sizeMB: 420, url: 'https://www.libreoffice.org/',
    for: T('older office formats such as DOC, PPT and ODT', 'DOC·PPT·ODT 같은 예전 오피스 형식', 'DOC、PPT、ODT 等旧版办公格式'),
  },
  calibre: {
    name: 'Calibre', sizeMB: null, url: 'https://calibre-ebook.com/',
    for: T('rare e-book formats and MOBI/AZW3 output', '희귀 전자책 형식과 MOBI·AZW3 저장', '少见的电子书格式及 MOBI/AZW3 输出'),
  },
  ghostscript: {
    name: 'Ghostscript', sizeMB: null, url: 'https://www.ghostscript.com/',
    for: T('EPS and PostScript', 'EPS·PostScript', 'EPS 和 PostScript'),
  },
  pandoc: {
    name: 'Pandoc', sizeMB: 42, url: 'https://pandoc.org/',
    for: T('LaTeX, Org, AsciiDoc and other markup, Word → Markdown and Markdown → slides', 'LaTeX·Org·AsciiDoc 같은 마크업, 워드→마크다운, 마크다운→슬라이드', 'LaTeX、Org、AsciiDoc 等标记语言，Word 转 Markdown，Markdown 转幻灯片'),
  },
};

/** Engines that ship with the installer (named where the site mentions them). */
export const BUILT_IN_ENGINES = ['ImageMagick', 'PDFium', 'PDFsharp', 'rhwp', 'Filee HWPX writer', '7-Zip'];

/* ───────── Options (presets and behaviour, used in tables and on conversion pages) ───────── */

export const OPTIONS = {
  quality: {
    short: T('quality', '품질', '质量'),
    long: T('Adjustable quality for JPG, WEBP and AVIF: JPG saves at 90 % by default, and a JPG 70 % preset makes smaller files.',
      'JPG·WEBP·AVIF 품질을 조절할 수 있어요. JPG는 기본 90%로 저장하고, JPG 70% 프리셋으로 더 작게 만들 수 있습니다.',
      'JPG、WebP、AVIF 质量可调：JPG 默认以 90% 保存，JPG 70% 预设可得到更小的文件。'),
  },
  resize: {
    short: T('resize', '크기 조정', '缩放'),
    long: T('Resize while converting, by percentage (for example half size) or to a maximum long edge.',
      '변환하면서 비율(예: 절반)이나 긴 변 길이로 크기를 줄일 수 있어요.',
      '转换时可按比例（如缩小一半）或按长边尺寸缩放。'),
  },
  dpi: {
    short: T('DPI', 'DPI', 'DPI'),
    long: T('Set the DPI written into the image, for example 300 for print.', '이미지에 기록할 DPI를 정할 수 있어요(예: 인쇄용 300).', '可设置写入图片的 DPI（例如打印用 300）。'),
  },
  grayscale: {
    short: T('grayscale', '흑백', '灰度'),
    long: T('A grayscale preset makes black-and-white copies.', '흑백 프리셋으로 흑백 사본을 만들 수 있어요.', '灰度预设可生成黑白副本。'),
  },
  metadata: {
    short: T('metadata', '메타데이터', '元数据'),
    long: T('Metadata (EXIF, XMP, colour profile) is kept by default and can be removed for privacy.',
      '메타데이터(EXIF·XMP·색 프로필)는 기본으로 유지되며, 개인정보 보호를 위해 지울 수도 있어요.',
      '元数据（EXIF、XMP、色彩配置文件）默认保留，也可为保护隐私而清除。'),
  },
  icoSizes: {
    short: T('ICO sizes', 'ICO 크기', 'ICO 尺寸'),
    long: T('ICO files hold 256, 128, 64, 48, 32 and 16 px by default; the sizes can be changed in the preset.',
      'ICO에는 기본으로 256·128·64·48·32·16픽셀이 모두 들어가며, 프리셋에서 크기를 바꿀 수 있어요.',
      'ICO 默认包含 256、128、64、48、32、16 像素，可在预设中修改尺寸。'),
  },
  tiff: {
    short: T('TIFF compression', 'TIFF 압축', 'TIFF 压缩'),
    long: T('TIFF compression can be chosen (LZW by default).', 'TIFF 압축 방식을 고를 수 있어요(기본 LZW).', '可选择 TIFF 压缩方式（默认 LZW）。'),
  },
  transparency: {
    short: T('white background', '흰 배경', '白色背景'),
    long: T('JPG has no transparency, so transparent areas are filled with white.', 'JPG는 투명도가 없어 투명한 부분은 흰색으로 채웁니다.', 'JPG 不支持透明，透明区域以白色填充。'),
  },
  merge: {
    short: T('merge into one PDF', 'PDF 하나로 합치기', '合并为一个 PDF'),
    long: T('The merge preset combines all dropped files into one PDF.', '합치기 프리셋은 놓은 파일을 모두 PDF 하나로 합칩니다.', '合并预设可把拖入的所有文件合并成一个 PDF。'),
  },
  split: {
    short: T('split pages', '페이지 나누기', '拆分页面'),
    long: T('The split preset saves every page as its own PDF in a subfolder.', '나누기 프리셋은 페이지마다 PDF를 하나씩 하위 폴더에 저장합니다.', '拆分预设会把每一页单独存成 PDF，放在子文件夹中。'),
  },
  rotate: {
    short: T('rotate & flip', '회전·뒤집기', '旋转和翻转'),
    long: T('Rotate and flip presets turn images left, right or 180° and mirror them, after the photo\'s own orientation.',
      '회전·뒤집기 프리셋으로 이미지를 왼쪽·오른쪽·180°로 돌리거나 뒤집을 수 있어요. 사진의 원래 방향을 먼저 맞춘 뒤 돌려요.',
      '旋转和翻转预设可把图片向左、向右或 180° 旋转，或镜像翻转。会先按照片自身的方向摆正再旋转。'),
  },
  trace: {
    short: T('Trace to SVG', '벡터화', '描摹'),
    long: T('Two presets trace a picture into vector shapes: Trace to SVG in up to 64 colours, and Line art to SVG in black for logos, signatures and scans. No other program is needed.',
      '프리셋 두 개로 그림을 벡터 도형으로 바꿔요. ‘벡터화’는 최대 64색, ‘흑백 선화’는 로고·서명·스캔용 검은 선이에요. 다른 프로그램은 필요 없어요.',
      '两个预设可把图片描摹成矢量图形。“描摹”最多 64 色，“黑白描摹”为黑色线条，适合 Logo、签名和扫描件。无需其他程序。'),
  },
  removeBackground: {
    short: T('remove background', '배경 제거', '去除背景'),
    long: T('The Remove background preset makes a plain backdrop transparent: the paper behind a signature or stamp, the backdrop of a logo.',
      '배경 제거 프리셋은 서명·도장 뒤의 종이나 로고 뒤의 단색 배경을 투명하게 만들어요.',
      '去除背景预设可将签名、印章后面的纸张或标志后面的纯色背景变为透明。'),
  },
  pages: {
    short: T('page ranges', '페이지 범위', '页码范围'),
    long: T('Page ranges such as 1-3,5 limit the conversion to the pages you need.', '‘1-3,5’ 같은 페이지 범위로 필요한 페이지만 변환할 수 있어요.', '可用“1-3,5”这样的页码范围只转换需要的页面。'),
  },
  renderDpi: {
    short: T('render DPI', '해상도(DPI)', '渲染 DPI'),
    long: T('Pages are rendered at 150 DPI by default; choose 300 DPI for print quality.', '페이지는 기본 150DPI로 그리며, 인쇄용이면 300DPI를 고르세요.', '页面默认以 150 DPI 渲染，打印质量可选 300 DPI。'),
  },
  longImage: {
    short: T('one long image', '긴 이미지 한 장', '拼成长图'),
    long: T('The Long image preset stacks all pages into one tall image, e.g. to post a whole document at once.',
      '긴 이미지 프리셋은 모든 페이지를 위아래로 이어 이미지 한 장으로 만들어요. 문서를 한 번에 올릴 때 좋아요.',
      '长图预设会把所有页面上下拼成一张图片，适合一次性发布整份文档。'),
  },
  compress: {
    short: T('compress PDF', 'PDF 압축', '压缩 PDF'),
    long: T('The Compress PDF preset makes a PDF smaller while it stays a PDF: pictures are scaled down to 72, 150 or 300 dpi and photos saved again as JPEG, while text, fonts, links, bookmarks and forms stay. A PDF that can\'t get smaller is left as it was. With Ghostscript installed, Filee can try it too and keep the smaller result.',
      'PDF 압축 프리셋은 PDF를 PDF 그대로 더 작게 만들어요. 그림은 72·150·300dpi로 줄이고 사진은 JPEG로 다시 저장하며, 글자·글꼴·링크·책갈피·양식은 그대로예요. 더 작아지지 않는 PDF는 원래대로 둬요. Ghostscript가 있으면 함께 시도해서 더 작은 결과를 남길 수도 있어요.',
      '“压缩 PDF”预设可以让 PDF 变小，同时仍是 PDF。图片缩小到 72、150 或 300 dpi，照片重新存为 JPEG，文字、字体、链接、书签和表单保持不变。无法变小的 PDF 保持原样。装有 Ghostscript 时还可以用它试一次，保留更小的结果。'),
  },
  slides: {
    short: T('a picture per slide', '페이지마다 슬라이드 그림', '每页一张幻灯片图片'),
    long: T('PPTX (slides) puts a picture of each page on its own slide, at the page\'s size, with the page\'s text in the speaker notes. The slides look exactly like the PDF but aren\'t editable; convert to DOCX for editable text.',
      'PPTX (슬라이드)는 페이지마다 그 크기 그대로 그림 한 장을 슬라이드에 넣고, 페이지의 글은 발표자 노트에 담아요. PDF와 똑같이 보이지만 편집은 안 돼요. 글을 고치려면 DOCX로 바꾸세요.',
      '“PPTX（幻灯片）”把每一页按原尺寸作为一张图片放在单独的幻灯片上，页面文字放在演讲者备注中。幻灯片与 PDF 看起来完全一样，但无法编辑。需要编辑文字请转为 DOCX。'),
  },
  vectorPdf: {
    short: T('vector PDF', '벡터 PDF', '矢量 PDF'),
    long: T('The PDF stays vector, so it is sharp at any zoom and in print.', 'PDF에서도 벡터가 유지되어 확대하거나 인쇄해도 선명합니다.', 'PDF 仍为矢量，任意放大或打印都清晰。'),
  },
  editable: {
    short: T('editable', '편집 가능', '可编辑'),
    long: T('The result has real text and paragraphs you can edit, not pictures of pages.', '페이지 그림이 아니라 실제 글과 문단으로 만들어 편집할 수 있습니다.', '生成可以编辑的文字和段落，而不是页面图片。'),
  },
  attachments: {
    short: T('attachments as ZIP', '첨부 파일은 ZIP으로', '附件存为 ZIP'),
    long: T('Attachments can be saved separately as one ZIP.', '첨부 파일은 ZIP 하나로 따로 저장할 수 있어요.', '附件可以单独保存为一个 ZIP。'),
  },
  perSheet: {
    short: T('one CSV per sheet', '시트마다 CSV', '每个工作表一个 CSV'),
    long: T('Workbooks with several sheets give one CSV per sheet.', '시트가 여러 개면 시트마다 CSV가 하나씩 만들어집니다.', '有多个工作表时，每个工作表生成一个 CSV。'),
  },
  layoutKept: {
    short: T('layout kept', '레이아웃 유지', '保留版式'),
    long: T('Keeps page size and margins, headers and footers with page numbers, tables, text boxes, shapes and pictures.',
      '용지 크기와 여백, 쪽 번호가 있는 머리말·꼬리말, 표, 글상자, 도형, 그림을 유지합니다.',
      '保留纸张大小和页边距、带页码的页眉页脚、表格、文本框、形状和图片。'),
  },
  noOffice: {
    short: T('no Office needed', '오피스 불필요', '无需 Office'),
    long: T('No Microsoft Office or LibreOffice needed.', 'MS 오피스나 LibreOffice가 필요 없습니다.', '无需 Microsoft Office 或 LibreOffice。'),
  },
  noHancom: {
    short: T('no Hancom Office needed', '한컴오피스 불필요', '无需 Hancom Office'),
    long: T('No Hancom Office and no approval dialog.', '한컴오피스도, 승인 창도 필요 없습니다.', '无需 Hancom Office，也不会弹出确认窗口。'),
  },
  noAutocad: {
    short: T('no AutoCAD needed', '오토캐드 불필요', '无需 AutoCAD'),
    long: T('No AutoCAD or DWG viewer needed.', '오토캐드나 DWG 뷰어가 필요 없습니다.', '无需 AutoCAD 或 DWG 看图软件。'),
  },
  lossless: {
    short: T('no re-encoding', '재인코딩 없음', '无需重新编码'),
    long: T('When the new format can hold the video and sound as they are (an iPhone MOV → MP4), they are only rewrapped: no quality lost, HDR kept, done in seconds.',
      '아이폰 MOV → MP4처럼 영상과 소리를 새 형식에 그대로 담을 수 있으면 다시 인코딩하지 않고 포장만 바꿔요. 화질 손실 없이 HDR도 그대로, 몇 초면 끝나요.',
      '像 iPhone 的 MOV 转 MP4 这样，视频和声音能原样放进新格式时，只重新封装，不重新编码。画质不损失，HDR 保留，几秒就完成。'),
  },
  res720: {
    short: T('720p option', '720p 옵션', '720p 选项'),
    long: T('The MP4 720p preset shrinks large videos for sharing.', 'MP4 720p 프리셋으로 큰 영상을 공유하기 좋게 줄일 수 있어요.', 'MP4 720p 预设可把大视频缩小，便于分享。'),
  },
  extractAudio: {
    short: T('extract audio', '소리 추출', '提取音频'),
    long: T('Only the sound is saved, without the video track.', '영상 트랙 없이 소리만 저장합니다.', '只保存声音，不含视频轨。'),
  },
  mp3128: {
    short: T('MP3 128k', 'MP3 128k', 'MP3 128k'),
    long: T('The MP3 128k preset makes smaller files, ideal for speech.', 'MP3 128k 프리셋은 말소리 위주의 파일을 더 작게 만듭니다.', 'MP3 128k 预设文件更小，适合人声内容。'),
  },
  extract: {
    short: T('extract', '압축 풀기', '解压'),
    long: T('The extract preset unpacks an archive into a folder instead.', '압축 풀기 프리셋을 쓰면 폴더에 바로 풀 수도 있어요.', '也可以用解压预设直接解压到文件夹。'),
  },
  zipAll: {
    short: T('pack into one ZIP', 'ZIP 하나로 묶기', '打包成一个 ZIP'),
    long: T('Any selection of files can be packed into one ZIP.', '어떤 파일이든 골라서 ZIP 하나로 묶을 수 있어요.', '任意选中的文件都可以打包成一个 ZIP。'),
  },
  drmFree: {
    short: T('DRM-free books', 'DRM 없는 책', '无 DRM 书籍'),
    long: T('Works with DRM-free books only.', 'DRM이 없는 책만 변환할 수 있습니다.', '仅支持无 DRM 的书籍。'),
  },
  alac: {
    short: T('ALAC in M4A', 'M4A에 ALAC', 'M4A 中的 ALAC'),
    long: T('M4A can hold lossless ALAC as well as AAC.', 'M4A에는 AAC뿐 아니라 무손실 ALAC도 담을 수 있어요.', 'M4A 除了 AAC，也可以保存无损的 ALAC。'),
  },
  codecs: {
    short: T('HEVC / AV1', 'HEVC·AV1', 'HEVC / AV1'),
    long: T('Video presets can encode HEVC (H.265) or AV1 for smaller files, keeping 10-bit and HDR video.',
      '동영상 프리셋에서 HEVC(H.265)나 AV1을 골라 더 작게 만들 수 있어요. 10비트와 HDR 영상도 그대로예요.',
      '视频预设可选择 HEVC（H.265）或 AV1，文件更小，并保留 10 位和 HDR 视频。'),
  },
  hwEncode: {
    short: T('hardware encoding', '하드웨어 인코딩', '硬件编码'),
    long: T('Turn on Use hardware acceleration in a video preset to encode H.264 and HEVC on the graphics chip (NVENC, Quick Sync, AMF, VideoToolbox or VA-API): much faster and lighter on power, slightly larger at the same quality. It is off by default, and without a usable chip the video is encoded as before.',
      '동영상 프리셋에서 ‘하드웨어 가속 사용’을 켜면 H.264·HEVC를 그래픽 칩(NVENC·Quick Sync·AMF·VideoToolbox·VA-API)으로 인코딩해요. 훨씬 빠르고 전력도 덜 쓰지만, 같은 화질이면 파일이 조금 커져요. 기본은 꺼져 있고, 쓸 수 있는 칩이 없으면 평소처럼 인코딩해요.',
      '在视频预设中开启“使用硬件加速”后，H.264 和 HEVC 会用显卡（NVENC、Quick Sync、AMF、VideoToolbox 或 VA-API）编码，速度快得多，也更省电，同等画质下文件略大。默认关闭，没有可用的显卡时照常编码。'),
  },
  frames: {
    short: T('every frame', '모든 프레임', '每一帧'),
    long: T('Usually a video gives one still frame. The Extract frames presets, or Save every frame of a video in a PNG or JPG preset, save every frame (or every Nth) as pictures in a folder next to the video.',
      '동영상은 정지 이미지 한 장이 돼요. 프레임 추출 프리셋이나 PNG·JPG 프리셋의 ‘동영상의 모든 프레임 저장하기’를 쓰면 프레임마다(또는 N번째 프레임마다) 그림을 동영상 옆 폴더에 저장해요.',
      '视频默认得到一张静止画面。使用“提取帧”预设，或在 PNG/JPG 预设中勾选“保存视频的每一帧”，可把每一帧（或每 N 帧）存为图片，放在视频旁边的文件夹中。'),
  },
  extractSubs: {
    short: T('extract subtitles', '자막 추출', '提取字幕'),
    long: T('The Extract subtitles preset on the video donut saves the first text subtitle track of a video as SRT.',
      '동영상 도넛의 자막 추출 프리셋은 영상의 첫 번째 텍스트 자막 트랙을 SRT로 저장해요.',
      '视频圆环上的“提取字幕”预设会把视频中第一条文本字幕轨保存为 SRT。'),
  },
  utf8: {
    short: T('saved as UTF-8', 'UTF-8로 저장', '保存为 UTF-8'),
    long: T('Results are saved as UTF-8. Korean files saved in CP949 (EUC-KR) are detected and read correctly.',
      '결과는 UTF-8로 저장해요. CP949(EUC-KR)로 저장된 한국어 파일도 알아서 읽어요.',
      '结果保存为 UTF-8。以 CP949（EUC-KR）保存的韩文文件也能自动识别。'),
  },
  tables: {
    short: T('tables to CSV / Excel', '표는 CSV·엑셀로', '表格转 CSV/Excel'),
    long: T('Data that is a table (a list of records) also converts to and from CSV and Excel.',
      '표 모양의 데이터(레코드 목록)는 CSV·엑셀로, 또 CSV·엑셀에서 바꿀 수도 있어요.',
      '表格形式的数据（记录列表）也能与 CSV 和 Excel 互相转换。'),
  },
  preview3d: {
    short: T('picture preview', '그림 미리보기', '预览图'),
    long: T('PNG or JPG gives a shaded picture of the model, seen from the front right and above.',
      'PNG나 JPG로 바꾸면 모델을 오른쪽 앞 위에서 본 음영 그림이 만들어져요.',
      '转成 PNG 或 JPG 会得到模型的着色图，视角为右前上方。'),
  },
  colours3d: {
    short: T('colours and textures', '색과 텍스처', '颜色和纹理'),
    long: T('Colours, textures and materials are kept where the target format can hold them. STL keeps only the shape.',
      '대상 형식이 담을 수 있으면 색·텍스처·재질을 유지해요. STL은 모양만 담아요.',
      '目标格式支持时会保留颜色、纹理和材质。STL 只保存形状。'),
  },
  hdrTone: {
    short: T('HDR tone-mapped', 'HDR 톤 매핑', 'HDR 色调映射'),
    long: T('HDR screenshots that Windows saves as JPEG XR are tone-mapped to normal brightness instead of being clipped.',
      'Windows가 JPEG XR로 저장하는 HDR 스크린샷은 밝은 부분을 잘라 내지 않고 톤 매핑해서 평소 밝기로 바꿔요.',
      'Windows 以 JPEG XR 保存的 HDR 截图会经过色调映射，转为正常亮度，而不是直接截断高光。'),
  },
  livePhoto: {
    short: T('Live Photo video', '라이브 포토 동영상', '实况照片视频'),
    long: T('The Extract Live Photo video preset saves the video of an iPhone Live Photo (a LIVP from iCloud, or a photo with its MOV) or an Android Motion Photo as MP4 or MOV. The other way round, the Live Photo (iPhone) and Motion Photo (Android) presets turn a short clip of a video into a moving photo; that is still experimental.',
      '‘라이브 포토 동영상 추출’ 프리셋은 아이폰 라이브 포토(아이클라우드에서 받은 LIVP, 또는 MOV가 옆에 있는 사진)나 안드로이드 모션 포토의 동영상을 MP4·MOV로 저장해요. 반대로 ‘라이브 포토 (아이폰)’·‘모션 포토 (안드로이드)’ 프리셋은 동영상의 짧은 구간을 움직이는 사진으로 만들어요. 이건 아직 실험 기능이에요.',
      '“提取实况/动态照片视频”预设可把 iPhone 实况照片（从 iCloud 下载的 LIVP，或旁边带有 MOV 的照片）或安卓动态照片中的视频保存为 MP4 或 MOV。反过来，“实况照片（iPhone）”和“动态照片（安卓）”预设可把视频中的一小段做成会动的照片，这项功能仍处于实验阶段。'),
  },
  wgs84: {
    short: T('WGS 84 longitude / latitude', 'WGS 84 경위도', 'WGS 84 经纬度'),
    long: T('Results are always in longitude and latitude (WGS 84). Shapefiles in UTM, Web Mercator, Lambert or Albers are converted, so they open in the right place; converting a file to its own format reprojects it.',
      '결과는 언제나 경위도(WGS 84)예요. UTM·웹 메르카토르·람베르트·알베르스 좌표계의 Shapefile도 변환해서 제자리에 열리고, 같은 형식으로 변환하면 좌표계만 바꿔요.',
      '结果始终为经纬度（WGS 84）。UTM、Web 墨卡托、兰伯特或阿尔伯斯坐标系的 Shapefile 会被转换，在地图上打开时位置正确；转换为同一格式即可重新投影。'),
  },
  geoZip: {
    short: T('save as ZIP', 'ZIP으로 저장', '保存为 ZIP'),
    long: T('A Shapefile is five files (.shp, .shx, .dbf, .prj and .cpg). With Save the result as a ZIP in a preset, or for every geospatial result in the settings, they travel together in one ZIP.',
      'Shapefile은 파일 다섯 개(.shp·.shx·.dbf·.prj·.cpg)로 이뤄져요. 프리셋의 ‘결과를 ZIP으로 저장’을 켜거나 설정에서 지리 정보 결과를 모두 ZIP으로 저장하게 하면 ZIP 하나로 함께 묶여요.',
      'Shapefile 由五个文件组成（.shp、.shx、.dbf、.prj 和 .cpg）。在预设中勾选“将结果保存为 ZIP”，或在设置中对所有地理信息结果启用，它们就会打包进同一个 ZIP。'),
  },
};

/* ───────── Formats and routes, by category ───────── */

/**
 * A format: id (also used in URLs), label, extensions. Optional: display (longer label for "reads" lists), brand,
 * koJong (Korean reading ends in 0 = a vowel, 1 = a consonant, 2 = ㄹ; picks 를/을, 로/으로…), koLabel,
 * name and about (localized; required for formats that appear on conversion pages).
 */
const fmt = (id, label, ext, extra = {}) => ({ id, label, ext, ...extra });

const RAW = [
  ['dng', 'DNG', 'Adobe DNG (Leica, Pentax, phones)'], ['cr2', 'CR2', 'Canon'], ['cr3', 'CR3', 'Canon'], ['crw', 'CRW', 'Canon'],
  ['nef', 'NEF', 'Nikon'], ['nrw', 'NRW', 'Nikon Coolpix'], ['arw', 'ARW', 'Sony'], ['srf', 'SRF', 'Sony'], ['sr2', 'SR2', 'Sony'],
  ['orf', 'ORF', 'Olympus / OM System'], ['rw2', 'RW2', 'Panasonic'], ['raf', 'RAF', 'Fujifilm'], ['pef', 'PEF', 'Pentax'],
  ['srw', 'SRW', 'Samsung'], ['x3f', 'X3F', 'Sigma'], ['3fr', '3FR', 'Hasselblad'], ['erf', 'ERF', 'Epson'], ['mos', 'MOS', 'Leaf'],
  ['mrw', 'MRW', 'Minolta'], ['dcr', 'DCR', 'Kodak'], ['kdc', 'KDC', 'Kodak'], ['iiq', 'IIQ', 'Phase One'], ['fff', 'FFF', 'Hasselblad'],
  ['mef', 'MEF', 'Mamiya'], ['rwl', 'RWL', 'Leica'],
];
const RAW_IDS = RAW.map(([id]) => id);
const RAW_ABOUT = {
  cr2: {
    name: T('Canon CR2 RAW photo', '캐논 CR2 RAW 사진', '佳能 CR2 RAW 照片'),
    about: T('CR2 is the RAW photo format Canon DSLRs used for many years (newer Canon models write CR3). It stores the unprocessed sensor data, which leaves plenty of room for editing.',
      'CR2는 캐논 DSLR이 오랫동안 써 온 RAW 사진 형식입니다(최신 기종은 CR3). 센서의 원본 데이터를 그대로 담아 보정 여유가 큽니다.',
      'CR2 是佳能单反长期使用的 RAW 照片格式（新机型改用 CR3），保存传感器原始数据，后期调整空间大。'),
  },
  nef: {
    name: T('Nikon NEF RAW photo', '니콘 NEF RAW 사진', '尼康 NEF RAW 照片'),
    about: T('NEF is Nikon\'s RAW photo format, used by Nikon DSLRs and Z mirrorless cameras. Like other RAW files it holds unprocessed sensor data and is several times larger than a JPG.',
      'NEF는 니콘 DSLR과 Z 미러리스 카메라가 쓰는 RAW 사진 형식입니다. 다른 RAW처럼 가공 전 센서 데이터를 담고 있어 JPG보다 몇 배 큽니다.',
      'NEF 是尼康单反和 Z 系列无反相机使用的 RAW 照片格式，和其他 RAW 一样保存未处理的传感器数据，体积是 JPG 的数倍。'),
  },
};

const IMG_WRITE = ['jpg', 'png', 'webp', 'avif', 'tiff', 'bmp', 'gif', 'ico', 'psd', 'tga', 'ppm', 'jxl', 'jp2', 'icns', 'pdf',
  'apng', 'mng', 'qoi', 'dds', 'pcx', 'cur', 'xpm', 'xbm', 'wbmp', 'pam', 'pfm', 'sgi', 'ras', 'miff'];
/** Raster images ImageMagick reads (every one can be traced into SVG). */
const IMG_READ = ['jpg', 'png', 'webp', 'avif', 'heic', 'tiff', 'bmp', 'gif', 'ico', 'psd', 'psb', 'tga', 'ppm', 'jxl', 'jp2', 'xcf',
  'icns', 'apng', 'mng', 'qoi', 'dds', 'pcx', 'cur', 'xpm', 'xbm', 'wbmp', 'pam', 'pfm', 'sgi', 'ras', 'miff', 'dcm', 'exr', 'hdr', 'pcd'];
/** Video formats FFmpeg reads. */
const VIDEO_READ = ['mp4', 'm4v', 'mov', 'mkv', 'webm', 'avi', 'wmv', 'flv', 'mpg', 'ts', 'm2ts', '3gp', '3g2', 'ogv', 'vob', 'mod', 'dv', 'mxf',
  'rm', 'swf', 'wtv', 'cavs'];

export const CATEGORIES = [
  {
    id: 'images', icon: 'image', color: '#378add',
    name: T('Images', '이미지', '图片'), plain: T('images', '이미지', '图片'),
    intro: T('Photos and graphics, including iPhone HEIC and Live Photos, Photoshop PSD, camera RAW from all major brands, animated APNG, DICOM and the HDR screenshots of Windows (JPEG XR). Resize, rotate, set quality and DPI or strip metadata while converting, or trace a picture into an SVG.',
      '아이폰 HEIC와 라이브 포토, 포토샵 PSD, 주요 카메라 브랜드의 RAW, 움직이는 APNG, DICOM, Windows의 HDR 스크린샷(JPEG XR)까지 사진과 그래픽을 변환합니다. 변환하면서 크기·회전·품질·DPI를 바꾸거나 메타데이터를 지우고, 그림을 SVG로 벡터화할 수도 있어요.',
      '照片和图形，包括 iPhone 的 HEIC 和实况照片、Photoshop 的 PSD、各大品牌相机的 RAW、动态 APNG、DICOM 以及 Windows 的 HDR 截图（JPEG XR）。转换时可调整尺寸、旋转、质量和 DPI，或清除元数据，还能把图片描摹成 SVG。'),
    formats: [
      fmt('jpg', 'JPG', ['jpg', 'jpeg', 'jpe', 'jfif'], {
        name: T('JPEG image', 'JPEG 이미지', 'JPEG 图像'),
        about: T('JPEG is the most widely used photo format. Its lossy compression keeps files small, but every save at lower quality discards some detail, and it has no transparency.',
          'JPG(JPEG)는 가장 널리 쓰이는 사진 형식입니다. 손실 압축이라 파일이 작지만, 품질을 낮춰 저장할수록 디테일이 조금씩 사라지고 투명도는 지원하지 않습니다.',
          'JPG（JPEG）是最常用的照片格式，采用有损压缩，文件小，但降低质量保存时会丢失部分细节，且不支持透明。'),
      }),
      fmt('png', 'PNG', ['png'], {
        name: T('PNG image', 'PNG 이미지', 'PNG 图像'),
        about: T('PNG is a lossless image format with transparency, ideal for screenshots, logos and graphics with sharp edges. Photos saved as PNG are usually much larger than JPG.',
          'PNG는 투명도를 지원하는 무손실 이미지 형식으로, 스크린샷·로고·선이 선명한 그래픽에 알맞습니다. 사진을 PNG로 저장하면 보통 JPG보다 훨씬 커집니다.',
          'PNG 是支持透明的无损图片格式，适合截图、Logo 和线条清晰的图形。照片存成 PNG 通常比 JPG 大得多。'),
      }),
      fmt('webp', 'WEBP', ['webp'], {
        name: T('WebP image', 'WEBP 이미지', 'WebP 图像'),
        about: T('WebP is Google\'s image format for the web. It supports lossy and lossless compression and transparency and is usually smaller than JPG or PNG, but some editors and upload forms still don\'t accept it.',
          'WEBP는 구글이 만든 웹용 이미지 형식으로, 손실·무손실 압축과 투명도를 모두 지원하고 보통 JPG나 PNG보다 작습니다. 다만 일부 편집 프로그램과 업로드 양식은 아직 받지 않습니다.',
          'WebP 是 Google 推出的网页图片格式，支持有损、无损压缩和透明，通常比 JPG、PNG 更小，但部分编辑软件和上传表单仍不支持。'),
      }),
      fmt('avif', 'AVIF', ['avif'], {
        name: T('AVIF image', 'AVIF 이미지', 'AVIF 图像'),
        about: T('AVIF is a modern image format based on the AV1 video codec. It compresses better than JPG and WebP, but support in older software and devices is still limited.',
          'AVIF는 AV1 동영상 코덱을 바탕으로 한 최신 이미지 형식입니다. JPG나 WEBP보다 압축률이 좋지만 오래된 프로그램과 기기에서는 아직 지원이 부족합니다.',
          'AVIF 是基于 AV1 视频编码的新一代图片格式，压缩率高于 JPG 和 WebP，但旧软件和设备的支持仍然有限。'),
      }),
      fmt('heic', 'HEIC', ['heic', 'heif', 'hif'], {
        display: 'HEIC/HEIF',
        name: T('HEIC / HEIF image', 'HEIC·HEIF 이미지', 'HEIC/HEIF 图像'),
        about: T('HEIC (HEIF) is the photo format iPhones and iPads use by default. Photos are often about half the size of a JPG, but many Windows apps, websites and older devices can\'t open them.',
          'HEIC(HEIF)는 아이폰과 아이패드가 기본으로 쓰는 사진 형식입니다. JPG의 절반 정도 용량으로 저장되는 경우가 많지만, 많은 Windows 프로그램과 웹사이트, 오래된 기기에서 열리지 않습니다.',
          'HEIC（HEIF）是 iPhone 和 iPad 默认的照片格式，体积通常约为 JPG 的一半，但很多 Windows 软件、网站和旧设备无法打开。'),
      }),
      fmt('tiff', 'TIFF', ['tiff', 'tif']),
      fmt('bmp', 'BMP', ['bmp', 'dib']),
      fmt('gif', 'GIF', ['gif'], {
        name: T('GIF image / animation', 'GIF 이미지·애니메이션', 'GIF 图像/动图'),
        about: T('GIF is an old image format limited to 256 colours that supports simple animation. It is still the universal way to share short silent loops in chats, documents and bug reports.',
          'GIF는 256색으로 제한된 오래된 이미지 형식이지만 간단한 애니메이션을 지원해, 짧은 무음 반복 영상을 메신저·문서·버그 제보에 올릴 때 여전히 널리 쓰입니다.',
          'GIF 是只支持 256 色的老牌图片格式，但支持简单动画，至今仍是在聊天、文档和问题反馈中分享无声短循环动图的通用方式。'),
      }),
      fmt('ico', 'ICO', ['ico'], {
        name: T('Windows icon', 'Windows 아이콘', 'Windows 图标'),
        about: T('ICO is the Windows icon format. One ICO file holds the same picture at several sizes (for example 16, 32, 48 and 256 pixels), so it looks sharp everywhere from the taskbar to website favicons.',
          'ICO는 Windows 아이콘 형식입니다. 한 파일에 같은 그림을 여러 크기(예: 16, 32, 48, 256픽셀)로 담아 작업 표시줄부터 웹사이트 파비콘까지 어디서든 선명하게 보입니다.',
          'ICO 是 Windows 图标格式，一个文件里包含同一图案的多种尺寸（如 16、32、48、256 像素），从任务栏到网站 favicon 都能清晰显示。'),
      }),
      fmt('psd', 'PSD', ['psd'], {
        name: T('Photoshop document', '포토샵 문서', 'Photoshop 文档'),
        about: T('PSD is Adobe Photoshop\'s native format. It keeps layers, masks and adjustment settings, so it is great for editing but can\'t be opened by most viewers or websites.',
          'PSD는 어도비 포토샵의 기본 형식으로 레이어·마스크·조정 설정을 담고 있습니다. 편집에는 좋지만 대부분의 뷰어와 웹사이트에서는 열리지 않습니다.',
          'PSD 是 Adobe Photoshop 的原生格式，保存图层、蒙版和调整设置，适合编辑，但大多数看图软件和网站无法打开。'),
      }),
      fmt('psb', 'PSB', ['psb']),
      fmt('tga', 'TGA', ['tga', 'icb', 'vda', 'vst']),
      fmt('ppm', 'PPM', ['ppm', 'pgm', 'pbm', 'pnm'], { display: 'PPM/PGM/PBM' }),
      fmt('jxl', 'JPEG XL', ['jxl'], { koJong: 1 }),
      fmt('jp2', 'JPEG 2000', ['jp2', 'j2k', 'jpf', 'jpx']),
      fmt('xcf', 'XCF', ['xcf'], { brand: 'GIMP' }),
      fmt('icns', 'ICNS', ['icns'], {
        name: T('macOS icon', 'macOS 아이콘', 'macOS 图标'),
        about: T('ICNS is the icon format of macOS. Like ICO it bundles several sizes of one image, up to 1024×1024 for Retina displays, and is used for app icons on the Mac.',
          'ICNS는 macOS의 아이콘 형식입니다. ICO처럼 한 이미지를 여러 크기로 묶으며, 레티나 화면용 1024×1024까지 담아 맥 앱 아이콘에 쓰입니다.',
          'ICNS 是 macOS 的图标格式，与 ICO 类似，把同一图像的多个尺寸打包在一起，最大可达 Retina 屏幕用的 1024×1024，用作 Mac 应用图标。'),
      }),
      fmt('apng', 'APNG', ['apng'], { brand: 'animated PNG' }),
      fmt('mng', 'MNG', ['mng']),
      fmt('qoi', 'QOI', ['qoi']),
      fmt('dds', 'DDS', ['dds'], { brand: 'DirectDraw Surface' }),
      fmt('pcx', 'PCX', ['pcx']),
      fmt('cur', 'CUR', ['cur'], { brand: 'Windows cursor' }),
      fmt('xpm', 'XPM', ['xpm']),
      fmt('xbm', 'XBM', ['xbm']),
      fmt('wbmp', 'WBMP', ['wbmp']),
      fmt('pam', 'PAM', ['pam']),
      fmt('pfm', 'PFM', ['pfm']),
      fmt('sgi', 'SGI', ['sgi', 'rgb', 'rgba', 'bw']),
      fmt('ras', 'Sun Raster', ['ras', 'sun'], { koJong: 0 }),
      fmt('miff', 'MIFF', ['miff'], { brand: 'ImageMagick' }),
      fmt('dcm', 'DICOM', ['dcm', 'dicom'], { brand: 'medical images' }),
      fmt('exr', 'OpenEXR', ['exr']),
      fmt('hdr', 'Radiance HDR', ['hdr']),
      fmt('pcd', 'Photo CD', ['pcd'], { brand: 'Kodak' }),
      fmt('jxr', 'JPEG XR', ['jxr', 'wdp', 'hdp'], { brand: 'Windows HDR screenshots' }),
      fmt('livp', 'LIVP', ['livp'], { display: 'Live Photo (LIVP)', brand: 'iPhone Live Photo from iCloud' }),
      ...RAW.map(([id, label, brand]) => fmt(id, label, [id], { brand, raw: true, ...RAW_ABOUT[id] })),
    ],
    routes: [
      { from: IMG_READ,
        to: IMG_WRITE, engine: 'builtin', via: 'ImageMagick',
        extras: ['quality', 'resize', 'dpi', 'grayscale', 'metadata', 'rotate', 'removeBackground', 'icoSizes', 'tiff', 'merge'] },
      { label: T('Camera RAW', '카메라 RAW', '相机 RAW'), from: RAW_IDS, to: IMG_WRITE, engine: 'builtin', via: 'ImageMagick',
        extras: ['quality', 'resize', 'metadata', 'rotate'] },
      { from: [...IMG_READ, ...RAW_IDS], to: ['svg'], engine: 'builtin', extras: ['trace'] },
      { from: [...IMG_READ.filter(id => id !== 'heic'), ...RAW_IDS, 'jxr'], to: ['heic'],
        engine: 'ffmpeg', extras: ['quality', 'resize', 'metadata'] },
      { from: ['jxr'], to: [...IMG_WRITE, 'svg'], engine: 'builtin', via: 'Windows Imaging Component', extras: ['hdrTone', 'quality', 'resize'],
        note: T('Windows only', 'Windows 전용', '仅限 Windows') },
      { from: ['livp'], to: IMG_WRITE, engine: 'builtin', via: 'ImageMagick', extras: ['quality', 'resize', 'metadata'],
        note: T('the photo of the Live Photo', '라이브 포토의 사진', '实况照片中的照片') },
      { from: ['livp'], to: ['mp4', 'mov'], engine: 'ffmpeg', extras: ['livePhoto'],
        note: T('the video of the Live Photo', '라이브 포토의 동영상', '实况照片中的视频') },
    ],
  },
  {
    id: 'vector', icon: 'vector', color: '#d4537e',
    name: T('Vector graphics', '벡터 그래픽', '矢量图'), plain: T('vector graphics', '벡터 그래픽', '矢量图'),
    intro: T('SVG, Windows metafiles, Illustrator, EPS/PostScript and drawings from CorelDRAW, Visio and LibreOffice Draw. SVG also becomes DXF or DWG for CAD.',
      'SVG, Windows 메타파일(EMF·WMF), 일러스트레이터, EPS·PostScript와 코렐드로·비지오·LibreOffice Draw 도면을 변환합니다. SVG는 CAD용 DXF·DWG로도 바꿀 수 있어요.',
      'SVG、Windows 图元文件（EMF/WMF）、Illustrator、EPS/PostScript，以及 CorelDRAW、Visio 和 LibreOffice Draw 的绘图。SVG 还能转成 CAD 用的 DXF 或 DWG。'),
    formats: [
      fmt('svg', 'SVG', ['svg'], {
        name: T('SVG vector graphic', 'SVG 벡터 그래픽', 'SVG 矢量图'),
        about: T('SVG is an XML-based vector graphics format. Shapes and text stay sharp at any size, which makes it ideal for logos and icons on the web, but many apps and upload forms only accept pixel images.',
          'SVG는 XML 기반의 벡터 그래픽 형식이라 도형과 글자가 어떤 크기에서도 선명해 웹의 로고와 아이콘에 알맞습니다. 하지만 많은 프로그램과 업로드 양식은 픽셀 이미지만 받습니다.',
          'SVG 是基于 XML 的矢量图形格式，图形和文字在任何尺寸下都保持清晰，非常适合网页 Logo 和图标，但很多软件和上传表单只接受位图。'),
      }),
      fmt('svgz', 'SVGZ', ['svgz']),
      fmt('emf', 'EMF', ['emf']),
      fmt('wmf', 'WMF', ['wmf']),
      fmt('ai', 'AI', ['ai'], { brand: 'Adobe Illustrator' }),
      fmt('eps', 'EPS', ['eps', 'epsf', 'epsi'], {
        name: T('Encapsulated PostScript', 'EPS(Encapsulated PostScript)', 'EPS（Encapsulated PostScript）'),
        about: T('EPS is a vector format from print and design work, often used for logos and illustrations sent to print shops. Most modern apps can\'t show it without a PostScript interpreter.',
          'EPS는 인쇄·디자인 작업에서 쓰는 벡터 형식으로, 인쇄소에 넘기는 로고와 일러스트에 자주 쓰입니다. PostScript 해석기가 없으면 요즘 프로그램 대부분에서 볼 수 없습니다.',
          'EPS 是印刷和设计工作中常用的矢量格式，常用于交给印厂的 Logo 和插画。没有 PostScript 解释器，大多数现代软件无法显示。'),
      }),
      fmt('ps', 'PS', ['ps'], { brand: 'PostScript' }),
      fmt('cdr', 'CDR', ['cdr'], { brand: 'CorelDRAW' }),
      fmt('cgm', 'CGM', ['cgm']),
      fmt('vsd', 'VSD', ['vsd', 'vsdx'], { display: 'VSD/VSDX', brand: 'Microsoft Visio' }),
      fmt('odg', 'ODG', ['odg'], { brand: 'LibreOffice Draw' }),
      fmt('fodg', 'FODG', ['fodg'], { brand: 'flat OpenDocument drawing' }),
    ],
    routes: [
      { from: ['svg', 'svgz'], to: ['pdf', 'png', 'jpg', 'svg', 'svgz'], engine: 'builtin', extras: ['vectorPdf'] },
      { from: ['svg', 'svgz'], to: ['dxf', 'dwg'], engine: 'builtin', extras: ['noAutocad'] },
      { from: ['svg'], to: ['emf', 'wmf', 'odg'], engine: 'libreoffice' },
      { from: ['emf', 'wmf'], to: ['png', 'pdf'], engine: 'builtin' },
      { from: ['ai'], to: ['pdf', 'png'], engine: 'builtin',
        note: T('AI files saved with PDF content (Illustrator\'s default)', 'PDF 내용을 함께 저장한 AI 파일(일러스트레이터 기본값)', '包含 PDF 内容的 AI 文件（Illustrator 默认设置）') },
      { from: ['eps', 'ps'], to: ['pdf', 'png'], engine: 'ghostscript', extras: ['vectorPdf'] },
      { from: ['cdr', 'cgm', 'vsd', 'odg', 'fodg'], to: ['pdf', 'svg', 'png'], engine: 'libreoffice' },
    ],
  },
  {
    id: 'pdf', icon: 'pdf', color: '#e5252a',
    name: T('PDF', 'PDF', 'PDF'), plain: T('PDF', 'PDF', 'PDF'),
    intro: T('Turn PDFs into images, editable Word or HWPX documents, PowerPoint slides, text or a comic archive, and merge, split, compress or pick pages.',
      'PDF를 이미지, 편집 가능한 워드·HWPX 문서, 파워포인트 슬라이드, 텍스트, 만화책 압축(CBZ)으로 바꾸고, 합치기·나누기·압축·페이지 고르기를 할 수 있습니다.',
      '把 PDF 转成图片、可编辑的 Word 或 HWPX 文档、PowerPoint 幻灯片、文本或漫画压缩包（CBZ），还能合并、拆分、压缩和挑选页面。'),
    formats: [
      fmt('pdf', 'PDF', ['pdf'], {
        name: T('PDF document', 'PDF 문서', 'PDF 文档'),
        about: T('PDF is the standard for sharing documents that must look the same everywhere. Fonts, layout and images are fixed, and it opens on any device. That also makes PDFs hard to edit.',
          'PDF는 어디서 열어도 똑같이 보여야 하는 문서를 공유할 때 쓰는 표준 형식입니다. 글꼴·레이아웃·이미지가 고정되어 모든 기기에서 열리지만, 그만큼 편집은 어렵습니다.',
          'PDF 是分享文档的标准格式，字体、版式和图片都是固定的，在任何设备上看起来都一样，但也因此很难编辑。'),
      }),
    ],
    routes: [
      { from: ['pdf'], to: ['png', 'jpg', 'tiff'], engine: 'builtin', via: 'PDFium', extras: ['renderDpi', 'pages', 'longImage'] },
      { from: ['pdf'], to: ['docx', 'hwpx', 'epub', 'txt', 'md', 'html', 'cbz'], engine: 'builtin', extras: ['editable'] },
      { from: ['pdf'], to: ['pptx'], engine: 'builtin', extras: ['slides'] },
      { from: ['pdf'], to: [], engine: 'builtin', via: 'PDFsharp', extras: ['merge', 'split', 'pages', 'compress'] },
      { from: ['pdf'], to: ['eps', 'ps'], engine: 'ghostscript' },
      { from: ['pdf'], to: ['svg'], engine: 'libreoffice',
        note: T('one page', '한 페이지', '单页') },
    ],
  },
  {
    id: 'documents', icon: 'document', color: '#2b579a',
    name: T('Documents', '문서', '文档'), plain: T('documents', '문서', '文档'),
    intro: T('Word documents without Microsoft Office, Chinese OFD e-invoices, older and rare word-processor formats with the optional LibreOffice engine, and saved e-mails (EML and Outlook MSG).',
      '마이크로소프트 오피스 없이 워드 문서와 중국 OFD 전자 세금계산서를 변환하고, 오래되거나 드문 워드프로세서 형식은 추가 엔진 LibreOffice로, 저장한 이메일(EML·아웃룩 MSG)도 변환합니다.',
      '无需 Microsoft Office 即可转换 Word 文档和 OFD 电子发票。旧版和少见的文字处理格式使用可选引擎 LibreOffice。还支持保存的电子邮件（EML 和 Outlook MSG）。'),
    formats: [
      fmt('docx', 'DOCX', ['docx'], {
        name: T('Word document', '워드 문서', 'Word 文档'),
        about: T('DOCX is the Microsoft Word format since Word 2007 (Office Open XML). It is the most common format for editable documents such as reports, letters and forms.',
          'DOCX는 워드 2007부터 쓰이는 Microsoft Word 형식(Office Open XML)입니다. 보고서·편지·양식처럼 편집 가능한 문서에 가장 많이 쓰입니다.',
          'DOCX 是 Word 2007 起使用的 Microsoft Word 格式（Office Open XML），是报告、信函、表单等可编辑文档最常见的格式。'),
      }),
      fmt('docm', 'DOCM', ['docm']),
      fmt('dotx', 'DOTX', ['dotx']),
      fmt('dotm', 'DOTM', ['dotm']),
      fmt('doc', 'DOC', ['doc'], {
        koJong: 1,
        name: T('Word 97–2003 document', '워드 97~2003 문서', 'Word 97–2003 文档'),
        about: T('DOC is the binary format of Word 97–2003. Old archives, official forms and legacy systems still produce it, but it is being replaced by DOCX.',
          'DOC는 워드 97~2003의 바이너리 형식입니다. 오래된 자료, 관공서 서식, 옛 시스템에서 아직 만들어지지만 점점 DOCX로 바뀌고 있습니다.',
          'DOC 是 Word 97–2003 使用的二进制格式，旧资料、公文模板和老系统仍在产生这种文件，但正逐渐被 DOCX 取代。'),
      }),
      fmt('dot', 'DOT', ['dot'], { brand: 'Word 97–2003 template' }),
      fmt('odt', 'ODT', ['odt'], { brand: 'OpenDocument' }),
      fmt('fodt', 'FODT', ['fodt'], { brand: 'flat OpenDocument text' }),
      fmt('ott', 'OTT', ['ott'], { brand: 'OpenDocument template' }),
      fmt('rtf', 'RTF', ['rtf']),
      fmt('wps', 'WPS', ['wps'], { brand: 'Microsoft Works / WPS Office' }),
      fmt('ofd', 'OFD', ['ofd'], { brand: 'Chinese e-invoices and official documents (GB/T 33190)' }),
      fmt('wpd', 'WPD', ['wpd'], { brand: 'WordPerfect' }),
      fmt('lwp', 'LWP', ['lwp'], { brand: 'Lotus Word Pro' }),
      fmt('abw', 'ABW', ['abw', 'zabw'], { brand: 'AbiWord' }),
      fmt('pages', 'Pages', ['pages'], { brand: 'Apple Pages' }),
      fmt('sdw', 'SDW', ['sdw'], { brand: 'StarWriter' }),
      fmt('cwk', 'ClarisWorks', ['cwk'], { brand: 'ClarisWorks / AppleWorks', koJong: 0 }),
      fmt('mcw', 'MacWrite', ['mcw'], { koJong: 0 }),
      fmt('602', 'T602', ['602']),
      fmt('psw', 'Pocket Word', ['psw'], { koJong: 0 }),
      fmt('pub', 'PUB', ['pub'], { brand: 'Microsoft Publisher', koJong: 1 }),
      fmt('eml', 'EML', ['eml'], {
        koJong: 2,
        name: T('E-mail message', '이메일 메시지', '电子邮件'),
        about: T('EML is a single e-mail saved as a file (MIME format), with the headers, the message and its attachments. Most mail apps, including Outlook and Thunderbird, can open it.',
          'EML은 이메일 한 통을 파일로 저장한 형식(MIME)으로, 머리글·본문·첨부 파일을 담습니다. 아웃룩, 썬더버드 등 대부분의 메일 프로그램에서 열 수 있습니다.',
          'EML 是把一封电子邮件保存为文件的格式（MIME），包含邮件头、正文和附件，Outlook、Thunderbird 等大多数邮件客户端都能打开。'),
      }),
      fmt('msg', 'MSG', ['msg'], {
        brand: 'Outlook',
        name: T('Outlook message', '아웃룩 메시지', 'Outlook 邮件'),
        about: T('MSG is the file Microsoft Outlook saves when you drag an e-mail out of it. Only Outlook opens it, so it is hard to read on a PC without Outlook or on a phone.',
          'MSG는 아웃룩에서 메일을 끌어내 저장하면 생기는 파일입니다. 아웃룩에서만 열려서 아웃룩이 없는 PC나 휴대폰에서는 읽기 어렵습니다.',
          'MSG 是从 Microsoft Outlook 中拖出邮件时保存的文件，只有 Outlook 能打开，在没有 Outlook 的电脑或手机上很难阅读。'),
      }),
    ],
    routes: [
      { from: ['docx', 'docm', 'dotx', 'dotm'], to: ['pdf', 'hwpx', 'hwp', 'epub', 'txt', 'html', 'png', 'jpg'], engine: 'builtin', extras: ['noOffice', 'merge'] },
      { from: ['docx'], to: ['md'], engine: 'pandoc' },
      { from: ['ofd'], to: ['pdf', 'docx', 'hwpx', 'txt', 'md', 'html', 'epub'], engine: 'builtin', extras: ['noOffice'] },
      { from: ['doc', 'dot', 'odt', 'fodt', 'ott', 'rtf', 'wps', 'wpd', 'lwp', 'abw', 'pages', 'sdw', 'cwk', 'mcw', '602', 'psw'],
        to: ['pdf', 'docx', 'odt'], engine: 'libreoffice', extras: ['merge'] },
      { from: ['docx', 'doc', 'odt', 'rtf'], to: ['fodt', 'ott'], engine: 'libreoffice' },
      { from: ['pub'], to: ['pdf', 'svg', 'png'], engine: 'libreoffice' },
      { from: ['eml', 'msg'], to: ['pdf', 'html', 'txt', 'zip'], engine: 'builtin', extras: ['attachments'] },
      { from: ['msg'], to: ['eml'], engine: 'builtin' },
    ],
  },
  {
    id: 'hwp', icon: 'hwp', color: '#1b7fc4',
    name: T('HWP (Hangul)', '한글(HWP)', '韩文 HWP'), plain: T('Korean HWP/HWPX', '한글(HWP·HWPX)', '韩文 HWP/HWPX'),
    intro: T('Korean Hancom Hangul documents without Hancom Office: HWP ↔ HWPX, to PDF, images, Word, text, Markdown and HTML, and HWPX from Word, Excel, PowerPoint, Markdown and PDF.',
      '한컴오피스 없이 한글 문서를 변환합니다. HWP ↔ HWPX, PDF·이미지·워드·텍스트·마크다운·HTML로, 그리고 워드·엑셀·파워포인트·마크다운·PDF에서 HWPX로.',
      '无需 Hancom Office 转换韩文（한글）文档：HWP ↔ HWPX，转为 PDF、图片、Word、文本、Markdown 和 HTML，也能从 Word、Excel、PowerPoint、Markdown 和 PDF 生成 HWPX。'),
    formats: [
      fmt('hwp', 'HWP', ['hwp'], {
        name: T('Hangul document (HWP)', '한글 문서(HWP)', '韩文文档（HWP）'),
        about: T('HWP is the document format of Hancom Office Hangul (한글), the standard word processor in Korean government offices, schools and many companies. Outside Korea few programs can open it.',
          'HWP는 한컴오피스 한글의 문서 형식으로, 공공기관·학교·기업에서 표준처럼 쓰입니다. 한글이 없으면 열거나 고치기 어렵습니다.',
          'HWP 是韩国 Hancom Office 韩文文字处理软件（한글）的文档格式，韩国政府机关、学校和很多企业都在用，韩国以外很少有软件能打开。'),
      }),
      fmt('hwpx', 'HWPX', ['hwpx'], {
        name: T('Hangul document (HWPX)', '한글 문서(HWPX)', '韩文文档（HWPX）'),
        about: T('HWPX is the open, XML-based format of Hancom Hangul (OWPML, Korean national standard KS X 6101). Korean public institutions are moving to it from the binary HWP format.',
          'HWPX는 한글의 개방형 XML 문서 형식(OWPML, 국가표준 KS X 6101)입니다. 공공기관을 중심으로 바이너리 HWP 대신 쓰이는 추세입니다.',
          'HWPX 是韩文文字处理软件（한글）基于 XML 的开放格式（OWPML，韩国国家标准 KS X 6101），韩国公共机构正逐步用它取代二进制的 HWP。'),
      }),
    ],
    routes: [
      { from: ['hwp', 'hwpx'], to: ['pdf', 'png', 'jpg', 'docx', 'txt', 'md', 'html', 'epub'], engine: 'builtin', extras: ['noHancom', 'merge'] },
      { from: ['hwp'], to: ['hwpx'], engine: 'builtin', via: 'rhwp', extras: ['noHancom'] },
      { from: ['hwpx'], to: ['hwp'], engine: 'builtin', via: 'rhwp', extras: ['noHancom'] },
      { from: ['docx', 'xlsx', 'pptx', 'md', 'pdf'], to: ['hwpx'], engine: 'builtin', via: 'Filee HWPX writer', extras: ['layoutKept', 'noHancom'] },
      { from: ['docx', 'xlsx', 'pptx', 'md', 'txt', 'html', 'pdf', 'epub'], to: ['hwp'], engine: 'builtin', via: 'HWPX → rhwp', extras: ['noHancom'] },
    ],
  },
  {
    id: 'spreadsheets', icon: 'table', color: '#1d7a46',
    name: T('Spreadsheets', '스프레드시트', '电子表格'), plain: T('spreadsheets', '스프레드시트', '电子表格'),
    intro: T('Excel, OpenDocument and CSV/TSV sheets, to PDF with Excel-like page fitting or into each other, without Excel.',
      '엑셀·오픈도큐먼트·CSV/TSV 시트를 엑셀 없이 PDF로(엑셀처럼 페이지에 맞춰) 바꾸거나 서로 변환합니다.',
      '无需 Excel，把 Excel、OpenDocument 和 CSV/TSV 表格转成 PDF（像 Excel 一样适配页面），或互相转换。'),
    formats: [
      fmt('xlsx', 'XLSX', ['xlsx'], {
        name: T('Excel workbook', '엑셀 통합 문서', 'Excel 工作簿'),
        about: T('XLSX is the Microsoft Excel workbook format since Excel 2007. One workbook can hold several sheets with formulas, formatting, charts and pictures.',
          'XLSX는 엑셀 2007부터 쓰이는 Microsoft Excel 통합 문서 형식으로, 한 파일에 수식·서식·차트·그림이 있는 여러 시트를 담을 수 있습니다.',
          'XLSX 是 Excel 2007 起使用的 Microsoft Excel 工作簿格式，一个文件可包含多个带公式、格式、图表和图片的工作表。'),
      }),
      fmt('xlsm', 'XLSM', ['xlsm']),
      fmt('xltx', 'XLTX', ['xltx']),
      fmt('xls', 'XLS', ['xls'], {
        name: T('Excel 97–2003 workbook', '엑셀 97~2003 통합 문서', 'Excel 97–2003 工作簿'),
        about: T('XLS is the binary workbook format of Excel 97–2003. Many older systems and bank or accounting exports still produce it.',
          'XLS는 엑셀 97~2003의 바이너리 통합 문서 형식입니다. 오래된 시스템이나 은행·회계 프로그램의 내보내기에서 아직 자주 나옵니다.',
          'XLS 是 Excel 97–2003 的二进制工作簿格式，很多旧系统以及银行、财务软件导出的文件仍是这种格式。'),
      }),
      fmt('xlt', 'XLT', ['xlt'], { brand: 'Excel 97–2003 template' }),
      fmt('ods', 'ODS', ['ods'], { brand: 'OpenDocument' }),
      fmt('ots', 'OTS', ['ots'], { brand: 'OpenDocument template' }),
      fmt('fods', 'FODS', ['fods'], { brand: 'flat OpenDocument spreadsheet' }),
      fmt('csv', 'CSV', ['csv'], {
        name: T('Comma-separated values', 'CSV(쉼표로 구분된 값)', 'CSV（逗号分隔值）'),
        about: T('CSV is plain text with one table row per line. Every spreadsheet, database and programming language reads it, but it has no formatting, formulas or multiple sheets.',
          'CSV는 한 줄에 표의 한 행을 적는 텍스트 형식입니다. 모든 스프레드시트·데이터베이스·프로그래밍 언어가 읽을 수 있지만 서식·수식·여러 시트는 담지 못합니다.',
          'CSV 是每行对应表格一行的纯文本格式，所有电子表格、数据库和编程语言都能读取，但不能保存格式、公式或多个工作表。'),
      }),
      fmt('tsv', 'TSV', ['tsv', 'tab']),
      fmt('numbers', 'Numbers', ['numbers'], { brand: 'Apple Numbers', koJong: 0 }),
      fmt('et', 'ET', ['et'], { brand: 'WPS Spreadsheets' }),
      fmt('sdc', 'SDC', ['sdc'], { brand: 'StarCalc' }),
    ],
    routes: [
      { from: ['xlsx', 'xlsm', 'xltx', 'xls', 'xlt', 'ods', 'csv', 'tsv'], to: ['pdf', 'xlsx', 'csv', 'tsv', 'ods', 'json', 'hwpx', 'html'], engine: 'builtin',
        extras: ['noOffice', 'perSheet', 'merge'] },
      { from: ['numbers', 'et', 'sdc', 'fods', 'ots'], to: ['pdf', 'xlsx'], engine: 'libreoffice' },
      { from: ['xlsx', 'xls', 'ods'], to: ['ots', 'xlt'], engine: 'libreoffice' },
    ],
  },
  {
    id: 'presentations', icon: 'slides', color: '#c8502e',
    name: T('Presentations', '프레젠테이션', '演示文稿'), plain: T('presentations', '프레젠테이션', '演示文稿'),
    intro: T('PowerPoint to PDF, images and HWPX without PowerPoint; older PPT, ODP and Keynote with the optional LibreOffice engine.',
      '파워포인트 없이 PPTX를 PDF·이미지·HWPX로, 예전 PPT·ODP·키노트는 추가 엔진 LibreOffice로 변환합니다.',
      '无需 PowerPoint 把 PPTX 转成 PDF、图片和 HWPX；旧版 PPT、ODP 和 Keynote 使用可选引擎 LibreOffice。'),
    formats: [
      fmt('pptx', 'PPTX', ['pptx'], {
        name: T('PowerPoint presentation', '파워포인트 프레젠테이션', 'PowerPoint 演示文稿'),
        about: T('PPTX is the Microsoft PowerPoint format since PowerPoint 2007. It holds slides with text, pictures, shapes, tables, notes and animations.',
          'PPTX는 파워포인트 2007부터 쓰이는 Microsoft PowerPoint 형식으로, 텍스트·그림·도형·표·노트·애니메이션이 있는 슬라이드를 담습니다.',
          'PPTX 是 PowerPoint 2007 起使用的 Microsoft PowerPoint 格式，包含带文字、图片、形状、表格、备注和动画的幻灯片。'),
      }),
      fmt('pptm', 'PPTM', ['pptm']),
      fmt('potx', 'POTX', ['potx']),
      fmt('potm', 'POTM', ['potm']),
      fmt('ppsx', 'PPSX', ['ppsx']),
      fmt('ppt', 'PPT', ['ppt', 'pps', 'pot'], {
        name: T('PowerPoint 97–2003 presentation', '파워포인트 97~2003 프레젠테이션', 'PowerPoint 97–2003 演示文稿'),
        about: T('PPT is the binary format of PowerPoint 97–2003. Old lecture slides and archived presentations are often still in PPT.',
          'PPT는 파워포인트 97~2003의 바이너리 형식입니다. 예전 강의 자료나 보관된 발표 자료는 아직 PPT인 경우가 많습니다.',
          'PPT 是 PowerPoint 97–2003 的二进制格式，很多旧课件和存档的演示文稿仍是 PPT。'),
      }),
      fmt('odp', 'ODP', ['odp'], { brand: 'OpenDocument' }),
      fmt('otp', 'OTP', ['otp'], { brand: 'OpenDocument template' }),
      fmt('fodp', 'FODP', ['fodp'], { brand: 'flat OpenDocument presentation' }),
      fmt('key', 'Keynote', ['key'], { brand: 'Apple Keynote' }),
      fmt('dps', 'DPS', ['dps'], { brand: 'WPS Presentation' }),
      fmt('sda', 'SDA', ['sda', 'sdd'], { brand: 'StarImpress / StarDraw' }),
    ],
    routes: [
      { from: ['pptx', 'pptm', 'potx', 'potm', 'ppsx'], to: ['pdf', 'png', 'jpg', 'docx', 'hwpx'], engine: 'builtin', extras: ['noOffice', 'merge'] },
      { from: ['ppt', 'odp', 'otp', 'fodp', 'key', 'dps', 'sda'], to: ['pdf', 'pptx', 'odp'], engine: 'libreoffice', extras: ['merge'] },
      { from: ['pptx', 'ppt', 'odp'], to: ['otp'], engine: 'libreoffice' },
    ],
  },
  {
    id: 'text', icon: 'text', color: '#5f5e5a',
    name: T('Text & markup', '텍스트·마크업', '文本与标记'), plain: T('text and markup', '텍스트·마크업', '文本与标记'),
    intro: T('Plain text, Markdown, HTML and saved web pages (MHTML) to PDF, Word, HWPX and EPUB. LaTeX, reStructuredText, Org, AsciiDoc, Typst, Jupyter and other markup use the optional Pandoc engine, which also turns Markdown into PowerPoint slides.',
      '텍스트·마크다운·HTML과 저장한 웹 페이지(MHTML)를 PDF·워드·HWPX·EPUB으로 변환합니다. LaTeX, reStructuredText, Org, AsciiDoc, Typst, 주피터 같은 마크업은 추가 엔진 Pandoc을 쓰고, 마크다운을 파워포인트 슬라이드로도 만들어요.',
      '把纯文本、Markdown、HTML 和保存的网页（MHTML）转成 PDF、Word、HWPX 和 EPUB。LaTeX、reStructuredText、Org、AsciiDoc、Typst、Jupyter 等标记语言使用可选引擎 Pandoc，它还能把 Markdown 转成 PowerPoint 幻灯片。'),
    formats: [
      fmt('txt', 'TXT', ['txt', 'log', 'py', 'pac', 'bat', 'command'], {
        name: T('Plain text', '텍스트 파일', '纯文本'),
        about: T('TXT is plain text without any formatting, the simplest and most portable document format. The only thing that can differ is the character encoding (UTF-8, UTF-16 or a legacy code page).',
          'TXT는 서식이 전혀 없는 순수 텍스트로, 가장 단순하고 어디서나 열리는 문서 형식입니다. 다를 수 있는 건 문자 인코딩(UTF-8, UTF-16, CP949 같은 옛 코드 페이지)뿐입니다.',
          'TXT 是不含任何格式的纯文本，是最简单、兼容性最好的文档格式，唯一可能不同的是字符编码（UTF-8、UTF-16 或旧式代码页）。'),
      }),
      fmt('md', 'Markdown', ['md', 'markdown'], {
        koLabel: '마크다운', koJong: 1,
        name: T('Markdown', '마크다운', 'Markdown'),
        about: T('Markdown is a lightweight plain-text markup: # for headings, * for lists, ** for bold. It is popular for notes, README files and documentation, and is readable even without rendering.',
          '마크다운은 # 제목, * 목록, ** 굵게처럼 기호로 서식을 적는 가벼운 텍스트 형식입니다. 메모·README·문서 작성에 많이 쓰이며 렌더링 없이도 읽기 쉽습니다.',
          'Markdown 是一种轻量级纯文本标记语言：# 表示标题，* 表示列表，** 表示加粗。常用于笔记、README 和技术文档，不渲染也便于阅读。'),
      }),
      fmt('html', 'HTML', ['html', 'htm', 'xhtml'], {
        koJong: 2,
        name: T('Web page (HTML)', '웹 페이지(HTML)', '网页（HTML）'),
        about: T('HTML is the language of web pages. A saved .html file opens in any browser, but how it looks depends on the browser and on linked styles and images, which may be missing offline.',
          'HTML은 웹 페이지를 만드는 언어입니다. 저장한 .html 파일은 어느 브라우저에서나 열리지만, 모양이 브라우저와 연결된 스타일·이미지에 따라 달라지고 오프라인에서는 일부가 빠질 수 있습니다.',
          'HTML 是网页的语言。保存的 .html 文件可以在任何浏览器中打开，但显示效果取决于浏览器以及外链的样式和图片，离线时可能缺失。'),
      }),
      fmt('mhtml', 'MHTML', ['mhtml', 'mht'], { brand: 'web page saved as a single file' }),
      fmt('rst', 'reStructuredText', ['rst'], { koJong: 0 }),
      fmt('tex', 'LaTeX', ['tex', 'latex'], { koJong: 0 }),
      fmt('org', 'Org', ['org'], { brand: 'Emacs Org mode' }),
      fmt('adoc', 'AsciiDoc', ['adoc', 'asciidoc'], { koJong: 1 }),
      fmt('typ', 'Typst', ['typ'], { koJong: 0 }),
      fmt('mediawiki', 'MediaWiki', ['mediawiki', 'wiki'], { koJong: 0 }),
      fmt('dbk', 'DocBook', ['dbk', 'docbook'], { koJong: 1 }),
      fmt('ipynb', 'Jupyter', ['ipynb'], { brand: 'Jupyter notebook', koJong: 0 }),
      fmt('textile', 'Textile', ['textile'], { koJong: 2 }),
      fmt('man', 'Man page', ['man'], { brand: 'Unix manual page', koJong: 0 }),
      fmt('opml', 'OPML', ['opml'], { koJong: 2 }),
    ],
    routes: [
      { from: ['txt', 'md', 'html'], to: ['pdf', 'docx', 'hwpx', 'epub'], engine: 'builtin', extras: ['merge'] },
      { from: ['txt'], to: ['txt'], engine: 'builtin', extras: ['utf8'],
        note: T('LOG files and scripts (PY, PAC, BAT, COMMAND) are read as text and never run',
          'LOG 파일과 스크립트(PY·PAC·BAT·COMMAND)는 텍스트로만 읽고 실행하지 않아요',
          'LOG 文件和脚本（PY、PAC、BAT、COMMAND）只作为文本读取，绝不会运行') },
      { from: ['mhtml'], to: ['html', 'pdf', 'docx', 'hwpx', 'txt', 'md', 'epub'], engine: 'builtin',
        note: T('the saved page, with its pictures', '저장한 페이지를 그림과 함께', '保存的网页，连同其中的图片') },
      { from: ['rst', 'tex', 'org', 'adoc', 'typ', 'mediawiki', 'dbk', 'ipynb', 'textile', 'man', 'opml'],
        to: ['pdf', 'docx', 'hwpx', 'odt', 'html', 'md', 'epub', 'txt'], engine: 'pandoc' },
      { from: ['docx', 'html', 'md'], to: ['rst', 'tex', 'org', 'adoc', 'typ', 'mediawiki', 'dbk', 'ipynb', 'textile', 'man', 'opml'], engine: 'pandoc' },
      { from: ['md', 'rst', 'org', 'adoc', 'typ', 'mediawiki', 'textile', 'ipynb'], to: ['pptx'], engine: 'pandoc' },
    ],
  },
  {
    id: 'data', icon: 'data', color: '#4d7c0f',
    name: T('Data', '데이터', '数据'), plain: T('data files', '데이터 파일', '数据文件'),
    intro: T('JSON, JSON Lines, YAML, TOML and XML into each other, and tables to and from CSV and Excel. vCard contacts to and from CSV, also from old phones. Nothing to install.',
      'JSON·JSON Lines·YAML·TOML·XML을 서로 바꾸고, 표 데이터는 CSV·엑셀과 오갈 수 있어요. vCard 연락처도 CSV로, CSV에서 vCard로 바꿔요. 옛 휴대폰 파일도 돼요. 따로 설치할 건 없어요.',
      'JSON、JSON Lines、YAML、TOML 和 XML 互相转换，表格数据还能与 CSV、Excel 互转。vCard 联系人可与 CSV 互转，旧手机导出的也可以。无需安装其他软件。'),
    formats: [
      fmt('json', 'JSON', ['json'], {
        koJong: 0,
        name: T('JSON data', 'JSON 데이터', 'JSON 数据'),
        about: T('JSON is the data format of the web: objects, lists, text and numbers in plain text. APIs, apps and settings files use it everywhere.',
          'JSON은 웹의 대표 데이터 형식으로, 객체·목록·글자·숫자를 텍스트로 적습니다. API, 앱, 설정 파일 어디서나 쓰여요.',
          'JSON 是网络上最常用的数据格式，用纯文本表示对象、列表、文字和数字，API、应用和配置文件到处都在用。'),
      }),
      fmt('jsonl', 'JSON Lines', ['jsonl', 'ndjson'], { koJong: 0 }),
      fmt('yaml', 'YAML', ['yaml', 'yml'], {
        koJong: 2,
        name: T('YAML data', 'YAML 데이터', 'YAML 数据'),
        about: T('YAML holds the same kind of data as JSON, written with indentation instead of brackets. Config files for Docker, Kubernetes, CI pipelines and many apps are YAML.',
          'YAML은 JSON과 같은 데이터를 괄호 대신 들여쓰기로 적는 형식입니다. 도커·쿠버네티스·CI 파이프라인과 여러 앱의 설정 파일이 YAML이에요.',
          'YAML 能保存和 JSON 相同的数据，用缩进代替括号。Docker、Kubernetes、CI 流水线和很多应用的配置文件都是 YAML。'),
      }),
      fmt('toml', 'TOML', ['toml'], { koJong: 2 }),
      fmt('xml', 'XML', ['xml'], { koJong: 2 }),
      fmt('vcf', 'vCard', ['vcf', 'vcard'], {
        koJong: 0,
        name: T('vCard contacts', 'vCard 연락처', 'vCard 联系人'),
        about: T('vCard (.vcf) is the standard file for contacts. Phones, Outlook, Google Contacts and iCloud export address books as vCard, often many contacts in one file.',
          'vCard(.vcf)는 연락처를 담는 표준 파일입니다. 휴대폰·아웃룩·구글 주소록·아이클라우드가 주소록을 vCard로 내보내고, 한 파일에 여러 명이 들어 있는 경우가 많아요.',
          'vCard（.vcf）是保存联系人的标准文件。手机、Outlook、Google 通讯录和 iCloud 都以 vCard 导出通讯录，一个文件里常有很多联系人。'),
      }),
    ],
    routes: [
      { from: ['json', 'jsonl', 'yaml', 'toml', 'xml'], to: ['json', 'jsonl', 'yaml', 'toml', 'xml', 'csv', 'xlsx'], engine: 'builtin', extras: ['tables'] },
      { from: ['csv', 'xlsx'], to: ['json', 'jsonl', 'yaml', 'toml', 'xml'], engine: 'builtin', extras: ['tables'] },
      { from: ['vcf'], to: ['csv', 'xlsx'], engine: 'builtin', extras: ['utf8'] },
      { from: ['csv'], to: ['vcf'], engine: 'builtin' },
    ],
  },
  {
    id: 'ebooks', icon: 'book', color: '#8a5cc2',
    name: T('E-books & comics', '전자책·만화', '电子书与漫画'), plain: T('e-books and comics', '전자책·만화', '电子书与漫画'),
    intro: T('EPUB, Kindle (MOBI, AZW, AZW3), FictionBook and comic archives (CBZ, CBR, CB7…) to PDF, EPUB, Word and more, and KEPUB for Kobo readers. DRM-free books only.',
      'EPUB, 킨들(MOBI·AZW·AZW3), FictionBook, 만화책 압축(CBZ·CBR·CB7 등)을 PDF·EPUB·워드 등으로, 코보 단말기용 KEPUB으로도 변환합니다. DRM이 없는 책만 가능합니다.',
      '把 EPUB、Kindle（MOBI、AZW、AZW3）、FictionBook 和漫画压缩包（CBZ、CBR、CB7 等）转成 PDF、EPUB、Word 等格式，也能转成 Kobo 阅读器用的 KEPUB。仅限无 DRM 的书籍。'),
    formats: [
      fmt('epub', 'EPUB', ['epub'], {
        koJong: 1,
        name: T('EPUB e-book', 'EPUB 전자책', 'EPUB 电子书'),
        about: T('EPUB is the open standard for e-books. Text reflows to fit any screen, and most e-readers and reading apps support it; Kindle accepts EPUB through Send to Kindle.',
          'EPUB은 전자책의 개방형 표준 형식입니다. 화면 크기에 맞춰 글이 다시 배치되고 대부분의 전자책 단말기와 앱에서 읽을 수 있습니다.',
          'EPUB 是开放的电子书标准格式，文字会根据屏幕大小重新排版，大多数电子书阅读器和阅读应用都支持。'),
      }),
      fmt('kepub', 'KEPUB', ['kepub.epub', 'kepub'], { brand: 'Kobo', koJong: 1 }),
      fmt('mobi', 'MOBI', ['mobi'], {
        name: T('Kindle / Mobipocket e-book', '킨들·모비포켓 전자책', 'Kindle/Mobipocket 电子书'),
        about: T('MOBI is the older Mobipocket e-book format that Amazon Kindle used for years. It is still common in older e-book collections, but Amazon has moved to AZW3/KFX and EPUB.',
          'MOBI는 아마존 킨들이 오랫동안 써 온 모비포켓 전자책 형식입니다. 오래된 전자책 모음에 아직 많지만, 아마존은 AZW3·KFX와 EPUB으로 옮겨 갔습니다.',
          'MOBI 是亚马逊 Kindle 长期使用的 Mobipocket 电子书格式，旧的电子书收藏里仍很常见，但亚马逊已转向 AZW3/KFX 和 EPUB。'),
      }),
      fmt('azw', 'AZW', ['azw'], { brand: 'Kindle' }),
      fmt('azw3', 'AZW3', ['azw3'], { brand: 'Kindle' }),
      fmt('azw4', 'AZW4', ['azw4'], { brand: 'Kindle' }),
      fmt('prc', 'PRC', ['prc'], { brand: 'Mobipocket' }),
      fmt('fb2', 'FB2', ['fb2'], { brand: 'FictionBook' }),
      fmt('cbz', 'CBZ', ['cbz']),
      fmt('cbr', 'CBR', ['cbr']),
      fmt('cb7', 'CB7', ['cb7']),
      fmt('cbt', 'CBT', ['cbt']),
      fmt('cbc', 'CBC', ['cbc']),
      fmt('htmlz', 'HTMLZ', ['htmlz']),
      fmt('txtz', 'TXTZ', ['txtz']),
      fmt('lit', 'LIT', ['lit'], { brand: 'Microsoft Reader' }),
      fmt('lrf', 'LRF', ['lrf'], { brand: 'Sony Reader' }),
      fmt('chm', 'CHM', ['chm'], { brand: 'Compiled HTML Help' }),
      fmt('pdb', 'PDB', ['pdb'], { brand: 'Palm eReader' }),
      fmt('pml', 'PML', ['pml']),
      fmt('rb', 'RB', ['rb'], { brand: 'Rocket eBook' }),
      fmt('snb', 'SNB', ['snb'], { brand: 'Shanda Bambook' }),
      fmt('tcr', 'TCR', ['tcr'], { brand: 'Psion' }),
      fmt('oeb', 'OEB', ['oeb', 'opf'], { brand: 'Open eBook' }),
    ],
    routes: [
      { from: ['epub', 'kepub', 'mobi', 'azw', 'azw3', 'azw4', 'prc', 'fb2', 'cbz', 'cbr', 'cb7', 'cbt', 'cbc', 'htmlz', 'txtz'],
        to: ['pdf', 'epub', 'docx', 'txt', 'html', 'hwpx'], engine: 'builtin', extras: ['drmFree'] },
      { from: ['epub', 'mobi', 'azw3', 'fb2', 'docx', 'md'], to: ['kepub'], engine: 'builtin', extras: ['drmFree'] },
      { from: ['docx', 'txt', 'md', 'html'], to: ['epub'], engine: 'builtin' },
      { from: ['pdf'], to: ['cbz'], engine: 'builtin' },
      { from: ['epub', 'mobi', 'azw', 'azw3', 'azw4', 'prc', 'fb2', 'htmlz', 'txtz'], to: ['mobi', 'azw3'], engine: 'calibre', extras: ['drmFree'] },
      { from: ['lit', 'lrf', 'chm', 'pdb', 'pml', 'rb', 'snb', 'tcr', 'oeb'], to: ['epub', 'pdf', 'docx', 'txt', 'html'], engine: 'calibre' },
    ],
  },
  {
    id: 'video', icon: 'video', color: '#9c36b5',
    name: T('Video', '동영상', '视频'), plain: T('video', '동영상', '视频'),
    intro: T('All common video formats to MP4 (H.264, HEVC or AV1), WebM, MOV, MKV, AVI, GIF or APNG, with a 720p option, hardware encoding on the graphics chip, audio extraction to MP3 or M4A and every frame saved as pictures. Uses the optional FFmpeg engine.',
      '주요 동영상 형식을 MP4(H.264·HEVC·AV1)·WEBM·MOV·MKV·AVI·GIF·APNG로 바꾸고, 720p로 줄이거나 그래픽 칩으로 빠르게 인코딩하고, MP3·M4A로 소리만 뽑거나 모든 프레임을 그림으로 저장할 수 있습니다. 추가 엔진 FFmpeg를 씁니다.',
      '把常见视频格式转成 MP4（H.264、HEVC 或 AV1）、WebM、MOV、MKV、AVI、GIF 或 APNG，可缩小到 720p、用显卡硬件编码、提取 MP3/M4A 音频，或把每一帧存为图片。使用可选引擎 FFmpeg。'),
    formats: [
      fmt('mp4', 'MP4', ['mp4'], {
        name: T('MPEG-4 video', 'MPEG-4 동영상', 'MPEG-4 视频'),
        about: T('MP4 (MPEG-4 Part 14) is the most compatible video format. It plays on phones, TVs, browsers and every video site, usually with H.264 or H.265 video and AAC audio.',
          'MP4(MPEG-4 Part 14)는 가장 호환성이 좋은 동영상 형식입니다. 휴대폰·TV·브라우저·동영상 사이트 어디서나 재생되며, 보통 H.264/H.265 영상과 AAC 오디오를 담습니다.',
          'MP4（MPEG-4 第 14 部分）是兼容性最好的视频格式，手机、电视、浏览器和各大视频网站都能播放，通常使用 H.264/H.265 视频和 AAC 音频。'),
      }),
      fmt('mov', 'MOV', ['mov', 'qt'], {
        name: T('QuickTime movie', 'QuickTime 동영상', 'QuickTime 视频'),
        about: T('MOV is Apple\'s QuickTime video format, used by iPhones and Macs. It usually contains H.264 or HEVC video, but some editors, TVs and websites handle MP4 better.',
          'MOV는 아이폰과 맥이 쓰는 애플 QuickTime 동영상 형식입니다. 보통 H.264나 HEVC 영상을 담지만, 일부 편집 프로그램·TV·웹사이트는 MP4를 더 잘 받습니다.',
          'MOV 是苹果的 QuickTime 视频格式，iPhone 和 Mac 录制的视频多为 MOV，通常包含 H.264 或 HEVC 视频，但一些剪辑软件、电视和网站对 MP4 支持更好。'),
      }),
      fmt('mkv', 'MKV', ['mkv'], {
        name: T('Matroska video', 'Matroska 동영상', 'Matroska 视频'),
        about: T('MKV (Matroska) is a flexible open container that can hold many video, audio and subtitle tracks. It is popular for films and recordings, but phones, TVs and editors don\'t always play it.',
          'MKV(Matroska)는 여러 영상·음성·자막 트랙을 담을 수 있는 유연한 개방형 컨테이너입니다. 영화나 녹화 파일에 많이 쓰이지만 휴대폰·TV·편집 프로그램에서 재생되지 않을 때가 있습니다.',
          'MKV（Matroska）是一种灵活的开放容器格式，可包含多条视频、音频和字幕轨，常用于电影和录像，但手机、电视和剪辑软件不一定都能播放。'),
      }),
      fmt('webm', 'WEBM', ['webm'], {
        koJong: 1,
        name: T('WebM video', 'WEBM 동영상', 'WebM 视频'),
        about: T('WebM is an open video format made for browsers (VP8/VP9 or AV1 video with Vorbis or Opus audio). Screen recordings and downloads are often WebM, but many editors and devices expect MP4.',
          'WEBM은 브라우저용으로 만든 개방형 동영상 형식(VP8/VP9·AV1 영상, Vorbis·Opus 오디오)입니다. 화면 녹화나 다운로드 파일에 흔하지만 많은 편집 프로그램과 기기는 MP4를 요구합니다.',
          'WebM 是为浏览器设计的开放视频格式（VP8/VP9 或 AV1 视频，Vorbis 或 Opus 音频），录屏和下载的视频常是 WebM，但很多剪辑软件和设备需要 MP4。'),
      }),
      fmt('avi', 'AVI', ['avi', 'divx'], {
        name: T('AVI video', 'AVI 동영상', 'AVI 视频'),
        about: T('AVI is Microsoft\'s video container from the 1990s. Camcorders, older cameras and archives still hold AVI files, which are often large and poorly supported on phones.',
          'AVI는 1990년대에 나온 마이크로소프트의 동영상 컨테이너입니다. 캠코더·옛 카메라·보관 자료에 아직 많고, 용량이 크며 휴대폰에서 잘 재생되지 않는 경우가 많습니다.',
          'AVI 是微软 1990 年代推出的视频容器，旧摄像机、相机和存档里仍有很多 AVI 文件，通常体积大，手机上支持也不好。'),
      }),
      fmt('m4v', 'M4V', ['m4v'], { brand: 'iTunes video' }),
      fmt('wmv', 'WMV', ['wmv', 'asf']),
      fmt('flv', 'FLV', ['flv', 'f4v']),
      fmt('mpg', 'MPEG', ['mpg', 'mpeg', 'mpe', 'm1v', 'm2v', 'dat'], { brand: 'MPEG-1/2, Video CD (.dat)' }),
      fmt('ts', 'TS', ['ts']),
      fmt('m2ts', 'M2TS', ['m2ts', 'mts', 'm2t'], { display: 'M2TS/MTS' }),
      fmt('3gp', '3GP', ['3gp', '3gpp']),
      fmt('3g2', '3G2', ['3g2']),
      fmt('ogv', 'OGV', ['ogv']),
      fmt('vob', 'VOB', ['vob'], { brand: 'DVD' }),
      fmt('mod', 'MOD', ['mod', 'tod'], { brand: 'JVC / Panasonic camcorders' }),
      fmt('dv', 'DV', ['dv', 'dif']),
      fmt('mxf', 'MXF', ['mxf']),
      fmt('rm', 'RM', ['rm', 'rmvb'], { display: 'RM/RMVB', brand: 'RealMedia' }),
      fmt('swf', 'SWF', ['swf'], { brand: 'Flash' }),
      fmt('wtv', 'WTV', ['wtv', 'dvr-ms', 'dvr'], { brand: 'Windows Media Center' }),
      fmt('cavs', 'CAVS', ['cavs']),
    ],
    routes: [
      { from: VIDEO_READ,
        to: ['mp4', 'webm', 'mov', 'mkv', 'avi', 'gif', 'apng', 'mp3', 'm4a'], engine: 'ffmpeg', extras: ['lossless', 'codecs', 'hwEncode', 'res720', 'extractAudio'] },
      { from: VIDEO_READ, to: ['png', 'jpg'], engine: 'ffmpeg', extras: ['frames', 'livePhoto'],
        note: T('one still frame or every frame', '정지 이미지 한 장 또는 모든 프레임', '一张静止画面或每一帧') },
      { from: ['gif', 'apng'], to: ['mp4', 'webm', 'mov'], engine: 'ffmpeg' },
    ],
  },
  {
    id: 'audio', icon: 'audio', color: '#0f9d8a',
    name: T('Audio', '오디오', '音频'), plain: T('audio', '오디오', '音频'),
    intro: T('Music, recordings and voice memos to MP3, M4A, WAV, FLAC, OGG, Opus, AAC or lossless WavPack and TTA. APE, DSD and DTS are read too. Uses the optional FFmpeg engine.',
      '음악·녹음·음성 메모를 MP3·M4A·WAV·FLAC·OGG·OPUS·AAC와 무손실 WavPack·TTA로 변환합니다. APE·DSD·DTS도 읽어요. 추가 엔진 FFmpeg를 씁니다.',
      '把音乐、录音和语音备忘录转成 MP3、M4A、WAV、FLAC、OGG、Opus、AAC 或无损的 WavPack、TTA，也能读取 APE、DSD 和 DTS。使用可选引擎 FFmpeg。'),
    formats: [
      fmt('mp3', 'MP3', ['mp3'], {
        name: T('MP3 audio', 'MP3 오디오', 'MP3 音频'),
        about: T('MP3 is the classic compressed audio format. Practically every player, car stereo and phone plays it, which makes it the safest choice for sharing music, podcasts and recordings.',
          'MP3는 대표적인 압축 오디오 형식입니다. 거의 모든 플레이어·차량 오디오·휴대폰에서 재생되어 음악·팟캐스트·녹음 파일을 공유할 때 가장 무난합니다.',
          'MP3 是最经典的压缩音频格式，几乎所有播放器、车载音响和手机都能播放，是分享音乐、播客和录音最稳妥的选择。'),
      }),
      fmt('m4a', 'M4A', ['m4a'], {
        name: T('MPEG-4 audio', 'MPEG-4 오디오', 'MPEG-4 音频'),
        about: T('M4A is an MPEG-4 audio file, usually AAC, used by iTunes, iPhone voice memos and many recorders. It sounds good at small sizes, but some players and car stereos only take MP3.',
          'M4A는 MPEG-4 오디오 파일(보통 AAC)로, 아이튠즈·아이폰 음성 메모·여러 녹음기에서 쓰입니다. 작은 용량에 음질이 좋지만 일부 플레이어와 차량 오디오는 MP3만 재생합니다.',
          'M4A 是 MPEG-4 音频文件（通常为 AAC），iTunes、iPhone 语音备忘录和很多录音设备都在用，体积小音质好，但部分播放器和车载音响只支持 MP3。'),
      }),
      fmt('m4b', 'M4B', ['m4b'], { brand: 'audiobooks' }),
      fmt('aac', 'AAC', ['aac']),
      fmt('wav', 'WAV', ['wav', 'wave'], {
        name: T('WAV audio', 'WAV 오디오', 'WAV 音频'),
        about: T('WAV is uncompressed audio (usually PCM) used for recording and editing. It sounds exactly like the source but takes about 10 MB per minute in CD quality.',
          'WAV는 녹음과 편집에 쓰는 비압축 오디오(보통 PCM)입니다. 원음 그대로지만 CD 음질 기준 1분에 약 10MB를 차지합니다.',
          'WAV 是用于录音和编辑的无压缩音频（通常为 PCM），音质与原始录音完全一致，但 CD 音质下每分钟约占 10 MB。'),
      }),
      fmt('flac', 'FLAC', ['flac'], {
        koJong: 1,
        name: T('FLAC lossless audio', 'FLAC 무손실 오디오', 'FLAC 无损音频'),
        about: T('FLAC is lossless compressed audio: it shrinks files to roughly half the size of WAV without losing any quality, which makes it the favourite format for music libraries and hi-res downloads.',
          'FLAC은 무손실 압축 오디오로, 음질 손실 없이 WAV의 절반 정도 크기로 줄여 줍니다. 음악 라이브러리와 고음질 음원에 많이 쓰입니다.',
          'FLAC 是无损压缩音频，在不损失音质的前提下把文件压缩到 WAV 的一半左右，是音乐收藏和高解析度音源最常用的格式。'),
      }),
      fmt('ogg', 'OGG', ['ogg', 'oga']),
      fmt('opus', 'OPUS', ['opus']),
      fmt('wma', 'WMA', ['wma']),
      fmt('aiff', 'AIFF', ['aiff', 'aif', 'aifc']),
      fmt('ac3', 'AC3', ['ac3']),
      fmt('amr', 'AMR', ['amr']),
      fmt('au', 'AU', ['au', 'snd']),
      fmt('caf', 'CAF', ['caf']),
      fmt('weba', 'WEBA', ['weba']),
      fmt('mka', 'MKA', ['mka']),
      fmt('mp2', 'MP2', ['mp2', 'mpa']),
      fmt('dss', 'DSS', ['dss'], { brand: 'Olympus / Philips dictation' }),
      fmt('voc', 'VOC', ['voc']),
      fmt('wv', 'WavPack', ['wv'], { koJong: 1 }),
      fmt('tta', 'TTA', ['tta']),
      fmt('w64', 'W64', ['w64'], { brand: 'Sony Wave64' }),
      fmt('eac3', 'E-AC3', ['eac3', 'ec3'], { brand: 'Dolby Digital Plus' }),
      fmt('ape', 'APE', ['ape'], { brand: "Monkey's Audio" }),
      fmt('mpc', 'Musepack', ['mpc', 'mpp', 'mp+'], { koJong: 1 }),
      fmt('tak', 'TAK', ['tak']),
      fmt('dsf', 'DSF', ['dsf'], { brand: 'DSD' }),
      fmt('dff', 'DFF', ['dff'], { brand: 'DSD' }),
      fmt('dts', 'DTS', ['dts']),
      fmt('spx', 'Speex', ['spx'], { koJong: 0 }),
    ],
    routes: [
      { from: ['mp3', 'm4a', 'm4b', 'aac', 'wav', 'flac', 'ogg', 'opus', 'wma', 'aiff', 'ac3', 'amr', 'au', 'caf', 'weba', 'mka', 'mp2', 'dss', 'voc',
        'wv', 'tta', 'w64', 'eac3', 'ape', 'mpc', 'tak', 'dsf', 'dff', 'dts', 'spx'],
        to: ['mp3', 'm4a', 'wav', 'flac', 'ogg', 'opus', 'aac', 'wv', 'tta', 'w64', 'ac3', 'eac3'], engine: 'ffmpeg', extras: ['mp3128', 'alac'] },
    ],
  },
  {
    id: 'subtitles', icon: 'subtitles', color: '#4f46e5',
    name: T('Subtitles', '자막', '字幕'), plain: T('subtitles', '자막', '字幕'),
    intro: T('SRT, ASS, WebVTT, SAMI (SMI), LRC, TTML and MicroDVD into each other without any engine, saved as UTF-8; SSA and SCC are read. Korean SMI and SRT files in CP949 are read correctly. Subtitles in a video come out with FFmpeg.',
      'SRT·ASS·WebVTT·SAMI(SMI)·LRC·TTML·MicroDVD를 엔진 없이 서로 바꾸고 UTF-8로 저장해요. SSA·SCC도 읽어요. CP949로 저장된 SMI·SRT도 제대로 읽어요. 동영상 속 자막은 FFmpeg로 꺼내요.',
      'SRT、ASS、WebVTT、SAMI（SMI）、LRC、TTML 和 MicroDVD 无需引擎即可互相转换，保存为 UTF-8，也能读取 SSA 和 SCC。以 CP949 保存的韩文 SMI、SRT 也能正确读取。视频里的字幕用 FFmpeg 提取。'),
    formats: [
      fmt('srt', 'SRT', ['srt'], {
        name: T('SubRip subtitles', 'SRT 자막', 'SRT 字幕'),
        about: T('SRT (SubRip) is the most common subtitle file: numbered cues with start and end times and plain text. Nearly every player, editor and video site accepts it.',
          'SRT(SubRip)는 가장 흔한 자막 파일로, 번호와 시작·끝 시간, 글자만 적은 단순한 형식입니다. 거의 모든 플레이어·편집 프로그램·동영상 사이트가 받아요.',
          'SRT（SubRip）是最常见的字幕文件，只有编号、开始和结束时间以及文字。几乎所有播放器、剪辑软件和视频网站都支持。'),
      }),
      fmt('ass', 'ASS', ['ass'], {
        name: T('Advanced SubStation Alpha subtitles', 'ASS 자막', 'ASS 字幕'),
        about: T('ASS (Advanced SubStation Alpha) is the styled subtitle format of anime fansubs and Aegisub, with fonts, colours, positions and effects. Many devices and sites only take plain SRT.',
          'ASS(Advanced SubStation Alpha)는 애니메이션 자막과 Aegisub에서 쓰는 꾸밈 자막 형식으로, 글꼴·색·위치·효과를 담아요. 많은 기기와 사이트는 단순한 SRT만 받아요.',
          'ASS（Advanced SubStation Alpha）是动画字幕组和 Aegisub 常用的特效字幕格式，可设置字体、颜色、位置和效果，但很多设备和网站只接受简单的 SRT。'),
      }),
      fmt('ssa', 'SSA', ['ssa'], { brand: 'SubStation Alpha' }),
      fmt('vtt', 'WebVTT', ['vtt'], {
        name: T('WebVTT subtitles', 'WebVTT 자막', 'WebVTT 字幕'),
        about: T('WebVTT (.vtt) is the subtitle format of HTML5 video. Web players, YouTube and online course platforms use it.',
          'WebVTT(.vtt)는 HTML5 동영상의 자막 형식입니다. 웹 플레이어, 유튜브, 온라인 강의 플랫폼에서 써요.',
          'WebVTT（.vtt）是 HTML5 视频的字幕格式，网页播放器、YouTube 和在线课程平台都在用。'),
      }),
      fmt('smi', 'SAMI', ['smi', 'sami'], {
        display: 'SAMI (SMI)',
        name: T('SAMI subtitles (SMI)', 'SMI(SAMI) 자막', 'SAMI 字幕（SMI）'),
        about: T('SAMI (.smi) is Microsoft\'s HTML-like subtitle format. It is still the classic subtitle file in Korea, often saved in the old CP949 encoding that newer players show as broken text.',
          'SMI(SAMI)는 마이크로소프트의 HTML 비슷한 자막 형식입니다. 한국에서 오래 써 온 자막 파일이라 옛 CP949 인코딩으로 저장된 경우가 많고, 요즘 플레이어에서는 글자가 깨지기도 해요.',
          'SAMI（.smi）是微软推出的类似 HTML 的字幕格式，在韩国一直很常用，常以旧的 CP949 编码保存，新播放器可能显示乱码。'),
      }),
      fmt('lrc', 'LRC', ['lrc'], { brand: 'song lyrics' }),
      fmt('ttml', 'TTML', ['ttml', 'dfxp'], { display: 'TTML/DFXP', koJong: 2 }),
      fmt('sub', 'MicroDVD', ['sub'], { koJong: 0 }),
      fmt('scc', 'SCC', ['scc'], { brand: 'Scenarist closed captions' }),
    ],
    routes: [
      { from: ['srt', 'ass', 'ssa', 'vtt', 'smi', 'lrc', 'ttml', 'sub', 'scc'], to: ['srt', 'ass', 'vtt', 'smi', 'lrc', 'ttml', 'sub'], engine: 'builtin', extras: ['utf8'] },
      { from: ['mkv', 'mp4', 'mov', 'webm'], to: ['srt', 'ass', 'vtt'], engine: 'ffmpeg', extras: ['extractSubs'] },
    ],
  },
  {
    id: 'archives', icon: 'archive', color: '#b7791f',
    name: T('Archives', '압축 파일', '压缩包'), plain: T('archives', '압축 파일', '压缩包'),
    intro: T('Repack or extract ZIP, 7Z, RAR, TAR, disk images and many more archive formats with the bundled 7-Zip engine, or pack any files into one ZIP.',
      'ZIP·7Z·RAR·TAR, 디스크 이미지를 비롯한 여러 압축 형식을 내장 7-Zip 엔진으로 다시 묶거나 풀고, 여러 파일을 ZIP 하나로 묶을 수 있습니다.',
      '用自带的 7-Zip 引擎重新打包或解压 ZIP、7Z、RAR、TAR、磁盘映像等多种压缩格式，也能把任意文件打包成一个 ZIP。'),
    formats: [
      fmt('zip', 'ZIP', ['zip', 'wbpz'], {
        koJong: 1,
        name: T('ZIP archive', 'ZIP 압축 파일', 'ZIP 压缩包'),
        about: T('ZIP is the universal archive format. Windows, macOS, phones and nearly every upload form open it without extra software.',
          'ZIP은 가장 보편적인 압축 형식입니다. Windows, macOS, 휴대폰, 거의 모든 업로드 양식에서 별도 프로그램 없이 열립니다.',
          'ZIP 是最通用的压缩格式，Windows、macOS、手机以及几乎所有上传表单都能直接打开，无需额外软件。'),
      }),
      fmt('7z', '7Z', ['7z'], {
        name: T('7-Zip archive', '7-Zip 압축 파일', '7-Zip 压缩包'),
        about: T('7Z is the open archive format of 7-Zip. Its LZMA2 compression usually makes smaller files than ZIP, but not every system or website can open it.',
          '7Z는 7-Zip의 개방형 압축 형식입니다. LZMA2 압축으로 보통 ZIP보다 작게 만들지만, 모든 시스템과 웹사이트에서 열리지는 않습니다.',
          '7Z 是 7-Zip 的开放压缩格式，采用 LZMA2 压缩，通常比 ZIP 更小，但并非所有系统和网站都能打开。'),
      }),
      fmt('rar', 'RAR', ['rar'], {
        koJong: 2,
        name: T('RAR archive', 'RAR 압축 파일', 'RAR 压缩包'),
        about: T('RAR is the proprietary archive format of WinRAR, common for downloads split into parts. Recent Windows 11 versions can open RAR but can\'t create it, and many tools only accept ZIP.',
          'RAR은 WinRAR의 독자 압축 형식으로, 여러 조각으로 나뉜 다운로드 파일에 자주 쓰입니다. 최신 Windows 11은 RAR을 열 수는 있지만 만들 수 없고, 많은 도구가 ZIP만 받습니다.',
          'RAR 是 WinRAR 的专有压缩格式，常见于分卷下载的文件。新版 Windows 11 可以打开 RAR，但不能创建，而且很多工具只接受 ZIP。'),
      }),
      fmt('tar', 'TAR', ['tar']),
      fmt('tgz', 'TAR.GZ', ['tar.gz', 'tgz', 'taz']),
      fmt('tbz2', 'TAR.BZ2', ['tar.bz2', 'tbz2', 'tar.bz', 'tbz']),
      fmt('txz', 'TAR.XZ', ['tar.xz', 'txz']),
      fmt('tar7z', 'TAR.7Z', ['tar.7z']),
      fmt('tlz', 'TAR.LZ', ['tar.lz', 'tlz']),
      fmt('tz', 'TAR.Z', ['tar.z', 'tz']),
      fmt('gz', 'GZ', ['gz']),
      fmt('bz2', 'BZ2', ['bz2', 'bz']),
      fmt('xz', 'XZ', ['xz']),
      fmt('lz', 'LZ', ['lz'], { brand: 'lzip' }),
      fmt('lzma', 'LZMA', ['lzma']),
      fmt('z', 'Z', ['z']),
      fmt('jar', 'JAR', ['jar'], { brand: 'Java' }),
      fmt('cab', 'CAB', ['cab'], { brand: 'Windows Cabinet' }),
      fmt('cpio', 'CPIO', ['cpio']),
      fmt('deb', 'DEB', ['deb'], { brand: 'Debian/Ubuntu packages' }),
      fmt('rpm', 'RPM', ['rpm'], { brand: 'Red Hat/Fedora packages' }),
      fmt('dmg', 'DMG', ['dmg'], { brand: 'macOS disk image' }),
      fmt('iso', 'ISO', ['iso'], { brand: 'disc image' }),
      fmt('img', 'IMG', ['img'], { brand: 'disk image' }),
      fmt('lha', 'LHA', ['lha', 'lzh'], { display: 'LHA/LZH' }),
      fmt('arj', 'ARJ', ['arj']),
      fmt('alz', 'ALZ', ['alz'], { brand: 'ALZip' }),
      fmt('egg', 'EGG', ['egg'], { brand: 'ALZip' }),
    ],
    routes: [
      { from: ['zip', '7z', 'rar', 'tar', 'tgz', 'tbz2', 'txz', 'tar7z', 'tlz', 'tz', 'gz', 'bz2', 'xz', 'lz', 'lzma', 'z', 'jar', 'cab', 'cpio', 'deb', 'rpm',
        'dmg', 'iso', 'img', 'lha', 'arj', 'alz', 'egg'],
        to: ['zip', '7z', 'tar', 'tgz'], engine: 'builtin', via: '7-Zip', extras: ['extract'] },
      { fromText: T('Any files', '아무 파일', '任意文件'), from: [], to: ['zip'], engine: 'builtin', extras: ['zipAll'] },
    ],
  },
  {
    id: 'cad', icon: 'cad', color: '#0e7490',
    name: T('CAD drawings', 'CAD 도면', 'CAD 图纸'), plain: T('CAD drawings', 'CAD 도면', 'CAD 图纸', 'in running text'),
    intro: T('AutoCAD DWG and DXF: convert between them or to PDF, SVG and PNG, without AutoCAD.',
      '오토캐드 DWG·DXF를 서로 바꾸거나 PDF·SVG·PNG로 변환합니다. 오토캐드가 필요 없어요.',
      'AutoCAD 的 DWG 和 DXF 可互相转换，也可转成 PDF、SVG 和 PNG，无需 AutoCAD。'),
    formats: [
      fmt('dwg', 'DWG', ['dwg'], {
        name: T('AutoCAD drawing', '오토캐드 도면', 'AutoCAD 图纸'),
        about: T('DWG is AutoCAD\'s native drawing format and the most common CAD file in architecture and engineering. Without AutoCAD or a DWG viewer it is hard to open or share.',
          'DWG는 오토캐드의 기본 도면 형식으로, 건축·설계 분야에서 가장 많이 쓰는 CAD 파일입니다. 오토캐드나 전용 뷰어가 없으면 열거나 공유하기 어렵습니다.',
          'DWG 是 AutoCAD 的原生图纸格式，也是建筑和工程领域最常见的 CAD 文件，没有 AutoCAD 或看图软件很难打开和分享。'),
      }),
      fmt('dxf', 'DXF', ['dxf'], {
        name: T('Drawing Exchange Format', 'DXF 도면 교환 형식', 'DXF 图纸交换格式'),
        about: T('DXF (Drawing Exchange Format) is Autodesk\'s interchange format for CAD drawings. Laser cutters, CNC software and most CAD programs read it, so it is the usual way to move drawings between tools.',
          'DXF(Drawing Exchange Format)는 오토데스크가 만든 CAD 도면 교환 형식입니다. 레이저 커터·CNC 소프트웨어와 대부분의 CAD 프로그램이 읽을 수 있어 프로그램 사이에 도면을 옮길 때 주로 씁니다.',
          'DXF（Drawing Exchange Format）是 Autodesk 制定的 CAD 图纸交换格式，激光切割、CNC 软件和大多数 CAD 程序都能读取，常用于在不同软件之间传递图纸。'),
      }),
    ],
    routes: [
      { from: ['dwg'], to: ['dxf'], engine: 'builtin', extras: ['noAutocad'] },
      { from: ['dxf'], to: ['dwg'], engine: 'builtin', extras: ['noAutocad'] },
      { from: ['dwg', 'dxf'], to: ['pdf', 'svg', 'png'], engine: 'builtin', extras: ['noAutocad', 'merge'] },
    ],
  },
  {
    id: 'models', icon: 'cube', color: '#be185d',
    name: T('3D models', '3D 모델', '3D 模型'), plain: T('3D models', '3D 모델', '3D 模型', 'in running text'),
    intro: T('GLB, glTF, STL, OBJ, 3MF and PLY into each other, and FBX into any of them, with colours, textures and materials where the format keeps them, and to a shaded PNG or JPG picture. Nothing to install.',
      'GLB·glTF·STL·OBJ·3MF·PLY를 서로 바꾸고, FBX도 이 형식들로 바꿔요. 형식이 담을 수 있으면 색·텍스처·재질도 유지하고, 음영을 넣은 PNG·JPG 그림으로도 만들어요. 따로 설치할 건 없어요.',
      'GLB、glTF、STL、OBJ、3MF 和 PLY 互相转换，FBX 也能转成其中任意一种，格式支持时保留颜色、纹理和材质，也能生成带阴影的 PNG 或 JPG 图片。无需安装其他软件。'),
    formats: [
      fmt('glb', 'GLB', ['glb'], {
        name: T('glTF binary (GLB)', 'GLB(glTF 바이너리)', 'GLB（glTF 二进制）'),
        about: T('GLB is the one-file version of glTF, the 3D format of the web, AR and game engines. Meshes, materials and textures are packed into a single compact file.',
          'GLB는 웹·AR·게임 엔진의 3D 형식인 glTF를 파일 하나로 묶은 것입니다. 메시·재질·텍스처가 작은 파일 하나에 들어 있어요.',
          'GLB 是 glTF 的单文件版本，glTF 是网页、AR 和游戏引擎常用的 3D 格式，网格、材质和纹理都打包在一个紧凑的文件里。'),
      }),
      fmt('gltf', 'glTF', ['gltf']),
      fmt('stl', 'STL', ['stl'], {
        koJong: 2,
        name: T('STL 3D model', 'STL 3D 모델', 'STL 3D 模型'),
        about: T('STL is the classic file for 3D printing. It stores only the triangles of a shape, with no colours or units, and every slicer and CAD program reads it.',
          'STL은 3D 프린팅의 대표 파일입니다. 모양의 삼각형만 담고 색이나 단위는 없으며, 모든 슬라이서와 CAD 프로그램이 읽어요.',
          'STL 是 3D 打印最经典的文件格式，只保存形状的三角形，没有颜色和单位，所有切片软件和 CAD 程序都能读取。'),
      }),
      fmt('obj', 'OBJ', ['obj'], {
        name: T('Wavefront OBJ model', 'OBJ 3D 모델', 'OBJ 3D 模型'),
        about: T('OBJ (Wavefront) is a plain-text 3D format almost every 3D program opens. Materials and textures sit next to it in an .mtl file and pictures.',
          'OBJ(Wavefront)는 거의 모든 3D 프로그램이 여는 텍스트 3D 형식입니다. 재질과 텍스처는 옆의 .mtl 파일과 그림에 따로 담겨요.',
          'OBJ（Wavefront）是几乎所有 3D 软件都能打开的纯文本 3D 格式，材质和纹理另存在旁边的 .mtl 文件和图片中。'),
      }),
      fmt('3mf', '3MF', ['3mf'], { brand: '3D printing' }),
      fmt('ply', 'PLY', ['ply'], { brand: '3D scans' }),
      fmt('fbx', 'FBX', ['fbx'], { brand: 'Autodesk FBX' }),
    ],
    routes: [
      { from: ['glb', 'gltf', 'stl', 'obj', '3mf', 'ply', 'fbx'], to: ['glb', 'gltf', 'stl', 'obj', '3mf', 'ply'], engine: 'builtin', extras: ['colours3d'] },
      { from: ['glb', 'gltf', 'stl', 'obj', '3mf', 'ply', 'fbx'], to: ['png', 'jpg'], engine: 'builtin', extras: ['preview3d'] },
    ],
  },
  {
    id: 'fonts', icon: 'font', color: '#4b5563',
    name: T('Fonts', '글꼴', '字体'), plain: T('fonts', '글꼴', '字体'),
    intro: T('Desktop and web fonts: TTF, OTF, WOFF, WOFF2 and EOT into each other.',
      '데스크톱·웹 글꼴 TTF·OTF·WOFF·WOFF2·EOT를 서로 변환합니다.',
      '桌面字体和网页字体 TTF、OTF、WOFF、WOFF2、EOT 互相转换。'),
    formats: [
      fmt('ttf', 'TTF', ['ttf'], {
        name: T('TrueType font', '트루타입 글꼴', 'TrueType 字体'),
        about: T('TTF (TrueType) is the most common desktop font format on Windows and macOS. Install it to use the font in any app.',
          'TTF(트루타입)는 Windows와 macOS에서 가장 흔한 데스크톱 글꼴 형식으로, 설치하면 모든 프로그램에서 쓸 수 있습니다.',
          'TTF（TrueType）是 Windows 和 macOS 上最常见的桌面字体格式，安装后可以在任何软件中使用。'),
      }),
      fmt('otf', 'OTF', ['otf'], {
        name: T('OpenType font', '오픈타입 글꼴', 'OpenType 字体'),
        about: T('OTF (OpenType) is a font format by Adobe and Microsoft. OpenType fonts with PostScript (CFF) outlines are common for professional typefaces and support features such as ligatures.',
          'OTF(오픈타입)는 어도비와 마이크로소프트가 만든 글꼴 형식입니다. PostScript 윤곽(CFF)을 쓰는 오픈타입 글꼴은 전문 서체에 많고, 합자 같은 고급 기능을 지원합니다.',
          'OTF（OpenType）是 Adobe 与微软共同制定的字体格式，采用 PostScript 轮廓（CFF）的 OpenType 字体在专业字库中很常见，并支持连字等高级排版功能。'),
      }),
      fmt('woff', 'WOFF', ['woff']),
      fmt('woff2', 'WOFF2', ['woff2'], {
        name: T('Web font (WOFF2)', '웹 글꼴(WOFF2)', '网页字体（WOFF2）'),
        about: T('WOFF2 is the compressed web font format supported by all modern browsers. It is typically about 30 % smaller than WOFF, so pages load faster.',
          'WOFF2는 모든 최신 브라우저가 지원하는 압축 웹 글꼴 형식입니다. 보통 WOFF보다 30% 정도 작아 웹 페이지가 더 빨리 뜹니다.',
          'WOFF2 是所有现代浏览器都支持的压缩网页字体格式，通常比 WOFF 小约 30%，网页加载更快。'),
      }),
      fmt('eot', 'EOT', ['eot'], { brand: 'Internet Explorer' }),
    ],
    routes: [
      { from: ['ttf', 'otf', 'woff', 'woff2', 'eot'], to: ['ttf', 'otf', 'woff', 'woff2', 'eot'], engine: 'builtin' },
    ],
  },
  {
    id: 'geo', icon: 'map', color: '#16a34a',
    name: T('Geospatial data', '지리 정보', '地理信息'), plain: T('geospatial data', '지리 정보', '地理信息数据'),
    intro: T('Maps and GPS data: GeoJSON, KML, KMZ, GPX and Shapefile into each other and to CSV, Excel and JSON, and a CSV with coordinates back into a map file. Vector data only (points, lines and areas), always saved in longitude and latitude. Nothing to install.',
      '지도·GPS 데이터 GeoJSON·KML·KMZ·GPX·Shapefile을 서로 바꾸고 CSV·엑셀·JSON으로도 만들며, 좌표가 있는 CSV는 다시 지도 파일로 바꿔요. 벡터 데이터(점·선·면)만 다루고 결과는 언제나 경위도로 저장해요. 따로 설치할 건 없어요.',
      '地图和 GPS 数据：GeoJSON、KML、KMZ、GPX 和 Shapefile 互相转换，也可转成 CSV、Excel 和 JSON，带坐标的 CSV 还能转回地图文件。仅支持矢量数据（点、线、面），结果始终以经纬度保存。无需安装其他软件。'),
    formats: [
      fmt('geojson', 'GeoJSON', ['geojson'], { brand: 'web maps, GIS' }),
      fmt('kml', 'KML', ['kml'], { brand: 'Google Earth' }),
      fmt('kmz', 'KMZ', ['kmz'], { brand: 'Google Earth (zipped KML)' }),
      fmt('gpx', 'GPX', ['gpx'], { brand: 'GPS tracks and waypoints' }),
      fmt('shp', 'Shapefile', ['shp'], { brand: 'Esri Shapefile (.shp with .dbf, .prj, .cpg)' }),
    ],
    routes: [
      { from: ['geojson', 'kml', 'kmz', 'gpx', 'shp'], to: ['geojson', 'kml', 'kmz', 'gpx', 'shp', 'csv'], engine: 'builtin', extras: ['wgs84', 'geoZip'] },
      { from: ['geojson', 'kml', 'kmz', 'gpx', 'shp'], to: ['xlsx', 'json'], engine: 'builtin', via: 'CSV',
        note: T('one row per feature, with its coordinates', '지형지물마다 좌표와 함께 한 행씩', '每个要素一行，附带坐标') },
      { from: ['csv'], to: ['geojson', 'kml', 'kmz', 'gpx', 'shp'], engine: 'builtin', extras: ['wgs84'],
        note: T('a CSV with longitude and latitude columns or WKT', '경도·위도 열이나 WKT 열이 있는 CSV', '包含经度、纬度列或 WKT 列的 CSV') },
    ],
  },
];

/** Groups used by conversion pages only (not counted as formats). */
export const PSEUDO_FORMATS = [
  fmt('raw', 'RAW', RAW_IDS, {
    pseudo: true, members: RAW_IDS, cat: 'images',
    name: T('Camera RAW photo', '카메라 RAW 사진', '相机 RAW 照片'),
    about: T('Camera RAW files (CR2, CR3, NEF, ARW, DNG, RAF, ORF and more) hold the unprocessed sensor data of a photo. They keep the most detail for editing but are large and need special software to view.',
      '카메라 RAW 파일(CR2, CR3, NEF, ARW, DNG, RAF, ORF 등)은 센서가 기록한 가공 전 데이터를 담습니다. 보정에 가장 유리하지만 용량이 크고 전용 프로그램이 있어야 볼 수 있습니다.',
      '相机 RAW 文件（CR2、CR3、NEF、ARW、DNG、RAF、ORF 等）保存传感器记录的未处理数据，后期空间最大，但体积大，需要专门软件才能查看。'),
  }),
];

/* ───────── Conversion guide pages (/convert/<from>-to-<to>/) ───────── */

/**
 * One page per pair and language. The engine comes from the routes above (build fails if a pair isn't supported).
 * options: keys of OPTIONS shown on the page. tip: what's specific about this pair. popular: linked from the home page.
 */
export const PAIRS = [
  // Images
  { from: 'heic', to: 'jpg', popular: true, options: ['quality', 'resize', 'metadata'],
    tip: T('JPG is the safe choice when a website, an older Windows app or someone without an iPhone needs your photos. A whole batch of HEIC photos converts at once, and each JPG is saved next to its original.',
      '웹사이트나 오래된 Windows 프로그램, 아이폰이 없는 사람에게 사진을 보낼 땐 JPG가 가장 무난합니다. HEIC 사진 여러 장을 한꺼번에 변환할 수 있고, 각 JPG는 원본 옆에 저장돼요.',
      '需要把照片发到网站、旧版 Windows 软件，或发给没有 iPhone 的人时，JPG 最稳妥。可以一次批量转换大量 HEIC 照片，每个 JPG 都保存在原图旁边。') },
  { from: 'heic', to: 'png', options: ['resize', 'metadata'],
    tip: T('Choose PNG when you want to keep editing the photo without adding a round of JPG compression. PNG is lossless, so expect files several times larger than the HEIC original.',
      '사진을 더 편집할 계획이라면 JPG 압축을 한 번 더 거치지 않도록 PNG로 바꾸세요. PNG는 무손실이라 원본 HEIC보다 몇 배 큰 파일이 됩니다.',
      '如果还要继续编辑照片，转成 PNG 可以避免再经历一次 JPG 压缩。PNG 是无损格式，文件通常会比原始 HEIC 大好几倍。') },
  { from: 'jpg', to: 'heic', options: ['quality', 'resize', 'metadata'],
    tip: T('HEIC keeps a photo in about half the space of a JPG at the same quality, the way iPhones save photos. Saving HEIC needs the free FFmpeg engine (about 100 MB, downloaded once in the app). EXIF, the colour profile and the orientation are kept.',
      'HEIC는 같은 화질에서 JPG의 절반 정도 용량으로 사진을 저장해요. 아이폰이 사진을 저장하는 방식이에요. HEIC로 저장하려면 무료 FFmpeg 엔진(약 100MB, 앱에서 한 번 다운로드)이 필요하고, EXIF·색 프로필·방향은 그대로 유지돼요.',
      'HEIC 在同等画质下只占 JPG 约一半的空间，iPhone 就是这样保存照片的。保存 HEIC 需要免费的 FFmpeg 引擎（约 100 MB，在应用中下载一次），EXIF、色彩配置文件和方向都会保留。') },
  { from: 'webp', to: 'png', popular: true, options: ['resize'],
    tip: T('Images saved from websites are often WebP. Converting to PNG keeps the full quality and any transparency, so the result works in every editor, slide deck and document.',
      '웹사이트에서 저장한 이미지는 WEBP인 경우가 많습니다. PNG로 바꾸면 화질과 투명 배경이 그대로 유지되어 어떤 편집 프로그램·슬라이드·문서에도 넣을 수 있어요.',
      '从网页保存的图片常常是 WebP。转成 PNG 会完整保留画质和透明背景，可以放进任何编辑软件、幻灯片或文档。') },
  { from: 'webp', to: 'jpg', options: ['quality', 'resize', 'transparency'],
    tip: T('Pick JPG when the image is a photo and file size matters, for example for upload forms that reject WebP.',
      '사진이고 용량이 중요하다면 JPG가 좋습니다. WEBP를 받지 않는 업로드 양식에도 그대로 올릴 수 있어요.',
      '如果是照片且在意文件大小，选 JPG 即可，也能上传到不接受 WebP 的表单。') },
  { from: 'png', to: 'jpg', popular: true, options: ['quality', 'resize', 'transparency'],
    tip: T('Screenshots and exported photos saved as PNG can be many megabytes. Photos usually get much smaller as JPG; for text-heavy screenshots and logos, PNG often stays the better format.',
      'PNG로 저장된 스크린샷이나 사진은 몇 MB씩 되기도 합니다. 사진이라면 JPG로 바꿔 용량을 크게 줄일 수 있고, 글자가 많은 스크린샷이나 로고는 PNG가 더 나은 경우가 많습니다.',
      '存成 PNG 的截图和照片往往有好几 MB。照片转成 JPG 通常能大幅缩小体积；文字较多的截图和 Logo 则往往更适合保留 PNG。') },
  { from: 'jpg', to: 'png', options: ['resize', 'metadata', 'removeBackground'],
    tip: T('Converting JPG to PNG doesn\'t bring back detail lost to JPG compression, but it stops further loss: every later edit and save stays lossless. Convert before you retouch an image or add transparency in an editor.',
      'JPG를 PNG로 바꿔도 이미 압축으로 잃은 디테일이 돌아오지는 않지만, 이후 편집하고 저장할 때 더 이상 화질이 떨어지지 않습니다. 이미지를 보정하거나 편집기에서 배경을 투명하게 만들기 전에 바꿔 두세요.',
      'JPG 转 PNG 并不能找回压缩时丢失的细节，但之后每次编辑、保存都不会再损失画质。适合在修图或在编辑器里添加透明背景之前转换。') },
  { from: 'avif', to: 'jpg', options: ['quality', 'resize'],
    tip: T('AVIF images from modern websites and phones don\'t open in many older programs, image viewers and upload forms. JPG opens everywhere, at the cost of somewhat larger files.',
      '최신 웹사이트나 휴대폰에서 받은 AVIF 이미지는 오래된 프로그램·이미지 뷰어·업로드 양식에서 열리지 않을 때가 많습니다. JPG는 파일이 조금 커지는 대신 어디서나 열려요.',
      '来自新网站和手机的 AVIF 图片，在很多旧软件、看图工具和上传表单里都打不开。JPG 文件会稍大一些，但到处都能打开。') },
  { from: 'png', to: 'webp', options: ['quality', 'resize'],
    tip: T('WebP is ideal for websites: photos get much smaller than JPG and graphics keep their transparency. The WEBP preset saves at quality 85, a good balance for the web.',
      'WEBP는 웹사이트용으로 알맞습니다. 사진은 JPG보다 훨씬 작아지고 그래픽은 투명 배경을 유지해요. WEBP 프리셋은 웹에 적당한 품질 85로 저장합니다.',
      'WebP 非常适合网站：照片比 JPG 小很多，图形也能保留透明背景。WEBP 预设以 85 的质量保存，兼顾画质与体积。') },
  { from: 'jpg', to: 'pdf', popular: true, options: [],
    tip: T('Scanned pages, receipts and photos of documents often have to be sent as one PDF. Drop the images on the merge preset to get a single PDF, or on PDF to get one PDF per image. By default each page takes the size of its image.',
      '스캔한 서류나 영수증 사진을 PDF 하나로 보내야 할 때가 많죠. 이미지를 합치기 프리셋에 놓으면 한 파일로, PDF에 놓으면 이미지마다 PDF가 하나씩 만들어집니다. 기본적으로 각 페이지는 이미지 크기를 따릅니다.',
      '扫描件、收据和文档照片常常需要合成一个 PDF 发送。把图片放到合并预设上即可得到一个文件，放到 PDF 上则每张图片各生成一个 PDF。默认每页大小与图片一致。') },
  { from: 'png', to: 'ico', options: ['icoSizes'],
    tip: T('One ICO covers everything Windows needs for desktop, Explorer and taskbar icons, and it works as a website favicon too. Start from a square PNG of at least 256×256 px for the sharpest result.',
      'ICO 하나로 Windows 바탕화면·탐색기·작업 표시줄 아이콘과 웹사이트 파비콘까지 해결됩니다. 가장 선명하게 만들려면 256×256픽셀 이상의 정사각형 PNG로 시작하세요.',
      '一个 ICO 就能满足 Windows 桌面、资源管理器、任务栏图标以及网站 favicon 的需要。想要最清晰的效果，请使用至少 256×256 像素的正方形 PNG。') },
  { from: 'png', to: 'icns', options: [],
    tip: T('Making a Mac app icon on Windows usually needs extra tools; Filee turns a PNG into an ICNS file directly. Use a square 1024×1024 px PNG so the Retina sizes stay sharp.',
      'Windows에서 맥 앱 아이콘을 만들려면 보통 별도 도구가 필요하지만, Filee는 PNG를 바로 ICNS로 바꿉니다. 레티나 크기까지 선명하게 하려면 1024×1024픽셀 정사각형 PNG를 쓰세요.',
      '在 Windows 上制作 Mac 应用图标通常需要额外工具，Filee 可以直接把 PNG 转成 ICNS。建议使用 1024×1024 像素的正方形 PNG，Retina 尺寸才会清晰。') },
  { from: 'psd', to: 'png', options: ['resize'],
    tip: T('Share a Photoshop design with people who don\'t have Photoshop: the PNG shows the image as saved, with the visible layers combined and transparency kept. PNG can\'t store layers, so keep the PSD for editing.',
      '포토샵이 없는 사람에게 디자인을 보여줄 때 좋습니다. PNG에는 저장된 모습 그대로 보이는 레이어가 합쳐져 담기고 투명 배경도 유지됩니다. 레이어 자체는 PNG에 담을 수 없으니 편집용 PSD는 따로 보관하세요.',
      '适合把 Photoshop 设计稿发给没有 Photoshop 的人：PNG 会按保存时的样子合并可见图层，并保留透明背景。PNG 无法保存图层，编辑用的 PSD 请另行保留。') },
  { from: 'raw', to: 'jpg', options: ['quality', 'resize', 'metadata'],
    tip: T('Filee reads the RAW files of Canon, Nikon, Sony, Fujifilm, Olympus/OM System, Panasonic, Pentax, Samsung, Leica, Hasselblad, Phase One and more, and develops them with default settings. It\'s the quick way to get shareable JPGs from a shoot; for creative editing, use a RAW editor first.',
      '캐논·니콘·소니·후지필름·올림푸스(OM 시스템)·파나소닉·펜탁스·삼성·라이카·핫셀블라드·페이즈원 등의 RAW 파일을 읽어 기본 설정으로 현상합니다. 촬영 후 공유할 JPG를 빠르게 뽑을 때 좋고, 본격적인 보정은 RAW 편집 프로그램에서 먼저 하세요.',
      'Filee 能读取佳能、尼康、索尼、富士、奥林巴斯（OM System）、松下、宾得、三星、徕卡、哈苏、飞思等相机的 RAW 文件，并以默认参数显影。适合拍摄后快速导出可分享的 JPG；需要精细调色时，请先在 RAW 编辑软件中处理。') },
  { from: 'cr2', to: 'jpg', options: ['quality', 'resize', 'metadata'],
    tip: T('Drop a whole memory card\'s worth of CR2 files at once: Filee converts them in parallel and saves each JPG next to its RAW file. Newer Canon cameras write CR3, which Filee reads as well.',
      '메모리 카드의 CR2 파일을 한꺼번에 놓아도 됩니다. 여러 파일을 동시에 변환해 각 JPG를 원본 RAW 옆에 저장해요. 최신 캐논 카메라의 CR3도 읽을 수 있습니다.',
      '可以一次拖入整张存储卡的 CR2 文件：Filee 并行转换，每个 JPG 都保存在对应 RAW 文件旁边。佳能新机型的 CR3 也能读取。') },
  { from: 'nef', to: 'jpg', options: ['metadata'],
    tip: T('NEF files are too large and too unusual to send as they are. As JPG they become small, universally viewable photos; use JPG 70 % or a half-size preset for messaging apps. Nikon\'s NRW files from Coolpix cameras work the same way.',
      'NEF 파일은 크고 열 수 있는 곳이 적어 그대로 보내기 어렵습니다. JPG로 바꾸면 작고 어디서나 보이는 사진이 되고, 메신저로 보낼 땐 JPG 70%나 크기를 절반으로 줄이는 프리셋을 쓰세요. 니콘 쿨픽스의 NRW 파일도 똑같이 변환됩니다.',
      'NEF 文件体积大、能打开的地方少，不适合直接发送。转成 JPG 后体积小、到处都能看；通过聊天软件发送时可用 JPG 70% 或缩小一半的预设。尼康 Coolpix 的 NRW 文件也同样可以转换。') },
  // Vector
  { from: 'svg', to: 'png', popular: true, options: [],
    tip: T('Many apps, slide decks and upload forms don\'t accept SVG. Filee renders the vector drawing to a PNG with transparency; compressed SVGZ files work too.',
      'SVG를 받지 않는 프로그램·슬라이드·업로드 양식이 많습니다. Filee는 벡터 그림을 투명 배경의 PNG로 그려 내고, 압축된 SVGZ도 변환할 수 있어요.',
      '很多软件、幻灯片和上传表单不接受 SVG。Filee 会把矢量图渲染成带透明背景的 PNG，压缩过的 SVGZ 也能转换。') },
  { from: 'svg', to: 'pdf', options: ['merge'],
    tip: T('SVG to PDF stays vector: lines and text remain sharp at any zoom and in print, and the file stays small. Handy for sending logos and diagrams to a print shop or putting them into documents.',
      'SVG를 PDF로 바꿔도 벡터가 유지되어 확대하거나 인쇄해도 선과 글자가 선명하고 파일도 작습니다. 로고나 다이어그램을 인쇄소에 보내거나 문서에 넣을 때 편리해요.',
      'SVG 转 PDF 后仍是矢量：任意放大或打印，线条和文字都清晰，文件也很小，适合把 Logo 和示意图交给印厂或放进文档。') },
  { from: 'eps', to: 'pdf', options: [],
    tip: T('EPS can only be displayed by a PostScript interpreter; Filee uses Ghostscript for that. The PDF keeps the vector artwork, so it opens anywhere and still prints sharply. PostScript (.ps) files work the same way.',
      'EPS는 PostScript 해석기가 있어야 볼 수 있는데, Filee는 Ghostscript로 이를 처리합니다. PDF에도 벡터 그림이 그대로 남아 어디서나 열리고 인쇄해도 선명해요. PostScript(.ps) 파일도 똑같이 변환됩니다.',
      'EPS 需要 PostScript 解释器才能显示，Filee 使用 Ghostscript 来处理。生成的 PDF 保留矢量图形，到处都能打开，打印依然清晰。PostScript（.ps）文件也同样可以转换。') },
  // PDF
  { from: 'pdf', to: 'jpg', popular: true, options: ['renderDpi', 'pages', 'quality', 'longImage'],
    tip: T('Every page becomes its own JPG, so a 10-page PDF gives you 10 images. Handy for chats, slides and social posts that accept images but not PDF.',
      'PDF의 각 페이지가 JPG 한 장씩으로 저장되어, 10쪽짜리 PDF라면 이미지 10장이 생깁니다. 메신저·슬라이드·SNS처럼 PDF는 안 되고 이미지만 받는 곳에 올릴 때 편리해요.',
      'PDF 的每一页都会保存为一张 JPG，10 页的 PDF 就得到 10 张图片，方便发到只接受图片、不接受 PDF 的聊天软件、幻灯片或社交媒体。') },
  { from: 'pdf', to: 'png', options: ['renderDpi', 'pages', 'longImage'],
    tip: T('PNG keeps text and lines crisp without JPG artefacts, which suits slides, diagrams, sheet music and pages you want to annotate or put into a presentation.',
      'PNG는 JPG 특유의 뭉개짐 없이 글자와 선이 선명해, 슬라이드·도표·악보나 메모를 달거나 발표 자료에 넣을 페이지에 알맞습니다.',
      'PNG 不会出现 JPG 的压缩痕迹，文字和线条清晰，适合幻灯片、图表、乐谱，以及需要批注或放进演示文稿的页面。') },
  { from: 'pdf', to: 'docx', popular: true, options: [],
    tip: T('Filee turns the PDF into a Word document with real paragraphs instead of page pictures, so you can fix typos or reuse the text. Complex layouts may need touch-ups, and a scanned PDF that only contains page images has no text to extract.',
      'PDF를 페이지 그림이 아닌 실제 문단으로 된 워드 문서로 바꿔, 오타를 고치거나 내용을 다시 쓸 수 있습니다. 레이아웃이 복잡하면 손볼 곳이 생길 수 있고, 텍스트 없이 그림만 있는 스캔 PDF에서는 글자를 뽑아낼 수 없습니다.',
      'Filee 把 PDF 转成由真实段落组成的 Word 文档，而不是一页页的图片，方便修改错字或重用内容。版式复杂时可能需要稍作调整；只有页面图片的扫描 PDF 没有可提取的文字。') },
  { from: 'pdf', to: 'epub', options: ['editable'],
    tip: T('Filee goes PDF → Word → EPUB on its own, so the text reflows to fit a phone or an e-reader screen. It works best with PDFs that have real text in them. Headings come through as plain paragraphs, and scanned pages have no text to convert.',
      'Filee가 PDF → 워드 → EPUB 순서로 알아서 변환해서, 휴대폰이나 전자책 단말기 화면에 맞게 글이 다시 흘러요. 실제 글자가 들어 있는 PDF일 때 잘 되고, 제목은 일반 문단으로 바뀌며, 스캔한 페이지는 변환할 글자가 없어요.',
      'Filee 会自动按 PDF → Word → EPUB 转换，文字会按手机或电子书阅读器的屏幕重新排版。含真实文字的 PDF 效果最好。标题会变成普通段落，扫描页没有可转换的文字。') },
  { from: 'pdf', to: 'hwp', options: ['editable', 'noHancom'],
    tip: T('Filee takes the text of the PDF into a Word document, writes it as HWPX and then saves that as HWP, all with built-in engines. It works for PDFs with real text in them. Complex layouts may need touch-ups, and scanned pages have no text to take out.',
      'Filee가 PDF의 글을 워드 문서로 꺼낸 뒤 HWPX로 쓰고, 그걸 다시 HWP로 저장해요. 모두 내장 엔진이라 한컴오피스는 필요 없어요. 실제 글자가 들어 있는 PDF에서 잘 되고, 레이아웃이 복잡하면 손볼 곳이 생길 수 있으며, 스캔한 페이지는 꺼낼 글자가 없어요.',
      'Filee 先把 PDF 的文字提取成 Word 文档，再写成 HWPX，最后存成 HWP，全部使用内置引擎。含真实文字的 PDF 效果最好；版式复杂时可能需要稍作调整，扫描页没有可提取的文字。') },
  { from: 'pdf', to: 'md', options: ['editable'],
    tip: T('Filee turns the PDF into a Word document first and then into Markdown, keeping paragraphs, headings and bold text where it can tell them apart. Useful for notes, wikis or pasting the text into other tools. Scanned pages have no text to convert.',
      'Filee가 PDF를 먼저 워드 문서로 바꾼 뒤 마크다운으로 만들어요. 문단, 제목, 굵은 글씨는 구분되는 만큼 그대로 남아서 메모나 위키에 옮기거나 다른 도구에 붙여 넣기 좋아요. 스캔한 페이지는 변환할 글자가 없어요.',
      'Filee 先把 PDF 转成 Word 文档，再转成 Markdown，能识别的段落、标题和粗体都会保留，适合整理笔记、放进 Wiki 或粘贴到其他工具。扫描页没有可转换的文字。') },
  { from: 'pdf', to: 'hwpx', options: ['editable'],
    tip: T('Korean offices often need documents in Hangul format. Filee converts the PDF\'s text into an HWPX file you can open and edit in Hancom Hangul, without Hancom Office for the conversion; turn it into HWP afterwards if a form requires the old format.',
      '관공서나 회사에 한글 파일로 내야 할 때가 많죠. Filee는 PDF의 내용을 한글에서 열고 고칠 수 있는 HWPX로 바꿉니다. 변환에 한컴오피스는 필요 없고, HWP 형식이 필요하면 만들어진 HWPX를 다시 HWP로 바꾸면 됩니다.',
      '在韩国，公文和提交材料常常需要韩文（한글）格式。Filee 可以把 PDF 内容转成能在 Hancom 韩文软件中打开和编辑的 HWPX，转换过程不需要 Hancom Office；如需旧的 HWP 格式，再把 HWPX 转成 HWP 即可。') },
  { from: 'pdf', to: 'pptx', options: ['slides'],
    tip: T('Handy when a PDF has to be shown in PowerPoint or added to an existing deck: every page becomes a slide that looks exactly like the PDF, and the page\'s text waits in the speaker notes. The slides are pictures, so to change the wording convert the PDF to DOCX instead.',
      'PDF를 파워포인트로 띄우거나 기존 발표 자료에 넣어야 할 때 좋아요. 페이지마다 PDF와 똑같이 보이는 슬라이드가 되고, 페이지의 글은 발표자 노트에 들어가요. 슬라이드는 그림이라서 문구를 고치려면 PDF를 DOCX로 바꾸세요.',
      '需要在 PowerPoint 中放映 PDF，或把它加进现有演示文稿时很方便。每一页都变成与 PDF 看起来完全一样的幻灯片，页面文字放在演讲者备注中。幻灯片是图片，要修改文字请把 PDF 转为 DOCX。') },
  // Documents
  { from: 'docx', to: 'pdf', popular: true, options: [],
    tip: T('No Microsoft Word or LibreOffice needed: Filee reads the DOCX itself and lays out the pages with headers, footers, tables and pictures. Drop several documents on the merge preset to combine them into one PDF.',
      '워드나 LibreOffice가 없어도 됩니다. Filee가 DOCX를 직접 읽어 머리말·꼬리말·표·그림이 있는 페이지를 배치해 PDF로 만듭니다. 여러 문서를 합치기 프리셋에 놓으면 PDF 한 개로 묶을 수 있어요.',
      '无需 Microsoft Word 或 LibreOffice：Filee 自己读取 DOCX，排好带页眉页脚、表格和图片的页面后输出 PDF。把多个文档放到合并预设上，即可合成一个 PDF。') },
  { from: 'doc', to: 'pdf', options: ['merge'],
    tip: T('Old Word 97–2003 documents from archives, official forms or legacy systems become PDFs that open anywhere. The same engine also converts ODT, RTF, WPS, WordPerfect, Lotus Word Pro, AbiWord and Apple Pages files.',
      '보관 자료, 관공서 서식, 옛 시스템에서 나온 워드 97~2003 문서를 어디서나 열리는 PDF로 바꿉니다. 같은 엔진으로 ODT·RTF·WPS·워드퍼펙트·로터스 워드프로·AbiWord·애플 Pages 파일도 변환할 수 있어요.',
      '来自旧资料、公文模板或老系统的 Word 97–2003 文档，可以转成到处都能打开的 PDF。同一引擎还能转换 ODT、RTF、WPS、WordPerfect、Lotus Word Pro、AbiWord 和 Apple Pages 文件。') },
  { from: 'eml', to: 'pdf', options: ['attachments', 'merge'],
    tip: T('Save e-mails as PDF for records, invoices or legal files: the PDF shows the sender, recipients, date, subject and message, and it opens anywhere without a mail app.',
      '기록 보관, 청구서, 법적 증빙용으로 이메일을 PDF로 저장하세요. 보낸 사람·받는 사람·날짜·제목과 본문이 PDF에 담기고, 메일 프로그램 없이 어디서나 열립니다.',
      '把邮件存成 PDF，方便存档、报销或留作证据：PDF 中包含发件人、收件人、日期、主题和正文，没有邮件客户端也能打开。') },
  // HWP
  { from: 'hwp', to: 'pdf', popular: true, options: ['merge'],
    tip: T('Filee renders HWP pages with rhwp, an open-source Hangul engine, so neither Hancom Office nor its approval dialog is involved. Useful for sending Korean documents to people who can\'t open HWP.',
      'Filee는 오픈소스 한글 엔진 rhwp로 HWP 페이지를 그려 PDF로 만듭니다. 한컴오피스도, 승인 창도 필요 없어요. 한글이 없는 사람에게 문서를 보낼 때 특히 편리합니다.',
      'Filee 使用开源韩文引擎 rhwp 渲染 HWP 页面，不需要 Hancom Office，也不会弹出确认窗口，方便把韩文文档发给打不开 HWP 的人。') },
  { from: 'hwp', to: 'docx', options: ['noHancom'],
    tip: T('Turn a Hangul document into a Word file that colleagues abroad can edit. Text, paragraphs and tables are carried over; layouts with many floating objects are worth a quick check in Word.',
      '한글 문서를 워드에서 고칠 수 있는 DOCX로 바꿔 보세요. 글·문단·표가 옮겨지며, 떠 있는 개체가 많은 복잡한 문서는 워드에서 한 번 확인하는 게 좋습니다.',
      '把韩文文档转成同事能在 Word 中编辑的 DOCX。文字、段落和表格都会转换；包含大量浮动对象的复杂版式，建议在 Word 中检查一下。') },
  { from: 'hwpx', to: 'pdf', options: ['noHancom', 'merge'],
    tip: T('HWPX, the newer XML-based Hangul format, is converted like HWP: the built-in rhwp engine lays out the pages, fully offline. Handy for archiving HWPX forms from public institutions as PDF.',
      '새 XML 기반 한글 형식인 HWPX도 HWP와 똑같이, 내장 rhwp 엔진이 페이지를 배치해 인터넷 없이 PDF로 만듭니다. 공공기관에서 받은 HWPX 서식을 한글 없이 PDF로 보관할 때 좋아요.',
      '较新的 XML 韩文格式 HWPX 与 HWP 一样，由内置的 rhwp 引擎完成排版，全程离线生成 PDF，适合把韩国公共机构的 HWPX 表格存档为 PDF。') },
  { from: 'hwp', to: 'hwpx', options: [],
    tip: T('Some systems and newer workflows accept only HWPX. Filee converts binary HWP to HWPX with rhwp, without Hancom Office, and converts a whole batch of old documents in one go.',
      '일부 시스템과 새 업무 환경은 HWPX만 받습니다. Filee는 한컴오피스 없이 rhwp로 HWP를 HWPX로 바꾸며, 오래된 문서 여러 개를 한 번에 변환할 수 있어요.',
      '一些系统和新的办公流程只接受 HWPX。Filee 使用 rhwp 把二进制 HWP 转成 HWPX，无需 Hancom Office，还能一次批量转换大量旧文档。') },
  { from: 'hwpx', to: 'hwp', options: ['noHancom'],
    tip: T('Older versions of Hangul and some submission portals still expect .hwp. Filee converts HWPX back to HWP with rhwp, so you don\'t have to open and re-save each file in Hangul.',
      '구버전 한글이나 일부 제출 사이트는 아직 .hwp를 요구합니다. Filee는 rhwp로 HWPX를 HWP로 바꿔 주므로, 한글에서 파일을 하나씩 열어 다시 저장할 필요가 없어요.',
      '旧版韩文软件和一些提交系统仍要求 .hwp。Filee 通过 rhwp 把 HWPX 转回 HWP，不必在韩文软件里逐个打开另存。') },
  { from: 'docx', to: 'hwpx', options: ['noHancom'],
    tip: T('Filee\'s own HWPX writer carries the Word layout over: page size and margins, headers and footers with page numbers, tables with merged cells, borders and shading, text boxes, shapes and pictures. Every file it writes is checked with three independent HWPX readers in the tests.',
      'Filee의 자체 HWPX 작성기는 워드 레이아웃을 그대로 옮깁니다. 용지 크기와 여백, 쪽 번호가 들어간 머리말·꼬리말, 병합 셀·테두리·음영이 있는 표, 글상자·도형·그림까지요. 테스트에서는 만들어진 파일을 서로 다른 HWPX 리더 3개로 검증합니다.',
      'Filee 自带的 HWPX 写入器会保留 Word 版式：纸张大小和页边距、带页码的页眉页脚、含合并单元格与边框底纹的表格，以及文本框、形状和图片。生成的每个文件都在测试中经过三个独立 HWPX 读取器的验证。') },
  { from: 'docx', to: 'hwp', options: ['noHancom'],
    tip: T('For offices and forms that still ask for .hwp. Filee writes the Word document as HWPX with its own writer and converts that to HWP with rhwp, both built in, so Hancom Office isn\'t needed for the conversion.',
      '아직 .hwp로 내야 하는 곳을 위한 변환이에요. Filee가 자체 작성기로 워드 문서를 HWPX로 만든 뒤 rhwp로 HWP로 바꿔요. 둘 다 내장 엔진이라 변환에 한컴오피스는 필요 없어요.',
      '适合仍要求提交 .hwp 的机构和表格。Filee 先用自带的写入器把 Word 文档写成 HWPX，再用 rhwp 转成 HWP，两者都是内置的，转换时不需要 Hancom Office。') },
  { from: 'docx', to: 'jpg', options: ['noOffice', 'quality'],
    tip: T('Each page of the Word document becomes a JPG (Filee lays the document out as a PDF first), handy for posting a page online or sending a quick preview. Word isn\'t needed.',
      '워드 문서의 각 페이지가 JPG 한 장씩이 돼요(Filee가 먼저 PDF로 배치한 뒤 그림으로 바꿔요). 페이지를 온라인에 올리거나 미리보기를 보낼 때 편해요. 워드는 필요 없어요.',
      'Word 文档的每一页都会变成一张 JPG（Filee 先把文档排成 PDF 再转成图片），方便把页面发到网上或发送预览。不需要 Word。') },
  // Spreadsheets
  { from: 'xlsx', to: 'pdf', popular: true, options: ['noOffice', 'merge'],
    tip: T('Each visible sheet becomes its own section, with number formats, fonts, fills, borders and merged cells as Excel shows them. Wide sheets are scaled to the page width like Excel\'s "Fit all columns on one page", and frozen header rows repeat on every page.',
      '보이는 시트마다 따로 나뉘며, 표시 형식·글꼴·채우기·테두리·병합 셀이 엑셀에서 보이는 그대로 옮겨집니다. 넓은 시트는 엑셀의 ‘한 페이지에 모든 열 맞추기’처럼 페이지 너비에 맞춰 줄이고, 틀 고정한 머리글 행은 매 페이지에 반복돼요.',
      '每个可见工作表各成一节，数字格式、字体、填充、边框和合并单元格都与 Excel 中显示的一致。较宽的表会像 Excel 的“将所有列调整为一页”那样缩放到页面宽度，冻结的标题行会在每页重复。') },
  { from: 'xlsx', to: 'csv', options: ['noOffice'],
    tip: T('CSV holds a single table, so Filee writes one CSV per sheet. Cells are exported as values, ready for databases, scripts and import forms.',
      'CSV에는 표를 하나만 담을 수 있어 시트마다 CSV 파일이 하나씩 만들어집니다. 셀은 값으로 저장되어 데이터베이스·스크립트·가져오기 양식에 바로 쓸 수 있어요.',
      'CSV 只能保存一张表，因此 Filee 会为每个工作表各生成一个 CSV。单元格以值的形式导出，可直接用于数据库、脚本和导入表单。') },
  { from: 'csv', to: 'xlsx', options: ['noOffice'],
    tip: T('An XLSX workbook can hold the formatting, formulas and extra sheets that CSV can\'t. Select all your CSV exports and drop them at once to get one workbook per file, without Excel\'s import dialog.',
      'XLSX 통합 문서에는 CSV에 없는 서식·수식·여러 시트를 담을 수 있습니다. CSV 내보내기 파일을 모두 골라 한 번에 놓으면 파일마다 통합 문서가 하나씩 만들어져, 엑셀에서 하나씩 가져올 필요가 없어요.',
      'XLSX 工作簿能保存 CSV 没有的格式、公式和多个工作表。选中所有 CSV 导出文件一次拖放，每个文件生成一个工作簿，不必在 Excel 里逐个导入。') },
  { from: 'xls', to: 'xlsx', options: [],
    tip: T('Upgrade old Excel 97–2003 workbooks without Excel or LibreOffice: the conversion is built in. XLSX files are usually smaller, can\'t carry macros and open in every current spreadsheet app.',
      '엑셀 97~2003 통합 문서를 엑셀이나 LibreOffice 없이 XLSX로 바꿉니다. 변환 기능이 기본 내장이에요. XLSX는 보통 더 작고 매크로를 담을 수 없으며, 요즘 쓰는 모든 스프레드시트 프로그램에서 열립니다.',
      '无需 Excel 或 LibreOffice，就能把 Excel 97–2003 的旧工作簿升级为 XLSX，转换功能是内置的。XLSX 通常更小、不能包含宏，所有现代电子表格软件都能打开。') },
  // Presentations
  { from: 'pptx', to: 'pdf', popular: true, options: ['noOffice', 'merge'],
    tip: T('Each slide becomes one PDF page at the slide\'s size, with text, shapes, pictures, tables and the master design. Handy for handing out decks or uploading them where PowerPoint files aren\'t accepted. Animations and speaker notes aren\'t part of the PDF.',
      '슬라이드 한 장이 슬라이드 크기 그대로 PDF 한 페이지가 되며, 글·도형·그림·표와 마스터 디자인이 담깁니다. 발표 자료를 나눠 주거나 PPT를 받지 않는 곳에 올릴 때 편리해요. 애니메이션과 발표자 노트는 PDF에 들어가지 않습니다.',
      '每张幻灯片按原尺寸成为 PDF 的一页，包含文字、形状、图片、表格和母版设计，方便分发讲义或上传到不接受 PPT 的地方。动画和演讲者备注不会进入 PDF。') },
  { from: 'ppt', to: 'pdf', options: ['merge'],
    tip: T('Old PowerPoint 97–2003 decks become PDFs that anyone can open, print or upload. Keynote (.key), ODP and WPS (DPS) presentations are converted the same way.',
      '파워포인트 97~2003 발표 자료를 누구나 열고 인쇄하고 올릴 수 있는 PDF로 바꿉니다. 키노트(.key), ODP, WPS(DPS) 프레젠테이션도 같은 방법으로 변환돼요.',
      'PowerPoint 97–2003 的旧演示文稿可以转成任何人都能打开、打印或上传的 PDF。Keynote（.key）、ODP 和 WPS 演示（DPS）文件也能用同样的方法转换。') },
  { from: 'pptx', to: 'jpg', options: ['noOffice'],
    tip: T('Every slide becomes a JPG, ready for social posts, thumbnails, chat messages or a video editor. Choose PNG instead if the slides have lots of small text.',
      '슬라이드마다 JPG 한 장씩 만들어져 SNS 게시물, 썸네일, 메신저, 영상 편집에 바로 쓸 수 있습니다. 작은 글씨가 많은 슬라이드라면 PNG가 더 선명해요.',
      '每张幻灯片都会生成一张 JPG，可直接用于社交媒体、缩略图、聊天消息或视频剪辑。如果幻灯片中小字较多，选 PNG 会更清晰。') },
  // Text
  { from: 'md', to: 'pdf', options: ['merge'],
    tip: T('Headings, lists (including task lists), tables, code, quotes, links, images, footnotes and math are laid out on A4 pages, without Pandoc, LaTeX or a browser. A quick way to share notes and README files with people who don\'t read Markdown.',
      '제목, 목록(할 일 목록 포함), 표, 코드, 인용, 링크, 그림, 각주, 수식을 A4 페이지에 배치합니다. Pandoc이나 LaTeX, 브라우저가 없어도 돼요. 마크다운을 모르는 사람에게 메모나 README를 보낼 때 간편합니다.',
      '标题、列表（包括任务列表）、表格、代码、引用、链接、图片、脚注和公式都会排版到 A4 页面上，无需 Pandoc、LaTeX 或浏览器。把笔记和 README 发给不熟悉 Markdown 的人时很方便。') },
  { from: 'md', to: 'docx', options: [],
    tip: T('Built in, no Pandoc needed. Headings, lists, tables, links and footnotes carry over, so you can keep editing and restyling the document in Word.',
      'Pandoc 없이 기본 기능으로 변환합니다. 제목·목록·표·링크·각주가 그대로 옮겨져 워드에서 이어서 편집하고 꾸밀 수 있어요.',
      '内置转换，无需 Pandoc。标题、列表、表格、链接和脚注都会保留，可以在 Word 中继续编辑和调整样式。') },
  { from: 'txt', to: 'pdf', options: ['merge'],
    tip: T('Plain text becomes a clean A4 PDF with one paragraph per line. Filee recognises UTF-8 and UTF-16 as well as legacy Korean (CP949) text files, so old logs and notes don\'t turn into garbled characters.',
      '텍스트가 한 줄에 한 문단씩 깔끔한 A4 PDF가 됩니다. UTF-8·UTF-16은 물론 예전 한글 텍스트(CP949)도 알아서 인식해 오래된 메모나 로그가 깨지지 않아요.',
      '纯文本会生成整洁的 A4 PDF，每行一个段落。Filee 能识别 UTF-8 和 UTF-16 编码，适合把日志、笔记和说明文件存档或打印。') },
  { from: 'html', to: 'pdf', options: ['merge'],
    tip: T('Save a web page or an HTML report as a PDF that looks the same everywhere and can be archived or printed. Filee converts .html files saved on your PC, and several of them can be merged into one PDF.',
      '웹 페이지나 HTML 보고서를 어디서나 똑같이 보이는 PDF로 저장해 보관하거나 인쇄하세요. Filee는 PC에 저장된 .html 파일을 변환하며, 여러 파일을 PDF 하나로 합칠 수도 있어요.',
      '把网页或 HTML 报告存成在任何地方看起来都一样的 PDF，便于存档或打印。Filee 转换的是保存在电脑上的 .html 文件，也可以把多个文件合并成一个 PDF。') },
  // E-books
  { from: 'epub', to: 'pdf', popular: true, options: ['drmFree'],
    tip: T('A PDF keeps a fixed page layout, which is handy for printing an e-book, reading it on a PC or sending it to a device without an EPUB reader.',
      'PDF는 페이지 모양이 고정되어 전자책을 인쇄하거나 PC에서 읽거나 EPUB 뷰어가 없는 기기로 보낼 때 편리합니다.',
      'PDF 版式固定，方便打印电子书、在电脑上阅读，或发送到没有 EPUB 阅读器的设备。') },
  { from: 'mobi', to: 'epub', options: ['drmFree'],
    tip: T('Move an old Kindle/Mobipocket library to EPUB so it opens in Apple Books, Google Play Books, Kobo and most reader apps. This direction is built in, so Calibre isn\'t needed.',
      '예전 킨들·모비포켓 전자책을 EPUB으로 바꾸면 애플 북스, 구글 플레이 북 등 대부분의 전자책 앱과 단말기에서 읽을 수 있습니다. 이 방향은 기본 내장이라 Calibre가 필요 없어요.',
      '把旧的 Kindle/Mobipocket 电子书转成 EPUB，就能在 Apple Books、Google Play 图书等大多数阅读应用和阅读器中打开。这个方向是内置的，不需要 Calibre。') },
  { from: 'epub', to: 'mobi', options: ['drmFree'],
    tip: T('The e-book tool Calibre writes the MOBI and AZW3 files. Current Kindles also accept EPUB through Send to Kindle, so MOBI is mainly useful for older Kindle devices and apps.',
      'MOBI·AZW3 저장은 전자책 도구 Calibre가 맡습니다. 최신 킨들은 ‘Send to Kindle’로 EPUB도 받으므로, MOBI는 주로 구형 킨들 기기와 앱에 쓸모가 있어요.',
      'MOBI 和 AZW3 由电子书工具 Calibre 输出。如今的 Kindle 也可以通过 Send to Kindle 接收 EPUB，MOBI 主要适用于老款 Kindle 设备和应用。') },
  // Video
  { from: 'mp4', to: 'mp3', popular: true, options: ['extractAudio', 'mp3128'],
    tip: T('Save the soundtrack of a lecture, concert or interview as an MP3 that plays everywhere: in the car, on an old player or in a transcription tool.',
      '강의·공연·인터뷰 영상에서 소리만 뽑아 차 안, 옛 플레이어, 받아쓰기 도구 어디서나 재생되는 MP3로 저장하세요.',
      '把讲座、演唱会或访谈视频的声音保存为 MP3，在车里、旧播放器或语音转文字工具中都能播放。') },
  { from: 'mov', to: 'mp4', popular: true, options: ['lossless'],
    tip: T('iPhone and Mac videos are MOV files. As MP4 they play on Android phones, smart TVs, older Windows apps and upload forms that reject MOV. The video and sound usually fit MP4 as they are, so Filee only rewraps them: no quality lost, HDR kept, done in seconds. The MP4 720p preset shrinks 4K clips for sharing.',
      '아이폰과 맥으로 찍은 영상은 MOV입니다. MP4로 바꾸면 안드로이드 폰, 스마트 TV, 오래된 Windows 프로그램, MOV를 받지 않는 업로드 양식에서도 재생돼요. 영상과 소리는 대개 MP4에 그대로 들어가서 다시 인코딩하지 않고 포장만 바꾸니, 화질 손실 없이 HDR도 그대로 몇 초면 끝나요. MP4 720p 프리셋으로 4K 영상을 공유하기 좋게 줄일 수도 있습니다.',
      'iPhone 和 Mac 拍的视频是 MOV 格式。转成 MP4 后，安卓手机、智能电视、旧版 Windows 软件以及不接受 MOV 的上传表单都能播放。视频和声音通常能原样放进 MP4，所以只重新封装，不重新编码，画质不损失，HDR 保留，几秒就完成。MP4 720p 预设还能把 4K 视频缩小，方便分享。') },
  { from: 'mkv', to: 'mp4', options: ['res720', 'hwEncode'],
    tip: T('MKV recordings, for example from OBS, often won\'t import into video editors or play on TVs, while MP4 is accepted almost everywhere. The conversion runs locally, so long recordings never have to be uploaded.',
      'OBS 등으로 녹화한 MKV는 편집 프로그램에 안 들어가거나 TV에서 재생되지 않을 때가 많지만, MP4는 거의 어디서나 받아요. PC에서 변환하니 긴 녹화 파일을 업로드할 필요가 없습니다.',
      '用 OBS 等软件录制的 MKV 常常导入不了剪辑软件，也无法在电视上播放，而 MP4 几乎到处都支持。转换在本地完成，长时间录像也不必上传。') },
  { from: 'webm', to: 'mp4', options: ['res720', 'hwEncode'],
    tip: T('Screen recordings and videos saved from the browser are often WebM, which many video editors, older players and messaging apps handle poorly. MP4 plays almost everywhere, and a whole batch of clips converts at once.',
      '화면 녹화나 브라우저에서 저장한 영상은 WEBM인 경우가 많은데, 편집 프로그램·오래된 플레이어·메신저에서 잘 안 될 때가 있습니다. MP4는 거의 어디서나 재생되고, 여러 클립도 한 번에 변환할 수 있어요.',
      '录屏和从浏览器保存的视频常常是 WebM，很多剪辑软件、旧播放器和聊天软件对它支持不好。MP4 几乎到处都能播放，还能一次批量转换多个片段。') },
  { from: 'mp4', to: 'gif', options: [],
    tip: T('Turn a short clip into an animated GIF for chats, documentation or bug reports. Keep it short: GIF stores every frame as a 256-colour image, so long or high-resolution videos make very large files.',
      '짧은 영상을 메신저·문서·버그 제보용 움직이는 GIF로 만드세요. GIF는 모든 프레임을 256색 이미지로 저장하므로 길거나 해상도가 높은 영상은 파일이 매우 커집니다.',
      '把短视频做成 GIF 动图，用于聊天、文档或问题反馈。GIF 会把每一帧存成 256 色图像，视频越长、分辨率越高，文件就越大。') },
  { from: 'mp4', to: 'jpg', options: ['frames'],
    tip: T('A video dropped on JPG gives one still picture. To pick a thumbnail or go through a clip frame by frame, use the Extract frames (JPG) preset: the pictures land in a folder next to the video, every frame or every Nth. A video that would give more than 100,000 pictures or fill the disk is refused before it starts.',
      '동영상을 JPG에 놓으면 정지 이미지 한 장이 만들어져요. 썸네일을 고르거나 프레임 단위로 살펴보려고 모든 프레임이 필요하면 프레임 추출 프리셋을 쓰세요. 모든 프레임이나 N번째 프레임마다 그림이 동영상 옆 폴더에 저장돼요. 그림이 10만 장을 넘거나 디스크를 가득 채울 동영상은 시작하기 전에 멈추고 알려 줘요.',
      '把视频拖到 JPG 上会得到一张静止图片。要挑选缩略图或逐帧查看时，可用“提取帧”预设把每一帧（或每 N 帧）存为图片，放在视频旁边的文件夹中。超过 10 万张图片或会占满磁盘的视频会在开始前被拒绝。') },
  { from: 'avi', to: 'mp4', options: ['res720', 'hwEncode'],
    tip: T('AVI files from old camcorders and cameras are large and often use codecs that phones and TVs no longer play. An MP4 with modern compression is usually much smaller and plays everywhere.',
      '예전 캠코더·카메라의 AVI 파일은 용량이 크고, 요즘 휴대폰이나 TV가 재생하지 못하는 코덱을 쓰는 경우가 많습니다. 최신 압축을 쓰는 MP4는 대개 훨씬 작고 어디서나 재생돼요.',
      '旧摄像机和相机的 AVI 文件体积大，而且常用手机和电视已不再支持的编码。采用现代压缩的 MP4 通常小得多，到处都能播放。') },
  // Audio
  { from: 'wav', to: 'mp3', popular: true, options: ['mp3128'],
    tip: T('A WAV recording takes about 10 MB per minute; as MP3 it needs a fraction of that and still plays on every device.',
      'WAV 녹음은 1분에 약 10MB지만 MP3로 바꾸면 몇 분의 일로 줄고, 모든 기기에서 재생됩니다.',
      'WAV 录音每分钟约 10 MB，转成 MP3 后只有几分之一，而且所有设备都能播放。') },
  { from: 'flac', to: 'mp3', options: ['mp3128'],
    tip: T('Keep your lossless FLAC library at home and put MP3 copies on the phone, a USB stick for the car or an older player that doesn\'t play FLAC. Whole albums convert in one go.',
      '무손실 FLAC 음원은 그대로 두고, 휴대폰·차량용 USB·FLAC을 못 트는 옛 플레이어에는 MP3 사본을 넣으세요. 앨범 전체도 한 번에 변환됩니다.',
      '无损 FLAC 音乐库留在电脑上，给手机、车载 U 盘或不支持 FLAC 的旧播放器准备一份 MP3 副本。整张专辑可以一次转换完。') },
  { from: 'm4a', to: 'mp3', options: ['mp3128'],
    tip: T('iPhone voice memos, DRM-free iTunes downloads and many recorders produce M4A. MP3 is accepted by every player, car stereo and upload form.',
      '아이폰 음성 메모, DRM 없는 아이튠즈 음원, 여러 녹음기가 M4A로 저장합니다. MP3는 모든 플레이어·차량 오디오·업로드 양식에서 받아요.',
      'iPhone 语音备忘录、无 DRM 的 iTunes 音乐和很多录音设备都保存为 M4A。而所有播放器、车载音响和上传表单都接受 MP3。') },
  // Archives
  { from: 'rar', to: 'zip', popular: true, options: ['extract'],
    tip: T('Repack RAR archives as ZIP for people, upload forms and systems that only accept ZIP. WinRAR isn\'t needed, neither to read the RAR nor to write the ZIP.',
      'ZIP만 받는 사람·업로드 양식·시스템을 위해 RAR 압축 파일을 ZIP으로 다시 묶습니다. RAR을 읽을 때도, ZIP을 만들 때도 WinRAR은 필요 없어요.',
      '为只接受 ZIP 的人、上传表单和系统，把 RAR 压缩包重新打包成 ZIP。读取 RAR 和生成 ZIP 都不需要 WinRAR。') },
  { from: '7z', to: 'zip', options: ['extract'],
    tip: T('7Z often compresses better, but ZIP opens on any computer or phone without extra software. Convert when you send an archive to someone who doesn\'t have 7-Zip.',
      '7Z가 더 작게 압축되는 경우가 많지만, ZIP은 별도 프로그램 없이 어떤 컴퓨터·휴대폰에서도 열립니다. 7-Zip이 없는 사람에게 보낼 때 바꿔 주세요.',
      '7Z 往往压缩得更小，但 ZIP 无需额外软件就能在任何电脑和手机上打开。发给没有 7-Zip 的人时，先转成 ZIP 吧。') },
  // CAD
  { from: 'dwg', to: 'pdf', options: ['noAutocad'],
    tip: T('Send drawings to clients, site teams or print shops who don\'t have AutoCAD: a PDF opens on any PC or phone. Several drawings can be merged into one PDF.',
      '오토캐드가 없는 고객·현장·출력소에 도면을 보낼 때 PDF면 어떤 PC나 휴대폰에서도 열립니다. 여러 도면을 PDF 하나로 합칠 수도 있어요.',
      '把图纸发给没有 AutoCAD 的客户、施工现场或打印店时，PDF 在任何电脑和手机上都能打开，还能把多张图纸合并成一个 PDF。') },
  { from: 'dxf', to: 'pdf', options: ['noAutocad', 'merge'],
    tip: T('DXF files from CAD programs, laser-cutting jobs or design exchanges become PDFs anyone can open and print. SVG and PNG are available too, for example for web previews.',
      'CAD 프로그램이나 레이저 커팅 작업, 설계 교환용으로 받은 DXF 파일을 누구나 열고 인쇄할 수 있는 PDF로 바꿉니다. 웹 미리보기용 SVG·PNG로도 바꿀 수 있어요.',
      '把来自 CAD 软件、激光切割任务或设计交换的 DXF 文件，转成任何人都能打开和打印的 PDF。也可以转成 SVG 或 PNG，用于网页预览。') },
  { from: 'dwg', to: 'dxf', options: ['noAutocad'],
    tip: T('DXF is the interchange format that laser cutters, CNC software and most CAD programs read. Converting DWG to DXF lets you open AutoCAD drawings in those tools, and DXF back to DWG works too.',
      'DXF는 레이저 커터·CNC 소프트웨어와 대부분의 CAD 프로그램이 읽는 교환 형식입니다. DWG를 DXF로 바꾸면 이런 도구에서도 오토캐드 도면을 열 수 있고, 반대로 DXF를 DWG로 바꿀 수도 있어요.',
      'DXF 是激光切割机、CNC 软件和大多数 CAD 程序都能读取的交换格式。把 DWG 转成 DXF，就能在这些工具中打开 AutoCAD 图纸；DXF 转回 DWG 也可以。') },
  // Fonts
  { from: 'ttf', to: 'woff2', options: [],
    tip: T('Self-host a font on your website: WOFF2 is the compressed web font format every modern browser supports, typically about 30 % smaller than WOFF. Check that the font\'s license allows web embedding.',
      '웹사이트에 글꼴을 직접 올릴 때는 WOFF2가 좋습니다. 모든 최신 브라우저가 지원하고 보통 WOFF보다 30% 정도 작아요. 글꼴 라이선스가 웹 임베딩을 허용하는지 먼저 확인하세요.',
      '在网站上自托管字体时，WOFF2 是首选：所有现代浏览器都支持，通常比 WOFF 小约 30%。请先确认字体授权允许网页嵌入。') },
  { from: 'otf', to: 'ttf', options: [],
    tip: T('Some older programs, cutting and embroidery machines and game engines only accept TrueType fonts. Convert a whole OTF font family to TTF in one go, without a font editor.',
      '일부 오래된 프로그램, 커팅·자수 기계, 게임 엔진은 트루타입 글꼴만 받습니다. 글꼴 편집기 없이 OTF 글꼴 패밀리 전체를 한 번에 TTF로 바꿔 보세요.',
      '一些旧软件、切割和刺绣机器以及游戏引擎只接受 TrueType 字体。无需字体编辑器，就能把一整套 OTF 字体一次转成 TTF。') },
  // Tracing (images → SVG) and SVG → CAD
  { from: 'png', to: 'svg', popular: true, options: ['trace'],
    tip: T('Use Line art to SVG for logos, signatures and scans: the ink becomes one black shape on a transparent background. Trace to SVG keeps up to 64 colours for icons and illustrations. Photos come out as flat patches, so tracing suits drawings best.',
      '로고·서명·스캔은 흑백 선화 프리셋을 쓰세요. 잉크 부분이 투명 배경 위의 검은 도형 하나가 돼요. 아이콘·일러스트는 최대 64색을 남기는 벡터화 프리셋이 좋아요. 사진은 단색 조각처럼 바뀌니 그림에 알맞아요.',
      'Logo、签名和扫描件请用“黑白描摹”预设，墨迹会变成透明背景上的一个黑色图形。图标和插画适合“描摹”预设，最多保留 64 种颜色。照片会变成色块，所以描摹最适合绘制的图形。') },
  { from: 'jpg', to: 'svg', options: ['trace'],
    tip: T('A JPG of a logo or a scanned sketch becomes an SVG that stays sharp at any size, ready for a cutting plotter, a website or a print shop. JPG noise turns into specks, so lower the Detail setting in the preset if the result looks busy.',
      '로고 JPG나 스캔한 스케치를 어떤 크기에서도 선명한 SVG로 바꿔요. 커팅 플로터, 웹사이트, 인쇄소에 바로 쓸 수 있어요. JPG 노이즈는 작은 점이 되니 결과가 지저분하면 프리셋에서 세밀도를 낮추세요.',
      '把 Logo 的 JPG 或扫描的草图转成任意尺寸都清晰的 SVG，可直接用于刻字机、网站或印厂。JPG 的噪点会变成小斑点，结果太杂时可在预设中调低细节。') },
  { from: 'svg', to: 'dxf', options: ['noAutocad'],
    tip: T('Laser cutters, CNC software and CAD programs read DXF. Filee writes the SVG\'s outlines in millimetres, so a shape 100 mm wide stays 100 mm. Curves become fine polylines. Fills, images and filters are left out.',
      '레이저 커터·CNC 소프트웨어·CAD 프로그램은 DXF를 읽어요. Filee는 SVG의 윤곽선을 밀리미터 단위로 써서 100mm 도형은 그대로 100mm예요. 곡선은 촘촘한 폴리라인이 되고, 채우기·그림·필터는 빠져요.',
      '激光切割机、CNC 软件和 CAD 程序都能读取 DXF。Filee 以毫米为单位写入 SVG 的轮廓，宽 100 mm 的图形仍是 100 mm。曲线会变成细密的多段线，填充、图片和滤镜不会保留。') },
  // E-mail
  { from: 'msg', to: 'pdf', options: ['attachments', 'merge'],
    tip: T('E-mails dragged out of Outlook are MSG files that only Outlook opens. As PDF they keep the sender, recipients, date, subject and message, and open anywhere. Outlook isn\'t needed.',
      '아웃룩에서 끌어낸 메일은 아웃룩에서만 열리는 MSG 파일이에요. PDF로 바꾸면 보낸 사람·받는 사람·날짜·제목·본문이 그대로 남고 어디서나 열려요. 아웃룩은 필요 없어요.',
      '从 Outlook 拖出的邮件是只有 Outlook 才能打开的 MSG 文件。转成 PDF 后保留发件人、收件人、日期、主题和正文，到处都能打开。不需要 Outlook。') },
  // Data
  { from: 'json', to: 'yaml', options: [],
    tip: T('YAML is easier to read and edit by hand, which is why config files use it. Keys keep their order, and text that would read back as a number or true/false is quoted.',
      'YAML은 사람이 읽고 고치기 쉬워서 설정 파일에 많이 써요. 키 순서는 그대로이고, 다시 읽을 때 숫자나 true/false로 바뀔 글자는 따옴표로 감싸요.',
      'YAML 更便于人工阅读和编辑，所以配置文件常用它。键的顺序保持不变，会被误读成数字或 true/false 的文字会加上引号。') },
  { from: 'yaml', to: 'json', options: [],
    tip: T('Turn a config file into JSON for an API, a script or a tool that only reads JSON. Anchors and aliases are resolved, and a file with several documents becomes one array. Comments are dropped, since JSON has none.',
      'API·스크립트·JSON만 읽는 도구에 넣을 수 있게 설정 파일을 JSON으로 바꿔요. 앵커와 별칭은 풀어 쓰고, 문서가 여러 개면 배열 하나가 돼요. JSON에는 주석이 없어서 주석은 빠져요.',
      '把配置文件转成 JSON，交给 API、脚本或只读 JSON 的工具。锚点和别名会展开，含多个文档的文件会变成一个数组。JSON 没有注释，所以注释会被去掉。') },
  { from: 'json', to: 'csv', options: ['tables'],
    tip: T('A JSON list of records becomes a table you can open in Excel: one row per record, one column per key. A wrapper like {"users": […]} is looked through. Data that isn\'t a table stops with a message instead of a broken file.',
      '레코드 목록인 JSON을 엑셀에서 여는 표로 바꿔요. 레코드마다 한 행, 키마다 한 열이에요. {"users": […]}처럼 감싼 객체는 알아서 풀어요. 표가 아닌 데이터는 깨진 파일 대신 안내 메시지가 떠요.',
      '记录列表形式的 JSON 会变成可在 Excel 中打开的表格，每条记录一行，每个键一列。{"users": […]} 这样的外层对象会自动展开。不是表格的数据会给出提示，而不会生成损坏的文件。') },
  { from: 'vcf', to: 'csv', options: ['utf8'],
    tip: T('Get an address book into Excel or a mailing tool: one row per contact with name, organization, email, phone, address and birthday. Contacts from old Korean phones in CP949 are read correctly.',
      '주소록을 엑셀이나 메일 발송 도구로 옮길 때 좋아요. 연락처마다 한 행에 이름·회사·이메일·전화·주소·생일이 들어가요. CP949로 저장된 옛 휴대폰 연락처도 제대로 읽어요.',
      '把通讯录导入 Excel 或群发工具时很方便。每个联系人一行，包含姓名、单位、邮箱、电话、地址和生日。旧手机以 CP949 保存的韩文联系人也能正确读取。') },
  // Subtitles
  { from: 'srt', to: 'vtt', popular: true, options: ['utf8'],
    tip: T('Web players and online course platforms want WebVTT. Timing, line breaks and italics come across, and no engine is needed.',
      '웹 플레이어와 온라인 강의 플랫폼은 WebVTT를 원해요. 시간, 줄바꿈, 기울임이 그대로 옮겨지고 엔진도 필요 없어요.',
      '网页播放器和在线课程平台需要 WebVTT。时间、换行和斜体都会保留，无需任何引擎。') },
  { from: 'smi', to: 'srt', options: ['utf8'],
    tip: T('Many players, TVs and editors don\'t read SMI, and old Korean SMI files often show as broken text. Filee detects CP949, picks the language with the most lines and saves a clean UTF-8 SRT.',
      '많은 플레이어·TV·편집 프로그램이 SMI를 못 읽고, 옛 SMI 자막은 글자가 깨지기도 해요. Filee는 CP949를 알아서 인식하고, 언어가 여럿이면 줄이 가장 많은 언어로 깔끔한 UTF-8 SRT를 만들어요.',
      '很多播放器、电视和剪辑软件不支持 SMI，旧的韩文 SMI 还常显示乱码。Filee 会自动识别 CP949，多语言时选择行数最多的语言，保存为干净的 UTF-8 SRT。') },
  { from: 'ass', to: 'srt', options: ['utf8'],
    tip: T('When a TV, a phone or a video site refuses styled ASS subtitles, plain SRT works. Bold, italics, underline and colours are kept; positions, fonts and effects are dropped.',
      'TV·휴대폰·동영상 사이트가 꾸밈 자막 ASS를 받지 않으면 단순한 SRT로 바꾸세요. 굵게·기울임·밑줄·색은 남고, 위치·글꼴·효과는 빠져요.',
      '电视、手机或视频网站不接受带样式的 ASS 字幕时，转成简单的 SRT 即可。粗体、斜体、下划线和颜色会保留，位置、字体和特效会去掉。') },
  { from: 'mkv', to: 'srt', options: ['extractSubs'],
    tip: T('Take the subtitles out of a film to edit or translate them. The first text subtitle track is saved as SRT; picture-based subtitles (DVD, Blu-ray) can\'t be turned into text. Needs the free FFmpeg engine.',
      '영화의 자막을 꺼내 고치거나 번역할 때 좋아요. 첫 번째 텍스트 자막 트랙을 SRT로 저장해요. DVD·블루레이의 그림 자막은 글자로 바꿀 수 없어요. 무료 FFmpeg 엔진이 필요해요.',
      '想编辑或翻译电影字幕时，可以先把字幕提取出来。第一条文本字幕轨会保存为 SRT，DVD、蓝光的图形字幕无法转成文字。需要免费的 FFmpeg 引擎。') },
  // 3D models
  { from: 'stl', to: 'obj', options: ['colours3d'],
    tip: T('Open a print file in a 3D program that prefers OBJ. STL has no units, so Filee reads it as millimetres and writes OBJ in millimetres too, with Y pointing up like most 3D programs.',
      'OBJ를 더 잘 다루는 3D 프로그램에서 출력용 파일을 열 때 좋아요. STL에는 단위가 없어서 밀리미터로 읽고 OBJ도 밀리미터로 쓰며, 대부분의 3D 프로그램처럼 Y축이 위를 향해요.',
      '想在更擅长 OBJ 的 3D 软件中打开打印文件时很方便。STL 没有单位，Filee 按毫米读取，OBJ 也以毫米写出，并像大多数 3D 软件一样以 Y 轴朝上。') },
  { from: 'obj', to: 'stl', options: ['colours3d'],
    tip: T('Slicers for 3D printers take STL. Faces of any shape are split into triangles, and Y-up becomes Z-up, so an upright model stands on the print bed. STL keeps only the shape, so colours and textures stay in the OBJ.',
      '3D 프린터 슬라이서는 STL을 받아요. 어떤 모양의 면이든 삼각형으로 나누고, Y축 위를 Z축 위로 바꿔 똑바로 선 모델이 출력판 위에 서요. STL은 모양만 담으니 색과 텍스처는 OBJ에 남겨 두세요.',
      '3D 打印的切片软件接受 STL。任意形状的面都会拆成三角形，Y 轴朝上会改为 Z 轴朝上，直立的模型会立在打印平台上。STL 只保存形状，颜色和纹理请保留在 OBJ 中。') },
  { from: 'glb', to: 'obj', options: ['colours3d'],
    tip: T('Bring a model from the web or a game engine into a program that reads OBJ. The .mtl file and the textures are written next to the .obj, so keep them together.',
      '웹이나 게임 엔진의 모델을 OBJ를 읽는 프로그램으로 옮길 때 좋아요. .mtl 파일과 텍스처가 .obj 옆에 함께 저장되니 같이 보관하세요.',
      '把网页或游戏引擎中的模型导入只读 OBJ 的软件时很方便。.mtl 文件和纹理会保存在 .obj 旁边，请把它们放在一起。') },
];

/* ───────── FAQ (home page, FAQPage JSON-LD, llms-full.txt) ───────── */

/** Answers may use the placeholders of vars(); links: 'formats' or conversion page slugs. */
export const FAQ = [
  { q: T('Is Filee really free?', 'Filee는 정말 무료인가요?', 'Filee 真的免费吗？'),
    a: T('Yes. Filee is free and open source under the MIT license: no ads, no watermarks, no account, no trial and no file-count or file-size limits of its own.',
      '네. Filee는 MIT 라이선스의 무료 오픈소스 프로그램입니다. 광고·워터마크·회원가입·체험 기간이 없고, 파일 개수나 크기 제한도 따로 두지 않습니다.',
      '是的。Filee 是基于 MIT 许可的免费开源软件：没有广告、水印、账号和试用期，也不设文件数量或大小限制。') },
  { q: T('Does it work offline? Are my files uploaded?', '인터넷 없이도 되나요? 파일이 업로드되나요?', '可以离线使用吗？文件会被上传吗？'),
    a: T('Every conversion runs on your own PC and files are never uploaded. The internet is only used to download an optional engine or check for updates, so confidential documents, photos and recordings stay on your computer.',
      '변환은 모두 내 PC에서 하고 파일은 업로드하지 않습니다. 인터넷은 추가 엔진을 받거나 업데이트를 확인할 때만 쓰므로, 기밀 문서·사진·녹음 파일이 컴퓨터 밖으로 나가지 않아요.',
      '所有转换都在你自己的电脑上完成，文件从不上传。只有下载可选引擎或检查更新时才会联网，机密文档、照片和录音都留在你的电脑里。') },
  { q: T('Which file formats does Filee support?', '어떤 파일 형식을 지원하나요?', 'Filee 支持哪些文件格式？'),
    a: T('Filee reads {formatTotal} file formats in {categoryCount} categories: {categoryList}. {builtinTotal} of them work right after install; the others use a free optional engine. The format catalog lists every format and what it converts to.',
      '{categoryCount}개 분야, {formatTotal}가지 형식을 읽을 수 있습니다: {categoryList}. 이 중 {builtinTotal}가지는 설치 직후 바로 쓸 수 있고, 나머지는 무료 추가 엔진을 씁니다. 전체 형식과 변환 가능한 형식은 지원 형식 목록에 정리되어 있어요.',
      'Filee 可读取 {categoryCount} 大类共 {formatTotal} 种格式：{categoryList}。其中 {builtinTotal} 种安装后即可使用，其余使用免费的可选引擎。完整格式及可转换的目标格式见格式目录。'),
    links: ['formats'] },
  { q: T('Do I need Microsoft Office, Hancom Office or LibreOffice?', 'MS 오피스나 한컴오피스, LibreOffice가 있어야 하나요?', '需要安装 Microsoft Office、Hancom Office 或 LibreOffice 吗？'),
    a: T('No. Word, Excel and PowerPoint files (DOCX, XLSX, XLS, CSV, PPTX) and Korean HWP/HWPX documents are converted by engines built into Filee. Filee doesn\'t use Office or Hancom Office even when they are installed; LibreOffice is only an optional in-app download for older formats such as DOC, PPT, ODT and RTF.',
      '아니요. 워드·엑셀·파워포인트 파일(DOCX, XLSX, XLS, CSV, PPTX)과 한글 문서(HWP, HWPX)는 Filee에 내장된 엔진으로 변환합니다. 오피스나 한컴오피스가 설치되어 있어도 쓰지 않으며, LibreOffice는 DOC·PPT·ODT·RTF 같은 예전 형식을 위한 선택형 추가 엔진일 뿐입니다.',
      '不需要。Word、Excel、PowerPoint 文件（DOCX、XLSX、XLS、CSV、PPTX）和韩文 HWP/HWPX 文档都由 Filee 内置的引擎转换。即使装了 Office 或 Hancom Office，Filee 也不会使用；LibreOffice 只是为 DOC、PPT、ODT、RTF 等旧格式准备的应用内可选下载。'),
    links: ['docx-to-pdf', 'xlsx-to-pdf', 'pptx-to-pdf', 'hwp-to-pdf'] },
  { q: T('What are the optional engines?', '추가 엔진은 무엇인가요?', '什么是可选引擎？'),
    a: T('Large engines are not in the installer. Tick them on the installer\'s engine page, or download them inside Filee whenever you need them: {engineDetails}. They are saved in Filee\'s own folder and can be removed at any time, and the app shows their versions, download speed and time left. If FFmpeg, calibre, Pandoc, Ghostscript or LibreOffice is already on your PC (on the PATH, Scoop included, or in Program Files), Filee uses it and skips the download, and says when that copy is older than the version it is tested with. Settings → Engines → Use my copy picks a specific one.',
      '용량이 큰 엔진은 설치 파일에 넣지 않았어요. 설치할 때 엔진 선택 화면에서 고르거나, 필요할 때 Filee 안에서 받을 수 있습니다: {engineDetails}. 엔진은 Filee 전용 폴더에 저장되고 언제든 지울 수 있으며, 앱에서 버전·다운로드 속도·남은 시간을 볼 수 있어요. FFmpeg, calibre, Pandoc, Ghostscript, LibreOffice가 PC에 이미 있으면(PATH, Scoop, Program Files) 그걸 쓰고 내려받지 않아요. Filee가 테스트한 버전보다 오래됐으면 업데이트를 권하고, 특정 프로그램은 설정 → 엔진 → 내 프로그램 쓰기에서 고를 수 있어요.',
      '体积较大的引擎不包含在安装包中。可以在安装程序的引擎页面勾选，也可以在需要时在 Filee 里下载：{engineDetails}。引擎保存在 Filee 自己的文件夹中，随时可以删除，应用内会显示版本、下载速度和剩余时间。如果电脑上已有 FFmpeg、calibre、Pandoc、Ghostscript 或 LibreOffice（PATH、Scoop 或 Program Files 中），Filee 会直接使用，不再下载；版本比测试版本旧时会建议更新。也可以在“设置 → 引擎 → 使用我的程序”中指定某个程序。') },
  { q: T('Does installing Filee need administrator rights?', 'Filee를 설치하려면 관리자 권한이 필요한가요?', '安装 Filee 需要管理员权限吗？'),
    a: T('Only once, while installing. The installer puts Filee in Program Files for all users and, on Windows 11, adds “Convert with Filee” to the top of the File Explorer menu. Filee itself then runs as your normal user. For silent installs, run the installer with /VERYSILENT /SUPPRESSMSGBOXES. If you can\'t install programs, use the portable ZIP: unzip it anywhere and run Filee.exe.',
      '설치할 때 한 번만 필요해요. 설치 프로그램이 모든 사용자를 위해 Program Files에 설치하고, Windows 11에서는 탐색기 기본 메뉴에 “Filee로 변환”을 추가합니다. 설치 후 Filee는 일반 사용자 권한으로 실행돼요. 조용히 설치하려면 설치 프로그램을 /VERYSILENT /SUPPRESSMSGBOXES로 실행하세요. 프로그램을 설치할 수 없다면 포터블 ZIP을 원하는 곳에 풀고 Filee.exe를 실행하세요.',
      '只在安装时需要一次。安装程序会为所有用户安装到 Program Files，并在 Windows 11 上把“用 Filee 转换”添加到资源管理器主菜单。之后 Filee 以普通用户身份运行。静默安装时，请用 /VERYSILENT /SUPPRESSMSGBOXES 参数运行安装程序。如果无法安装程序，可以使用便携版 ZIP：解压到任意位置后运行 Filee.exe。') },
  { q: T('Filee doesn\'t start on Windows 10: no window, no error. What can I do?', 'Windows 10에서 Filee가 창도 오류도 없이 실행되지 않아요. 어떻게 하나요?', 'Filee 在 Windows 10 上无法启动，没有窗口也没有报错，怎么办？'),
    a: T('This happens on a Windows 10 that hasn\'t been updated for a long time, on a PC whose processor supports Hardware-enforced Stack Protection (CET). Windows turns that protection on but lacks a part that .NET needs, so Filee and its installer stop right away, without a window or a message. Installing the available Windows updates (the latest cumulative update) fixes it. If updating isn\'t possible, turning the protection off for Filee alone usually works: in PowerShell as administrator, run Set-ProcessMitigation -Name Filee.exe -Disable UserShadowStack, then the same for filee-cli.exe and for the installer\'s file name (or use the portable ZIP). To undo it, remove those entries in Windows Security → App & browser control → Exploit protection settings → Program settings.',
      '오랫동안 업데이트하지 않은 Windows 10을 하드웨어 적용 스택 보호(CET)를 지원하는 프로세서의 PC에서 쓸 때 생기는 문제예요. Windows가 이 보호 기능을 켜지만 .NET에 필요한 기능이 빠져 있어서, Filee와 설치 프로그램이 창이나 메시지 없이 바로 종료돼요. Windows 업데이트에서 받을 수 있는 업데이트(최신 누적 업데이트)를 설치하면 해결돼요. 업데이트할 수 없다면 Filee에만 이 보호 기능을 끄면 대개 실행돼요. 관리자 권한 PowerShell에서 Set-ProcessMitigation -Name Filee.exe -Disable UserShadowStack을 실행하고, filee-cli.exe와 설치 프로그램 파일 이름으로도 똑같이 실행하세요(또는 포터블 ZIP을 쓰세요). 되돌리려면 Windows 보안 → 앱 및 브라우저 컨트롤 → Exploit Protection 설정 → 프로그램 설정에서 해당 항목을 지우면 돼요.',
      '这种情况发生在长期未更新的 Windows 10 上，且电脑的处理器支持“硬件强制堆栈保护”（CET）。Windows 会开启这项保护，却缺少 .NET 需要的一项功能，于是 Filee 和安装程序会立即退出，不显示窗口或消息。安装 Windows 更新中可用的更新（最新的累积更新）即可解决。如果无法更新，通常只对 Filee 关闭这项保护就能启动：以管理员身份打开 PowerShell，运行 Set-ProcessMitigation -Name Filee.exe -Disable UserShadowStack，再对 filee-cli.exe 和安装程序的文件名各运行一次（或者使用便携版 ZIP）。要撤销，请在“Windows 安全中心 → 应用和浏览器控制 → Exploit Protection 设置 → 程序设置”中删除这些条目。') },
  { q: T('Can I convert many files at once?', '여러 파일을 한 번에 변환할 수 있나요?', '可以一次转换很多文件吗？'),
    a: T('Yes. Select as many files as you like and drop them once: Filee converts them in parallel, a failed file never stops the others, and presets can merge everything into one PDF or pack it into one ZIP.',
      '네. 원하는 만큼 파일을 골라 한 번에 놓으면 동시에 변환합니다. 한 파일이 실패해도 나머지는 계속되고, 프리셋으로 전부 PDF 하나로 합치거나 ZIP 하나로 묶을 수도 있어요.',
      '可以。选中任意多个文件一次拖放即可：Filee 会并行转换，某个文件失败也不影响其他文件，还可以用预设把所有文件合并成一个 PDF 或打包成一个 ZIP。') },
  { q: T('Can I convert from the Windows 11 right-click menu?', 'Windows 11 우클릭 메뉴에서도 변환할 수 있나요?', '可以在 Windows 11 右键菜单中转换吗？'),
    a: T('Yes. Right-click files in File Explorer and choose "Convert with Filee". On Windows 11 you can also put it in the top-level menu, without "Show more options": click "Add to the main menu" in Settings → General once and approve the administrator prompt. Send To, a keyboard shortcut and the drop zone in the main window work too.',
      '네. 탐색기에서 파일을 우클릭하고 Filee 변환을 고르면 돼요. Windows 11에서는 설정 → 일반의 ‘기본 메뉴에 추가’를 한 번 누르고 관리자 승인을 하면 ‘추가 옵션 표시’ 없이 첫 메뉴에 나타나요. 보내기 메뉴, 단축키, 메인 창의 드롭 영역도 쓸 수 있어요.',
      '可以。在资源管理器中右键点击文件并选择 Filee 转换即可。在 Windows 11 上，只需在“设置 → 常规”中点一次“添加到主菜单”并同意管理员提示，它就会出现在第一层菜单中，无需点“显示更多选项”。也可以使用“发送到”、快捷键或主窗口的拖放区。') },
  { q: T('Can Filee convert from the command line or automatically?', '명령줄이나 자동으로도 변환할 수 있나요?', '可以用命令行或自动转换吗？'),
    a: T('Yes. Setup can add the filee command to PATH: filee convert *.heic --to jpg converts files, wildcards and folders with your presets, prints JSON for scripts and returns exit codes. Watch folders automatically convert the files that land in a folder and can move the originals aside. Set them up on the Watch folders page in the app or with filee watch in a terminal.',
      '네. 설치할 때 filee 명령을 PATH에 추가할 수 있어요. filee convert *.heic --to jpg처럼 파일, 와일드카드, 폴더를 내 프리셋으로 변환하고, 스크립트용 JSON과 종료 코드도 내놓아요. 자동 변환 폴더는 앱의 자동 변환 폴더 화면이나 터미널의 filee watch로 설정하며, 폴더에 들어오는 파일을 알아서 변환하고 원본을 따로 옮겨 둘 수도 있어요.',
      '可以。安装时可以把 filee 命令添加到 PATH：filee convert *.heic --to jpg 可用你的预设转换文件、通配符和文件夹，并为脚本输出 JSON 和退出码。自动转换文件夹会自动转换放进来的文件，还能把原文件移到别处；可在应用的“自动转换文件夹”页面设置，也可在终端中运行 filee watch。'),
    links: ['cli'] },
  { q: T('How do I convert a file, for example HEIC to JPG?', '파일은 어떻게 변환하나요? 예를 들어 HEIC를 JPG로 바꾸려면요?', '如何转换文件？比如 HEIC 转 JPG？'),
    a: T('Select the files in File Explorer, hold Ctrl (or the key you chose) and drag them. A donut of formats opens at the cursor: drop the files on JPG and the new files appear next to the originals. There are step-by-step guides for the most common conversions.',
      '탐색기에서 파일을 고르고 Ctrl(또는 직접 정한 키)을 누른 채 끌어 보세요. 커서 위치에 형식 도넛이 열리면 JPG에 놓기만 하면 원본 옆에 새 파일이 생깁니다. 자주 쓰는 변환은 단계별 안내 페이지도 있어요.',
      '在资源管理器中选中文件，按住 Ctrl（或你设置的键）拖动，光标处会弹出格式圆环，把文件放到 JPG 上，新文件就会出现在原文件旁边。常见转换都有分步指南。'),
    links: ['heic-to-jpg', 'pdf-to-docx', 'mp4-to-mp3', 'webp-to-png', 'jpg-to-pdf', 'mov-to-mp4'] },
  { q: T('Why use Filee instead of an online converter?', '온라인 변환 사이트 대신 Filee를 쓰는 이유는요?', '为什么用 Filee 而不是在线转换网站？'),
    a: T('Online converters upload your files to someone else\'s server, often limit file size and count, and depend on a fast connection. Filee converts on your PC: private files stay private, large videos and hundreds of files are no problem, and it works without internet, for free and without ads.',
      '온라인 변환 사이트는 파일을 남의 서버에 올리고, 크기와 개수를 제한하는 경우가 많으며, 빠른 인터넷이 필요합니다. Filee는 내 PC에서 변환하므로 개인 파일이 밖으로 나가지 않고, 큰 동영상이나 수백 개의 파일도 문제없으며, 인터넷 없이도 광고 없이 무료로 쓸 수 있어요.',
      '在线转换网站要把文件上传到别人的服务器，常常限制文件大小和数量，还依赖网速。Filee 在你的电脑上转换：私密文件不外泄，大视频和上百个文件都没问题，没有网络也能用，而且免费、无广告。') },
  { q: T('Which operating systems are supported?', '어떤 운영체제에서 쓸 수 있나요?', '支持哪些操作系统？'),
    a: T('Windows 10 and 11 (64-bit) and Linux (x64 and ARM64, Ubuntu 22.04 or later) are full releases. On Linux the drag gesture needs an X11 session; on KDE Plasma with Wayland it is experimental, and on other Wayland desktops the drop zone and the file manager\'s right-click menu work. macOS 13 or later (Apple silicon and Intel) is a preview: the app isn\'t notarized yet, so macOS asks you to allow it once under Privacy & Security. Pick your system in the download section.',
      'Windows 10·11(64비트)과 Linux(x64·ARM64, Ubuntu 22.04 이상)는 정식 버전이에요. Linux에서 드래그 제스처는 X11 세션에서 동작하고, KDE Plasma의 Wayland에서는 실험 기능이에요. 다른 Wayland 데스크톱에서는 드롭 영역과 파일 관리자의 우클릭 메뉴를 쓰세요. macOS 13 이상(Apple Silicon·Intel)은 미리보기예요. 앱이 아직 공증을 받지 않아 처음 한 번 개인정보 보호 및 보안에서 허용해야 해요. 다운로드에서 운영체제를 고르면 돼요.',
      'Windows 10 和 11（64 位）以及 Linux（x64 和 ARM64，Ubuntu 22.04 或更高版本）为正式版。Linux 上的拖动手势需要 X11 会话；在 KDE Plasma 的 Wayland 下为实验功能，其他 Wayland 桌面请使用拖放区和文件管理器的右键菜单。macOS 13 或更高版本（Apple 芯片和 Intel）为预览版：应用尚未公证，首次需在“隐私与安全性”中允许一次。在下载区选择你的系统即可。') },
];

/* ───────── Home page bits ───────── */

/** Format chips in the home page marquee (two rows). */
export const MARQUEE = ['jpg', 'png', 'heic', 'webp', 'avif', 'psd', 'cr2', 'svg', 'pdf', 'docx', 'hwp', 'hwpx', 'xlsx', 'csv', 'pptx', 'txt', 'md',
  'epub', 'mobi', 'mp4', 'mov', 'mkv', 'webm', 'mp3', 'wav', 'flac', 'm4a', 'srt', 'json', 'zip', 'rar', '7z', 'dwg', 'dxf', 'stl', 'ttf', 'woff2', 'gif', 'ico'];

/** Formats on each demo donut, like the app's default toolbars; `source` is the demo file's format (checked). */
export const DEMO_DONUTS = {
  image: { source: 'heic', items: [['PNG'], ['JPG'], ['WEBP'], ['PDF'], ['TIFF'], ['BMP'], ['ICO'], ['JPG', '70%']] },
  video: { source: 'mov', items: [['MP4'], ['MP4', '720p'], ['WEBM'], ['MOV'], ['GIF'], ['MP3'], ['MKV'], ['AVI']] },
  document: { source: 'docx', items: [['PDF'], ['HWPX'], ['EPUB'], ['TXT'], ['HTML']] },
  hwp: { source: 'hwp', items: [['PDF'], ['DOCX'], ['HWPX'], ['PNG'], ['TXT'], ['MD']] },
};

/* ───────── Derived data and helpers ───────── */

export const FORMATS = Object.fromEntries([
  ...CATEGORIES.flatMap(c => c.formats.map(f => [f.id, { ...f, cat: c.id }])),
  ...PSEUDO_FORMATS.map(f => [f.id, f]),
]);
export const CATEGORY = Object.fromEntries(CATEGORIES.map(c => [c.id, c]));
const ALL_ROUTES = CATEGORIES.flatMap(c => c.routes.map(r => ({ ...r, cat: c.id })));

export const pairSlug = p => `${p.from}-to-${p.to}`;
export const PAIR = Object.fromEntries(PAIRS.map(p => [pairSlug(p), p]));

/** Label of a format in a language (Korean may use a Korean name, e.g. 마크다운). */
export const label = (id, lang) => (lang === 'ko' && FORMATS[id].koLabel) || FORMATS[id].label;

/** The route that converts from → to (built-in engines first), or null. */
export function routeFor(from, to) {
  const sources = FORMATS[from]?.members ?? [from];
  const matches = ALL_ROUTES.filter(r => sources.every(s => r.from.includes(s)) && r.to.includes(to));
  return matches.find(r => r.engine === 'builtin') ?? matches[0] ?? null;
}

/** Everything `from` converts to: [{ to, engine }], built-in first, without duplicates. */
export function targetsOf(from) {
  const sources = FORMATS[from]?.members ?? [from];
  const out = new Map();
  for (const r of ALL_ROUTES) {
    if (!sources.every(s => r.from.includes(s))) continue;
    for (const to of r.to) if (to !== from && (!out.has(to) || r.engine === 'builtin')) out.set(to, r.engine);
  }
  return [...out].map(([to, engine]) => ({ to, engine })).sort((a, b) => (a.engine === 'builtin' ? 0 : 1) - (b.engine === 'builtin' ? 0 : 1));
}

/** Engines a category uses, built in first. */
export const enginesOf = cat => [...new Set(CATEGORY[cat].routes.map(r => r.engine))].sort((a, b) => (a === 'builtin' ? -1 : b === 'builtin' ? 1 : 0));

/**
 * Number of formats in a list, counted like the app (FormatRegistry): the camera RAW brands (CR2, NEF, ARW…) are one
 * format, "RAW", there; they are listed one by one here so each gets its own chip and extensions.
 */
export const countFormats = formats => formats.filter(f => !f.raw).length + (formats.some(f => f.raw) ? 1 : 0);

/** Counts shown on the site. */
export function stats() {
  const all = CATEGORIES.flatMap(c => c.formats);
  const builtinSources = new Set(ALL_ROUTES.filter(r => r.engine === 'builtin').flatMap(r => r.from));
  const formatTotal = countFormats(all);
  return {
    formatTotal,
    formatCount: `${Math.floor(formatTotal / 10) * 10}+`,
    categoryCount: CATEGORIES.length,
    builtinTotal: countFormats(all.filter(f => builtinSources.has(f.id))),
    pairCount: PAIRS.length,
  };
}

/** Chinese typography: a space between Han characters and Latin letters or digits. */
export const zhSpace = text => text
  .replace(/([一-鿿])([A-Za-z0-9])/g, '$1 $2')
  .replace(/([A-Za-z0-9%])([一-鿿])/g, '$1 $2');

/** Applies the language's spacing rules (Chinese: a space between Han characters and Latin letters or digits). */
const spaced = (text, lang) => (LANGUAGE[lang]?.cjkSpacing ? zhSpace(text) : text);

/** A list in running text: "a, b and c" / "a, b, c" / "a、b 和 c" / "a, b i c" / "a, b y c" (languages.mjs → list). */
export function joinList(items, lang) {
  if (items.length < 2) return items.join('');
  const { sep, last, lastBeforeI } = LANGUAGE[lang].list;
  // Spanish writes "e" instead of "y" before a word that starts with an "i" sound (imágenes, hilos, ICO).
  const and = lastBeforeI && /^h?[iíIÍ](?![aeouáéóú])/.test(items.at(-1)) ? lastBeforeI : last;
  return spaced(`${items.slice(0, -1).join(sep)}${and}${items.at(-1)}`, lang);
}

/** "about 100 MB" in a language ('' without a size). */
export const sizeText = (mb, lang) => (mb
  ? LANGUAGE[lang].size.replace('{mb}', new Intl.NumberFormat(`${LANGUAGE[lang].htmlLang}-u-nu-latn`).format(mb)) : '');

/** A size in brackets after a name: " (about 100 MB)", "(약 100MB)", "（约 100 MB）"; '' without a size. */
export const sizeParen = (mb, lang) => (mb ? LANGUAGE[lang].paren.replace('{size}', sizeText(mb, lang)) : '');

/** "FFmpeg for video and audio (about 100 MB); …" */
export function engineDetails(lang) {
  const { engineFor, engineSep } = LANGUAGE[lang];
  return Object.values(ENGINES)
    .map(e => spaced(engineFor.replace('{name}', e.name).replace('{what}', L(e.for, lang)).replace('{size}', sizeParen(e.sizeMB, lang)), lang))
    .join(engineSep);
}

/** Placeholder values for texts in i18n/*.json and this file. */
export function vars(lang) {
  const s = stats();
  return {
    ...s,
    version: VERSION,
    versionShort: VERSION.split('.').slice(0, 2).join('.'),
    newIn: NEW_IN,
    categoryList: joinList(CATEGORIES.map(c => L(c.plain, lang)), lang),
    engineNames: joinList(Object.values(ENGINES).map(e => e.name), lang),
    engineDetails: engineDetails(lang),
    _lang: lang,
  };
}

/**
 * The form of a count in a language: "one:# format|few:# formaty|many:# formatów" picks by the language's plural
 * rules (Intl.PluralRules categories zero, one, two, few, many and other, the fallback); # is the number.
 */
function plural(n, spec, lang, text) {
  const forms = {};
  for (const part of spec.split('|')) {
    const m = /^(zero|one|two|few|many|other):(.*)$/s.exec(part);
    if (!m) throw new Error(`Plural form "${part}" needs a category (one:, few:, many:, other:…) in "${text}"`);
    forms[m[1]] = m[2];
  }
  const form = forms[new Intl.PluralRules(LANGUAGE[lang]?.htmlLang ?? lang).select(Number(n))] ?? forms.other;
  if (form == null) throw new Error(`No plural form for ${n} (and no other:) in "${text}"`);
  return form.replaceAll('#', n);
}

/**
 * Fills {name} placeholders and {name|one:…|other:…} counts (see plural()); unknown names throw so typos surface in
 * the build. values._lang (set by vars()) picks the plural rules and the spacing (Chinese: CJK/Latin spacing).
 */
export function fill(text, values) {
  const lang = values._lang ?? 'en';
  const out = String(text).replace(/\{(\w+)(?:\|([^{}]*))?\}/g, (_, key, forms) => {
    if (!(key in values)) throw new Error(`Unknown placeholder {${key}} in "${text}"`);
    return forms == null ? values[key] : plural(values[key], forms, lang, text);
  });
  return spaced(out, lang);
}

/** Korean particles after a format label, from its reading (koJong). */
export function particles(id) {
  const jong = FORMATS[id].koJong ?? 0; // 0: vowel, 1: consonant, 2: ㄹ
  return { eul: jong ? '을' : '를', ro: jong === 1 ? '으로' : '로', eun: jong ? '은' : '는', wa: jong ? '과' : '와', i: jong ? '이' : '가' };
}

/** Throws when something in the catalog doesn't add up (unknown ids, unsupported pages, missing texts). */
export function validateCatalog() {
  const errors = [];
  const ids = CATEGORIES.flatMap(c => c.formats.map(f => f.id));
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (dupes.length) errors.push(`Duplicate format ids: ${dupes.join(', ')}`);
  for (const r of ALL_ROUTES) {
    for (const id of [...r.from, ...r.to]) if (!FORMATS[id]) errors.push(`Route in ${r.cat} uses unknown format "${id}"`);
    if (r.engine !== 'builtin' && !ENGINES[r.engine]) errors.push(`Route in ${r.cat} uses unknown engine "${r.engine}"`);
    for (const key of r.extras ?? []) if (!OPTIONS[key]) errors.push(`Route in ${r.cat} uses unknown option "${key}"`);
  }
  // That a text exists; textErrors() checks every T() text in every language.
  const hasText = v => typeof v?.en === 'string' && v.en.trim() !== '';
  errors.push(...textErrors());
  const seen = new Set();
  for (const p of PAIRS) {
    const slug = pairSlug(p);
    if (seen.has(slug)) errors.push(`Duplicate conversion page ${slug}`);
    seen.add(slug);
    if (!FORMATS[p.from] || !FORMATS[p.to]) { errors.push(`${slug}: unknown format`); continue; }
    if (!routeFor(p.from, p.to)) errors.push(`${slug}: no route converts ${p.from} to ${p.to}`);
    if (!hasText(p.tip)) errors.push(`${slug}: tip missing`);
    for (const id of [p.from, p.to]) {
      if (!hasText(FORMATS[id].about) || !hasText(FORMATS[id].name)) errors.push(`${slug}: format ${id} needs a name and an about text`);
    }
    for (const key of p.options) if (!OPTIONS[key]) errors.push(`${slug}: unknown option "${key}"`);
  }
  for (const f of FAQ) {
    if (!hasText(f.q) || !hasText(f.a)) errors.push(`FAQ "${f.q?.en}" needs a question and an answer`);
    for (const link of f.links ?? []) if (link !== 'formats' && link !== 'cli' && !PAIR[link]) errors.push(`FAQ links to unknown page ${link}`);
  }
  for (const id of MARQUEE) if (!FORMATS[id]) errors.push(`MARQUEE: unknown format ${id}`);
  const byLabel = Object.fromEntries(Object.values(FORMATS).flatMap(f => [[f.label.toLowerCase(), f.id], [f.id, f.id]]));
  for (const [profile, donut] of Object.entries(DEMO_DONUTS)) {
    for (const [itemLabel] of donut.items) {
      const to = byLabel[itemLabel.toLowerCase()];
      if (!to || !routeFor(donut.source, to)) errors.push(`DEMO_DONUTS.${profile}: ${donut.source} → ${itemLabel} is not supported`);
    }
  }
  for (const c of CATEGORIES) if (!hasText(c.name) || !hasText(c.intro) || !hasText(c.plain)) errors.push(`Category ${c.id} needs name, intro and plain texts`);
  for (const [key, o] of Object.entries(OPTIONS)) if (!hasText(o.short) || !hasText(o.long)) errors.push(`Option ${key} needs short and long texts`);
  if (errors.length) throw new Error(`Catalog errors:\n- ${errors.join('\n- ')}`);
}

/**
 * Translations of the T() texts: every text in every language, the same {placeholders} as the English one, and no
 * dictionary entry left over from an English text that was changed or removed.
 */
function textErrors() {
  const errors = [];
  const placeholders = text => [...String(text).matchAll(/\{(\w+)[|}]/g)].map(m => m[1]).sort().join(',');
  const keys = new Set(TEXTS.map(({ key }) => key));
  for (const { text, key } of TEXTS) {
    for (const lang of LANGS) {
      const where = INLINE.includes(lang) ? `T() text in ${lang}` : `src/texts/${lang}.mjs`;
      if (typeof text[lang] !== 'string' || !text[lang].trim()) errors.push(`${where}: no translation of "${key}"`);
      else if (placeholders(text[lang]) !== placeholders(text.en)) errors.push(`${where}: other placeholders than "${key}"`);
    }
  }
  for (const [lang, dictionary] of Object.entries(DICTIONARIES)) {
    for (const key of Object.keys(dictionary)) {
      if (!keys.has(key)) errors.push(`src/texts/${lang}.mjs: "${key}" is not (or no longer) an English text of the catalog`);
    }
  }
  return errors;
}
